# MobellSite 品牌资源

由 `scripts/app/gen-branding.mjs` + `scripts/app/gen-ico.py` 生成，源图形为站点 logo（`public/images/logo.svg`，Tabler alpine-js 图标，品牌蓝 `#014ecb`）。

## 文件

| 文件                          | 用途                                                              |
| ----------------------------- | ----------------------------------------------------------------- |
| `icon.svg`                    | 矢量源文件（蓝色圆角方块 + 白色 logo）                            |
| `icon-512.png`                | Play Store / 商店图标、关于页大图标                               |
| `icon-192.png` / `icon-128.png` | Android 通知大图标、Windows 托盘备用                             |
| `icon-256.png`                | Windows 托盘图标（Electron Tray 用 PNG）                          |
| `icon-96.png` / `icon-72.png` / `icon-64.png` / `icon-48.png` / `icon-32.png` / `icon-16.png` | Android mipmap 各密度、Windows 多尺寸图标 |
| `icon.ico`                    | Windows 窗口 / exe / 通知图标（多尺寸 16–256）                    |
| `ic-stat-update-*.png`        | Android 通知栏单色小图标（白色透明底），按密度 24/36/48/72/96/192 |

## Windows（Electron）映射

- `@electron/packager --icon apps/shared/branding/icon.ico`
- 托盘：`nativeImage.createFromPath('.../icon-256.png')`
- 通知：`icon: '.../icon-192.png'`

## Android 映射

```
res/mipmap-mdpi/ic_launcher.png       <- icon-48.png
res/mipmap-hdpi/ic_launcher.png       <- icon-72.png
res/mipmap-xhdpi/ic_launcher.png      <- icon-96.png
res/mipmap-xxhdpi/ic_launcher.png     <- icon-144.png (由 icon-192 缩放到 144，或直接用 192)
res/mipmap-xxxhdpi/ic_launcher.png    <- icon-192.png
res/drawable-mdpi/ic_stat_update.png  <- ic-stat-update-24.png
res/drawable-hdpi/ic_stat_update.png  <- ic-stat-update-36.png
res/drawable-xhdpi/ic_stat_update.png <- ic-stat-update-48.png
res/drawable-xxhdpi/ic_stat_update.png<- ic-stat-update-72.png
res/drawable-xxxhdpi/ic_stat_update.png<- ic-stat-update-96.png
```

通知大图标：`res/drawable-nodpi/ic_notification_large.png` <- `icon-192.png`（通知里用 `setLargeIcon`）。

## 重新生成

```bash
node scripts/app/gen-branding.mjs
python scripts/app/gen-ico.py
```

（需要仓库根 `node_modules` 中的 `sharp`，以及 Python `Pillow`。）
