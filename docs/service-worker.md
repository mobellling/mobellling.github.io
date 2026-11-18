# Service Worker 已停用

本项目已完整退役此前的 Service Worker。现在不再注册缓存 worker，也不再预下载站点资源；`_hash` 仍为原生 app 的更新检查生成，但网站本身不再读取它。页面访问量统计（Vercount）和浏览器普通的 HTTP 缓存不受影响。

## 当前状态

| 项目                                                | 状态                                                   |
| --------------------------------------------------- | ------------------------------------------------------ |
| SW 注册                                             | 已移除；`Layout.astro` 只挂载清理组件                  |
| `/_hash` 清单                                       | 仍由构建生成，供原生 app 更新检查；SW 不再读取或预下载 |
| Cache First                                         | 已移除                                                 |
| 跨源 `no-cors` 图片缓存                             | 已移除                                                 |
| 403/404 状态页替换                                  | 已移除                                                 |
| `postMessage` 强制刷新 / `window.__SW__` / 调试面板 | 已移除                                                 |
| `sameOrigin.ignoreSearch`                           | 已移除                                                 |
| 页面访问量统计                                      | 保留，见 [page-views.md](./page-views.md)              |

## 过渡文件

`public/sw.js` 现在是一个没有 `fetch` 事件监听器的自毁 worker，仅用于清退旧版本：

1. 安装时调用 `skipWaiting()`，尽快接管旧 worker 的激活流程。
2. 激活时删除所有 `mobell-sw-*` Cache Storage 缓存。
3. 删除 IndexedDB 数据库 `mobell-sw`（旧的清单和图片元数据）。
4. 向仍打开的页面广播 `{ type: 'SW_RETIRED' }`。
5. 调用 `self.registration.unregister()` 注销自己。

因为没有 `fetch` 监听器，即使注销失败，它也不会再拦截或改写任何请求。

`src/components/common/RetireServiceWorker.astro` 会在页面加载时做同样的页面侧清理：注销根作用域的旧注册、删除 `mobell-sw-*` 缓存、删除 IndexedDB、清理 `sessionStorage` 里的 `sw-debug`。收到 `SW_RETIRED` 时最多自动刷新一次，避免循环刷新。

## 为什么保留 `/sw.js`

已安装旧 worker 的访客可能仍从旧缓存里拿到旧 HTML。旧页面不会执行新的清理脚本，只有浏览器主动更新 `/sw.js` 后才能把旧 worker 换成自毁版本。因此这个文件需要保留一段时间，直到确认所有回访用户都已完成升级。

`public/_headers` 仍然给 `/sw.js` 设置：

```text
/sw.js
  Cache-Control: no-cache
```

## 为什么保留 `/_hash`

`scripts/gen-hash.mjs` 和 `npm run build` 的 `postbuild` 仍然会生成 `dist/_hash`。这不是网站 SW 的一部分：`apps/windows/update-checker.mjs` 等原生壳仍用它判断站点是否更新。网站本身没有任何代码再读取这个文件，也没有预下载逻辑。若以后不再需要原生 app 的站点更新提醒，可以再删除生成器和 `/_hash` 规则。

## 手动验证

```bash
npm run build
npm run check:astro
```

构建后应满足：

- `dist/_hash` 仍然存在（供原生 app 更新检查）。
- `dist/sw.js` 中不存在 `fetch` 事件监听器。
- 页面不再注册 service worker，控制台没有 `[SW]` 注册日志。
- 已安装旧 worker 的浏览器在刷新后，`navigator.serviceWorker.getRegistrations()` 返回空，`mobell-sw-*` 缓存被删除。

从旧版本升级时，可先在 DevTools → Application → Service Workers 中确认旧 worker 被替换并注销；Cache Storage 和 IndexedDB 中的旧数据也应消失。

## 后续彻底移除

确认旧访客完成过渡后，可以：

1. 删除 `public/sw.js`。
2. 从 `public/_headers` 删除 `/sw.js` 规则。
3. 按需删除 `src/components/common/RetireServiceWorker.astro` 及 `Layout.astro` 中的引用。

删除前请确认线上已经没有旧 worker 的活跃用户，否则旧缓存页面可能继续存在。
