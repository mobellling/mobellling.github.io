/**
 * MobellSite 更新检测（网站更新 + 软件更新）
 *
 * 纯 Node 模块：只使用 node:crypto 与全局 fetch，不依赖 Electron，可直接单测。
 * 对应 specs：docs/apps/APP-SPEC.md 第 5、6 节。
 */
import { createHash } from 'node:crypto';

export const APP_ID = 'com.mobellsite.app';
export const APP_VERSION = '1.0.0';
export const SITE_URL = 'https://mobellling.github.io/';
export const SITE_HASH_URL = 'https://mobellling.github.io/_hash';
export const LATEST_JSON_URL = 'https://mobellling.github.io/app/latest.json';
export const REQUEST_TIMEOUT_MS = 15_000;
/** 软件更新自动检查间隔：6 小时 */
export const APP_UPDATE_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** SHA-256 小写 hex（用于 `_hash` 原始字节指纹，第 5.1 节） */
export function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex').toLowerCase();
}

/** 把 "1.0.10" 拆成数字数组；非数字片段视为 0 */
export function parseVersion(version) {
  return String(version ?? '')
    .trim()
    .replace(/^v/i, '')
    .split('.')
    .map((part) => {
      const value = Number.parseInt(part, 10);
      return Number.isFinite(value) && value >= 0 ? value : 0;
    });
}

/**
 * 版本比较：a < b 返回 -1，相等 0，a > b 返回 1。
 * 按 `.` 拆数字比较，保证 1.0.10 > 1.0.9。
 */
export function compareVersions(a, b) {
  const left = parseVersion(a);
  const right = parseVersion(b);
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const x = left[index] ?? 0;
    const y = right[index] ?? 0;
    if (x !== y) return x > y ? 1 : -1;
  }
  return 0;
}

/** 带超时的 GET（默认 15s）。返回原始 Response，便于取 arrayBuffer / text。 */
export async function fetchWithTimeout(url, options = {}) {
  const {
    timeoutMs = REQUEST_TIMEOUT_MS,
    fetchImpl = globalThis.fetch,
    headers = {},
  } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        ...headers,
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 取站点版本清单 `_hash`，返回 {
 *   ok, status, fingerprint, bytes, error?
 * }
 * 成功条件：HTTP 200 且 body 为非空文本；fingerprint = SHA-256(原始字节)。
 */
export async function fetchSiteHash(options = {}) {
  const url = `${SITE_HASH_URL}?_t=${Date.now()}`;
  try {
    const response = await fetchWithTimeout(url, options);
    const buffer = Buffer.from(await response.arrayBuffer());
    const text = buffer.toString('utf8').trim();
    if (response.status !== 200 || text.length === 0) {
      return { ok: false, status: response.status, fingerprint: null, error: '非 200 或内容为空' };
    }
    return {
      ok: true,
      status: response.status,
      fingerprint: sha256Hex(buffer),
      bytes: buffer.length,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      fingerprint: null,
      error: String(error?.message ?? error),
    };
  }
}

/**
 * 取软件更新清单 `latest.json`。不存在 / 解析失败一律静默返回 ok:false（第 6 节）。
 */
export async function fetchLatestManifest(options = {}) {
  const url = `${LATEST_JSON_URL}?_t=${Date.now()}`;
  try {
    const response = await fetchWithTimeout(url, options);
    if (response.status !== 200) {
      return { ok: false, status: response.status, data: null };
    }
    const text = await response.text();
    if (!text.trim()) {
      return { ok: false, status: response.status, data: null, error: '内容为空' };
    }
    const data = JSON.parse(text);
    return { ok: true, status: 200, data };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: String(error?.message ?? error),
    };
  }
}

/**
 * 更新检测器：负责第 5、6 节的判定、去重与状态持久化。
 *
 * 状态对象由调用方（Electron 主进程）持有并持久化：
 *   siteBaseline / siteBaselineAt / siteLastNotified / siteLastCheckAt /
 *   appLastNotifiedVersion
 *
 * 回调：
 *   onSiteUpdated({fingerprint, notified, manual})  站点内容变化
 *   onAppUpdateAvailable({version, url, notes, sha256, size, manual}) 软件有新版本
 */
export class UpdateChecker {
  constructor({
    state,
    persistState = () => {},
    fetchImpl = globalThis.fetch,
    timeoutMs = REQUEST_TIMEOUT_MS,
    notificationsEnabled = () => true,
    currentVersion = APP_VERSION,
    onSiteUpdated = () => {},
    onAppUpdateAvailable = () => {},
    logger = console,
  } = {}) {
    if (!state || typeof state !== 'object') {
      throw new TypeError('UpdateChecker 需要 state 对象');
    }
    this.state = state;
    this.persistState = persistState;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.notificationsEnabled = notificationsEnabled;
    this.currentVersion = currentVersion;
    this.onSiteUpdated = onSiteUpdated;
    this.onAppUpdateAvailable = onAppUpdateAvailable;
    this.logger = logger;
    this.siteCheckInFlight = false;
    this.appCheckInFlight = false;
  }

  /** 第 5 节：检查网站是否更新。任意时刻最多 1 个请求在飞。 */
  async checkSiteUpdate({ manual = false } = {}) {
    if (this.siteCheckInFlight) {
      return { status: 'busy', httpStatus: 0 };
    }
    this.siteCheckInFlight = true;
    try {
      const result = await fetchSiteHash({
        fetchImpl: this.fetchImpl,
        timeoutMs: this.timeoutMs,
      });
      const nowIso = new Date().toISOString();
      const state = this.state;

      if (!result.ok) {
        this.logger.log?.(
          `[site-check] 检查失败：http=${result.status} ${result.error ?? ''}`.trim(),
        );
        return { status: 'error', httpStatus: result.status, error: result.error };
      }

      // 第一次成功拿到 fingerprint：只建立基线，不通知（第 5.3 节）
      if (!state.siteBaseline) {
        state.siteBaseline = result.fingerprint;
        state.siteBaselineAt = nowIso;
        state.siteLastCheckAt = nowIso;
        this.persistState();
        this.logger.log?.(`[site-check] 建立基线 ${result.fingerprint.slice(0, 12)}…`);
        return {
          status: 'baseline',
          httpStatus: result.status,
          fingerprint: result.fingerprint,
        };
      }

      if (result.fingerprint === state.siteBaseline) {
        state.siteLastCheckAt = nowIso;
        this.persistState();
        return {
          status: 'unchanged',
          httpStatus: result.status,
          fingerprint: result.fingerprint,
        };
      }

      // 站点内容变化：更新基线，按去重规则决定是否通知
      state.siteBaseline = result.fingerprint;
      state.siteBaselineAt = nowIso;
      state.siteLastCheckAt = nowIso;
      const shouldNotify =
        this.notificationsEnabled() && state.siteLastNotified !== result.fingerprint;
      if (shouldNotify) {
        state.siteLastNotified = result.fingerprint;
      }
      this.persistState();
      this.logger.log?.(
        `[site-check] 检测到网站更新 ${result.fingerprint.slice(0, 12)}… notify=${shouldNotify}`,
      );
      this.onSiteUpdated({
        fingerprint: result.fingerprint,
        notified: shouldNotify,
        manual,
      });
      return {
        status: 'updated',
        httpStatus: result.status,
        fingerprint: result.fingerprint,
        notified: shouldNotify,
      };
    } finally {
      this.siteCheckInFlight = false;
    }
  }

  /**
   * 第 6 节：检查软件更新。
   * manual=true 时忽略「同版本只提示一次」的去重（用户手动触发）。
   */
  async checkAppUpdate({ manual = false } = {}) {
    if (this.appCheckInFlight) {
      return { status: 'busy', httpStatus: 0 };
    }
    this.appCheckInFlight = true;
    try {
      const result = await fetchLatestManifest({
        fetchImpl: this.fetchImpl,
        timeoutMs: this.timeoutMs,
      });
      if (!result.ok) {
        // latest.json 不存在 / 解析失败：静默忽略
        return {
          status: result.status === 404 ? 'missing' : 'error',
          httpStatus: result.status,
          error: result.error,
        };
      }
      const entry = result.data?.apps?.windows;
      if (!entry || !entry.version) {
        return { status: 'invalid', httpStatus: 200 };
      }
      const comparison = compareVersions(entry.version, this.currentVersion);
      if (comparison <= 0) {
        return {
          status: 'current',
          httpStatus: 200,
          currentVersion: this.currentVersion,
          remoteVersion: entry.version,
        };
      }

      const state = this.state;
      const alreadyNotified = state.appLastNotifiedVersion === entry.version;
      if (!manual) {
        if (alreadyNotified) {
          return {
            status: 'available',
            httpStatus: 200,
            notified: false,
            remoteVersion: entry.version,
            currentVersion: this.currentVersion,
          };
        }
        if (!this.notificationsEnabled()) {
          return {
            status: 'available',
            httpStatus: 200,
            notified: false,
            suppressed: true,
            remoteVersion: entry.version,
            currentVersion: this.currentVersion,
          };
        }
      }

      state.appLastNotifiedVersion = entry.version;
      this.persistState();
      this.logger.log?.(`[app-check] 发现软件新版本 v${entry.version}（当前 ${this.currentVersion}）`);
      this.onAppUpdateAvailable({
        version: entry.version,
        url: entry.url,
        notes: entry.notes,
        sha256: entry.sha256,
        size: entry.size,
        manual,
      });
      return {
        status: 'available',
        httpStatus: 200,
        notified: true,
        remoteVersion: entry.version,
        currentVersion: this.currentVersion,
        url: entry.url,
      };
    } finally {
      this.appCheckInFlight = false;
    }
  }
}
