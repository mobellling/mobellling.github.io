/**
 * MobellSite service worker.
 *
 * Goals (in order):
 *  1. Foreground requests always win over background pre-downloading.
 *  2. Cache First for same-origin GETs (manifest assets live in `assets`).
 *  3. `/_hash` is polled periodically to detect new deploys.
 *  4. Every file in the manifest is pre-downloaded in the background.
 *  5. Cross-origin no-cors images are cached with a default 600 s TTL.
 *  6. Pages can force-refresh non-manifest URLs over postMessage. The cache key
 *     stays the page's original URL; `_t` is only used on the network request.
 *  7. Same-origin HTML error responses (403/404/...) can be replaced by the
 *     manifest's `/{status}.html` page. Error responses are never cached.
 *  8. `sameOrigin.ignoreSearch` makes same-origin cache keys ignore `?query`.
 *
 * Debug:
 *  - Register the worker with `?debug=1` or send `SW_CONFIG {debug:true}`.
 *  - Page helpers: `window.__SW__` (see src/scripts/sw-client.ts).
 *  - Debug panel: open any page with `?sw_debug=1`.
 *
 * This file is served as-is from `public/sw.js`; keep it dependency-free.
 */

'use strict';

const SW_VERSION = '1.0.0';
const CACHE_VERSION = 'v1';
const DB_NAME = 'mobell-sw';
const DB_VERSION = 1;
const STORE_KV = 'kv';
const STORE_IMAGES = 'imageMeta';
const PREFETCH_TAG = 'mobell-sw-manifest';
const IMAGE_META_MAX = 1000;

const CACHE_NAMES = {
  assets: `mobell-sw-assets-${CACHE_VERSION}`,
  runtime: `mobell-sw-runtime-${CACHE_VERSION}`,
  images: `mobell-sw-images-${CACHE_VERSION}`,
};

const SELF_URL = new URL(self.location.href);
const SCOPE_URL = new URL('./', SELF_URL);
const ORIGIN = SELF_URL.origin;
const SELF_PATH = SELF_URL.pathname;

const DEFAULT_CONFIG = {
  debug: false,

  manifest: {
    /** Resolved against the service-worker scope, so `/_hash` at site root. */
    url: '_hash',
    /** Re-check interval while the SW happens to be alive. */
    checkInterval: 5 * 60 * 1000,
    /** Also check (throttled) when a page navigates. */
    checkOnNavigation: true,
    navigationCheckThrottle: 60 * 1000,
    /** Abort a slow manifest request after this long. */
    timeout: 15 * 1000,
    /** Add `?_t=` to the manifest request to defeat CDN/browser caches. */
    cacheBust: true,
  },

  prefetch: {
    enabled: true,
    /** Parallel background downloads. Kept low on purpose. */
    concurrency: 3,
    /** After the last foreground request, wait this long before resuming. */
    quietMs: 1200,
    /** Navigation requests cancel in-flight background downloads. */
    abortOnNavigation: true,
    /** Fetch priority hint for background downloads. */
    priority: 'low',
    /** How long one fetch event may keep the worker alive for prefetching. */
    keepAliveMs: 60 * 1000,
    /** Retries per manifest item on failure. */
    maxRetries: 2,
  },

  sameOrigin: {
    /** When true, `?query` is ignored for same-origin cache keys. */
    ignoreSearch: false,
  },

  crossOriginImages: {
    enabled: true,
    /** Default cache lifetime for opaque no-cors images: 600 s. */
    ttl: 600 * 1000,
    maxEntries: IMAGE_META_MAX,
  },

  errorPages: {
    enabled: true,
    /** Statuses replaced with `/{status}.html` when that file is in the manifest. */
    statuses: [403, 404],
    /** Do not let the browser HTTP-cache a friendly error page. */
    cacheControl: 'no-store',
  },

  forceRefresh: {
    /**
     * `query` appends `?_t=<nonce>` (bypasses browser + CDN caches, server must
     * ignore it). `reload` uses Request.cache = 'reload'. `auto` uses `query`
     * for same-origin and `reload` for cross-origin/opaque responses.
     */
    strategy: 'query',
    param: '_t',
    timeout: 30 * 1000,
  },
};

/* -------------------------------------------------------------------------- */
/* Config + state                                                             */
/* -------------------------------------------------------------------------- */

const config = structuredCloneSafe(DEFAULT_CONFIG);

const state = {
  // Replaced at the bottom of this file with the real boot promise; starting
  // with a resolved promise keeps the type stable for `await state.ready`.
  ready: Promise.resolve(),
  manifest: new Map(),
  manifestVersion: '',
  manifestFetchedAt: 0,
  lastCheckAt: 0,
  checking: null,
  imageMeta: new Map(),
  startedAt: Date.now(),
  stats: {
    fetch: 0,
    cacheHit: 0,
    network: 0,
    imageHit: 0,
    imageMiss: 0,
    statusPage: 0,
    prefetch: 0,
    prefetchFailed: 0,
    refresh: 0,
    manifestChecks: 0,
    manifestUpdates: 0,
    broadcast: 0,
  },
};

/** @type {Map<string, Cache>} */
const cacheHandles = new Map();
let manifestTimer = null;
let coveragePromise = null;
let lastCoverageAt = 0;

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep(target, source) {
  if (!isPlainObject(source)) return target;
  for (const key of Object.keys(source)) {
    const next = source[key];
    if (isPlainObject(next)) {
      if (!isPlainObject(target[key])) target[key] = {};
      mergeDeep(target[key], next);
    } else if (next !== undefined) {
      target[key] = next;
    }
  }
  return target;
}

function numberInRange(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normaliseConfig() {
  config.manifest.checkInterval = numberInRange(config.manifest.checkInterval, 300000, 10000, 24 * 60 * 60 * 1000);
  config.manifest.navigationCheckThrottle = numberInRange(
    config.manifest.navigationCheckThrottle,
    60000,
    10000,
    24 * 60 * 60 * 1000
  );
  config.manifest.timeout = numberInRange(config.manifest.timeout, 15000, 1000, 120000);
  config.prefetch.concurrency = Math.round(numberInRange(config.prefetch.concurrency, 3, 1, 8));
  config.prefetch.quietMs = numberInRange(config.prefetch.quietMs, 1200, 0, 30000);
  config.prefetch.keepAliveMs = numberInRange(config.prefetch.keepAliveMs, 60000, 5000, 5 * 60 * 1000);
  config.prefetch.maxRetries = Math.round(numberInRange(config.prefetch.maxRetries, 2, 0, 5));
  if (!['high', 'low', 'auto'].includes(config.prefetch.priority)) config.prefetch.priority = 'low';
  config.crossOriginImages.ttl = numberInRange(config.crossOriginImages.ttl, 600000, 0, 30 * 24 * 60 * 60 * 1000);
  config.crossOriginImages.maxEntries = Math.round(
    numberInRange(config.crossOriginImages.maxEntries, IMAGE_META_MAX, 10, 10000)
  );
  config.errorPages.statuses = Array.isArray(config.errorPages.statuses)
    ? config.errorPages.statuses.map(Number).filter((status) => status >= 400 && status <= 599)
    : [403, 404];
  config.forceRefresh.timeout = numberInRange(config.forceRefresh.timeout, 30000, 1000, 120000);
  if (!['query', 'reload', 'auto'].includes(config.forceRefresh.strategy)) config.forceRefresh.strategy = 'query';
  if (!config.forceRefresh.param) config.forceRefresh.param = '_t';
}

function readBootConfig() {
  /** @type {Record<string, unknown>} */
  const overrides = {};
  try {
    const params = SELF_URL.searchParams;
    if (params.get('debug') === '1') overrides.debug = true;
    if (params.get('ignoreSearch') === '1') overrides.sameOrigin = { ignoreSearch: true };
    const ttlParam = params.get('imageTTL');
    if (ttlParam !== null) {
      const ttl = Number(ttlParam);
      if (Number.isFinite(ttl) && ttl >= 0) overrides.crossOriginImages = { ttl };
    }
    const interval = Number(params.get('checkInterval'));
    if (Number.isFinite(interval) && interval > 0) overrides.manifest = { checkInterval: interval };
  } catch {
    /* URL parsing cannot realistically fail here; keep defaults. */
  }
  return overrides;
}

/* -------------------------------------------------------------------------- */
/* Logging                                                                    */
/* -------------------------------------------------------------------------- */

const logs = [];
const LOG_LIMIT = 400;

function formatLogArg(value) {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function log(level, ...args) {
  if (level === 'debug' && !config.debug) return;
  const entry = {
    t: Date.now(),
    level,
    msg: args.map(formatLogArg).join(' '),
  };
  logs.push(entry);
  while (logs.length > LOG_LIMIT) logs.shift();
  if (config.debug || level === 'warn' || level === 'error') {
    const method = console[level] || console.log;
    method.call(console, `[SW ${level}]`, ...args);
  }
}

function getLogs(clear) {
  const entries = logs.slice();
  if (clear) logs.length = 0;
  return entries;
}

/* -------------------------------------------------------------------------- */
/* IndexedDB (tiny wrapper, degrades gracefully in private mode)              */
/* -------------------------------------------------------------------------- */

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  if (typeof indexedDB === 'undefined') {
    dbPromise = Promise.resolve(null);
    return dbPromise;
  }
  dbPromise = new Promise((resolve) => {
    let request;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      log('warn', 'IndexedDB unavailable', error);
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_KV)) db.createObjectStore(STORE_KV);
      if (!db.objectStoreNames.contains(STORE_IMAGES)) db.createObjectStore(STORE_IMAGES, { keyPath: 'url' });
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => {
      log('warn', 'IndexedDB open failed', request.error);
      resolve(null);
    };
    request.onblocked = () => log('warn', 'IndexedDB open blocked by another tab');
  });
  return dbPromise;
}

async function idbGet(storeName, key) {
  const db = await openDb();
  if (!db) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    } catch (error) {
      log('debug', 'idbGet failed', storeName, error);
      resolve(undefined);
    }
  });
}

async function idbGetAll(storeName) {
  const db = await openDb();
  if (!db) return [];
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const request = tx.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
      request.onerror = () => resolve([]);
    } catch (error) {
      log('debug', 'idbGetAll failed', storeName, error);
      resolve([]);
    }
  });
}

async function idbPut(storeName, value, key) {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      if (key === undefined) store.put(value);
      else store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => {
        log('warn', 'IndexedDB write failed', storeName, tx.error);
        resolve(false);
      };
      tx.onabort = () => resolve(false);
    } catch (error) {
      log('warn', 'IndexedDB write threw', storeName, error);
      resolve(false);
    }
  });
}

async function idbDelete(storeName, key) {
  const db = await openDb();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch (error) {
      log('debug', 'IndexedDB delete failed', storeName, error);
      resolve(false);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Small helpers                                                              */
/* -------------------------------------------------------------------------- */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheKeyForPath(path) {
  return new URL(path, SCOPE_URL).href;
}

function manifestUrl() {
  return new URL(config.manifest.url, SCOPE_URL);
}

function normaliseRequestKey(rawUrl) {
  const url = new URL(rawUrl);
  url.hash = '';
  if (config.sameOrigin.ignoreSearch) url.search = '';
  return url.href;
}

async function getCache(name) {
  const cached = cacheHandles.get(name);
  if (cached) return cached;
  const opened = await caches.open(name);
  cacheHandles.set(name, opened);
  return opened;
}

function isManagedManifestPath(path) {
  if (typeof path !== 'string' || !path.startsWith('/')) return false;
  let url;
  try {
    url = new URL(path, SCOPE_URL);
  } catch {
    return false;
  }
  if (url.origin !== ORIGIN) return false;
  if (url.pathname === SELF_PATH) return false;
  if (url.pathname === manifestUrl().pathname) return false;
  return true;
}

function isBypassed(url) {
  if (url.origin !== ORIGIN) return false;
  const path = url.pathname;
  if (path === SELF_PATH) return true;
  if (path === manifestUrl().pathname) return true;
  // Vite dev-server paths; harmless in production but useful when debugging.
  if (path.startsWith('/@')) return true;
  if (path.startsWith('/src/') || path.startsWith('/node_modules/') || path.startsWith('/.vite/')) return true;
  return false;
}

function wantsHtml(request) {
  if (request.mode === 'navigate' || request.destination === 'document') return true;
  if (request.destination === 'iframe' || request.destination === 'frame') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
}

function isHtmlErrorResponse(response) {
  if (!config.errorPages.enabled) return false;
  if (!config.errorPages.statuses.includes(response.status)) return false;
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  return contentType.includes('text/html');
}

function shouldCacheResponse(response) {
  if (!response) return false;
  if (response.status !== 200) return false;
  if (response.type === 'opaque' || response.type === 'opaqueredirect') return false;
  const cacheControl = (response.headers.get('cache-control') || '').toLowerCase();
  if (cacheControl.includes('no-store')) return false;
  return true;
}

async function fetchWithTimeout(request, ms) {
  if (!ms || ms <= 0) return fetch(request);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  let timedRequest;
  try {
    timedRequest = new Request(request, { signal: controller.signal });
  } catch {
    timedRequest = request;
  }
  try {
    return await fetch(timedRequest);
  } finally {
    clearTimeout(timer);
  }
}

function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

async function hashText(text) {
  try {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    const bytes = new Uint8Array(digest).slice(0, 8);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    log('debug', 'subtle crypto unavailable, using FNV-1a', error);
    return fnv1a(text);
  }
}

/* -------------------------------------------------------------------------- */
/* Manifest                                                                   */
/* -------------------------------------------------------------------------- */

function canonicalManifestPath(rawPath) {
  if (typeof rawPath !== 'string') return null;
  let value = rawPath.trim();
  if (!value) return null;
  if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1).trim();
  if (!value.startsWith('/')) return null;
  try {
    const url = new URL(value, ORIGIN);
    if (url.origin !== ORIGIN) return null;
    if (url.pathname === '/' || url.pathname === manifestUrl().pathname) return null;
    return url.pathname;
  } catch {
    return null;
  }
}

function parseManifestText(text) {
  const entries = new Map();
  const lines = text.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(.*)\s+(\S+)$/.exec(line);
    if (!match) continue;
    const path = canonicalManifestPath(match[1]);
    const hash = match[2].trim();
    if (!path || !hash) continue;
    entries.set(path, hash);
  }
  return entries;
}

async function fetchManifestText() {
  const url = manifestUrl();
  if (config.manifest.cacheBust) {
    url.searchParams.set(
      config.forceRefresh.param,
      `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    );
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.manifest.timeout);
  try {
    const response = await fetch(url.href, {
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`manifest HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

function mapsEqual(left, right) {
  if (left.size !== right.size) return false;
  for (const [key, value] of left) {
    if (right.get(key) !== value) return false;
  }
  return true;
}

function diffManifests(previous, next) {
  const added = [];
  const changed = [];
  const removed = [];
  for (const [path, hash] of next) {
    if (!previous.has(path)) added.push(path);
    else if (previous.get(path) !== hash) changed.push(path);
  }
  for (const path of previous.keys()) {
    if (!next.has(path)) removed.push(path);
  }
  return { added, changed, removed };
}

async function saveManifestState() {
  await idbPut(
    STORE_KV,
    {
      version: state.manifestVersion,
      fetchedAt: state.manifestFetchedAt,
      entries: Array.from(state.manifest.entries()),
    },
    'manifest'
  );
}

async function loadPersistedManifest() {
  const saved = await idbGet(STORE_KV, 'manifest');
  if (!saved || !Array.isArray(saved.entries)) return;
  const entries = new Map();
  for (const pair of saved.entries) {
    if (!Array.isArray(pair) || pair.length !== 2) continue;
    const path = canonicalManifestPath(pair[0]);
    if (path) entries.set(path, String(pair[1]));
  }
  state.manifest = entries;
  state.manifestVersion = String(saved.version || '');
  state.manifestFetchedAt = Number(saved.fetchedAt) || 0;
  log('info', `restored manifest ${state.manifestVersion} (${entries.size} files)`);
}

async function checkManifest(options = {}) {
  await state.ready;
  if (state.checking) return state.checking;

  const force = options.force === true;
  const now = Date.now();
  if (!force && state.lastCheckAt && now - state.lastCheckAt < config.manifest.checkInterval) {
    return {
      ok: true,
      skipped: true,
      reason: 'interval',
      version: state.manifestVersion,
      count: state.manifest.size,
    };
  }

  state.lastCheckAt = now;
  state.stats.manifestChecks += 1;

  const task = (async () => {
    try {
      const text = await fetchManifestText();
      const entries = parseManifestText(text);
      if (entries.size === 0) {
        log('warn', 'manifest has no entries; keeping the current manifest');
        return {
          ok: false,
          error: 'manifest has no entries',
          version: state.manifestVersion,
          count: state.manifest.size,
        };
      }

      const version = await hashText(text);
      const unchanged = state.manifestVersion === version && mapsEqual(state.manifest, entries);
      if (unchanged) {
        log('debug', 'manifest unchanged', version, `${entries.size} files`);
        return { ok: true, changed: false, version, count: entries.size };
      }

      const initial = state.manifest.size === 0;
      const diff = diffManifests(state.manifest, entries);
      state.manifest = entries;
      state.manifestVersion = version;
      state.manifestFetchedAt = Date.now();
      await saveManifestState();
      state.stats.manifestUpdates += 1;

      if (initial) {
        scheduler.enqueue(Array.from(entries.keys()), 'initial');
      } else {
        scheduler.enqueue([...diff.added, ...diff.changed], 'update');
        broadcast({
          type: 'SW_MANIFEST_UPDATED',
          version,
          count: entries.size,
          added: diff.added.length,
          changed: diff.changed.length,
          removed: diff.removed.length,
          at: state.manifestFetchedAt,
        });
      }

      log(
        'info',
        'manifest updated',
        version,
        `${entries.size} files`,
        `+${diff.added.length} ~${diff.changed.length} -${diff.removed.length}`
      );

      return {
        ok: true,
        changed: true,
        initial,
        version,
        count: entries.size,
        fetchedAt: state.manifestFetchedAt,
        diff: {
          added: diff.added,
          changed: diff.changed,
          removed: diff.removed,
        },
      };
    } catch (error) {
      log('warn', 'manifest check failed', error);
      return {
        ok: false,
        error: String(error && error.message ? error.message : error),
        version: state.manifestVersion,
        count: state.manifest.size,
      };
    }
  })();

  state.checking = task;
  try {
    return await task;
  } finally {
    if (state.checking === task) state.checking = null;
  }
}

function findManifestPath(url) {
  if (!state.manifest.size) return null;
  if (!config.sameOrigin.ignoreSearch && url.search) return null;

  const pathname = url.pathname;
  const candidates = [pathname];
  if (pathname.endsWith('/')) {
    candidates.push(`${pathname}index.html`);
  } else {
    candidates.push(`${pathname}/index.html`);
    if (!/\.[^/]+$/.test(pathname)) candidates.push(`${pathname}.html`);
  }

  for (const candidate of candidates) {
    if (state.manifest.has(candidate)) return candidate;
  }
  return null;
}

function startManifestTimer() {
  if (manifestTimer) {
    clearInterval(manifestTimer);
    manifestTimer = null;
  }
  if (!config.manifest.checkInterval) return;
  manifestTimer = setInterval(() => {
    checkManifest({ force: true }).catch((error) => log('warn', 'periodic manifest check failed', error));
  }, config.manifest.checkInterval);
  log('debug', 'manifest timer started', `${config.manifest.checkInterval}ms`);
}

async function registerPeriodicSync() {
  const periodicSync = self.registration && self.registration.periodicSync;
  if (!periodicSync || typeof periodicSync.register !== 'function') return;
  try {
    await periodicSync.register(PREFETCH_TAG, {
      minInterval: Math.max(config.manifest.checkInterval, 60 * 1000),
    });
    log('debug', 'periodicSync registered');
  } catch (error) {
    log('debug', 'periodicSync registration rejected', error);
  }
}

/* -------------------------------------------------------------------------- */
/* Background pre-download scheduler                                          */
/* -------------------------------------------------------------------------- */

function prefetchPriority(path) {
  if (path === '/index.html' || path === '/404.html' || /^\/\d{3}\.html$/.test(path)) return 0;
  if (path.endsWith('.html')) return 1;
  if (/\.(css|js|mjs|json|xml|txt|woff2?|ttf|otf)$/i.test(path)) return 2;
  if (/\.(png|jpe?g|webp|avif|gif|svg|ico)$/i.test(path)) return 3;
  return 4;
}

class PrefetchScheduler {
  constructor() {
    this.queue = [];
    this.queued = new Set();
    this.active = new Map();
    this.pausedUntil = 0;
    this.timer = null;
    this.pumping = false;
    this.stopped = false;
    this.generation = 0;
    this.idleWaiters = [];
  }

  get size() {
    return this.queue.length + this.active.size;
  }

  start() {
    this.stopped = false;
    this.pump();
  }

  status() {
    return {
      queued: this.queue.length,
      active: this.active.size,
      pausedFor: Math.max(0, this.pausedUntil - Date.now()),
      total: this.size,
    };
  }

  enqueue(paths, reason = 'manual') {
    let added = 0;
    for (const path of paths) {
      if (!isManagedManifestPath(path)) continue;
      if (this.queued.has(path) || this.active.has(path)) continue;
      this.queue.push({ path, reason, attempts: 0 });
      this.queued.add(path);
      added += 1;
    }
    if (added) {
      this.sortQueue();
      this.pump();
    }
    return added;
  }

  /**
   * Put an item back without consulting `active` (the caller is still the
   * active download until its `finally` block runs).
   */
  requeue(item) {
    if (this.queued.has(item.path)) return;
    this.queue.push(item);
    this.queued.add(item.path);
    this.sortQueue();
  }

  sortQueue() {
    this.queue.sort((left, right) => prefetchPriority(left.path) - prefetchPriority(right.path));
  }

  noteForeground(request) {
    if (!config.prefetch.enabled) return;
    if (this.size === 0 && !this.timer) return;
    this.pausedUntil = Math.max(this.pausedUntil, Date.now() + config.prefetch.quietMs);
    if (request.mode === 'navigate' && config.prefetch.abortOnNavigation) {
      this.abortActive();
    }
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.queue.length) this.scheduleWake();
  }

  abortActive() {
    for (const controller of this.active.values()) {
      try {
        controller.abort();
      } catch {
        /* already settled */
      }
    }
  }

  scheduleWake(waitMs) {
    if (this.timer) clearTimeout(this.timer);
    const wait = waitMs === undefined ? Math.max(0, this.pausedUntil - Date.now()) + 25 : waitMs;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.pump();
    }, wait);
  }

  pump() {
    if (this.pumping || this.stopped || !config.prefetch.enabled) return;
    this.pumping = true;
    try {
      while (this.queue.length > 0 && this.active.size < config.prefetch.concurrency) {
        if (Date.now() < this.pausedUntil) {
          this.scheduleWake();
          break;
        }
        const item = this.queue.shift();
        this.queued.delete(item.path);
        const controller = new AbortController();
        this.active.set(item.path, controller);
        this.download(item, controller, this.generation);
      }
    } finally {
      this.pumping = false;
    }
    this.resolveIdleIfDone();
  }

  async download(item, controller, generation) {
    try {
      await prefetchOne(item.path, controller.signal);
      state.stats.prefetch += 1;
    } catch (error) {
      if (generation !== this.generation) return;
      if (error && error.name === 'AbortError') {
        if (!this.stopped) this.requeue(item);
        log('debug', 'prefetch aborted', item.path);
      } else {
        state.stats.prefetchFailed += 1;
        log('warn', 'prefetch failed', item.path, error);
        if ((item.attempts || 0) < config.prefetch.maxRetries) {
          item.attempts = (item.attempts || 0) + 1;
          this.requeue(item);
        }
      }
    } finally {
      this.active.delete(item.path);
      this.pump();
      this.resolveIdleIfDone();
    }
  }

  resolveIdleIfDone() {
    if (this.size > 0) return;
    const waiters = this.idleWaiters;
    this.idleWaiters = [];
    for (const waiter of waiters) {
      try {
        waiter(true);
      } catch {
        /* ignore */
      }
    }
  }

  keepAlive(maxMs) {
    if (this.size === 0) return Promise.resolve(false);
    return new Promise((resolve) => {
      let settled = false;
      let timer;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        resolve(value);
      };
      const waiter = () => finish(true);
      this.idleWaiters.push(waiter);
      timer = setTimeout(() => {
        const index = this.idleWaiters.indexOf(waiter);
        if (index !== -1) this.idleWaiters.splice(index, 1);
        finish(false);
      }, maxMs);
    });
  }

  clear() {
    this.generation += 1;
    this.queue.length = 0;
    this.queued.clear();
    this.abortActive();
    this.active.clear();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.resolveIdleIfDone();
  }
}

const scheduler = new PrefetchScheduler();

async function prefetchOne(path, signal) {
  const key = cacheKeyForPath(path);
  const cache = await getCache(CACHE_NAMES.assets);
  const request = new Request(key, {
    cache: 'reload',
    credentials: 'same-origin',
    signal,
    priority: config.prefetch.priority,
  });
  const response = await fetch(request);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  // Consume the body into Cache Storage. This is not a response the page sees.
  await cache.put(key, response);
  log('debug', 'prefetched', path);
}

async function ensureCacheCoverage(force = false) {
  await state.ready;
  if (!state.manifest.size) return 0;
  const now = Date.now();
  if (!force && coveragePromise) return coveragePromise;
  if (!force && now - lastCoverageAt < 30 * 1000) return 0;
  if (coveragePromise) return coveragePromise;

  coveragePromise = (async () => {
    lastCoverageAt = now;
    const cache = await getCache(CACHE_NAMES.assets);
    const missing = [];
    for (const path of state.manifest.keys()) {
      if (!isManagedManifestPath(path)) continue;
      const hit = await cache.match(cacheKeyForPath(path), { ignoreVary: true });
      if (!hit) missing.push(path);
    }
    const added = scheduler.enqueue(missing, 'coverage');
    if (added > 0) log('info', 'cache coverage enqueued', added);
    return added;
  })();

  try {
    return await coveragePromise;
  } finally {
    coveragePromise = null;
  }
}

/* -------------------------------------------------------------------------- */
/* Cache lookups + responses                                                  */
/* -------------------------------------------------------------------------- */

async function lookupCached(key, altKey) {
  for (const name of [CACHE_NAMES.assets, CACHE_NAMES.runtime]) {
    const cache = await getCache(name);
    const hit = await cache.match(key, { ignoreVary: true });
    if (hit) return { response: hit, cacheName: name, key };
    if (altKey && altKey !== key) {
      const altHit = await cache.match(altKey, { ignoreVary: true });
      if (altHit) return { response: altHit, cacheName: name, key: altKey };
    }
  }
  return null;
}

async function getAsset(path) {
  const key = cacheKeyForPath(path);
  const cache = await getCache(CACHE_NAMES.assets);
  const cached = await cache.match(key, { ignoreVary: true });
  if (cached) return cached;
  try {
    const response = await fetch(new Request(key, { cache: 'reload', credentials: 'same-origin' }));
    if (!response.ok) return null;
    await cache.put(key, response.clone());
    return response;
  } catch (error) {
    log('debug', 'status page fetch failed', path, error);
    return null;
  }
}

function buildStatusPageResponse(page, originalResponse, statusPath) {
  const status = originalResponse.status;
  const headers = new Headers(page.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');
  headers.delete('last-modified');
  headers.delete('cache-control');
  headers.set('cache-control', config.errorPages.cacheControl || 'no-store');
  headers.set('content-type', 'text/html; charset=utf-8');
  headers.set('x-sw-status-page', statusPath);
  return new Response(page.body, {
    status,
    statusText: originalResponse.statusText || String(status),
    headers,
  });
}

async function getStatusPageResponse(originalResponse, request) {
  if (!config.errorPages.enabled) return null;
  const status = originalResponse.status;
  if (!config.errorPages.statuses.includes(status)) return null;

  const requestPath = new URL(request.url).pathname;
  for (const candidate of [`/${status}.html`, `/${status}/index.html`]) {
    const path = canonicalManifestPath(candidate);
    if (!path || !state.manifest.has(path)) continue;
    if (requestPath === path) continue;
    const page = await getAsset(path);
    if (!page) continue;
    state.stats.statusPage += 1;
    log('info', 'serving status page', status, path, 'for', requestPath);
    return buildStatusPageResponse(page, originalResponse, path);
  }
  return null;
}

async function handleSameOrigin(event) {
  const request = event.request;
  const url = new URL(request.url);
  await state.ready;
  state.stats.fetch += 1;

  const manifestPath = findManifestPath(url);
  const key = manifestPath ? cacheKeyForPath(manifestPath) : normaliseRequestKey(url.href);
  const altKey = manifestPath ? normaliseRequestKey(url.href) : null;

  const cached = await lookupCached(key, altKey);
  if (cached) {
    state.stats.cacheHit += 1;
    log('debug', 'cache hit', url.pathname, `(${cached.cacheName})`);
    return cached.response;
  }

  let response;
  try {
    const priority = request.mode === 'navigate' || request.destination === 'document' ? 'high' : '';
    response = await fetch(request, priority ? { priority } : undefined);
  } catch (error) {
    log('warn', 'network request failed', url.pathname, error);
    throw error;
  }

  state.stats.network += 1;

  if (isHtmlErrorResponse(response) && wantsHtml(request)) {
    const statusPage = await getStatusPageResponse(response, request);
    if (statusPage) return statusPage;
    // Not a manifest-backed status page: hand back the original response and
    // deliberately do not cache an error.
    return response;
  }

  if (shouldCacheResponse(response) && !request.headers.has('authorization')) {
    const cacheName = manifestPath ? CACHE_NAMES.assets : CACHE_NAMES.runtime;
    const cache = await getCache(cacheName);
    try {
      await cache.put(key, response.clone());
      log('debug', 'cached network response', key, `(${cacheName})`);
    } catch (error) {
      log('warn', 'failed to cache response', key, error);
    }
  }

  return response;
}

function isCrossOriginImage(request, url) {
  if (!config.crossOriginImages.enabled) return false;
  if (url.origin === ORIGIN) return false;
  if (request.mode !== 'no-cors') return false;
  if (request.destination === 'image') return true;
  if (request.destination === '') {
    const accept = request.headers.get('accept') || '';
    return accept.includes('image/');
  }
  return false;
}

async function getImageMeta(url) {
  if (state.imageMeta.has(url)) return state.imageMeta.get(url);
  const record = await idbGet(STORE_IMAGES, url);
  if (record) state.imageMeta.set(url, record);
  return record;
}

async function setImageMeta(url, cachedAt) {
  const record = { url, cachedAt };
  state.imageMeta.set(url, record);
  await idbPut(STORE_IMAGES, record);
  if (state.imageMeta.size > config.crossOriginImages.maxEntries) {
    pruneImageMeta().catch((error) => log('warn', 'image meta prune failed', error));
  }
}

async function pruneImageMeta() {
  const max = config.crossOriginImages.maxEntries;
  const all = await idbGetAll(STORE_IMAGES);
  if (all.length <= max) return;
  all.sort((left, right) => (left.cachedAt || 0) - (right.cachedAt || 0));
  const remove = all.slice(0, all.length - max);
  for (const record of remove) {
    state.imageMeta.delete(record.url);
    await idbDelete(STORE_IMAGES, record.url);
  }
  log('info', 'pruned image metadata', remove.length);
}

async function handleImage(event) {
  const request = event.request;
  const key = new URL(request.url).href;
  const cache = await getCache(CACHE_NAMES.images);
  const cached = await cache.match(key, { ignoreVary: true });
  const ttl = config.crossOriginImages.ttl;
  const meta = cached ? await getImageMeta(key) : undefined;
  const age = meta ? Date.now() - Number(meta.cachedAt || 0) : Infinity;
  const fresh = Boolean(cached) && ttl > 0 && age >= 0 && age < ttl;

  if (cached && fresh) {
    state.stats.imageHit += 1;
    log('debug', 'image cache hit', key, `${Math.round(age / 1000)}s old`);
    return cached;
  }

  state.stats.imageMiss += 1;
  let freshRequest;
  try {
    freshRequest = new Request(request, { cache: 'reload' });
  } catch {
    freshRequest = request;
  }

  try {
    const response = await fetch(freshRequest);
    if (response.type === 'opaque' || response.ok) {
      try {
        // Never touch the opaque response itself: clone it, store the clone.
        await cache.put(key, response.clone());
        await setImageMeta(key, Date.now());
      } catch (error) {
        log('warn', 'failed to cache image', key, error);
      }
    }
    return response;
  } catch (error) {
    if (cached) {
      log('warn', 'image refresh failed, serving stale copy', key, error);
      return cached;
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Force refresh API                                                          */
/* -------------------------------------------------------------------------- */

function resolveRefreshStrategy(target, options) {
  if (options.strategy === 'query' || options.strategy === 'reload') return options.strategy;
  if (target.origin !== ORIGIN) return 'reload';
  return config.forceRefresh.strategy === 'auto' ? 'query' : config.forceRefresh.strategy;
}

async function fetchForced(target, init, options = {}) {
  const strategy = resolveRefreshStrategy(target, options);
  const timeout = config.forceRefresh.timeout;
  const baseInit = { ...init };

  if (strategy === 'query') {
    const busted = new URL(target.href);
    busted.searchParams.set(
      config.forceRefresh.param,
      `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    );
    return fetchWithTimeout(new Request(busted.href, { ...baseInit, cache: 'no-store' }), timeout);
  }

  let request;
  try {
    request = new Request(target.href, { ...baseInit, cache: 'reload' });
  } catch {
    const busted = new URL(target.href);
    busted.searchParams.set(
      config.forceRefresh.param,
      `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
    );
    request = new Request(busted.href, { ...baseInit, cache: 'no-store' });
  }
  return fetchWithTimeout(request, timeout);
}

function normaliseUrlList(urls) {
  if (typeof urls === 'string') return [urls];
  if (Array.isArray(urls)) return urls.filter((url) => typeof url === 'string' && url.length > 0);
  return [];
}

async function refreshUrls(urls, options = {}) {
  await state.ready;
  const results = [];
  for (const rawUrl of normaliseUrlList(urls)) {
    const started = Date.now();
    try {
      const target = new URL(rawUrl, SCOPE_URL);
      if (target.origin === ORIGIN) {
        const manifestPath = findManifestPath(target);
        const key = manifestPath ? cacheKeyForPath(manifestPath) : normaliseRequestKey(target.href);
        const cacheName = manifestPath ? CACHE_NAMES.assets : CACHE_NAMES.runtime;
        const cache = await getCache(cacheName);
        const response = await fetchForced(
          target,
          { credentials: 'same-origin', mode: 'same-origin' },
          { strategy: options.strategy }
        );

        if (!response.ok) {
          results.push({
            url: rawUrl,
            ok: false,
            status: response.status,
            error: `HTTP ${response.status}`,
            ms: Date.now() - started,
          });
          continue;
        }

        await cache.put(key, response.clone());
        state.stats.refresh += 1;
        results.push({
          url: rawUrl,
          ok: true,
          status: response.status,
          key,
          cache: cacheName,
          manifest: Boolean(manifestPath),
          ms: Date.now() - started,
        });
      } else {
        const key = target.href;
        const cache = await getCache(CACHE_NAMES.images);
        const response = await fetchForced(target, { credentials: 'omit', mode: 'no-cors' }, { strategy: 'reload' });

        const acceptable = response.type === 'opaque' || response.ok;
        if (!acceptable) {
          results.push({
            url: rawUrl,
            ok: false,
            status: response.status,
            error: `HTTP ${response.status}`,
            ms: Date.now() - started,
          });
          continue;
        }

        // The key stays the original URL; the network request may have had
        // `_t` injected. Opaque responses are stored untouched.
        await cache.put(key, response.clone());
        await setImageMeta(key, Date.now());
        state.stats.refresh += 1;
        results.push({
          url: rawUrl,
          ok: true,
          status: response.status,
          opaque: response.type === 'opaque',
          key,
          cache: CACHE_NAMES.images,
          ms: Date.now() - started,
        });
      }
    } catch (error) {
      results.push({
        url: rawUrl,
        ok: false,
        error: String(error && error.message ? error.message : error),
        ms: Date.now() - started,
      });
    }
  }
  return results;
}

/* -------------------------------------------------------------------------- */
/* Status / config / cache management                                         */
/* -------------------------------------------------------------------------- */

async function buildStatus() {
  await state.ready;
  /** @type {Record<string, number>} */
  const cacheInfo = {};
  for (const name of Object.values(CACHE_NAMES)) {
    try {
      const cache = await getCache(name);
      cacheInfo[name] = (await cache.keys()).length;
    } catch {
      cacheInfo[name] = -1;
    }
  }

  let storage;
  try {
    if (navigator.storage && typeof navigator.storage.estimate === 'function') {
      const estimate = await navigator.storage.estimate();
      storage = { usage: estimate.usage, quota: estimate.quota };
    }
  } catch {
    storage = undefined;
  }

  return {
    ok: true,
    version: SW_VERSION,
    cacheVersion: CACHE_VERSION,
    manifest: {
      version: state.manifestVersion,
      count: state.manifest.size,
      fetchedAt: state.manifestFetchedAt,
      lastCheckAt: state.lastCheckAt,
      sample: Array.from(state.manifest.keys()).slice(0, 8),
    },
    caches: cacheInfo,
    config: structuredCloneSafe(config),
    stats: { ...state.stats },
    prefetch: scheduler.status(),
    imageMeta: state.imageMeta.size,
    online: navigator.onLine !== false,
    uptime: Date.now() - state.startedAt,
    storage,
  };
}

async function applyConfig(patch) {
  if (!isPlainObject(patch)) throw new Error('config patch must be an object');
  mergeDeep(config, patch);
  normaliseConfig();
  await idbPut(STORE_KV, structuredCloneSafe(config), 'config');
  startManifestTimer();
  scheduler.pump();
  log('info', 'config updated', patch);
  return structuredCloneSafe(config);
}

async function resetConfig() {
  const fresh = structuredCloneSafe(DEFAULT_CONFIG);
  for (const key of Object.keys(config)) delete config[key];
  Object.assign(config, fresh);
  normaliseConfig();
  await idbPut(STORE_KV, structuredCloneSafe(config), 'config');
  startManifestTimer();
  log('info', 'config reset');
  return structuredCloneSafe(config);
}

async function clearCaches(scope = 'all') {
  const scopes = {
    runtime: [CACHE_NAMES.runtime],
    assets: [CACHE_NAMES.assets],
    images: [CACHE_NAMES.images],
    all: [CACHE_NAMES.assets, CACHE_NAMES.runtime, CACHE_NAMES.images],
  };
  const names = scopes[scope] || scopes.all;
  const cleared = [];
  for (const name of names) {
    if (await caches.delete(name)) cleared.push(name);
    cacheHandles.delete(name);
  }

  if (scope === 'images' || scope === 'all') {
    state.imageMeta.clear();
    const records = await idbGetAll(STORE_IMAGES);
    for (const record of records) await idbDelete(STORE_IMAGES, record.url);
  }

  if (scope === 'all') {
    scheduler.clear();
    state.manifest = new Map();
    state.manifestVersion = '';
    state.manifestFetchedAt = 0;
    state.lastCheckAt = 0;
    await idbDelete(STORE_KV, 'manifest');
  }

  log('info', 'caches cleared', scope, cleared.join(', '));
  return { ok: true, scope, cleared };
}

/* -------------------------------------------------------------------------- */
/* Messaging                                                                  */
/* -------------------------------------------------------------------------- */

async function broadcast(message) {
  state.stats.broadcast += 1;
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      try {
        client.postMessage(message);
      } catch (error) {
        log('debug', 'broadcast failed', error);
      }
    }
  } catch (error) {
    log('debug', 'broadcast skipped', error);
  }
}

function reply(event, type, id, payload) {
  const message = { type: `${type}_RESULT`, id, ...payload };
  if (event.ports && event.ports[0]) {
    try {
      event.ports[0].postMessage(message);
      return;
    } catch (error) {
      log('debug', 'port reply failed', error);
    }
  }
  if (event.source && typeof event.source.postMessage === 'function') {
    try {
      event.source.postMessage(message);
    } catch (error) {
      log('debug', 'client reply failed', error);
    }
  }
}

function isAllowedMessage(event) {
  if (event.origin && event.origin !== ORIGIN) return false;
  return true;
}

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object' || typeof data.type !== 'string') return;
  if (!isAllowedMessage(event)) return;

  const type = data.type;
  const id = data.id;

  if (type === 'SW_KICK' || type === 'SW_PING') {
    // Reply immediately, then keep the worker alive while it catches up.
    reply(event, type, id, { ok: true, version: SW_VERSION });
    event.waitUntil(
      (async () => {
        await state.ready;
        try {
          await ensureCacheCoverage();
          scheduler.start();
          await checkManifest();
          await scheduler.keepAlive(config.prefetch.keepAliveMs);
        } catch (error) {
          log('warn', 'kick task failed', error);
        }
      })()
    );
    return;
  }

  event.waitUntil(
    (async () => {
      try {
        await state.ready;
        switch (type) {
          case 'SW_STATUS':
          case 'SW_HELLO': {
            reply(event, type, id, await buildStatus());
            break;
          }
          case 'SW_SYNC': {
            const result = await checkManifest({ force: true });
            reply(event, type, id, { ...result, ok: result.ok !== false });
            if (result.changed) await scheduler.keepAlive(config.prefetch.keepAliveMs);
            break;
          }
          case 'SW_PREFETCH': {
            let queued;
            if (Array.isArray(data.urls) && data.urls.length > 0) {
              const paths = data.urls
                .map((raw) => {
                  try {
                    const target = new URL(raw, SCOPE_URL);
                    return findManifestPath(target);
                  } catch {
                    return null;
                  }
                })
                .filter(Boolean);
              queued = scheduler.enqueue(paths, 'message');
            } else {
              queued = await ensureCacheCoverage(true);
            }
            scheduler.start();
            reply(event, type, id, { ok: true, queued, prefetch: scheduler.status() });
            await scheduler.keepAlive(config.prefetch.keepAliveMs);
            break;
          }
          case 'SW_REFRESH': {
            const results = await refreshUrls(data.urls, {
              strategy: data.strategy,
            });
            reply(event, type, id, {
              ok: results.every((result) => result.ok),
              results,
            });
            break;
          }
          case 'SW_CONFIG': {
            const next = await applyConfig(data.patch || data.config || {});
            reply(event, type, id, { ok: true, config: next });
            break;
          }
          case 'SW_RESET_CONFIG': {
            const next = await resetConfig();
            reply(event, type, id, { ok: true, config: next });
            break;
          }
          case 'SW_CLEAR': {
            const result = await clearCaches(data.scope || 'all');
            reply(event, type, id, result);
            break;
          }
          case 'SW_LOGS': {
            const entries = getLogs(Boolean(data.clear));
            reply(event, type, id, { ok: true, logs: entries });
            break;
          }
          case 'SW_CLAIM_CLIENTS': {
            await self.clients.claim();
            reply(event, type, id, { ok: true });
            break;
          }
          default: {
            reply(event, type, id, { ok: false, error: `unknown message type: ${type}` });
          }
        }
      } catch (error) {
        log('warn', 'message handler failed', type, error);
        reply(event, type, id, {
          ok: false,
          error: String(error && error.message ? error.message : error),
        });
      }
    })()
  );
});

/* -------------------------------------------------------------------------- */
/* Lifecycle                                                                  */
/* -------------------------------------------------------------------------- */

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      log('info', 'installing', SW_VERSION);
      // Do not race the first page load: pre-downloading starts after we are
      // active and have claimed clients, where foreground requests can pause it.
      scheduler.stopped = true;
      await state.ready;
      try {
        await checkManifest({ force: true });
      } catch (error) {
        log('warn', 'initial manifest check failed', error);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      await state.ready;
      await cleanupOldCaches();
      await self.clients.claim();
      await ensureCacheCoverage();
      scheduler.start();
      startManifestTimer();
      await registerPeriodicSync();
      pruneImageMeta().catch((error) => log('warn', 'image meta prune failed', error));
      broadcast({ type: 'SW_ACTIVATED', version: SW_VERSION, cacheVersion: CACHE_VERSION });
      log('info', 'activated', SW_VERSION);
    })()
  );
});

async function cleanupOldCaches() {
  const keep = new Set(Object.values(CACHE_NAMES));
  const names = await caches.keys();
  for (const name of names) {
    if (name.startsWith('mobell-sw-') && !keep.has(name)) {
      await caches.delete(name);
      cacheHandles.delete(name);
      log('info', 'deleted old cache', name);
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Fetch                                                                      */
/* -------------------------------------------------------------------------- */

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (request.headers.has('range')) return;

  const sameOrigin = url.origin === ORIGIN;
  if (sameOrigin && isBypassed(url)) return;

  scheduler.noteForeground(request);

  if (sameOrigin) {
    event.respondWith(
      handleSameOrigin(event).catch((error) => {
        log('warn', 'same-origin handler failed', url.pathname, error);
        return Response.error();
      })
    );
    event.waitUntil(scheduler.keepAlive(config.prefetch.keepAliveMs));
    maybeCheckManifestOnNavigation(event, request);
    return;
  }

  if (isCrossOriginImage(request, url)) {
    event.respondWith(
      handleImage(event).catch((error) => {
        log('warn', 'image handler failed', url.href, error);
        return Response.error();
      })
    );
  }
});

function maybeCheckManifestOnNavigation(event, request) {
  if (!config.manifest.checkOnNavigation) return;
  if (request.mode !== 'navigate' && request.destination !== 'document') return;
  if (Date.now() - state.lastCheckAt < config.manifest.navigationCheckThrottle) return;
  event.waitUntil(
    Promise.race([checkManifest(), delay(config.manifest.timeout + 1000)]).catch((error) =>
      log('warn', 'navigation manifest check failed', error)
    )
  );
}

/* -------------------------------------------------------------------------- */
/* Connectivity / periodic background sync                                    */
/* -------------------------------------------------------------------------- */

self.addEventListener('online', () => {
  log('info', 'online, checking manifest');
  checkManifest({ force: true })
    .then(() => ensureCacheCoverage())
    .catch((error) => log('warn', 'online sync failed', error));
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag !== PREFETCH_TAG) return;
  event.waitUntil(
    (async () => {
      await checkManifest({ force: true });
      await ensureCacheCoverage(true);
      scheduler.start();
      await scheduler.keepAlive(config.prefetch.keepAliveMs);
    })()
  );
});

/* -------------------------------------------------------------------------- */
/* Boot                                                                       */
/* -------------------------------------------------------------------------- */

state.ready = (async () => {
  const persistedConfig = await idbGet(STORE_KV, 'config');
  if (isPlainObject(persistedConfig)) mergeDeep(config, persistedConfig);
  mergeDeep(config, readBootConfig());
  normaliseConfig();

  await loadPersistedManifest();
  log('info', `service worker ${SW_VERSION} ready`, `scope=${SCOPE_URL.href}`, `manifest=${manifestUrl().href}`);
})().catch((error) => {
  log('error', 'service worker boot failed', error);
});

state.ready.then(() => {
  startManifestTimer();
});
