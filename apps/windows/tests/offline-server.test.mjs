import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createOfflineServer, resolveRequestPath, contentTypeFor } from '../offline-server.mjs';

async function withServer(run) {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'mobellsite-offline-'));
  await fsp.mkdir(path.join(root, 'sub'), { recursive: true });
  await fsp.writeFile(path.join(root, 'index.html'), '<!doctype html><title>MobellSite</title>主页');
  await fsp.writeFile(path.join(root, 'sub', 'index.html'), '<!doctype html><title>子目录</title>子页面');
  await fsp.writeFile(path.join(root, '_hash'), '/index.html abcdef\n');
  await fsp.writeFile(path.join(root, 'style.css'), 'body{color:#014ecb}');
  await fsp.writeFile(path.join(root, 'data.json'), '{"ok":true}');
  await fsp.writeFile(path.join(root, 'missing-page.html'), '');
  const outside = path.join(path.dirname(root), 'mobellsite-secret.txt');
  await fsp.writeFile(outside, 'SECRET');
  const server = await createOfflineServer({ root, logger: { log() {} } });
  try {
    await run({ server, root, outside });
  } finally {
    await server.close();
    await fsp.rm(root, { recursive: true, force: true });
    await fsp.rm(outside, { force: true });
  }
}

test('只监听 127.0.0.1 随机端口，并可提供首页与 _hash', async () => {
  await withServer(async ({ server }) => {
    assert.equal(server.host, '127.0.0.1');
    assert.ok(server.port > 0);
    assert.match(server.url, /^http:\/\/127\.0\.0\.1:\d+\/$/);
    const home = await fetch(server.url);
    assert.equal(home.status, 200);
    assert.match(home.headers.get('content-type'), /text\/html/);
    assert.match(await home.text(), /MobellSite/);
    const hash = await fetch(new URL('_hash', server.url));
    assert.equal(hash.status, 200);
    assert.match(await hash.text(), /abcdef/);
  });
});

test('目录请求补 index.html，404 与 Content-Type 正确', async () => {
  await withServer(async ({ server }) => {
    const sub = await fetch(new URL('sub/', server.url));
    assert.equal(sub.status, 200);
    assert.match(await sub.text(), /子页面/);
    const missing = await fetch(new URL('nope.html', server.url));
    assert.equal(missing.status, 404);
    const css = await fetch(new URL('style.css', server.url));
    assert.match(css.headers.get('content-type'), /text\/css/);
    const json = await fetch(new URL('data.json', server.url));
    assert.match(json.headers.get('content-type'), /application\/json/);
  });
});

test('阻止 ../、%2e%2e、反斜杠等路径穿越且不泄漏站点外文件', async () => {
  await withServer(async ({ server, outside }) => {
    for (const target of [
      '../mobellsite-secret.txt',
      '..%2fmobellsite-secret.txt',
      '%2e%2e/mobellsite-secret.txt',
      '%2e%2e%2fmobellsite-secret.txt',
      '..%5cmobellsite-secret.txt',
      '/sub/../../mobellsite-secret.txt',
    ]) {
      const response = await fetch(new URL(target, server.url));
      assert.notEqual(response.status, 200, `${target} 不应返回 200`);
      const text = await response.text();
      assert.ok(!text.includes('SECRET'), `${target} 泄漏了站点外内容`);
    }
    assert.ok(fs.existsSync(outside), '站点外文件仍应存在');
  });
});

test('非 GET/HEAD 返回 405，HEAD 不返回 body', async () => {
  await withServer(async ({ server }) => {
    const post = await fetch(server.url, { method: 'POST' });
    assert.equal(post.status, 405);
    assert.match(post.headers.get('allow'), /GET/);
    const head = await fetch(server.url, { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
  });
});

test('resolveRequestPath 拒绝解码后越界路径', () => {
  const root = path.resolve(os.tmpdir(), 'mobellsite-resolve-root');
  const ok = resolveRequestPath(root, '/sub/../index.html');
  assert.equal(ok.ok, true);
  assert.equal(ok.filePath, path.join(root, 'index.html'));
  // 这些请求要么被拒绝，要么规范化后仍落在站点根内，绝不越界
  for (const input of ['/../etc/passwd', '/%2e%2e/%2e%2e/Windows/win.ini', '/a%00b', '/..%5c..%5csecret']) {
    const result = resolveRequestPath(root, input);
    if (result.ok) {
      assert.ok(
        result.filePath === root || result.filePath.startsWith(root + path.sep),
        `${input} 解析结果越界：${result.filePath}`,
      );
    } else {
      assert.ok([400, 403].includes(result.status), `${input} 状态码异常`);
    }
  }
});

test('contentTypeFor 覆盖 spec 要求的扩展名', () => {
  const expected = {
    '.html': /text\/html/,
    '.css': /text\/css/,
    '.js': /javascript/,
    '.json': /application\/json/,
    '.svg': /image\/svg\+xml/,
    '.png': /image\/png/,
    '.jpg': /image\/jpeg/,
    '.jpeg': /image\/jpeg/,
    '.webp': /image\/webp/,
    '.gif': /image\/gif/,
    '.ico': /image\/x-icon/,
    '.woff2': /font\/woff2/,
    '.txt': /text\/plain/,
    '.xml': /application\/xml/,
    '.webmanifest': /application\/manifest\+json/,
    '.map': /application\/json/,
    '.wasm': /application\/wasm/,
  };
  for (const [ext, pattern] of Object.entries(expected)) {
    assert.match(contentTypeFor(`file${ext}`), pattern, ext);
  }
});
