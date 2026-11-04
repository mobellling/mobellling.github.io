# MobellSite 客户端

把 [mobellling.github.io](https://mobellling.github.io) 装进桌面与手机的应用集合。iOS 版本暂未提供。

| 平台    | 产物                                          | 技术栈                              |
| ------- | --------------------------------------------- | ----------------------------------- |
| Windows | `releases/windows/MobellSite-1.0.0-windows-x64.zip`（免安装） | Electron 45 + Node 内置静态服务器   |
| Android | `releases/android/MobellSite-1.0.0-android.apk` | 纯 Java + 原生 WebView，手工工具链  |

## 功能

- **完整网站**：默认在线加载站点，站内导航、搜索（pagefind）、图片全部可用；外链交给系统浏览器。
- **离线快照**：构建时把 `dist/` 全量打进应用，主文档加载失败自动切换内置快照，可离线浏览。
- **网站更新提醒**：定时拉取 `/_hash` 指纹，发现变化弹系统通知 + 应用内提示条（首次基线不误报、同变更只提醒一次）。
- **软件更新提醒**：拉取 `/app/latest.json`，发现新版本引导到浏览器下载。
- 托盘常驻（Windows）、通知渠道（Android）、深色状态栏、返回键处理等原生体验。

## 目录结构

```
apps/
  shared/branding/      # Windows/Android 共用品牌图标（icon.ico、mipmap PNG、通知图标）
  windows/              # Electron 工程 + build.ps1 + 内置 site/ 快照
  android/              # Java 工程 + build.ps1 + assets/www/ 快照 + keystore/
  README.md             # 本文件
docs/apps/
  APP-SPEC.md           # 唯一构建契约（功能/协议/验收）
  PUBLISH.md            # 发布与更新操作手册
releases/
  windows/              # zip + SHA256SUMS.txt + BUILD-REPORT.md
  android/              # apk + SHA256SUMS.txt + BUILD-REPORT.md
```

`dist/`（站点构建产物）在构建前由仓库根 `npm run build` 生成；两个客户端的构建脚本只**读取**它。

## 构建

前置：Node 24 + npm、PowerShell 7、Java 25（Android）、Python + Pillow（仅重新生成图标时需要）。

```powershell
# 1. 站点快照（在仓库根执行）
npm run build

# 2. Windows 免安装包
pwsh apps/windows/build.ps1            # 依赖安装 + electron 打包 + zip + sha256
pwsh apps/windows/build.ps1 -SkipInstall -NoZip   # 只验证/复用已有产物

# 3. Android APK（首次自动下载 build-tools 36 / platform 36 到 apps/android/.toolchain/）
pwsh apps/android/build.ps1
pwsh apps/android/build.ps1 -SkipDownload
```

产物在 `releases/<platform>/`，具体命令、工具版本与验证输出见各目录的 `BUILD-REPORT.md`。发布流程见 [`docs/apps/PUBLISH.md`](../docs/apps/PUBLISH.md)。

## 版本与更新

- 客户端版本号写在 `docs/apps/APP-SPEC.md`、`apps/windows/package.json`、`apps/android/AndroidManifest.xml`（`versionCode` 递增）。
- 发布新版本：上传 zip/APK 到 GitHub Releases → 回填 `public/app/latest.json` 的 version/url/sha256/size → 部署站点。
- 站点内容更新无需重新打包客户端，客户端会自动发现 `_hash` 变化并提醒；离线快照随客户端新版本更新。

## Android 签名

`apps/android/keystore/mobellsite.keystore` 是 APK 升级的唯一凭证（alias `mobellsite`，密码见同目录 `README.md`）。**请自行备份该文件与密码**，丢失后已安装用户无法升级到新 APK，只能卸载重装。
