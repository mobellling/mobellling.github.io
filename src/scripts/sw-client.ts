/**
 * Page-side client for `public/sw.js`.
 *
 * - Registers the service worker (production/preview, or `?sw_debug=1` in dev).
 * - Exposes `window.__SW__` / `window.__SW_DEBUG__` for manual control.
 * - Adds an optional floating debug panel when the URL has `?sw_debug=1`.
 *
 * The SW API is message based; every call uses a fresh MessageChannel and a
 * timeout so a wedged worker can never hang page code.
 */

export type SwCacheScope = 'all' | 'assets' | 'runtime' | 'images';

export interface SwLogEntry {
  t: number;
  level: string;
  msg: string;
}

export interface SwPrefetchStatus {
  queued: number;
  active: number;
  pausedFor: number;
  total: number;
}

export interface SwManifestInfo {
  version: string;
  count: number;
  fetchedAt: number;
  lastCheckAt: number;
  sample: string[];
}

export interface SwStatus {
  ok?: boolean;
  version: string;
  cacheVersion: string;
  manifest: SwManifestInfo;
  caches: Record<string, number>;
  config: Record<string, unknown>;
  stats: Record<string, number>;
  prefetch: SwPrefetchStatus;
  imageMeta: number;
  online: boolean;
  uptime: number;
  storage?: { usage?: number; quota?: number };
}

export interface SwRefreshResult {
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
  opaque?: boolean;
  key?: string;
  cache?: string;
  manifest?: boolean;
  ms?: number;
}

export interface SwManifestDiff {
  added: string[];
  changed: string[];
  removed: string[];
}

export interface SwManifestSyncResult {
  ok: boolean;
  changed?: boolean;
  initial?: boolean;
  skipped?: boolean;
  version?: string;
  count?: number;
  error?: string;
  diff?: SwManifestDiff;
}

export interface SwPrefetchResult {
  ok: boolean;
  queued: number;
  prefetch: SwPrefetchStatus;
}

export interface SwClearResult {
  ok: boolean;
  scope: SwCacheScope;
  cleared: string[];
}

export interface SwClientApi {
  version: string;
  register: () => Promise<ServiceWorkerRegistration | null>;
  status: () => Promise<SwStatus>;
  syncManifest: () => Promise<SwManifestSyncResult>;
  prefetch: (urls?: string[]) => Promise<SwPrefetchResult>;
  refresh: (urls: string | string[]) => Promise<SwRefreshResult[]>;
  refreshPage: (options?: { reload?: boolean }) => Promise<SwRefreshResult[]>;
  clearCache: (scope?: SwCacheScope) => Promise<SwClearResult>;
  configure: (patch: Record<string, unknown>) => Promise<Record<string, unknown>>;
  resetConfig: () => Promise<Record<string, unknown>>;
  logs: (clear?: boolean) => Promise<SwLogEntry[]>;
  kick: () => Promise<void>;
}

type SwBroadcast = {
  type: string;
  [key: string]: unknown;
};

const SW_RPC_TIMEOUT = 30_000;
const REFRESH_TIMEOUT = 120_000;
const PANEL_ID = '__sw-debug-panel';

let initialised = false;
let panelHost: HTMLElement | null = null;
let lastStatus: SwStatus | null = null;

function normaliseBase(base: string): string {
  const value = base || '/';
  return value.endsWith('/') ? value : `${value}/`;
}

function debugRequested(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sw_debug') === '0') {
      window.sessionStorage.setItem('sw-debug', '0');
      return false;
    }
    if (params.get('sw_debug') === '1') {
      window.sessionStorage.setItem('sw-debug', '1');
      return true;
    }
    return window.sessionStorage.getItem('sw-debug') === '1';
  } catch {
    return false;
  }
}

function readPageConfig(): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sw_ignore_search') === '1') patch.sameOrigin = { ignoreSearch: true };
    const ttlParam = params.get('sw_image_ttl');
    if (ttlParam !== null) {
      const ttl = Number(ttlParam);
      if (Number.isFinite(ttl) && ttl >= 0) patch.crossOriginImages = { ttl };
    }
    const strategy = params.get('sw_strategy');
    if (strategy === 'query' || strategy === 'reload' || strategy === 'auto') {
      patch.forceRefresh = { strategy };
    }
    if (params.get('sw_prefetch') === '0') patch.prefetch = { enabled: false };
  } catch {
    // ignore malformed URLs
  }
  return patch;
}

async function getWorker(): Promise<ServiceWorker> {
  if (!('serviceWorker' in navigator)) throw new Error('Service workers are not supported');
  let timer: number | undefined;
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      timer = window.setTimeout(
        () => reject(new Error('Service worker is not registered (dev server? use `?sw_debug=1` to enable it)')),
        5000
      );
    }),
  ]).finally(() => {
    if (timer) window.clearTimeout(timer);
  });
  const worker = navigator.serviceWorker.controller ?? registration.active;
  if (!worker) throw new Error('Service worker is not active');
  return worker;
}

function send<T>(type: string, payload: Record<string, unknown> = {}, timeoutMs = SW_RPC_TIMEOUT): Promise<T> {
  return getWorker().then(
    (worker) =>
      new Promise<T>((resolve, reject) => {
        const channel = new MessageChannel();
        const timer = window.setTimeout(() => {
          channel.port1.close();
          reject(new Error(`${type} timed out after ${timeoutMs}ms`));
        }, timeoutMs);

        channel.port1.onmessage = (event: MessageEvent<unknown>) => {
          const data = event.data as { type?: string; ok?: boolean; error?: string } | null;
          if (!data || data.type !== `${type}_RESULT`) return;
          window.clearTimeout(timer);
          channel.port1.close();
          if (data.ok === false) reject(new Error(data.error || `${type} failed`));
          else resolve(data as T);
        };

        worker.postMessage({ type, ...payload }, [channel.port2]);
      })
  );
}

async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  const base = normaliseBase(import.meta.env.BASE_URL);
  const scriptUrl = new URL('sw.js', new URL(base, window.location.origin)).href;
  return navigator.serviceWorker.register(scriptUrl, {
    scope: base,
    updateViaCache: 'none',
  });
}

async function kick(): Promise<void> {
  await send('SW_KICK', {}, 10_000);
}

async function status(): Promise<SwStatus> {
  return send<SwStatus>('SW_STATUS');
}

async function syncManifest(): Promise<SwManifestSyncResult> {
  return send<SwManifestSyncResult>('SW_SYNC', {}, 60_000);
}

async function prefetch(urls?: string[]): Promise<SwPrefetchResult> {
  return send<SwPrefetchResult>('SW_PREFETCH', urls && urls.length > 0 ? { urls } : {});
}

async function refresh(urls: string | string[]): Promise<SwRefreshResult[]> {
  const response = await send<{ results: SwRefreshResult[] }>('SW_REFRESH', { urls }, REFRESH_TIMEOUT);
  return response.results;
}

async function refreshPage(options: { reload?: boolean } = {}): Promise<SwRefreshResult[]> {
  const results = await refresh([window.location.href]);
  if (options.reload !== false && results.some((result) => result.ok)) {
    window.location.reload();
  }
  return results;
}

async function clearCache(scope: SwCacheScope = 'all'): Promise<SwClearResult> {
  return send<SwClearResult>('SW_CLEAR', { scope });
}

async function configure(patch: Record<string, unknown>): Promise<Record<string, unknown>> {
  const response = await send<{ config: Record<string, unknown> }>('SW_CONFIG', { patch });
  return response.config;
}

async function resetConfig(): Promise<Record<string, unknown>> {
  const response = await send<{ config: Record<string, unknown> }>('SW_RESET_CONFIG');
  return response.config;
}

async function logs(clear = false): Promise<SwLogEntry[]> {
  const response = await send<{ logs: SwLogEntry[] }>('SW_LOGS', { clear });
  return response.logs;
}

function onServiceWorkerMessage(event: MessageEvent<unknown>): void {
  const data = event.data as SwBroadcast | null;
  if (!data || typeof data.type !== 'string') return;
  window.dispatchEvent(new CustomEvent<SwBroadcast>('sw:message', { detail: data }));
  if (data.type === 'SW_MANIFEST_UPDATED') {
    window.dispatchEvent(new CustomEvent<SwBroadcast>('sw:manifest-updated', { detail: data }));
  }
  if (data.type === 'SW_ACTIVATED') {
    window.dispatchEvent(new CustomEvent<SwBroadcast>('sw:activated', { detail: data }));
    void kick().catch(() => undefined);
  }
}

function onControllerChange(): void {
  window.dispatchEvent(new CustomEvent('sw:controllerchange'));
  void kick().catch(() => undefined);
}

function installPageApi(): void {
  const api: SwClientApi = {
    version: '1.0.0',
    register: registerServiceWorker,
    status,
    syncManifest,
    prefetch,
    refresh,
    refreshPage,
    clearCache,
    configure,
    resetConfig,
    logs,
    kick,
  };
  window.__SW__ = api;
  window.__SW_DEBUG__ = api;
}

export async function initServiceWorker(): Promise<void> {
  if (initialised || typeof window === 'undefined') return;
  initialised = true;

  installPageApi();
  document.addEventListener('astro:page-load', () => {
    if (debugRequested()) mountDebugPanel();
  });

  if (!('serviceWorker' in navigator)) return;

  const debug = debugRequested();
  if (import.meta.env.DEV && !debug) return;

  try {
    const registration = await registerServiceWorker();
    navigator.serviceWorker.addEventListener('message', onServiceWorkerMessage);
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    await Promise.race([navigator.serviceWorker.ready, new Promise((resolve) => window.setTimeout(resolve, 5000))]);

    const pageConfig = readPageConfig();
    if (debug) pageConfig.debug = true;
    if (Object.keys(pageConfig).length > 0) {
      await configure(pageConfig).catch((error: unknown) => console.warn('[SW] config failed', error));
    }

    await kick().catch((error: unknown) => console.warn('[SW] kick failed', error));

    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SW_KICK' });
    }
  } catch (error) {
    console.warn('[SW] registration failed', error);
  }

  if (debug) {
    mountDebugPanel();
  }
}

/* -------------------------------------------------------------------------- */
/* Debug panel                                                                */
/* -------------------------------------------------------------------------- */

function panelMarkup(): string {
  return `
    <style>
      :host { all: initial; }
      .panel {
        position: fixed; right: 12px; bottom: 12px; z-index: 2147483647;
        width: min(390px, calc(100vw - 24px)); max-height: 62vh; overflow: auto;
        background: #0f172a; color: #e2e8f0; border: 1px solid #334155;
        border-radius: 10px; box-shadow: 0 18px 40px rgba(0,0,0,.45);
        font: 12px/1.45 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        padding: 10px;
      }
      .head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
      .head strong { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: #7dd3fc; }
      .head button { background: transparent; border: 0; color: #94a3b8; font-size: 18px; cursor: pointer; line-height: 1; }
      pre { margin: 0 0 8px; padding: 8px; background: #020617; border: 1px solid #1e293b; border-radius: 6px;
        white-space: pre-wrap; word-break: break-word; max-height: 18vh; overflow: auto; }
      .actions { display: flex; flex-wrap: wrap; gap: 6px; }
      .actions button {
        background: #1e293b; border: 1px solid #334155; color: #e2e8f0; border-radius: 6px;
        padding: 4px 7px; font: inherit; cursor: pointer;
      }
      .actions button:hover { background: #334155; }
      .actions button:disabled { opacity: .45; cursor: default; }
      .error { color: #fca5a5; min-height: 1em; margin-top: 6px; white-space: pre-wrap; }
      .muted { color: #94a3b8; }
    </style>
    <div class="panel">
      <div class="head"><strong>SW debug</strong><button type="button" data-action="close" title="close">×</button></div>
      <pre class="status">loading…</pre>
      <div class="actions">
        <button type="button" data-action="status">状态</button>
        <button type="button" data-action="sync">检查更新</button>
        <button type="button" data-action="prefetch">预下载</button>
        <button type="button" data-action="refresh">刷新本页</button>
        <button type="button" data-action="clear">清空运行时</button>
        <button type="button" data-action="toggle">ignoreSearch</button>
        <button type="button" data-action="logs">日志</button>
      </div>
      <pre class="logs muted">(logs)</pre>
      <div class="error"></div>
    </div>
  `;
}

function shadowElement<T extends Element>(shadow: ShadowRoot, selector: string): T | null {
  return shadow.querySelector<T>(selector);
}

function formatAge(timestamp: number): string {
  if (!timestamp) return 'never';
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`;
  return `${Math.round(seconds / 3600)}h ago`;
}

function summariseStatus(current: SwStatus, controlled: boolean): string {
  const config = current.config as {
    debug?: boolean;
    sameOrigin?: { ignoreSearch?: boolean };
    crossOriginImages?: { ttl?: number };
    prefetch?: { enabled?: boolean };
  };
  const ttlSeconds = Math.round(Number(config.crossOriginImages?.ttl ?? 0) / 1000);
  const cacheCounts = Object.entries(current.caches)
    .map(([name, count]) => `${name.replace('mobell-sw-', '')}: ${count}`)
    .join('  ');
  return [
    `worker      ${current.version} (${current.cacheVersion})  controlled=${controlled}  online=${current.online}`,
    `manifest    ${current.manifest.version || '(none)'}  ${current.manifest.count} files  checked ${formatAge(
      current.manifest.lastCheckAt
    )}`,
    `caches      ${cacheCounts}`,
    `prefetch    ${current.prefetch.active} active / ${current.prefetch.queued} queued  paused=${
      current.prefetch.pausedFor
    }ms  enabled=${config.prefetch?.enabled !== false}`,
    `images      ${ttlSeconds}s ttl  ${current.imageMeta} tracked`,
    `config      debug=${Boolean(config.debug)}  ignoreSearch=${Boolean(
      config.sameOrigin?.ignoreSearch
    )}  uptime=${Math.round(current.uptime / 1000)}s`,
    `stats       ${Object.entries(current.stats)
      .map(([key, value]) => `${key}=${value}`)
      .join(' ')}`,
    current.storage?.usage
      ? `storage     ${(current.storage.usage / 1024 / 1024).toFixed(1)} MB${
          current.storage.quota ? ` / ${(current.storage.quota / 1024 / 1024).toFixed(0)} MB` : ''
        }`
      : 'storage     (unknown)',
  ].join('\n');
}

async function refreshPanel(shadow: ShadowRoot, showLogs = false): Promise<void> {
  const statusElement = shadowElement<HTMLPreElement>(shadow, '.status');
  const logsElement = shadowElement<HTMLPreElement>(shadow, '.logs');
  if (!statusElement) return;
  try {
    const current = await status();
    lastStatus = current;
    statusElement.textContent = summariseStatus(current, Boolean(navigator.serviceWorker.controller));
    if (showLogs && logsElement) {
      const entries = await logs();
      logsElement.textContent = entries.length
        ? entries
            .slice(-40)
            .map((entry) => `${new Date(entry.t).toLocaleTimeString()} ${entry.level} ${entry.msg}`)
            .join('\n')
        : '(no logs — enable debug first)';
    }
  } catch (error) {
    statusElement.textContent = `SW unavailable: ${error instanceof Error ? error.message : String(error)}`;
  }
}

async function handlePanelAction(
  action: string | undefined,
  shadow: ShadowRoot,
  button: HTMLButtonElement
): Promise<void> {
  const errorElement = shadowElement<HTMLDivElement>(shadow, '.error');
  const logsElement = shadowElement<HTMLPreElement>(shadow, '.logs');
  if (!action) return;
  if (action === 'close') {
    panelHost?.remove();
    panelHost = null;
    try {
      window.sessionStorage.setItem('sw-debug', '0');
      const url = new URL(window.location.href);
      url.searchParams.delete('sw_debug');
      window.history.replaceState(null, '', url);
    } catch {
      // ignore
    }
    return;
  }
  if (errorElement) errorElement.textContent = '';
  button.disabled = true;
  try {
    if (action === 'status') {
      await refreshPanel(shadow, true);
    } else if (action === 'sync') {
      const result = await syncManifest();
      if (errorElement) {
        errorElement.textContent = result.ok
          ? `manifest ${result.version ?? ''} ${result.changed ? 'updated' : 'unchanged'} (${result.count ?? 0} files)`
          : `sync failed: ${result.error ?? 'unknown error'}`;
      }
      await refreshPanel(shadow, true);
    } else if (action === 'prefetch') {
      const result = await prefetch();
      if (errorElement) {
        errorElement.textContent = `queued ${result.queued}; ${result.prefetch.active} active / ${result.prefetch.queued} queued`;
      }
      await refreshPanel(shadow);
    } else if (action === 'refresh') {
      const results = await refreshPage({ reload: false });
      const failed = results.filter((result) => !result.ok);
      if (errorElement) {
        errorElement.textContent = failed.length
          ? `refresh failed: ${failed.map((result) => `${result.url} ${result.error ?? result.status}`).join(', ')}`
          : `refreshed ${results.length} url(s) — reloading…`;
      }
      if (failed.length === 0) window.location.reload();
    } else if (action === 'clear') {
      const result = await clearCache('runtime');
      if (errorElement) errorElement.textContent = `cleared: ${result.cleared.join(', ') || '(none)'}`;
      await refreshPanel(shadow);
    } else if (action === 'toggle') {
      const current = lastStatus ?? (await status());
      const config = current.config as { sameOrigin?: { ignoreSearch?: boolean } };
      const next = !config.sameOrigin?.ignoreSearch;
      await configure({ sameOrigin: { ignoreSearch: next } });
      if (errorElement) errorElement.textContent = `sameOrigin.ignoreSearch = ${next}`;
      await refreshPanel(shadow);
    } else if (action === 'logs') {
      const entries = await logs();
      if (logsElement) {
        logsElement.textContent = entries.length
          ? entries
              .slice(-60)
              .map((entry) => `${new Date(entry.t).toLocaleTimeString()} ${entry.level} ${entry.msg}`)
              .join('\n')
          : '(no logs — enable debug first)';
      }
    }
  } catch (error) {
    if (errorElement) errorElement.textContent = error instanceof Error ? error.message : String(error);
  } finally {
    button.disabled = false;
  }
}

function mountDebugPanel(): void {
  if (!debugRequested() || !document.body) return;
  if (panelHost && panelHost.isConnected) return;

  const host = document.createElement('div');
  host.id = PANEL_ID;
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = panelMarkup();
  document.body.appendChild(host);
  panelHost = host;

  const buttons = shadow.querySelectorAll<HTMLButtonElement>('button[data-action]');
  for (const button of buttons) {
    button.addEventListener('click', () => {
      void handlePanelAction(button.dataset.action, shadow, button);
    });
  }

  const interval = window.setInterval(() => {
    if (!host.isConnected) {
      window.clearInterval(interval);
      if (panelHost === host) panelHost = null;
      return;
    }
    void refreshPanel(shadow);
  }, 5000);

  void refreshPanel(shadow, true);
}

declare global {
  interface Window {
    __SW__: SwClientApi;
    __SW_DEBUG__: SwClientApi;
  }
}
