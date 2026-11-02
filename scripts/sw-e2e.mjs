#!/usr/bin/env node
/**
 * End-to-end checks for `public/sw.js` using headless Chrome + the static
 * server in `scripts/serve-dist.mjs`.
 *
 *   npm run build
 *   node scripts/sw-e2e.mjs
 *
 * Requires Chrome/Edge and a local build. This is a development tool, not part
 * of the deployed site.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, unlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createStaticServer } from './serve-dist.mjs';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(fn, { timeout = 20000, interval = 250, label = 'condition' } = {}) {
  const deadline = Date.now() + timeout;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(interval);
  }
  throw new Error(`timed out waiting for ${label}${lastError ? `: ${lastError.message}` : ''}`);
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.nextId = 0;
    this.pending = new Map();
    this.ws = null;
  }

  async open() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP websocket open timed out')), 10000);
      this.ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      });
      this.ws.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('CDP websocket error'));
      });
    });
    this.ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message || JSON.stringify(message.error)));
      else pending.resolve(message.result);
    });
  }

  send(method, params = {}, timeoutMs = 180000) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP ${method} timed out`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
  }
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

async function startChrome(port, profileDir) {
  const chromePath = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!chromePath) throw new Error('Chrome/Edge not found (set CHROME_PATH)');

  const child = spawn(
    chromePath,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  await waitFor(
    async () => {
      try {
        return await getJson(`http://127.0.0.1:${port}/json/version`);
      } catch {
        return false;
      }
    },
    { timeout: 25000, label: 'Chrome DevTools endpoint' }
  );

  const targets = await getJson(`http://127.0.0.1:${port}/json/list`);
  let page = targets.find((target) => target.type === 'page');
  if (!page) {
    const created = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
    page = await created.json();
  }
  return { child, page };
}

async function evaluate(session, expression, awaitPromise = true) {
  const result = await session.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    const detail =
      result.exceptionDetails.exception?.description ||
      result.exceptionDetails.text ||
      JSON.stringify(result.exceptionDetails);
    throw new Error(detail);
  }
  return result.result?.value;
}

async function navigate(session, url) {
  await session.send('Page.navigate', { url });
  await waitFor(async () => (await evaluate(session, 'document.readyState === "complete"', false)) === true, {
    timeout: 30000,
    label: `page load ${url}`,
  });
  await waitFor(async () => (await evaluate(session, 'typeof window.__SW__ === "object"', false)) === true, {
    timeout: 20000,
    label: 'window.__SW__',
  });
}

/**
 * Runs inside the page. Keep it self-contained: it is serialised with
 * Function.prototype.toString() and evaluated in the browser.
 */
async function runTests() {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const results = [];
  const check = (name, ok, detail = '') => {
    results.push({ name, ok: Boolean(ok), detail: String(detail) });
  };

  const sw = window.__SW__;
  if (!sw) throw new Error('window.__SW__ is not installed');

  await waitForController();
  async function waitForController() {
    for (let index = 0; index < 100; index += 1) {
      if (navigator.serviceWorker.controller) return;
      await sleep(200);
    }
  }
  check('page is controlled by the SW', Boolean(navigator.serviceWorker.controller));

  const initialStatus = await sw.status();
  check(
    'default image TTL is 600s',
    Number(initialStatus.config.crossOriginImages?.ttl) === 600000,
    JSON.stringify(initialStatus.config.crossOriginImages)
  );

  await sw.clearCache('all');
  const sync = await sw.syncManifest();
  check(
    'manifest sync',
    sync.ok && Number(sync.count) > 100,
    JSON.stringify({ ok: sync.ok, count: sync.count, changed: sync.changed, error: sync.error })
  );

  const prefetch = await sw.prefetch();
  check('prefetch started', prefetch.ok, JSON.stringify(prefetch));
  let status = await sw.status();
  for (let index = 0; index < 240; index += 1) {
    status = await sw.status();
    if (status.prefetch.total === 0 && status.caches['mobell-sw-assets-v1'] > 0) break;
    await sleep(250);
  }
  check('prefetch drained', status.prefetch.total === 0, JSON.stringify(status.prefetch));
  check(
    'manifest files cached',
    status.caches['mobell-sw-assets-v1'] >= status.manifest.count - 2,
    `${status.caches['mobell-sw-assets-v1']} / ${status.manifest.count}`
  );

  const beforeFirst = (await sw.status()).stats;
  const firstBody = await (await fetch('/index.html')).text();
  const beforeSecond = (await sw.status()).stats;
  const secondBody = await (await fetch('/index.html')).text();
  const afterSecond = (await sw.status()).stats;
  check(
    'cache first for manifest asset',
    afterSecond.cacheHit > beforeSecond.cacheHit && afterSecond.network === beforeSecond.network,
    JSON.stringify({ beforeFirst, beforeSecond, afterSecond })
  );
  check('cache body is stable', firstBody === secondBody, `${firstBody.length}/${secondBody.length}`);

  const dynamicOne = await (await fetch('/__sw-test/dynamic')).text();
  const dynamicTwo = await (await fetch('/__sw-test/dynamic')).text();
  check('non-manifest is cache first', dynamicOne === dynamicTwo, `${dynamicOne} / ${dynamicTwo}`);

  const refreshed = await sw.refresh([`${window.location.origin}/__sw-test/dynamic`]);
  const dynamicThree = await (await fetch('/__sw-test/dynamic')).text();
  check(
    'force refresh updates non-manifest entry',
    refreshed[0]?.ok && dynamicThree !== dynamicTwo,
    `${dynamicTwo} -> ${dynamicThree} (${JSON.stringify(refreshed[0])})`
  );

  const runtimeKeys = await caches
    .open('mobell-sw-runtime-v1')
    .then((cache) => cache.keys())
    .then((keys) => keys.map((key) => key.url));
  check(
    'refresh keeps the original cache key',
    runtimeKeys.includes(`${window.location.origin}/__sw-test/dynamic`) &&
      !runtimeKeys.some((url) => url.includes('_t=')),
    runtimeKeys.filter((url) => url.includes('dynamic')).join(', ')
  );

  const response404 = await fetch('/__sw-test/missing', { headers: { accept: 'text/html' } });
  const body404 = await response404.text();
  check(
    '404 uses manifest status page',
    response404.status === 404 && !body404.includes('ORIGINAL-404') && body404.length > 100,
    `${response404.status} len=${body404.length}`
  );
  const stats404Before = (await sw.status()).stats;
  await fetch('/__sw-test/missing', { headers: { accept: 'text/html' } });
  const stats404After = (await sw.status()).stats;
  check(
    'error response is not cached',
    stats404After.network > stats404Before.network,
    JSON.stringify({ before: stats404Before.network, after: stats404After.network })
  );

  const response403 = await fetch('/__sw-test/forbidden', { headers: { accept: 'text/html' } });
  const body403 = await response403.text();
  check(
    '403 without a status page stays original',
    response403.status === 403 && body403.includes('ORIGINAL-403'),
    `${response403.status} ${body403.slice(0, 40)}`
  );

  await sw.configure({ sameOrigin: { ignoreSearch: true } });
  const queryOne = await (await fetch('/__sw-test/query?v=1')).text();
  const queryTwo = await (await fetch('/__sw-test/query?v=2')).text();
  check('ignoreSearch merges same-origin keys', queryOne === queryTwo, `${queryOne} / ${queryTwo}`);

  await sw.configure({ sameOrigin: { ignoreSearch: false } });
  const queryThree = await (await fetch('/__sw-test/query?v=2')).text();
  check('ignoreSearch off keeps query in the key', queryThree !== queryTwo, `${queryTwo} / ${queryThree}`);

  await sw.configure({ crossOriginImages: { ttl: 800 } });
  const imageUrl = 'http://127.0.0.1:4322/__sw-test/pixel.png?e2e=1';
  const loadImage = async () => {
    // `fetch` with no-cors + an image Accept header has the same shape as a
    // cross-origin <img> request, but `cache: 'no-store'` prevents Chrome's own
    // image cache from hiding the second request from the SW.
    const response = await fetch(imageUrl, {
      mode: 'no-cors',
      cache: 'no-store',
      headers: { accept: 'image/png' },
    });
    return response.type === 'opaque' || response.ok;
  };

  const imageOne = await loadImage();
  const imageStatusOne = await sw.status();
  await sleep(1200);
  const imageTwo = await loadImage();
  const imageStatusTwo = await sw.status();
  check('cross-origin no-cors image loads', imageOne && imageTwo, `${imageOne}/${imageTwo}`);
  check(
    'cross-origin image was cached',
    imageStatusOne.caches['mobell-sw-images-v1'] >= 1,
    JSON.stringify(imageStatusOne.caches)
  );
  check(
    'image TTL triggers refetch',
    imageStatusTwo.stats.imageMiss > imageStatusOne.stats.imageMiss,
    JSON.stringify({ before: imageStatusOne.stats.imageMiss, after: imageStatusTwo.stats.imageMiss })
  );
  const opaqueType = await caches
    .open('mobell-sw-images-v1')
    .then((cache) => cache.match(imageUrl))
    .then((response) => response && response.type);
  check('opaque response is stored untouched', opaqueType === 'opaque', String(opaqueType));

  await sw.resetConfig();
  const resetStatus = await sw.status();
  check('config resets', true, '');
  check(
    'reset restores 600s image TTL',
    Number(resetStatus.config.crossOriginImages?.ttl) === 600000,
    JSON.stringify(resetStatus.config.crossOriginImages)
  );

  return results;
}

async function checkManifestUpdate(session, root) {
  const hashPath = path.join(root, '_hash');
  const newFile = path.join(root, '__e2e-new.txt');
  const original = await readFile(hashPath, 'utf8');
  const results = [];

  try {
    await writeFile(newFile, 'e2e-new-file', 'utf8');
    const withNewEntry = `${original.replace(/\n?$/, '\n')}/__e2e-new.txt deadbeefdeadbeef\n`;
    await writeFile(hashPath, withNewEntry, 'utf8');

    const sync = await evaluate(session, 'window.__SW__.syncManifest()');
    results.push({
      name: 'manifest update detected',
      ok: Boolean(sync.changed && Array.isArray(sync.diff?.added) && sync.diff.added.includes('/__e2e-new.txt')),
      detail: JSON.stringify({ changed: sync.changed, added: sync.diff?.added, count: sync.count }),
    });

    let cached = false;
    for (let index = 0; index < 40; index += 1) {
      cached = await evaluate(
        session,
        "caches.open('mobell-sw-assets-v1').then((cache) => cache.match('/__e2e-new.txt')).then(Boolean)"
      );
      if (cached) break;
      await sleep(250);
    }
    results.push({ name: 'new manifest file predownloaded', ok: cached, detail: String(cached) });
  } finally {
    await writeFile(hashPath, original, 'utf8');
    await unlink(newFile).catch(() => {});
    await evaluate(session, 'window.__SW__.syncManifest()').catch(() => {});
  }

  return results;
}

async function main() {
  const root = path.resolve('dist');
  if (!existsSync(path.join(root, '_hash'))) throw new Error('dist/_hash is missing; run `npm run build` first');
  if (!existsSync(path.join(root, 'sw.js'))) throw new Error('dist/sw.js is missing; run `npm run build` first');

  const server = createStaticServer({ port: 4321 });
  const imageServer = createStaticServer({ port: 4322 });
  await server.start();
  await imageServer.start();

  const profileDir = await mkdtemp(path.join(os.tmpdir(), 'sw-e2e-'));
  const debugPort = 9222 + Math.floor(Math.random() * 400);
  let chrome;
  let session;
  let exitCode = 0;

  try {
    const started = await startChrome(debugPort, profileDir);
    chrome = started.child;
    session = new CdpSession(started.page.webSocketDebuggerUrl);
    await session.open();
    await session.send('Page.enable');
    await session.send('Runtime.enable');
    await navigate(session, 'http://127.0.0.1:4321/');

    try {
      await waitFor(
        async () => (await evaluate(session, 'Boolean(navigator.serviceWorker.controller)', false)) === true,
        { timeout: 15000, label: 'service worker controller' }
      );
    } catch {
      await session.send('Page.reload', { ignoreCache: false });
      await sleep(1500);
      await waitFor(
        async () => (await evaluate(session, 'Boolean(navigator.serviceWorker.controller)', false)) === true,
        { timeout: 15000, label: 'service worker controller after reload' }
      );
    }

    const results = await evaluate(session, `(${runTests.toString()})()`);
    if (!Array.isArray(results)) throw new Error('test function returned no results');

    for (const result of results) {
      console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? `  — ${result.detail}` : ''}`);
      if (!result.ok) exitCode = 1;
    }

    const updateResults = await checkManifestUpdate(session, root);
    for (const result of updateResults) {
      console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? `  — ${result.detail}` : ''}`);
      if (!result.ok) exitCode = 1;
    }

    const allResults = [...results, ...updateResults];
    console.log(`\n${allResults.filter((result) => result.ok).length}/${allResults.length} checks passed`);
  } finally {
    session?.close();
    if (chrome) {
      if (process.platform === 'win32') {
        spawnSync('taskkill', ['/pid', String(chrome.pid), '/T', '/F'], { stdio: 'ignore' });
      } else {
        chrome.kill('SIGKILL');
      }
    }
    await server.stop();
    await imageServer.stop();
    await rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }

  process.exitCode = exitCode;
}

main().catch((error) => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
