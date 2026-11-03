# 访问量统计

站点是纯静态的（GitHub Pages），因此访问量使用 [Vercount](https://www.vercount.one/) 的公开
CORS/JSON 计数接口，不增加后端、数据库或构建步骤。

## 显示位置

| 位置         | 文件                                   | 数据                     |
| ------------ | -------------------------------------- | ------------------------ |
| 页脚版权行   | `src/components/widgets/Footer.astro`  | 本站总访问量 `site_pv`   |
| 博客文章头部 | `src/components/blog/SinglePost.astro` | 当前文章阅读量 `page_pv` |

页面上的占位元素统一使用：

```html
<span data-view-count="site">—</span> <span data-view-count="page">—</span>
```

`src/components/common/PageViewCounter.astro` 会在 `astro:page-load`（包括 View Transitions 的站内跳转）后
更新这些元素。它通过 `fetch` 调用 Vercount 的 `/api/v2/log` 接口，因此不需要加载第三方脚本，也能在站内跳转后
重新统计文章阅读量。

## 性能与降级

- 计数逻辑是 Astro 打包的小模块，不阻塞首屏。
- 网络请求放在 `requestIdleCallback`（不支持时 `setTimeout` 900ms）之后，且每个页面只发一个请求。
- 请求 5 秒超时；失败、被拦截、离线时保留 `—` 占位，不影响页面功能和布局。
- 数字使用 `tabular-nums`，加载后宽度稳定；页脚与文章头部的颜色、字号、图标沿用现有样式。
- 同一页面 2 秒内不会重复请求，避免 View Transitions 的事件重复导致多计数。
- 页面在站内跳转时，如果上一个页面的请求还没结束，会记为待刷新，结束后再统计新页面。

## 隐私说明

Vercount 是第三方服务，会收到当前页面的 URL、IP 和 User-Agent；请求使用 `credentials: 'omit'`，不携带站点
Cookie，也不做 UV 统计（只统计 PV）。若站点需要严格隐私或完全自托管，可以替换
`PageViewCounter.astro` 内的 `requestCounts()`，把接口换成自己的 Cloudflare Worker / GoatCounter 等；
页面上的 `data-view-count` 标记和样式不需要改。

## 本地预览

Vercount 对 `localhost` / `127.0.0.1` 也会返回计数。若本地网络无法访问该域名，占位符会保持 `—`，
这是预期行为；部署到线上后即可显示。注意 Vercount 的 `localhost` 数据是全站共享的测试池，本地看到的
总数没有参考价值，线上按域名分别统计。
