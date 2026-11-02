# Service Worker 使用说明

本项目在 `public/sw.js` 中实现了一个无依赖的 Service Worker，并在构建时生成 `dist/_hash` 清单。页面侧封装在
`src/scripts/sw-client.ts`，通过 `src/components/common/ServiceWorker.astro` 在 `Layout.astro` 里自动注册。

## 文件

| 文件                                        | 作用                                                               |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `public/sw.js`                              | Service Worker 本体（缓存策略、清单同步、预下载、postMessage API） |
| `scripts/gen-hash.mjs`                      | 构建后扫描 `dist`，生成 `/_hash`                                   |
| `src/scripts/sw-client.ts`                  | 页面端类型化 API、`window.__SW__`、调试面板                        |
| `src/components/common/ServiceWorker.astro` | 注册 SW 的 Astro 组件                                              |
| `scripts/serve-dist.mjs`                    | 本地生产构建预览（支持 `/_hash`、`/sw.js`、404）                   |
| `scripts/sw-e2e.mjs`                        | 基于无头 Chrome 的端到端检查                                       |

## 构建与部署

`npm run build` 会在 `astro build && pagefind` 之后自动执行 `postbuild`：

```bash
npm run build   # 构建 + pagefind + 生成 dist/_hash
npm run hash    # 只重新生成 dist/_hash
```

`/_hash` 是纯文本，每行 `文件路径 哈希`，路径以 `/` 开头，按路径排序：

```text
/_astro/Layout.abc123.css 3f2a...
/404.html 7dbf...
/index.html bad7...
```

- 哈希是文件内容 SHA-256 的前 16 位，仅用于判断“哪些文件变了”，不用于校验内容。
- `_hash` 本身不列入清单（无法自引用）；`sw.js` 会列入清单，但 SW 不会预缓存自己。
- 部署平台必须能直接访问 `/_hash`。GitHub Pages 的 Actions 产物部署可以；如果使用 Jekyll 源目录部署，
  `_` 开头的文件可能被排除，需要改用产物部署或重命名清单地址。
- `public/_headers` 为 Netlify 等平台声明 `/_hash` 与 `/sw.js` 不缓存；GitHub Pages 会忽略该文件，
  但注册时使用了 `updateViaCache: 'none'`，浏览器仍会绕过 HTTP 缓存检查 SW 更新。

## 缓存策略

| 请求                                   | 策略                                                                                          |
| -------------------------------------- | --------------------------------------------------------------------------------------------- |
| 同源、在 `/_hash` 清单内               | **Cache First**：先读 `mobell-sw-assets-v1`，未命中则网络并写入                               |
| 同源、不在清单内                       | **Cache First**（运行时缓存 `mobell-sw-runtime-v1`），未命中则网络并写入                      |
| 同源 HTML 的 403/404 等异常            | 若清单中有 `/{status}.html`，返回该页面内容（保留原状态码）；否则返回原响应；错误响应永不缓存 |
| 跨源 `mode: no-cors` 的图片            | 缓存到 `mobell-sw-images-v1`，默认 TTL 600 秒；过期后后台重新获取，网络失败时回退旧缓存       |
| 其他跨源请求                           | 不拦截，直接走网络                                                                            |
| 非 GET、带 `Range`、`/sw.js`、`/_hash` | 不拦截                                                                                        |

说明：

- 清单内资源按清单路径（如 `/aboutme/index.html`）缓存；`/aboutme`、`/aboutme/` 会映射到该路径。
- 非清单内容一旦缓存，默认一直命中，直到调用 `refresh()` 或清空缓存。这是“Cache First”的直接结果。
- 跨源 opaque 响应**原样存储**：不添加头、不读取 body、不重新构造 `Response`。TTL 记录另存在 IndexedDB。
- 旧版本删除的静态资源不会立刻从缓存移除，避免已经打开的旧页面 404；需要时用 `clearCache()` 清理。

## 更新检测与预下载

- 安装时请求一次 `/_hash`；激活时检查清单覆盖情况，把缺失项加入预下载队列。
- 页面每次加载会通过 `SW_KICK` 唤醒 SW；导航时按 `navigationCheckThrottle` 限流检查清单。
- SW 存活期间每 `checkInterval`（默认 5 分钟）检查一次；支持 `periodicSync` 的浏览器还会注册后台同步。
- 清单变化后比较哈希，只预下载新增/变化的文件；完成后向页面广播 `SW_MANIFEST_UPDATED`。
- 预下载默认并发 3，并使用 `priority: 'low'`。
- **前台优先**：任何前台请求都会把预下载暂停 `quietMs`（默认 1.2 秒）；页面导航会立即中止正在进行的预下载，
  被中止的项会重新排队，等前台安静后继续。

## 页面 API

`window.__SW__`（别名 `window.__SW_DEBUG__`）在所有页面可用：

```js
// 状态、清单、缓存数量、配置、统计、存储占用
await window.__SW__.status();

// 立即检查 /_hash；changed 表示清单发生变化
await window.__SW__.syncManifest();

// 预下载全部清单项，或只预下载指定清单 URL
await window.__SW__.prefetch();
await window.__SW__.prefetch(['/index.html', '/aboutme/']);

// 强制刷新非清单内容（也可以刷新清单内容，但清单哈希要等下次同步）
await window.__SW__.refresh('/some/page');
await window.__SW__.refresh(['/a', '/b']);

// 刷新当前页面缓存并 reload（默认 reload；传 { reload: false } 只刷新不跳转）
await window.__SW__.refreshPage();

// 清理缓存，scope: all | assets | runtime | images
await window.__SW__.clearCache('runtime');

// 运行时修改配置（会持久化到 IndexedDB）
await window.__SW__.configure({
  sameOrigin: { ignoreSearch: true },
  crossOriginImages: { ttl: 10 * 60 * 1000 },
  debug: true,
});
await window.__SW__.resetConfig();

// 查看 SW 环形日志
await window.__SW__.logs();
```

### 强制刷新与 `_t`

`refresh(url)` 默认使用 `forceRefresh.strategy: 'query'`：向网络请求注入 `?_t=<nonce>`，但**缓存键仍是页面传入的原始
URL**，`_t` 不会进入缓存键。这可以绕过浏览器/CDN 对旧 URL 的缓存；服务端必须忽略 `_t`（静态站点默认忽略）。

如果目标 URL 不能带未知查询参数，可切换策略：

```js
await window.__SW__.configure({ forceRefresh: { strategy: 'reload' } });
```

- `query`：注入 `_t`（默认，同源）。
- `reload`：使用 `Request.cache = 'reload'`，不改 URL。
- 跨源 URL 默认使用 `reload`，避免破坏签名 URL。

对 opaque 响应同样只按原始 URL 存储，响应本身不被修改。

### 原始 postMessage 协议

页面也可以直接发消息（需要 `MessageChannel` 接收回复）：

```js
const channel = new MessageChannel();
channel.port1.onmessage = (event) => console.log(event.data);
navigator.serviceWorker.controller.postMessage({ type: 'SW_REFRESH', urls: ['/some/page'], strategy: 'query' }, [
  channel.port2,
]);
```

请求类型：`SW_STATUS`、`SW_SYNC`、`SW_PREFETCH`、`SW_REFRESH`、`SW_CONFIG`、`SW_RESET_CONFIG`、`SW_CLEAR`、
`SW_LOGS`、`SW_KICK`、`SW_PING`、`SW_CLAIM_CLIENTS`。

回复类型为 `${type}_RESULT`，格式 `{ type, id, ok, ... }`。广播消息：`SW_MANIFEST_UPDATED`、`SW_ACTIVATED`。

## 配置

默认值在 `public/sw.js` 的 `DEFAULT_CONFIG`，可通过 `SW_CONFIG` / `configure()` 覆盖，或注册时用查询参数：

| 配置                               | 默认值       | 说明                                  |
| ---------------------------------- | ------------ | ------------------------------------- |
| `debug`                            | `false`      | 输出详细日志并保留调试日志            |
| `manifest.url`                     | `_hash`      | 相对 SW scope 解析，根部署即 `/_hash` |
| `manifest.checkInterval`           | `300000`     | 定时检查间隔（最小 10s）              |
| `manifest.checkOnNavigation`       | `true`       | 导航时也检查（受下面限流）            |
| `manifest.navigationCheckThrottle` | `60000`      | 导航检查限流                          |
| `manifest.timeout`                 | `15000`      | 清单请求超时                          |
| `manifest.cacheBust`               | `true`       | 清单请求加 `_t` 绕过 CDN              |
| `prefetch.enabled`                 | `true`       | 是否允许预下载                        |
| `prefetch.concurrency`             | `3`          | 预下载并发（1–8）                     |
| `prefetch.quietMs`                 | `1200`       | 前台请求后暂停预下载的时长            |
| `prefetch.abortOnNavigation`       | `true`       | 导航时中止进行中的预下载              |
| `prefetch.priority`                | `low`        | 预下载 fetch priority                 |
| `prefetch.keepAliveMs`             | `60000`      | 单次事件为预下载保活的上限            |
| `prefetch.maxRetries`              | `2`          | 单项失败重试次数                      |
| `sameOrigin.ignoreSearch`          | `false`      | 同源缓存键是否忽略 `?query`           |
| `crossOriginImages.enabled`        | `true`       | 是否缓存跨源 no-cors 图片             |
| `crossOriginImages.ttl`            | `600000`     | 图片 TTL（600 秒）                    |
| `crossOriginImages.maxEntries`     | `1000`       | 图片 TTL 元数据上限                   |
| `errorPages.enabled`               | `true`       | 是否启用异常页面替换                  |
| `errorPages.statuses`              | `[403, 404]` | 需要处理的 HTML 状态码                |
| `errorPages.cacheControl`          | `no-store`   | 替换响应上的 Cache-Control            |
| `forceRefresh.strategy`            | `query`      | `query` / `reload` / `auto`           |
| `forceRefresh.param`               | `_t`         | 注入的查询参数名                      |
| `forceRefresh.timeout`             | `30000`      | 强制刷新超时                          |

### `ignoreSearch`

开启后，同源请求的缓存键会去掉查询串：

```js
await window.__SW__.configure({ sameOrigin: { ignoreSearch: true } });
```

这会让 `/list?page=1` 和 `/list?page=2` 共用一个缓存键。只适合查询串不影响页面内容的站点；默认关闭。

## 调试

### 调试面板

打开任意页面并加上 `?sw_debug=1`：

```text
https://example.com/?sw_debug=1
```

右下角会出现面板，可查看状态、清单、缓存数量、预下载队列、日志，并执行检查更新、预下载、刷新当前页、
清空运行时缓存、切换 `ignoreSearch`。面板状态保存在 sessionStorage，站内跳转后仍保留。

### URL 调试参数

| 参数                  | 作用                                                  |
| --------------------- | ----------------------------------------------------- |
| `?sw_debug=1`         | 打开面板、启用 SW 详细日志；开发服务器下也允许注册 SW |
| `?sw_ignore_search=1` | 打开 `sameOrigin.ignoreSearch`                        |
| `?sw_image_ttl=8000`  | 设置图片 TTL（毫秒）                                  |
| `?sw_strategy=reload` | 强制刷新策略（`query`/`reload`/`auto`）               |
| `?sw_prefetch=0`      | 关闭预下载                                            |

### 控制台

```js
await window.__SW__.configure({ debug: true });
await window.__SW__.logs();
await window.__SW__.status();
```

SW 日志保留最近 400 条；`debug: false` 时只保留 info/warn/error。

### 本地预览与端到端测试

```bash
npm run build
npm run serve:dist     # http://127.0.0.1:4321
node scripts/sw-e2e.mjs
```

`sw-e2e.mjs` 会启动两个静态服务器（4321 / 4322，后者用于跨源图片），用无头 Chrome 验证：
清单同步、预下载、Cache First、强制刷新且缓存键不变、404 状态页、错误不缓存、`ignoreSearch`、
跨源图片 TTL 与 opaque 响应原样存储。

## 注意事项

- Service Worker 只在 HTTPS 或 `localhost` 下生效。
- 默认假设站点部署在根路径 `/`。如果部署到子路径，需要同时调整 SW 的 `scope`、`manifest.url` 和清单路径前缀。
- “同源非清单内容 Cache First”意味着内容会一直使用缓存，直到调用 `refresh()` / `clearCache()`；这是有意设计。
- 异常页替换只处理 `text/html` 且请求接受 HTML 的响应；图片等请求返回的 HTML 错误不会替换。
- 替换后的响应保留原始状态码（例如 404），便于 SEO 和监控；只替换 body/headers 中的内容类型相关字段。
- 清单中不存在的 `/{status}.html` 不会触发替换，也不会缓存原错误响应。
- 预下载全部资源会占用存储配额；`status().storage` 可查看用量，`clearCache('all')` 可重置（同时清空清单）。
