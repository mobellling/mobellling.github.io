# MobellSite 客户端（Windows / Android）构建规格 v1.0.0

> 目标：把 https://mobellling.github.io 完整装进应用；Windows 提供 **免安装 zip 绿色包**，Android 提供 **APK**；应用可接收「网站更新」和「软件更新」提醒。iOS 暂不做。
>
> 本文件是 Windows / Android 两个构建任务的唯一接口契约。除本文件明确允许的目录外，不要修改仓库其它文件（尤其不要改 `src/`、`public/`、`dist/`、`package.json`、lockfile）。

## 1. 产品标识

| 项目                 | 值                                                              |
| -------------------- | --------------------------------------------------------------- |
| 产品名 / 窗口标题    | `MobellSite`                                                    |
| 版本                 | `1.0.0`（Android versionCode = `1`）                            |
| Windows appId        | `com.mobellsite.app`（`app.setAppUserModelId`）                 |
| Android applicationId| `com.mobellsite.app`                                            |
| 站点根               | `https://mobellling.github.io/`（**末尾必须带 /**）             |
| 站点版本清单         | `https://mobellling.github.io/_hash`（纯文本，每次部署变化）    |
| 软件更新清单         | `https://mobellling.github.io/app/latest.json`                  |
| 品牌图标             | `apps/shared/branding/`（见该目录 README）                      |

## 2. 目录 / 写入范围（必须遵守）

| 角色          | 可写目录                                                                 |
| ------------- | ------------------------------------------------------------------------ |
| Windows 构建  | `apps/windows/**`、`scripts/app/windows/**`、`releases/windows/**`       |
| Android 构建  | `apps/android/**`、`scripts/app/android/**`、`releases/android/**`       |
| Lead 独占     | `src/**`、`public/**`、`dist/**`、`docs/apps/**`、`apps/shared/**`、`releases/manifest/**`、`scripts/app/*.py` 等根级共享文件 |

构建过程需要的临时文件一律放在自己目录内（例如 `apps/android/.toolchain/`），不要污染仓库根目录。

## 3. 内置离线快照（把网站装进软件）

- Lead 会在开工前重建站点，`<repo>/dist/` 即冻结快照（当前约 19MB，含 `_hash`、pagefind 搜索索引、全部文章页面与图片）。
- 构建时把 `dist/` 的**全部内容**复制进应用资源：
  - Windows：`apps/windows/site/`（打包后位于安装目录 `resources/app/site/`）
  - Android：`apps/android/app/src/main/assets/www/`（打包进 APK）
- 快照必须原样复制，不要改写 HTML 里的绝对路径（站点是根路径部署，`/_astro/...` 开头的路径必须按站点根解析）。
- 内置快照要能离线完整浏览：首页、文章、分类/标签列表、关于页、搜索页（pagefind）都要可用；跨域图片离线时允许缺失。

## 4. 在线 / 离线行为

1. 启动时**默认加载远程站点** `https://mobellling.github.io/`（相当于把网站搬到窗口里，站点更新会直接看到）。
2. 远程主文档加载失败（网络断开、DNS 失败、超时 20s）时，自动切换到**内置快照**：
   - Windows：进程内启动一个只监听 `127.0.0.1` 的静态文件服务器（Node `http`），从 `site/` 提供文件，加载 `http://127.0.0.1:<随机端口>/`。
   - Android：进程内启动 `ServerSocket` 静态资源服务器（`127.0.0.1` 随机端口），从 APK `assets/www/` 提供文件，加载 `http://127.0.0.1:<随机端口>/`；也可用等价的 `shouldInterceptRequest` 方案，但必须保证绝对路径 `/...` 与 `index.html` 目录映射正确。
   - 进入离线模式后，在页面顶部注入一条醒目的提示条：「离线模式 · 正在显示内置网站快照」+「重新连接」按钮；点击后重新加载远程站点，成功后提示条消失。
3. 远程加载成功时不显示离线提示条。
4. 站内链接（同 host `mobellling.github.io`）在 WebView 内部打开；外部链接（其它 host）用系统浏览器打开（Windows: `shell.openExternal`；Android: `ACTION_VIEW`）。
5. 不允许出现浏览器地址栏 / 标签页；桌面窗口关闭按钮行为见第 7 节。

> 静态服务器安全要求：只绑定 127.0.0.1、随机端口、只读；URL 解码后必须规范化并阻止 `..` 路径穿越；未找到返回 404；目录请求补 `index.html`；至少支持 `.html .css .js .json .svg .png .jpg .jpeg .webp .gif .ico .woff2 .txt .xml .webmanifest .map .wasm` 的 Content-Type。

## 5. 网站更新提醒（核心协议，三端语义必须一致）

### 5.1 检测

```
GET https://mobellling.github.io/_hash?_t=<当前毫秒时间戳>
请求头: Cache-Control: no-cache
超时: 15s（失败静默，重试即可）
成功条件: HTTP 200 且 body 是非空文本
fingerprint = SHA-256(body 原始字节) 的小写 hex
```

- 用 `_hash` 内容哈希判断「网站是否变了」，**不要**依赖 `ETag`/`Last-Modified`（GitHub Pages 缓存行为不稳定）。
- 请求必须加随机 `_t` 参数绕过 CDN 缓存。

### 5.2 持久化状态

| key                     | 含义                                   |
| ----------------------- | -------------------------------------- |
| `siteBaseline`          | 上一次确认的 `_hash` fingerprint        |
| `siteBaselineAt`        | 该 fingerprint 的确认时间（ISO / 毫秒）|
| `siteLastNotified`      | 最近一次已通知的 fingerprint            |
| `siteLastCheckAt`       | 最近一次检查时间                        |

- Windows：存 `app.getPath('userData')/state.json`。
- Android：存 `SharedPreferences`（`mobellsite_state`）。

### 5.3 判定与通知

```
第一次成功拿到 remote fingerprint:
    siteBaseline = remote; siteBaselineAt = now; 不通知   // 避免首次误报
之后每次成功:
    if remote == siteBaseline: 只更新 siteLastCheckAt
    else:
        siteBaseline = remote; siteBaselineAt = now; siteLastCheckAt = now
        if remote != siteLastNotified:
            siteLastNotified = remote
            notifySiteUpdated()
        update in-app banner
```

- `notifySiteUpdated()`：
  - 系统通知标题：`网站已更新`，正文：`MobellSite 有新内容，点击查看最新内容。`
  - 点击通知：聚焦应用并重新加载远程站点（若当前处于离线模式，先切回在线）。
  - 同一次变更只提醒一次（`siteLastNotified` 去重）。
  - 若通知权限不可用/被关闭：只显示应用内提示条，不报错。
- 应用内提示条（页面上方浮动，右上有 ×）：
  - 文案：`网站已更新` + `点击刷新` 按钮；点击刷新 → `location.reload()`（Windows 也可 `win.webContents.reload()`，Android `webView.reload()`）。
  - 提示条只针对站点更新；关闭后本次不再出现，直到下一次 `_hash` 变化。
  - 注入方式可用 `webContents.executeJavaScript` / `evaluateJavascript` 注入一段固定 DOM，务必带最高 `z-index`，且不影响站点原有交互；站点使用 View Transitions（Astro ClientRouter），页面切换后提示条允许消失，但下一次检测到更新仍可再次注入。
- 首次运行/无网络：不弹任何错误；首次成功检查只建立基线。

### 5.4 轮询节奏

| 场景                                   | 间隔   |
| -------------------------------------- | ------ |
| 前台（窗口聚焦 / Activity resumed）     | 60s   |
| 后台（窗口失焦 / Activity paused）     | 300s  |
| 启动时                                 | 立即  |
| 窗口重新聚焦 / Activity onResume       | 立即  |
| 手动「检查网站更新」                    | 立即  |
| Android 后台 JobScheduler（周期任务）   | 15min（系统最小值）|

- 请求超时/失败：不通知、不改变基线，等待下一轮。
- 任意时刻最多 1 个检查请求在飞（防重入）。

### 5.5 手动检查的反馈

- Windows 菜单「检查网站更新」、Android 菜单项：检查完成后给出短反馈（Windows 通知或窗口内 Toast；Android Toast）：
  - 已是最新：`网站已是最新版本`
  - 发现更新：触发上面的更新提醒
  - 检查失败：`检查失败，请检查网络`

## 6. 软件更新提醒（App 自身）

```
GET https://mobellling.github.io/app/latest.json?_t=<ms>   // no-cache, 15s 超时
```

清单结构（最终由 Lead 生成，字段以此为准）：

```json
{
  "schema": 1,
  "updatedAt": "2026-11-04T00:00:00.000Z",
  "siteUrl": "https://mobellling.github.io/",
  "apps": {
    "windows": {
      "version": "1.0.0",
      "url": "https://github.com/mobellling/blog/releases/latest/download/MobellSite-1.0.0-windows-x64.zip",
      "sha256": "…",
      "size": 123456789,
      "notes": "首个版本"
    },
    "android": {
      "version": "1.0.0",
      "url": "https://github.com/mobellling/blog/releases/latest/download/MobellSite-1.0.0-android.apk",
      "sha256": "…",
      "size": 123456789,
      "notes": "首个版本"
    }
  }
}
```

- 比较规则：把版本按 `.` 拆成数字比较（`1.0.10 > 1.0.9`）；远端 > 本机 → 有新版本。
- 通知：标题 `软件有新版本 v1.0.0`，正文 `点击下载更新（在浏览器中打开）`；点击用系统浏览器打开 `url`。
- 频率：启动时一次 + 每 6 小时一次 + 手动「检查软件更新」；同版本只提示一次（持久化 `appLastNotifiedVersion`）。
- 应用内「关于」显示：软件版本、内置网站快照 `_hash` 的文件数与生成时间（若有）、当前站点基线时间。
- 若 `latest.json` 不存在/解析失败：静默忽略。
- 不做应用内自动下载安装（避免签名/权限问题），只引导到浏览器下载。

## 7. Windows 应用（Electron）

- Electron **45.2.2**（npmmirror 镜像可用；GitHub Releases 在本机被墙，安装时设置 `ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`；`@electron/packager` 如要下载二进制，使用本地 zip 目录 `--electron-zip-dir`，不要走 GitHub）。
- 主进程结构（建议）：
  - `main.mjs`：单实例锁、BrowserWindow、菜单、托盘、生命周期、settings/state 读写、IPC/注入。
  - `update-checker.mjs`：第 5、6 节逻辑，纯 Node（`fetch`、`crypto`），可单测。
  - `offline-server.mjs`：第 4 节静态服务器。
  - `package.json`：`main: "main.mjs"`，`electron` 为 devDependency。
- 窗口：`1280x800`，最小 `900x600`，记住位置尺寸；标题 `MobellSite`；`contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`；设置 `webPreferences.partition` 默认即可。
- 关闭窗口 = 隐藏到托盘并提示「已最小化到托盘，可在托盘图标右键退出」（首次弹出气泡/通知）；托盘菜单：显示/隐藏、检查网站更新、检查软件更新、退出。
- 菜单：
  - 文件：刷新页面、重新连接在线站点、退出
  - 更新：检查网站更新、检查软件更新
  - 设置：开机启动（`app.setLoginItemSettings`，默认关）、更新提醒开关（默认开）
  - 帮助：打开网站、关于（版本信息对话框）
- 系统通知：`new Notification({ title, body, icon })`；设置 `app.setAppUserModelId('com.mobellsite.app')`；点击通知聚焦窗口并刷新。
- 托盘图标用 `apps/shared/branding/icon-256.png`（或 Windows .ico 转 PNG），Windows 任务栏/窗口图标用 `icon.ico`。
- 单实例：第二次启动聚焦已有窗口。
- 离线服务器仅在需要时启动；退出时关闭。
- 自检：实现 `MobellSite.exe --selftest`：不显示窗口（或显示后立即隐藏），执行：取 `_hash`、取 `latest.json`、加载远程站点等待 `did-finish-load` 或 15s 超时、打印一行 JSON（含 `ok`, `url`, `title`, `hashStatus`, `updateStatus`, `snapshotFiles`），然后 `app.exit(0)`；失败也打印 JSON 并 `exit(1)`。必须能在无人工交互下完成。
- 另实现 `--test-notify`：启动后 2s 发一条网站更新通知用于人工验证，5s 后退出。
- 打包：
  - 用 `@electron/packager`（`--platform=win32 --arch=x64 --electron-version=45.2.2 --electron-zip-dir=<本地 electron zip 目录> --icon=<icon.ico>`），产物目录 `apps/windows/out/MobellSite-win32-x64/`。
  - 压缩为 `releases/windows/MobellSite-1.0.0-windows-x64.zip`，zip 内根目录必须是 `MobellSite/`，解压后双击 `MobellSite.exe` 即可运行；zip 内附 `README.txt`（中文：解压运行、SmartScreen 提示、卸载即删除目录、更新方式、离线说明）。
  - 生成 `releases/windows/SHA256SUMS.txt`。
- 体积预期：zip < 260MB。
- 构建脚本 `apps/windows/build.ps1` 必须可重复执行（已存在依赖/产物时增量），支持 `-SkipInstall`、`-NoZip` 参数。

## 8. Android 应用

- 纯 Java + 原生 `android.webkit.WebView`，**不引入 AndroidX/Google Play 依赖**，以便使用 aapt2/javac/d8 手工构建（本机无 Gradle/Android Studio）。
- `minSdk 24`、`targetSdk 36`、`compileSdk 36`、`versionCode 1`、`versionName 1.0.0`、`applicationId com.mobellsite.app`、`application android:label="MobellSite"`，支持横竖屏（`configChanges` 处理避免旋转重建）。
- AndroidManifest 权限：`INTERNET`、`ACCESS_NETWORK_STATE`、`POST_NOTIFICATIONS`。不需要前台服务/存储权限。
- 界面：顶部原生小工具条（应用名 + 刷新按钮 + 「⋮」菜单），下方全屏 WebView；状态栏颜色与站点主题协调（深色 `#0f172a` 即可）。菜单项：刷新、重新连接在线站点、检查网站更新、检查软件更新、关于。
- WebView：JS、DOM storage、wide viewport、加载进度、`onBackPressed` 历史回退（到底后双击退出）、文件下载交给系统浏览器（`DownloadManager` 或 ACTION_VIEW URL）。
- 更新检测：Java 实现第 5、6 节；`HttpsURLConnection` + 线程池/Handler；前台 60s；`onPause` 停前台轮询；`onResume` 立即检查；`JobScheduler` 周期 15min 执行后台检查（`JobService`，需 `android.permission.RECEIVE_BOOT_COMPLETED` 可选；只做检查+通知，不拉网页）。
- 通知：`NotificationChannel`（`site_updates` 重要性 DEFAULT、`app_updates`），Android 13+ 首次启动请求 `POST_NOTIFICATIONS`；无权限时静默降级为应用内提示。通知小图标用单色 `ic_stat_update`（白色，见 branding），大图标用 branding `icon-192.png`。点击通知打开/聚焦 `MainActivity` 并触发刷新。
- 离线：第 4 节的进程内服务器；进入/退出离线模式要同步更新顶部工具条状态（例如标题旁显示「离线」）。
- 构建（手工工具链，无 Gradle）：
  - `apps/android/build.ps1` 首次运行自动下载到 `apps/android/.toolchain/`：
    - `https://dl.google.com/android/repository/build-tools_r36_windows.zip`（解压后找到 `aapt2.exe`, `zipalign.exe`, `apksigner.bat`）
    - `https://dl.google.com/android/repository/platform-36-ext19_r01.zip`（找到 `android.jar`）
    - 不要用 sdkmanager（避免额外 150MB 与网络问题）。下载后可校验 zip 是否完整。
  - 流程：`aapt2 compile --dir res -o compiled.zip` → `aapt2 link`（`-I android.jar --manifest ... -A assets/www --java gen --min-sdk-version 24 --target-sdk-version 36`）→ `javac --release 17`（android.jar 为 classpath）→ `d8 --release --min-api 24` → 把 `classes.dex` 打进 APK → `zipalign -f 4` → `apksigner sign` → `apksigner verify`。
  - 签名：keystore `apps/android/keystore/mobellsite.keystore`（若不存在用本机 `keytool` 生成：alias `mobellsite`，`-keyalg RSA -keysize 2048 -validity 36500`，storepass/keypass 写进 `apps/android/keystore/README.md`，**同一密码**）。该 keystore 是未来升级 APK 的唯一凭证，构建后保留在仓库工作区并提醒用户备份；构建脚本不要覆盖已有 keystore。
  - 产物 `releases/android/MobellSite-1.0.0-android.apk`，并生成 `releases/android/SHA256SUMS.txt`。
  - 构建脚本支持 `-SkipDownload`（工具链已就绪时）。
- 验证并记录：`aapt2 dump badging`（包名/版本/权限/label）、`apksigner verify --verbose`、`unzip -l` 确认 `classes.dex`、`assets/www/index.html`、`res/mipmap-xxxhdpi/ic_launcher.png` 存在。
- 体积预期：APK < 30MB。

## 9. 公共约束

- 工作目录 `<repo>` = `D:\my-blog\my-astrowind`。PowerShell 7 可用；Node 24、Java 25（`keytool`/`javac`/`jar` 在 `D:\code\Java\bin`）；无 Gradle、无 Android SDK、无 Visual Studio。
- 不要运行仓库根的 `npm install` / `npm run build`（会动 lockfile/dist）；`dist/` 只读复制。
- 网络：npm registry OK；`github.com` release 下载被墙（用 npmmirror）；`dl.google.com` 可直连；`api.nuget.org` 可访问。
- 所有下载缓存到各自目录，不要重复下载。
- 日志/中间产物放各自目录；交付目录只放最终产物与校验和。
- 代码注释用中文或英文均可；用户可见文案用**简体中文**。
- 完成后在任务里报告：产物绝对路径、大小、SHA256、验证命令与输出摘要、已知限制。

## 10. 验收清单

Windows：

- [ ] `releases/windows/MobellSite-1.0.0-windows-x64.zip` 存在，zip 根目录为 `MobellSite/`，含 `MobellSite.exe` 与 `resources/app/main.mjs`、`resources/app/site/index.html`。
- [ ] 解压到临时目录后 `MobellSite.exe --selftest` 输出合法 JSON，`ok: true`，`hashStatus: 200`。
- [ ] `--test-notify` 能弹出系统通知（或记录通知 API 成功）。
- [ ] zip 大小合理（<260MB），无绝对路径条目，无 node_modules。
- [ ] 代码审查：轮询/首次基线/去重/点击通知刷新/离线回退/关闭到托盘 全部符合第 4–7 节。

Android：

- [ ] `releases/android/MobellSite-1.0.0-android.apk` 存在。
- [ ] `apksigner verify --verbose` 通过（v1/v2/v3 至少 v2）。
- [ ] `aapt2 dump badging` 显示 `package: name='com.mobellsite.app' versionCode='1' versionName='1.0.0'`，label `MobellSite`，`sdkVersion:'24'`，`targetSdkVersion:'36'`。
- [ ] APK 内包含 `assets/www/index.html`、`assets/www/_hash`、`classes.dex`、`res/mipmap-*` 图标。
- [ ] 代码审查：第 4–6 节逻辑、JobScheduler、通知权限降级、离线服务器路径安全。
- [ ] 体积合理（<30MB）。

## 11. 交付

- 最终文件放在 `releases/windows/`、`releases/android/`，不要动其它平台的目录。
- 在 `releases/<platform>/BUILD-REPORT.md` 写：构建命令、时间、工具版本、验证输出、SHA256、产物说明、已知限制。
- 完成后通过任务消息通知 Lead，附上以上证据。
