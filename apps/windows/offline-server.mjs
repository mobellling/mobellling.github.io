/**
 * MobellSite 内置快照静态服务器（第 4 节）
 *
 * 安全要求：只绑定 127.0.0.1、随机端口、只读；
 * URL 解码后必须规范化并阻止 `..` 路径穿越；未找到返回 404；
 * 目录请求补 index.html；支持常见静态资源 Content-Type。
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

/** 静态资源扩展名 -> Content-Type（第 4 节要求的全部类型 + 常用补充） */
export const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.map': 'application/json; charset=utf-8',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.pdf': 'application/pdf',
  // pagefind 索引/片段（二进制分片）
  '.pf_fragment': 'application/octet-stream',
  '.pf_index': 'application/octet-stream',
  '.pf_meta': 'application/octet-stream',
  '.pagefind': 'application/wasm',
  '.zst': 'application/octet-stream',
};

export function contentTypeFor(filePath) {
  return (
    CONTENT_TYPES[path.extname(filePath).toLowerCase()] ??
    'application/octet-stream'
  );
}

function sendPlain(response, statusCode, text, extraHeaders = {}) {
  const body = Buffer.from(text, 'utf8');
  response.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  response.end(body);
}

/**
 * 把请求路径安全地解析为站点根内的绝对文件路径。
 * 返回 { ok:true, filePath } 或 { ok:false, status, reason }。
 */
export function resolveRequestPath(siteRoot, rawUrl) {
  let pathname;
  try {
    pathname = new URL(rawUrl ?? '/', 'http://127.0.0.1').pathname;
  } catch {
    return { ok: false, status: 400, reason: '非法 URL' };
  }

  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return { ok: false, status: 400, reason: 'URL 解码失败' };
  }

  if (decoded.includes('\0')) {
    return { ok: false, status: 400, reason: '非法路径' };
  }
  // 统一为正斜杠后进行规范化，任何 `..` 片段直接拒绝
  const normalizedPosix = path.posix.normalize(decoded.replace(/\\/g, '/'));
  if (normalizedPosix.split('/').includes('..')) {
    return { ok: false, status: 403, reason: '路径穿越被拒绝' };
  }

  const relative = normalizedPosix.replace(/^\/+/, '');
  const filePath = path.resolve(siteRoot, relative);
  const rootWithSep = siteRoot.endsWith(path.sep) ? siteRoot : siteRoot + path.sep;
  if (filePath !== siteRoot && !filePath.startsWith(rootWithSep)) {
    return { ok: false, status: 403, reason: '越界路径被拒绝' };
  }
  return { ok: true, filePath };
}

function serveFile(request, response, filePath, logger) {
  fs.stat(filePath, (statError, stats) => {
    if (statError) {
      sendPlain(response, 404, '404 Not Found');
      return;
    }
    let target = filePath;
    if (stats.isDirectory()) {
      // 目录请求补 index.html
      target = path.join(filePath, 'index.html');
      try {
        if (!fs.statSync(target).isFile()) {
          sendPlain(response, 404, '404 Not Found');
          return;
        }
      } catch {
        sendPlain(response, 404, '404 Not Found');
        return;
      }
    }

    let finalStats;
    try {
      finalStats = fs.statSync(target);
    } catch {
      sendPlain(response, 404, '404 Not Found');
      return;
    }
    if (!finalStats.isFile()) {
      sendPlain(response, 404, '404 Not Found');
      return;
    }

    const headers = {
      'Content-Type': contentTypeFor(target),
      'Content-Length': finalStats.size,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Accept-Ranges': 'none',
    };
    if (request.method === 'HEAD') {
      response.writeHead(200, headers);
      response.end();
      return;
    }
    response.writeHead(200, headers);
    const stream = fs.createReadStream(target);
    stream.on('error', (streamError) => {
      logger?.log?.(`[offline-server] 读取失败 ${target}: ${streamError.message}`);
      response.destroy();
    });
    stream.pipe(response);
  });
}

/**
 * 创建内置快照服务器。
 * @returns {Promise<{port:number, url:string, close:() => Promise<void>, server:http.Server}>}
 */
export async function createOfflineServer({ root, host = '127.0.0.1', logger = console } = {}) {
  if (!root) throw new TypeError('createOfflineServer 需要 root 参数（站点快照目录）');
  const siteRoot = path.resolve(root);

  const server = http.createServer((request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendPlain(response, 405, '405 Method Not Allowed', { Allow: 'GET, HEAD' });
      return;
    }
    const resolved = resolveRequestPath(siteRoot, request.url);
    if (!resolved.ok) {
      sendPlain(response, resolved.status, `${resolved.status} ${resolved.reason}`);
      return;
    }
    serveFile(request, response, resolved.filePath, logger);
  });

  server.on('clientError', (error, socket) => {
    try {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    } catch {
      /* ignore */
    }
  });

  await new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };
    const onListening = () => {
      server.off('error', onError);
      resolve();
    };
    server.once('error', onError);
    server.once('listening', onListening);
    server.listen(0, host);
  });

  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  if (!port) {
    await new Promise((resolve) => server.close(resolve));
    throw new Error('内置快照服务器未能分配端口');
  }

  return {
    port,
    host,
    url: `http://${host}:${port}/`,
    server,
    close: () =>
      new Promise((resolve) => {
        if (!server.listening) {
          resolve();
          return;
        }
        server.close(() => resolve());
      }),
  };
}
