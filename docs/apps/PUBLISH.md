# MobellSite 发布与更新手册

> 面向站长：网站内容更新、客户端发版、更新清单维护、回滚。
> 客户端行为契约见 [`APP-SPEC.md`](./APP-SPEC.md)。

## 1. 两条更新链路

| 链路         | 触发方式                                   | 客户端行为                                   |
| ------------ | ------------------------------------------ | -------------------------------------------- |
| **网站更新** | 推 `master` → GitHub Actions 部署 Pages     | 轮询 `https://mobellling.github.io/_hash`，发现变化 60s 内弹通知 |
| **软件更新** | 上传新 zip/APK 到 GitHub Releases + 改 `latest.json` | 启动/每 6h 拉 `https://mobellling.github.io/app/latest.json`，版本更高则提示下载 |

网站更新**不需要**重新打包客户端；客户端里的离线快照只在新版客户端发布时更新。

## 2. 发布网站内容

```bash
git add -A && git commit -m "content: ..." && git push origin master
```

- Actions 部署完成后 `dist/_hash` 变化，所有在线客户端会在一个轮询周期内（前台 60s）收到「网站已更新」。
- 部署过程中 `_hash` 可能短暂 404/旧值：客户端失败不改变基线，无需处理。
- 验证线上产物：

```powershell
curl.exe -s https://mobellling.github.io/_hash | Select-Object -First 5
curl.exe -s https://mobellling.github.io/app/latest.json
```

## 3. 发布 Windows / Android 新版本

### 3.1 改版本号

1. `docs/apps/APP-SPEC.md` 第 1 节版本表。
2. `apps/windows/package.json` 的 `version`。
3. `apps/android/AndroidManifest.xml` 的 `versionName`，并把 `versionCode` +1（**每次发版必须递增**）。

### 3.2 重新构建

```powershell
# 仓库根
npm run build
pwsh apps/windows/build.ps1
pwsh apps/android/build.ps1
```

产物：

- `releases/windows/MobellSite-<version>-windows-x64.zip`
- `releases/android/MobellSite-<version>-android.apk`

计算校验和：

```powershell
Get-FileHash releases/windows/MobellSite-1.0.1-windows-x64.zip -Algorithm SHA256
Get-FileHash releases/android/MobellSite-1.0.1-android.apk -Algorithm SHA256
```

### 3.3 上传 GitHub Releases

在 https://github.com/mobellling/blog/releases/new 创建 tag（如 `v1.0.1`），上传 zip 与 apk，填写更新说明。

- 客户端读取的下载地址形如
  `https://github.com/mobellling/blog/releases/latest/download/MobellSite-1.0.1-windows-x64.zip`
  —— **文件名必须与 `latest.json` 里的 `url` 完全一致**（含版本号）。
- `releases/` 已加入 `.gitignore`，安装包不进 git，只作为 Release 附件。

### 3.4 更新 `public/app/latest.json`

```json
{
  "schema": 1,
  "updatedAt": "2026-11-05T00:00:00.000Z",
  "siteUrl": "https://mobellling.github.io/",
  "apps": {
    "windows": {
      "version": "1.0.1",
      "url": "https://github.com/mobellling/blog/releases/latest/download/MobellSite-1.0.1-windows-x64.zip",
      "sha256": "<上一步 Get-FileHash 的小写 hex>",
      "size": 123456789,
      "notes": "更新说明"
    },
    "android": {
      "version": "1.0.1",
      "url": "https://github.com/mobellling/blog/releases/latest/download/MobellSite-1.0.1-android.apk",
      "sha256": "<...>",
      "size": 12345678,
      "notes": "更新说明"
    }
  }
}
```

注意：

- `version` 必须大于已发布版本，客户端按数字段比较（`1.0.10 > 1.0.9`）。
- `size` 单位字节；`sha256` 小写。
- 只发一个平台时，另一个平台的 `version` 保持旧值，不要删除。
- 提交并部署站点后生效（`https://mobellling.github.io/app/latest.json`）。
- 下载页 `https://mobellling.github.io/app/` 会自动读取此文件展示最新版本/大小/校验和。

### 3.5 回滚

- 网站回滚：`git revert` 内容提交并推送；客户端会检测到 `_hash` 变化并提示刷新（提示文案仍是「网站已更新」，属于预期）。
- 软件回滚：把 `latest.json` 的版本改回旧版本即可（客户端只提示更高版本，不会提示降级）。已安装的新版无法自动降级，需手动重新安装旧包。

## 4. 用户侧升级流程

- **Windows**：下载新 zip → 解压覆盖旧目录（或解压到新目录后删除旧目录）→ 双击 `MobellSite.exe`。数据（窗口位置、基线状态）在 `%APPDATA%\MobellSite\`，覆盖安装不会丢失。
- **Android**：下载新 APK → 点击安装覆盖旧版（签名相同才能覆盖升级）。首次安装需允许「未知来源」。
- 签名密钥：`apps/android/keystore/mobellsite.keystore`（alias `mobellsite`，密码见 `apps/android/keystore/README.md`）。**务必备份**，丢失后无法覆盖升级。

## 5. 客户端本地状态

| 平台    | 位置                                             | 内容                                                        |
| ------- | ------------------------------------------------ | ----------------------------------------------------------- |
| Windows | `%APPDATA%\MobellSite\state.json`                | 站点指纹基线/已通知指纹/最近检查时间/窗口尺寸、更新提醒开关 |
| Android | `/data/data/com.mobellsite.app/shared_prefs/mobellsite_state.xml` | 同上（SharedPreferences `mobellsite_state`）                |

清除方式：Windows 删除 `%APPDATA%\MobellSite\`；Android 系统设置里「清除数据」。清除后首次检查只重建基线，不会误报更新。

## 6. 发版检查清单

- [ ] `npm run build` 成功，`dist/_hash` 含本次内容
- [ ] 客户端版本号三处一致（spec / package.json / AndroidManifest）
- [ ] `--selftest` 通过（Windows）
- [ ] `apksigner verify` 通过（Android），签名与上一版相同
- [ ] zip <260MB、APK <30MB
- [ ] Release 已上传 zip + apk，文件名与 latest.json 一致
- [ ] `latest.json` 的 version/sha256/size 已回填并部署
- [ ] `https://mobellling.github.io/app/latest.json` 可访问且 JSON 合法
- [ ] 下载页 `https://mobellling.github.io/app/` 显示新版本
