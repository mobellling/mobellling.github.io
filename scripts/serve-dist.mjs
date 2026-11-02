#!/usr/bin/env node
/**
 * Tiny static server for `dist/` with production-like 404 handling.
 *
 * Useful because `/_hash` and `sw.js` have no extension and because Astro's
 * preview server is not always available while iterating on the SW.
 *
 *   node scripts/serve-dist.mjs
 *   PORT=4322 node scripts/serve-dist.mjs
 *
 * It also exposes a few `/__sw-test/*` endpoints used by `sw-e2e.mjs`.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const MIME = {
  '.avif': 'image/avif',
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
};

const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z2S8AAAAASUVORK5CYII=',
  'base64'
);

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const DEFAULT_PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function findFile(root, pathname) {
  const clean = pathname.replace(/^\/+/, '');
  const candidates = [path.join(root, clean)];

  if (!clean || pathname.endsWith('/')) {
    candidates.push(path.join(root, clean, 'index.html'));
  } else {
    candidates.push(path.join(root, clean, 'index.html'));
    if (!path.extname(clean)) candidates.push(path.join(root, `${clean}.html`));
  }

  for (const candidate of candidates) {
    if (!isInside(root, candidate)) continue;
    try {
      const info = await stat(candidate);
      if (info.isFile()) return { file: candidate, size: info.size };
    } catch {
      // try the next candidate
    }
  }
  return null;
}

function send(res, statusCode, headers, body) {
  res.writeHead(statusCode, headers);
  if (body === undefined) res.end();
  else res.end(body);
}

export function createStaticServer({
  root = DEFAULT_ROOT,
  publicRoot = DEFAULT_PUBLIC,
  port = Number(process.env.PORT ?? 4321),
  host = '127.0.0.1',
  verbose = process.env.VERBOSE === '1',
} = {}) {
  let dynamicCounter = 0;

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const pathname = (() => {
      try {
        return decodeURIComponent(url.pathname);
      } catch {
        return url.pathname;
      }
    })();

    if (verbose) console.log(`[serve] ${req.method} ${pathname}${url.search}`);

    // Test-only endpoints; absent from a real build.
    if (pathname.startsWith('/__sw-test/')) {
      if (pathname === '/__sw-test/dynamic') {
        dynamicCounter += 1;
        send(
          res,
          200,
          { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=0' },
          `dynamic-${dynamicCounter}`
        );
        return;
      }
      if (pathname === '/__sw-test/query') {
        send(
          res,
          200,
          { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=0' },
          `query:${url.search}`
        );
        return;
      }
      if (pathname === '/__sw-test/missing') {
        send(
          res,
          404,
          { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
          '<h1>ORIGINAL-404</h1>'
        );
        return;
      }
      if (pathname === '/__sw-test/forbidden') {
        send(
          res,
          403,
          { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
          '<h1>ORIGINAL-403</h1>'
        );
        return;
      }
      if (pathname === '/__sw-test/pixel.png') {
        send(
          res,
          200,
          { 'content-type': 'image/png', 'cache-control': 'no-store', 'access-control-allow-origin': '*' },
          PIXEL
        );
        return;
      }
      if (pathname === '/__sw-test/slow') {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        send(res, 200, { 'content-type': 'text/plain; charset=utf-8' }, 'slow');
        return;
      }
    }

    let file = await findFile(root, pathname);

    // The built site may not contain sw.js yet when iterating locally.
    if (!file && pathname === '/sw.js') {
      try {
        const info = await stat(path.join(publicRoot, 'sw.js'));
        file = { file: path.join(publicRoot, 'sw.js'), size: info.size };
      } catch {
        // ignore
      }
    }

    if (!file) {
      const notFound = await findFile(root, '/404.html');
      if (notFound) {
        send(
          res,
          404,
          {
            'content-type': 'text/html; charset=utf-8',
            'content-length': String(notFound.size),
            'cache-control': 'no-cache',
          },
          await import('node:fs/promises').then(({ readFile }) => readFile(notFound.file))
        );
      } else {
        send(res, 404, { 'content-type': 'text/plain; charset=utf-8' }, '404');
      }
      return;
    }

    const headers = {
      'content-type': contentType(file.file),
      'content-length': String(file.size),
    };
    if (pathname === '/_hash' || pathname === '/sw.js' || pathname.endsWith('.html') || pathname === '/') {
      headers['cache-control'] = 'no-cache';
    } else {
      headers['cache-control'] = 'public, max-age=600';
    }

    if (req.method === 'HEAD') {
      send(res, 200, headers);
      return;
    }

    res.writeHead(200, headers);
    createReadStream(file.file).pipe(res);
  });

  return {
    server,
    port,
    start() {
      return new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.off('error', reject);
          resolve(`http://${host}:${port}`);
        });
      });
    },
    stop() {
      return new Promise((resolve) => server.close(() => resolve()));
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const instance = createStaticServer();
  const url = await instance.start();
  console.log(`[serve] ${url} -> ${DEFAULT_ROOT}`);
  console.log('[serve] try /?sw_debug=1 (after a build) or /__sw-test/dynamic');
}
