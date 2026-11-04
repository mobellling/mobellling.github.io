/**
 * MobellSite Windows 客户端主进程
 *
 * 功能：单实例锁、窗口/托盘/菜单、在线优先 + 内置快照离线回退、
 * 网站更新轮询与提醒、软件更新检查、关闭到托盘、--selftest、--test-notify。
 * 对应 specs：docs/apps/APP-SPEC.md 第 4–7 节。
 */
import {
  app,
  BrowserWindow,
  Menu,
  Notification,
  Tray,
  dialog,
  nativeImage,
  screen,
  shell,
} from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createOfflineServer } from './offline-server.mjs';
import {
  APP_ID,
  APP_UPDATE_INTERVAL_MS,
  APP_VERSION,
  SITE_URL,
  UpdateChecker,
  fetchLatestManifest,
  fetchSiteHash,
} from './update-checker.mjs';

const APP_NAME = 'MobellSite';
const APP_ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(APP_ROOT, 'site');
const ASSETS_DIR = path.join(APP_ROOT, 'assets');
const ICON_ICO = path.join(ASSETS_DIR, 'icon.ico');
const TRAY_PNG = path.join(ASSETS_DIR, 'tray.png');
const NOTIFY_ICON = path.join(ASSETS_DIR, 'icon-192.png');

const IS_SELFTEST = process.argv.slice(1).includes('--selftest');
const IS_TEST_NOTIFY = process.argv.slice(1).includes('--test-notify');
const QUIET_STDOUT = IS_SELFTEST || IS_TEST_NOTIFY;

const REMOTE_HOST = 'mobellling.github.io';
const REMOTE_LOAD_TIMEOUT_MS = 20_000;
const SITE_POLL_FOREGROUND_MS = 60_000;
const SITE_POLL_BACKGROUND_MS = 300_000;

const DEFAULT_STATE = {
  siteBaseline: null,
  siteBaselineAt: null,
  siteLastNotified: null,
  siteLastCheckAt: null,
  appLastNotifiedVersion: null,
  trayHintShown: false,
  settings: { launchAtStartup: false, updateNotifications: true },
  window: { x: null, y: null, width: 1280, height: 800 },
};

app.setAppUserModelId(APP_ID);

/** @type {BrowserWindow | null} */
let win = null;
/** @type {Tray | null} */
let tray = null;
/** @type {UpdateChecker | null} */
let checker = null;
/** @type {Awaited<ReturnType<typeof createOfflineServer>> | null} */
let offlineServer = null;
let offlineSwitchPromise = null;
let state = null;
let isQuitting = false;
let mode = 'starting'; // starting | loading | online | offline
// 离线切换进行中：用于忽略在线加载失败时 Chromium error page 触发的
// did-finish-load（否则会误判为在线加载成功、提前关闭快照服务器）。
let offlineSwitching = false;
let navigationToken = 0;
let sitePollTimer = null;
let appUpdateTimer = null;
let boundsSaveTimer = null;
let logFilePath = null;

/* ------------------------------------------------------------------ */
/* 日志与结果文件                                                       */
/* ------------------------------------------------------------------ */

function resolveLogFilePath() {
  if (logFilePath) return logFilePath;
  try {
    logFilePath = path.join(app.getPath('userData'), 'app.log');
  } catch {
    logFilePath = path.join(os.tmpdir(), 'mobellsite-app.log');
  }
  return logFilePath;
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  try {
    const target = resolveLogFilePath();
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(target) && fs.statSync(target).size > 2 * 1024 * 1024) {
      fs.writeFileSync(target, '');
    }
    fs.appendFileSync(target, `${line}\n`, 'utf8');
  } catch {
    /* 日志失败不影响主流程 */
  }
  if (!QUIET_STDOUT) console.log(line);
}

function writeResultFiles(fileName, content) {
  const targets = [path.join(os.tmpdir(), fileName)];
  try {
    targets.push(path.join(app.getPath('userData'), fileName));
  } catch {
    /* ignore */
  }
  for (const target of targets) {
    try {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content, 'utf8');
    } catch {
      /* ignore */
    }
  }
}

/* ------------------------------------------------------------------ */
/* 设置 / 状态持久化（第 5.2 节）                                        */
/* ------------------------------------------------------------------ */

function statePath() {
  return path.join(app.getPath('userData'), 'state.json');
}

function loadState() {
  const fallback = {
    ...DEFAULT_STATE,
    settings: { ...DEFAULT_STATE.settings },
    window: { ...DEFAULT_STATE.window },
  };
  try {
    const raw = fs.readFileSync(statePath(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      ...fallback,
      ...parsed,
      settings: { ...fallback.settings, ...(parsed.settings ?? {}) },
      window: { ...fallback.window, ...(parsed.window ?? {}) },
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      log(`[state] 读取状态失败：${error?.message ?? error}`);
    }
    return fallback;
  }
}

function saveState() {
  if (!state) return;
  try {
    fs.mkdirSync(path.dirname(statePath()), { recursive: true });
    fs.writeFileSync(statePath(), `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  } catch (error) {
    log(`[state] 保存状态失败：${error?.message ?? error}`);
  }
}

function notificationsEnabled() {
  return state?.settings?.updateNotifications !== false;
}

/* ------------------------------------------------------------------ */
/* 通用工具                                                             */
/* ------------------------------------------------------------------ */

function countFilesRecursive(directory) {
  let count = 0;
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(fullPath);
      else if (entry.isFile()) count += 1;
    }
  }
  return count;
}

function countNonEmptyLines(filePath) {
  try {
    return fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0).length;
  } catch {
    return 0;
  }
}

function readSnapshotMeta() {
  const result = {
    files: countFilesRecursive(SITE_DIR),
    bytes: 0,
    generatedAt: null,
    hashEntries: countNonEmptyLines(path.join(SITE_DIR, '_hash')),
    hashBytes: 0,
  };
  try {
    const metaPath = path.join(APP_ROOT, 'site-meta.json');
    if (fs.existsSync(metaPath)) {
      // 兼容带 BOM 的 JSON（Windows PowerShell 5.1 的 Set-Content 会写 BOM）
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8').replace(/^\uFEFF/, ''));
      if (Number.isFinite(meta.files)) result.files = meta.files;
      if (Number.isFinite(meta.bytes)) result.bytes = meta.bytes;
      if (meta.generatedAt) result.generatedAt = meta.generatedAt;
      if (Number.isFinite(meta.hashEntries) && meta.hashEntries > 0) {
        result.hashEntries = meta.hashEntries;
      }
    }
    const hashPath = path.join(SITE_DIR, '_hash');
    if (fs.existsSync(hashPath)) {
      result.hashBytes = fs.statSync(hashPath).size;
    }
  } catch (error) {
    log(`[snapshot] 读取快照元信息失败：${error?.message ?? error}`);
  }
  return result;
}

function formatTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false });
}

function isRemoteUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === REMOTE_HOST;
  } catch {
    return false;
  }
}

function isLocalUrl(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'http:' &&
      (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost')
    );
  } catch {
    return false;
  }
}

function isHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function openExternalSafe(url) {
  if (!isHttpUrl(url) && !/^(mailto|tel):/i.test(String(url))) {
    log(`[link] 忽略不支持的链接：${url}`);
    return;
  }
  shell.openExternal(url).catch((error) => {
    log(`[link] 打开外部链接失败 ${url}: ${error?.message ?? error}`);
  });
}

/* ------------------------------------------------------------------ */
/* 系统通知（第 5.3 / 6 / 7 节）                                        */
/* ------------------------------------------------------------------ */

function showNotification({ title, body, onClick }) {
  try {
    if (!Notification.isSupported()) {
      log('[notify] Notification.isSupported() = false，跳过系统通知');
      return false;
    }
    const options = { title, body, silent: false };
    if (fs.existsSync(NOTIFY_ICON)) options.icon = NOTIFY_ICON;
    const notification = new Notification(options);
    notification.on('click', () => {
      try {
        onClick?.();
      } catch (error) {
        log(`[notify] 通知点击处理失败：${error?.message ?? error}`);
      }
    });
    notification.on('failed', (_event, error) => {
      log(`[notify] 通知显示失败：${error}`);
    });
    notification.show();
    log(`[notify] 已发送系统通知：${title}`);
    return true;
  } catch (error) {
    log(`[notify] 发送通知异常：${error?.message ?? error}`);
    return false;
  }
}

function showSiteUpdateNotification() {
  return showNotification({
    title: '网站已更新',
    body: 'MobellSite 有新内容，点击查看最新内容。',
    onClick: () => {
      showMainWindow();
      if (mode === 'offline') {
        void loadRemote({ reason: '通知点击' });
      } else if (win && !win.isDestroyed()) {
        win.webContents.reload();
      }
    },
  });
}

function showAppUpdateNotification({ version, url }) {
  return showNotification({
    title: `软件有新版本 v${version}`,
    body: '点击下载更新（在浏览器中打开）',
    onClick: () => {
      if (url) openExternalSafe(url);
    },
  });
}

/* ------------------------------------------------------------------ */
/* 页面内注入：离线提示条 / 网站更新提示条 / Toast / 软件更新提示条       */
/* ------------------------------------------------------------------ */

async function executeInPage(code) {
  if (!win || win.isDestroyed() || win.webContents.isDestroyed()) return false;
  try {
    return await win.webContents.executeJavaScript(code, true);
  } catch (error) {
    log(`[inject] 页面脚本执行失败：${error?.message ?? error}`);
    return false;
  }
}

function injectOfflineBanner() {
  const script = `(() => {
  try {
    const ID = 'mobellsite-offline-banner';
    if (document.getElementById(ID)) return 'exists';
    const bar = document.createElement('div');
    bar.id = ID;
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;gap:14px;padding:8px 16px;background:#b45309;color:#fff;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.28)';
    const text = document.createElement('span');
    text.textContent = '离线模式 · 正在显示内置网站快照';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = '重新连接';
    button.style.cssText = 'appearance:none;border:1px solid rgba(255,255,255,.75);background:rgba(255,255,255,.16);color:#fff;border-radius:999px;padding:4px 14px;font:inherit;cursor:pointer';
    button.addEventListener('click', () => {
      button.disabled = true;
      button.textContent = '正在连接…';
      window.location.href = ${JSON.stringify(SITE_URL)};
    });
    bar.appendChild(text);
    bar.appendChild(button);
    (document.body || document.documentElement).appendChild(bar);
    return 'injected';
  } catch (error) {
    return 'error:' + (error && error.message ? error.message : String(error));
  }
})()`;
  void executeInPage(script);
}

function injectSiteUpdateBanner(fingerprint) {
  if (!fingerprint) return;
  const script = `(() => {
  try {
    const ID = 'mobellsite-update-banner';
    const DISMISS_KEY = 'mobellsite.dismissedSiteHash';
    const fingerprint = ${JSON.stringify(fingerprint)};
    if (localStorage.getItem(DISMISS_KEY) === fingerprint) return 'dismissed';
    if (document.getElementById(ID)) return 'exists';
    const card = document.createElement('div');
    card.id = ID;
    card.setAttribute('role', 'alert');
    card.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483646;max-width:360px;background:#ffffff;color:#0f172a;border:1px solid rgba(15,23,42,.12);border-radius:12px;box-shadow:0 10px 30px rgba(15,23,42,.22);padding:14px 16px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', '关闭');
    close.style.cssText = 'position:absolute;top:6px;right:8px;appearance:none;border:0;background:transparent;color:#64748b;font-size:18px;line-height:1;cursor:pointer;padding:2px 6px';
    close.addEventListener('click', () => {
      try { localStorage.setItem(DISMISS_KEY, fingerprint); } catch (e) {}
      card.remove();
    });
    const title = document.createElement('div');
    title.textContent = '网站已更新';
    title.style.cssText = 'font-weight:600;margin-right:20px';
    const actions = document.createElement('div');
    actions.style.cssText = 'margin-top:10px;display:flex;gap:8px;align-items:center';
    const refresh = document.createElement('button');
    refresh.type = 'button';
    refresh.textContent = '点击刷新';
    refresh.style.cssText = 'appearance:none;border:0;border-radius:8px;background:#014ecb;color:#fff;padding:6px 14px;font:inherit;cursor:pointer';
    refresh.addEventListener('click', () => window.location.reload());
    actions.appendChild(refresh);
    card.appendChild(close);
    card.appendChild(title);
    card.appendChild(actions);
    (document.body || document.documentElement).appendChild(card);
    return 'injected';
  } catch (error) {
    return 'error:' + (error && error.message ? error.message : String(error));
  }
})()`;
  void executeInPage(script);
}

function injectAppUpdateBanner({ version, url }) {
  if (!version) return;
  const script = `(() => {
  try {
    const ID = 'mobellsite-app-banner';
    const DISMISS_KEY = 'mobellsite.dismissedAppVersion';
    const version = ${JSON.stringify(String(version))};
    const url = ${JSON.stringify(String(url ?? ''))};
    if (localStorage.getItem(DISMISS_KEY) === version) return 'dismissed';
    if (document.getElementById(ID)) return 'exists';
    const card = document.createElement('div');
    card.id = ID;
    card.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:2147483646;max-width:360px;background:#ffffff;color:#0f172a;border:1px solid rgba(15,23,42,.12);border-radius:12px;box-shadow:0 10px 30px rgba(15,23,42,.22);padding:14px 16px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', '关闭');
    close.style.cssText = 'position:absolute;top:6px;right:8px;appearance:none;border:0;background:transparent;color:#64748b;font-size:18px;line-height:1;cursor:pointer;padding:2px 6px';
    close.addEventListener('click', () => {
      try { localStorage.setItem(DISMISS_KEY, version); } catch (e) {}
      card.remove();
    });
    const title = document.createElement('div');
    title.textContent = '软件有新版本 v' + version;
    title.style.cssText = 'font-weight:600;margin-right:20px';
    const actions = document.createElement('div');
    actions.style.cssText = 'margin-top:10px';
    const download = document.createElement('button');
    download.type = 'button';
    download.textContent = '点击下载更新';
    download.style.cssText = 'appearance:none;border:0;border-radius:8px;background:#014ecb;color:#fff;padding:6px 14px;font:inherit;cursor:pointer';
    download.addEventListener('click', () => {
      if (url) window.location.href = url;
    });
    actions.appendChild(download);
    card.appendChild(close);
    card.appendChild(title);
    card.appendChild(actions);
    (document.body || document.documentElement).appendChild(card);
    return 'injected';
  } catch (error) {
    return 'error:' + (error && error.message ? error.message : String(error));
  }
})()`;
  void executeInPage(script);
}

async function showPageToast(message) {
  const script = `(() => {
  try {
    const ID = 'mobellsite-toast';
    const TIMER_KEY = '__mobellsiteToastTimer';
    let toast = document.getElementById(ID);
    if (toast) toast.remove();
    toast = document.createElement('div');
    toast.id = ID;
    toast.setAttribute('role', 'status');
    toast.textContent = ${JSON.stringify(String(message))};
    toast.style.cssText = 'position:fixed;left:50%;bottom:48px;transform:translateX(-50%);z-index:2147483647;background:rgba(15,23,42,.94);color:#fff;padding:10px 18px;border-radius:999px;font:14px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:80vw;text-align:center';
    (document.body || document.documentElement).appendChild(toast);
    clearTimeout(window[TIMER_KEY]);
    window[TIMER_KEY] = setTimeout(() => { toast.remove(); }, 4000);
    return true;
  } catch (error) {
    return false;
  }
})()`;
  return (await executeInPage(script)) === true;
}

async function feedback(message) {
  const shownInPage = await showPageToast(message);
  if (!shownInPage) {
    showNotification({ title: APP_NAME, body: message });
  }
}

/* ------------------------------------------------------------------ */
/* 在线 / 离线加载（第 4 节）                                            */
/* ------------------------------------------------------------------ */

async function stopOfflineServer() {
  const server = offlineServer;
  offlineServer = null;
  if (!server) return;
  try {
    await server.close();
    log('[offline] 内置快照服务器已关闭');
  } catch (error) {
    log(`[offline] 关闭内置快照服务器失败：${error?.message ?? error}`);
  }
}

async function switchToOffline({ reason = '' } = {}) {
  if (mode === 'offline' && offlineServer) return true;
  if (offlineSwitchPromise) return offlineSwitchPromise;

  offlineSwitchPromise = (async () => {
    // 作废可能仍在进行的在线加载
    navigationToken += 1;
    try {
      if (!offlineServer) {
        offlineServer = await createOfflineServer({
          root: SITE_DIR,
          logger: { log: (message) => log(`[offline-server] ${message}`) },
        });
        log(`[offline] 已启动内置快照服务器 ${offlineServer.url}`);
      }
      if (!win || win.isDestroyed()) return false;
      try {
        if (win.webContents.isLoading()) win.webContents.stop();
      } catch {
        /* ignore */
      }
      mode = 'offline';
      log(`[offline] 切换到内置快照（原因：${reason || '在线站点不可用'}）`);
      offlineSwitching = true;
      try {
        await win.loadURL(offlineServer.url);
      } finally {
        offlineSwitching = false;
      }
      return true;
    } catch (error) {
      log(`[offline] 加载内置快照失败：${error?.message ?? error}`);
      return false;
    } finally {
      offlineSwitchPromise = null;
    }
  })();
  return offlineSwitchPromise;
}

async function loadRemote({ reason = 'startup' } = {}) {
  if (!win || win.isDestroyed()) return false;
  const token = ++navigationToken;
  mode = 'loading';
  log(`[nav] 加载在线站点（${reason}）…`);
  let timer = null;
  try {
    const loadPromise = win.loadURL(SITE_URL);
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error('在线站点加载超时（20 秒）');
        error.code = 'ETIMEDOUT';
        reject(error);
      }, REMOTE_LOAD_TIMEOUT_MS);
    });
    await Promise.race([loadPromise, timeoutPromise]);
    if (token !== navigationToken) return false;
    mode = 'online';
    log('[nav] 在线站点加载完成');
    return true;
  } catch (error) {
    if (token !== navigationToken) return false;
    log(`[nav] 在线站点加载失败：${error?.message ?? error}`);
    try {
      if (win && !win.isDestroyed()) win.webContents.stop();
    } catch {
      /* ignore */
    }
    await switchToOffline({ reason: `${reason}: ${error?.message ?? error}` });
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ */
/* 窗口 / 托盘 / 菜单（第 7 节）                                         */
/* ------------------------------------------------------------------ */

function initialWindowBounds() {
  const saved = state?.window ?? {};
  const width = Number.isFinite(saved.width) && saved.width >= 900 ? saved.width : 1280;
  const height = Number.isFinite(saved.height) && saved.height >= 600 ? saved.height : 800;
  const bounds = { width, height };
  if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
    try {
      const display = screen.getDisplayMatching({
        x: saved.x,
        y: saved.y,
        width,
        height,
      });
      const area = display.workArea;
      const visible =
        saved.x >= area.x &&
        saved.y >= area.y &&
        saved.x + 120 <= area.x + area.width &&
        saved.y + 80 <= area.y + area.height;
      if (visible) {
        bounds.x = saved.x;
        bounds.y = saved.y;
      }
    } catch {
      /* ignore */
    }
  }
  return bounds;
}

function scheduleSaveWindowBounds() {
  clearTimeout(boundsSaveTimer);
  boundsSaveTimer = setTimeout(() => {
    if (!win || win.isDestroyed() || !state) return;
    state.window = win.getBounds();
    saveState();
  }, 500);
}

function showMainWindow() {
  if (!win || win.isDestroyed()) {
    createWindow();
    void loadRemote({ reason: '重新创建窗口' });
    return;
  }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
}

function hideToTray() {
  if (!win || win.isDestroyed()) return;
  win.hide();
  if (!state.trayHintShown) {
    state.trayHintShown = true;
    saveState();
    const content = '已最小化到托盘，可在托盘图标右键退出';
    let balloonShown = false;
    try {
      if (tray) {
        tray.displayBalloon({
          title: APP_NAME,
          content,
          icon: fs.existsSync(TRAY_PNG) ? TRAY_PNG : undefined,
          noSound: false,
        });
        balloonShown = true;
      }
    } catch (error) {
      log(`[tray] 气泡提示失败：${error?.message ?? error}`);
    }
    if (!balloonShown) showNotification({ title: APP_NAME, body: content });
  }
}

function toggleMainWindow() {
  if (!win || win.isDestroyed()) {
    showMainWindow();
    return;
  }
  if (win.isVisible() && !win.isMinimized()) win.hide();
  else showMainWindow();
}

function createWindow() {
  if (win && !win.isDestroyed()) return win;
  const bounds = initialWindowBounds();
  win = new BrowserWindow({
    ...bounds,
    minWidth: 900,
    minHeight: 600,
    title: APP_NAME,
    icon: fs.existsSync(ICON_ICO) ? ICON_ICO : undefined,
    show: !IS_SELFTEST,
    backgroundColor: '#0f172a',
    autoHideMenuBar: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      webviewTag: false,
    },
  });

  if (IS_SELFTEST) win.hide();

  // 窗口标题固定为 MobellSite（第 1 节产品标识）
  win.on('page-title-updated', (event) => {
    event.preventDefault();
    win?.setTitle(APP_NAME);
  });
  win.on('resize', scheduleSaveWindowBounds);
  win.on('move', scheduleSaveWindowBounds);
  win.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    hideToTray();
  });
  win.on('focus', () => {
    scheduleSitePoll({ immediate: true });
  });
  win.on('blur', () => {
    scheduleSitePoll();
  });

  // 站内链接窗口内打开；外部链接交给系统浏览器（第 4.4 节）
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isRemoteUrl(url) || isLocalUrl(url)) {
      if (win && !win.isDestroyed()) void win.loadURL(url);
    } else {
      openExternalSafe(url);
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (isRemoteUrl(url) || isLocalUrl(url)) return;
    event.preventDefault();
    openExternalSafe(url);
  });

  win.webContents.on('did-finish-load', () => {
    if (!win || win.isDestroyed()) return;
    const url = win.webContents.getURL();
    if (isRemoteUrl(url)) {
      if (offlineSwitching) {
        // 在线加载失败时 Chromium 也会为错误页触发 did-finish-load，此时已切换到离线
        log(`[nav] 忽略离线切换期间的在线 did-finish-load：${url}`);
        return;
      }
      mode = 'online';
      if (offlineServer) void stopOfflineServer();
      log('[nav] 在线页面加载完成');
    } else if (isLocalUrl(url)) {
      mode = 'offline';
      log('[nav] 离线快照页面加载完成，注入离线提示条');
      injectOfflineBanner();
    } else {
      log(`[nav] 页面加载完成：${url}`);
    }
  });

  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    if (!isMainFrame) return;
    if (errorCode === -3) return; // ERR_ABORTED：被新导航取消，忽略
    log(`[nav] did-fail-load ${errorCode} ${errorDescription} ${validatedURL}`);
    if (!isRemoteUrl(validatedURL)) return;
    if (mode === 'offline') {
      // 离线状态下点“重新连接”仍失败：恢复内置快照，避免停留在错误页
      if (offlineSwitching) return;
      log('[offline] 重新连接失败，恢复内置快照');
      if (offlineServer && win && !win.isDestroyed()) {
        void win.loadURL(offlineServer.url).catch(() => {});
      } else {
        void switchToOffline({ reason: `${errorCode} ${errorDescription}` });
      }
      return;
    }
    void switchToOffline({ reason: `${errorCode} ${errorDescription}` });
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    log(`[renderer] 渲染进程退出：${details?.reason ?? 'unknown'}`);
  });

  return win;
}

function createApplicationMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '刷新页面',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (win && !win.isDestroyed()) win.webContents.reload();
          },
        },
        {
          label: '重新连接在线站点',
          click: () => {
            void loadRemote({ reason: '菜单：重新连接' });
          },
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ],
    },
    {
      label: '更新',
      submenu: [
        { label: '检查网站更新', click: () => void manualCheckSiteUpdate() },
        { label: '检查软件更新', click: () => void manualCheckAppUpdate() },
      ],
    },
    {
      label: '设置',
      submenu: [
        {
          label: '开机启动',
          type: 'checkbox',
          checked: Boolean(state?.settings?.launchAtStartup),
          click: (menuItem) => applyLoginItem(menuItem.checked),
        },
        {
          label: '更新提醒',
          type: 'checkbox',
          checked: notificationsEnabled(),
          click: (menuItem) => {
            if (!state) return;
            state.settings.updateNotifications = Boolean(menuItem.checked);
            saveState();
            log(`[settings] 更新提醒 = ${state.settings.updateNotifications}`);
          },
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        { label: '打开网站', click: () => openExternalSafe(SITE_URL) },
        { label: '关于', click: () => void showAboutDialog() },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createTray() {
  let image = null;
  for (const candidate of [TRAY_PNG, ICON_ICO]) {
    if (!fs.existsSync(candidate)) continue;
    const loaded = nativeImage.createFromPath(candidate);
    if (!loaded.isEmpty()) {
      image = loaded;
      break;
    }
  }
  if (!image || image.isEmpty()) {
    log('[tray] 未找到可用的托盘图标，跳过托盘创建');
    return;
  }
  try {
    tray = new Tray(image);
    tray.setToolTip(APP_NAME);
    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: '显示 / 隐藏窗口', click: toggleMainWindow },
        { type: 'separator' },
        { label: '检查网站更新', click: () => void manualCheckSiteUpdate() },
        { label: '检查软件更新', click: () => void manualCheckAppUpdate() },
        { type: 'separator' },
        {
          label: '退出',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ]),
    );
    tray.on('click', toggleMainWindow);
    tray.on('double-click', showMainWindow);
  } catch (error) {
    log(`[tray] 创建托盘失败：${error?.message ?? error}`);
  }
}

function applyLoginItem(enabled) {
  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(enabled),
      path: process.execPath,
      args: [],
    });
    if (state) {
      state.settings.launchAtStartup = Boolean(enabled);
      saveState();
    }
    log(`[settings] 开机启动 = ${Boolean(enabled)}`);
  } catch (error) {
    log(`[settings] 设置开机启动失败：${error?.message ?? error}`);
  }
}

async function showAboutDialog() {
  const meta = readSnapshotMeta();
  const generatedAt = meta.generatedAt ? formatTime(meta.generatedAt) : '未知';
  const sizeText = meta.bytes > 0 ? `${(meta.bytes / 1024 / 1024).toFixed(1)} MB` : '—';
  const detail = [
    `软件版本：${APP_VERSION}`,
    `Electron：${process.versions.electron}    Chromium：${process.versions.chrome}`,
    `站点地址：${SITE_URL}`,
    `内置网站快照：${meta.files} 个文件，${sizeText}，生成时间 ${generatedAt}`,
    `快照 _hash 条目：${meta.hashEntries} 条`,
    `站点基线时间：${formatTime(state?.siteBaselineAt)}`,
    `最近网站检查：${formatTime(state?.siteLastCheckAt)}`,
    `用户数据目录：${app.getPath('userData')}`,
  ].join('\n');
  const options = {
    type: 'info',
    title: `关于 ${APP_NAME}`,
    message: `${APP_NAME} ${APP_VERSION}`,
    detail,
    buttons: ['确定'],
    icon: fs.existsSync(ICON_ICO) ? ICON_ICO : undefined,
  };
  try {
    if (win && !win.isDestroyed()) await dialog.showMessageBox(win, options);
    else await dialog.showMessageBox(options);
  } catch (error) {
    log(`[about] 打开关于对话框失败：${error?.message ?? error}`);
  }
}

/* ------------------------------------------------------------------ */
/* 更新检测与轮询（第 5、6 节）                                          */
/* ------------------------------------------------------------------ */

function createUpdateChecker() {
  checker = new UpdateChecker({
    state,
    persistState: saveState,
    notificationsEnabled,
    currentVersion: APP_VERSION,
    onSiteUpdated: ({ fingerprint, notified }) => {
      injectSiteUpdateBanner(fingerprint);
      if (notified) showSiteUpdateNotification();
    },
    onAppUpdateAvailable: (info) => {
      const shown = showAppUpdateNotification(info);
      if (!shown) injectAppUpdateBanner(info);
    },
    logger: { log: (message) => log(message), warn: (message) => log(message), error: (message) => log(message) },
  });
}

function sitePollIntervalMs() {
  if (win && !win.isDestroyed() && win.isFocused()) return SITE_POLL_FOREGROUND_MS;
  return SITE_POLL_BACKGROUND_MS;
}

function scheduleSitePoll({ immediate = false } = {}) {
  if (sitePollTimer) {
    clearTimeout(sitePollTimer);
    sitePollTimer = null;
  }
  const delay = immediate ? 0 : sitePollIntervalMs();
  sitePollTimer = setTimeout(async () => {
    sitePollTimer = null;
    if (checker) {
      try {
        await checker.checkSiteUpdate({ manual: false });
      } catch (error) {
        log(`[site-check] 轮询异常：${error?.message ?? error}`);
      }
    }
    if (!isQuitting) scheduleSitePoll();
  }, delay);
}

async function manualCheckSiteUpdate() {
  if (!checker) return;
  const result = await checker.checkSiteUpdate({ manual: true });
  switch (result.status) {
    case 'updated':
      if (!result.notified) injectSiteUpdateBanner(result.fingerprint);
      break;
    case 'baseline':
    case 'unchanged':
      await feedback('网站已是最新版本');
      break;
    case 'busy':
      await feedback('正在检查网站更新，请稍候…');
      break;
    default:
      await feedback('检查失败，请检查网络');
      break;
  }
}

async function manualCheckAppUpdate() {
  if (!checker) return;
  const result = await checker.checkAppUpdate({ manual: true });
  switch (result.status) {
    case 'current':
      await feedback('软件已是最新版本');
      break;
    case 'available':
      if (!result.notified) {
        await feedback(`发现新版本 v${result.remoteVersion}，请在浏览器中下载`);
      }
      break;
    case 'missing':
      await feedback('检查失败：更新清单不存在');
      break;
    case 'busy':
      await feedback('正在检查软件更新，请稍候…');
      break;
    default:
      await feedback('检查失败，请检查网络');
      break;
  }
}

/* ------------------------------------------------------------------ */
/* 启动流程                                                             */
/* ------------------------------------------------------------------ */

async function initApp() {
  state = loadState();
  // 与系统实际的开机启动状态保持同步
  try {
    const loginSettings = app.getLoginItemSettings();
    if (loginSettings && typeof loginSettings.openAtLogin === 'boolean') {
      state.settings.launchAtStartup = loginSettings.openAtLogin;
    }
  } catch {
    /* ignore */
  }

  createWindow();
  createApplicationMenu();
  createTray();
  createUpdateChecker();

  if (IS_TEST_NOTIFY) {
    runTestNotify();
    void loadRemote({ reason: 'test-notify' });
    return;
  }

  // 启动时：立即检查网站更新 + 检查软件更新（第 5.4 / 6 节）
  scheduleSitePoll({ immediate: true });
  void checker?.checkAppUpdate();
  appUpdateTimer = setInterval(() => {
    void checker?.checkAppUpdate();
  }, APP_UPDATE_INTERVAL_MS);

  await loadRemote({ reason: '启动' });
}

/* ------------------------------------------------------------------ */
/* --test-notify                                                       */
/* ------------------------------------------------------------------ */

function runTestNotify() {
  const payload = {
    ok: false,
    notificationSupported: Notification.isSupported(),
    notified: false,
    iconExists: fs.existsSync(NOTIFY_ICON),
    electron: process.versions.electron,
    note: '仅验证 Electron Notification API 调用路径；无桌面通知环境时 notificationSupported=false，不视为失败',
  };
  setTimeout(() => {
    payload.notified = showNotification({
      title: '网站已更新',
      body: 'MobellSite 有新内容，点击查看最新内容。',
      onClick: () => showMainWindow(),
    });
    payload.ok = payload.notificationSupported ? payload.notified : true;
    log(`[test-notify] notificationSupported=${payload.notificationSupported} shown=${payload.notified}`);
  }, 2000);

  setTimeout(() => {
    const line = JSON.stringify(payload);
    console.log(line);
    writeResultFiles('mobellsite-test-notify.json', line);
    app.exit(payload.ok ? 0 : 1);
  }, 5000);
}

/* ------------------------------------------------------------------ */
/* --selftest                                                          */
/* ------------------------------------------------------------------ */

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runSelftest() {
  const startedAt = Date.now();
  const result = {
    ok: false,
    url: SITE_URL,
    title: null,
    hashStatus: 0,
    updateStatus: 0,
    snapshotFiles: 0,
    electron: process.versions.electron,
    version: APP_VERSION,
    notificationSupported: false,
  };

  try {
    state = loadState();
    result.snapshotFiles = countFilesRecursive(SITE_DIR);
    result.snapshotHashEntries = countNonEmptyLines(path.join(SITE_DIR, '_hash'));
    result.notificationSupported = Notification.isSupported();

    const [hash, latest] = await Promise.all([fetchSiteHash(), fetchLatestManifest()]);
    result.hashStatus = hash.status;
    result.hashFingerprint = hash.fingerprint;
    result.updateStatus = latest.status;
    result.latestVersion = latest.data?.apps?.windows?.version ?? null;

    // 隐藏窗口加载远程站点：等待 did-finish-load 或 15s 超时
    const testWindow = new BrowserWindow({
      show: false,
      width: 1280,
      height: 800,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    let timedOut = false;
    let loaded = false;
    const loadPromise = testWindow
      .loadURL(SITE_URL)
      .then(() => true)
      .catch(() => false);
    const timeoutPromise = delay(15_000).then(() => {
      timedOut = true;
      return false;
    });
    loaded = await Promise.race([loadPromise, timeoutPromise]);
    if (timedOut) {
      try {
        testWindow.webContents.stop();
      } catch {
        /* ignore */
      }
    }
    result.remoteLoaded = loaded;
    result.url = testWindow.webContents.getURL() || SITE_URL;
    result.title = testWindow.webContents.getTitle() || testWindow.getTitle() || null;
    if (!testWindow.isDestroyed()) testWindow.destroy();

    // 内置快照服务器自检
    const server = await createOfflineServer({
      root: SITE_DIR,
      logger: { log: (message) => log(`[selftest][offline-server] ${message}`) },
    });
    try {
      result.offlineUrl = server.url;
      const indexResponse = await fetch(server.url);
      const indexBody = await indexResponse.text();
      result.offlineStatus = indexResponse.status;
      result.offlineSnapshotOk =
        indexResponse.status === 200 && indexBody.includes('MobellSite');
      const hashResponse = await fetch(`${server.url}_hash`);
      const hashBody = await hashResponse.text();
      result.offlineHashStatus = hashResponse.status;
      result.offlineHashOk = hashResponse.status === 200 && hashBody.length > 0;
      const traversalResponse = await fetch(`${server.url}..%2f..%2fpackage.json`);
      result.offlineTraversalStatus = traversalResponse.status;
      if (traversalResponse.body) {
        try {
          await traversalResponse.body.cancel();
        } catch {
          /* ignore */
        }
      }
    } finally {
      await server.close();
    }

    result.ok =
      result.hashStatus === 200 &&
      loaded === true &&
      typeof result.title === 'string' &&
      result.title.length > 0 &&
      result.offlineSnapshotOk === true;
  } catch (error) {
    result.error = String(error?.stack ?? error?.message ?? error);
  }

  result.durationMs = Date.now() - startedAt;
  const line = JSON.stringify(result);
  console.log(line);
  writeResultFiles('mobellsite-selftest.json', line);
  app.exit(result.ok ? 0 : 1);
}

/* ------------------------------------------------------------------ */
/* 生命周期                                                             */
/* ------------------------------------------------------------------ */

function startWhenReady() {
  app
    .whenReady()
    .then(async () => {
      if (IS_SELFTEST) {
        await runSelftest();
        return;
      }
      await initApp();
    })
    .catch((error) => {
      const message = `[fatal] 启动失败：${error?.stack ?? error?.message ?? error}`;
      log(message);
      if (!QUIET_STDOUT) console.error(message);
      app.exit(1);
    });
}

if (IS_SELFTEST || IS_TEST_NOTIFY) {
  startWhenReady();
} else if (app.requestSingleInstanceLock()) {
  app.on('second-instance', () => {
    showMainWindow();
  });
  startWhenReady();
} else {
  // 已有实例：聚焦它并退出本次启动（第 7 节单实例）
  app.quit();
}

app.on('second-instance', () => {
  showMainWindow();
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('will-quit', () => {
  clearTimeout(sitePollTimer);
  clearTimeout(appUpdateTimer);
  if (offlineServer) {
    offlineServer.close().catch(() => {});
    offlineServer = null;
  }
});

app.on('window-all-closed', () => {
  // 关闭到托盘：保持应用运行；只有退出动作才真正结束。
  // 注意：--selftest 会主动销毁自检窗口并自行 app.exit()，此处不能提前退出。
});

app.on('uncaughtException', (error) => {
  log(`[uncaught] ${error?.stack ?? error?.message ?? error}`);
});

app.on('unhandledRejection', (reason) => {
  log(`[unhandledRejection] ${reason?.stack ?? reason}`);
});
