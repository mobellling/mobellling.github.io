/**
 * update-checker.mjs 单元测试（node:test）
 *
 * 覆盖：版本比较、_hash 基线/变化/去重、通知开关、软件更新清单解析与去重。
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APP_VERSION,
  UpdateChecker,
  compareVersions,
  fetchLatestManifest,
  fetchSiteHash,
  parseVersion,
  sha256Hex,
} from '../update-checker.mjs';

function makeState() {
  return {
    siteBaseline: null,
    siteBaselineAt: null,
    siteLastNotified: null,
    siteLastCheckAt: null,
    appLastNotifiedVersion: null,
  };
}

function textResponse(body, status = 200) {
  return new Response(body, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

test('parseVersion / compareVersions 按数字比较', () => {
  assert.deepEqual(parseVersion('1.0.10'), [1, 0, 10]);
  assert.deepEqual(parseVersion('v2.3'), [2, 3]);
  assert.equal(compareVersions('1.0.10', '1.0.9'), 1);
  assert.equal(compareVersions('1.0.9', '1.0.10'), -1);
  assert.equal(compareVersions('1.0.0', '1.0'), 0);
  assert.equal(compareVersions('1.2.0', '1.10.0'), -1);
});

test('fetchSiteHash 用原始字节的 SHA-256 作为指纹', async () => {
  const body = '/index.html abcdef\n';
  const response = await fetchSiteHash({ fetchImpl: async () => textResponse(body) });
  assert.equal(response.ok, true);
  assert.equal(response.status, 200);
  assert.equal(response.fingerprint, sha256Hex(Buffer.from(body)));
});

test('fetchSiteHash 非 200 / 空内容返回失败', async () => {
  const notFound = await fetchSiteHash({ fetchImpl: async () => textResponse('', 404) });
  assert.equal(notFound.ok, false);
  assert.equal(notFound.status, 404);

  const empty = await fetchSiteHash({ fetchImpl: async () => textResponse('   \n') });
  assert.equal(empty.ok, false);
});

test('fetchLatestManifest 404 静默失败，200 解析 JSON', async () => {
  const missing = await fetchLatestManifest({ fetchImpl: async () => textResponse('', 404) });
  assert.equal(missing.ok, false);
  assert.equal(missing.status, 404);

  const manifest = { schema: 1, apps: { windows: { version: '1.1.0' } } };
  const ok = await fetchLatestManifest({ fetchImpl: async () => jsonResponse(manifest) });
  assert.equal(ok.ok, true);
  assert.equal(ok.data.apps.windows.version, '1.1.0');
});

test('网站更新：首次基线不通知，变化时通知且同一指纹只通知一次', async () => {
  const state = makeState();
  const events = [];
  let body = 'hash-a';
  const checker = new UpdateChecker({
    state,
    persistState: () => {},
    currentVersion: APP_VERSION,
    fetchImpl: async () => textResponse(body),
    onSiteUpdated: (event) => events.push(event),
  });

  const first = await checker.checkSiteUpdate();
  assert.equal(first.status, 'baseline');
  assert.equal(state.siteBaseline, sha256Hex(Buffer.from('hash-a')));
  assert.equal(events.length, 0);

  const same = await checker.checkSiteUpdate();
  assert.equal(same.status, 'unchanged');
  assert.equal(events.length, 0);

  body = 'hash-b';
  const changed = await checker.checkSiteUpdate();
  assert.equal(changed.status, 'updated');
  assert.equal(changed.notified, true);
  assert.equal(events.length, 1);
  assert.equal(events[0].fingerprint, sha256Hex(Buffer.from('hash-b')));
  assert.equal(state.siteLastNotified, sha256Hex(Buffer.from('hash-b')));

  const repeated = await checker.checkSiteUpdate();
  assert.equal(repeated.status, 'unchanged');
  assert.equal(events.length, 1);
});

test('网站更新：基线回退到已通知指纹时不重复通知', async () => {
  const state = makeState();
  let body = 'hash-a';
  const events = [];
  const checker = new UpdateChecker({
    state,
    persistState: () => {},
    fetchImpl: async () => textResponse(body),
    onSiteUpdated: (event) => events.push(event),
  });

  await checker.checkSiteUpdate(); // 基线 hash-a
  body = 'hash-b';
  await checker.checkSiteUpdate(); // 通知 hash-b

  // 模拟状态被外部改写：基线回到 hash-a，但 siteLastNotified 仍为 hash-b
  state.siteBaseline = sha256Hex(Buffer.from('hash-a'));
  body = 'hash-b';
  const again = await checker.checkSiteUpdate();
  assert.equal(again.status, 'updated');
  assert.equal(again.notified, false);
  assert.equal(events.length, 2);
  assert.equal(events[1].notified, false);
});

test('网站更新：通知关闭时不发系统通知但保留应用内提示回调', async () => {
  const state = makeState();
  let body = 'hash-a';
  const events = [];
  const checker = new UpdateChecker({
    state,
    persistState: () => {},
    notificationsEnabled: () => false,
    fetchImpl: async () => textResponse(body),
    onSiteUpdated: (event) => events.push(event),
  });

  await checker.checkSiteUpdate();
  body = 'hash-b';
  const updated = await checker.checkSiteUpdate();
  assert.equal(updated.status, 'updated');
  assert.equal(updated.notified, false);
  assert.equal(events.length, 1);
  assert.equal(events[0].notified, false);
  assert.equal(state.siteLastNotified, null);
});

test('网站更新：检查失败不改基线、不通知', async () => {
  const state = makeState();
  const events = [];
  let body = 'hash-a';
  let fail = false;
  const checker = new UpdateChecker({
    state,
    persistState: () => {},
    fetchImpl: async () => {
      if (fail) throw new Error('network down');
      return textResponse(body);
    },
    onSiteUpdated: (event) => events.push(event),
  });

  await checker.checkSiteUpdate();
  const baseline = state.siteBaseline;
  fail = true;
  const failed = await checker.checkSiteUpdate();
  assert.equal(failed.status, 'error');
  assert.equal(state.siteBaseline, baseline);
  assert.equal(events.length, 0);
});

test('网站更新：并发请求最多一个在飞（busy）', async () => {
  const state = makeState();
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const checker = new UpdateChecker({
    state,
    persistState: () => {},
    fetchImpl: async () => {
      await gate;
      return textResponse('hash-a');
    },
  });
  const first = checker.checkSiteUpdate();
  const second = await checker.checkSiteUpdate();
  assert.equal(second.status, 'busy');
  release();
  const firstResult = await first;
  assert.equal(firstResult.status, 'baseline');
});

test('软件更新：新版本只自动提示一次，手动检查可再次提示', async () => {
  const state = makeState();
  state.appLastNotifiedVersion = null;
  const events = [];
  const checker = new UpdateChecker({
    state,
    persistState: () => {},
    currentVersion: '1.0.0',
    fetchImpl: async () =>
      jsonResponse({
        schema: 1,
        apps: { windows: { version: '1.0.4', url: 'https://example.com/dl', notes: '修复若干问题' } },
      }),
    onAppUpdateAvailable: (event) => events.push(event),
  });

  const first = await checker.checkAppUpdate();
  assert.equal(first.status, 'available');
  assert.equal(first.notified, true);
  assert.equal(state.appLastNotifiedVersion, '1.0.4');
  assert.equal(events.length, 1);

  const second = await checker.checkAppUpdate();
  assert.equal(second.status, 'available');
  assert.equal(second.notified, false);
  assert.equal(events.length, 1);

  const manual = await checker.checkAppUpdate({ manual: true });
  assert.equal(manual.status, 'available');
  assert.equal(manual.notified, true);
  assert.equal(events.length, 2);
});

test('软件更新：同版本/低版本为 current，缺失清单为 missing', async () => {
  const state = makeState();
  state.appLastNotifiedVersion = null;
  const current = new UpdateChecker({
    state,
    persistState: () => {},
    currentVersion: '1.0.0',
    fetchImpl: async () => jsonResponse({ schema: 1, apps: { windows: { version: '1.0.0' } } }),
  });
  assert.equal((await current.checkAppUpdate()).status, 'current');

  const missing = new UpdateChecker({
    state: makeState(),
    persistState: () => {},
    currentVersion: '1.0.0',
    fetchImpl: async () => textResponse('', 404),
  });
  assert.equal((await missing.checkAppUpdate()).status, 'missing');

  const invalid = new UpdateChecker({
    state: makeState(),
    persistState: () => {},
    currentVersion: '1.0.0',
    fetchImpl: async () => jsonResponse({ schema: 1, apps: {} }),
  });
  assert.equal((await invalid.checkAppUpdate()).status, 'invalid');
});
