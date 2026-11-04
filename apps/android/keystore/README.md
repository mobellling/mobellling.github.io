# Android 签名密钥（MobellSite）

| 项 | 值 |
| --- | --- |
| keystore | `mobellsite.keystore`（PKCS12） |
| alias | `mobellsite` |
| store password | `mobellsite` |
| key password | `mobellsite` |
| 算法 | RSA 2048 |
| 有效期 | 36500 天 |

## 用途

仅供本仓库 `releases/android/` 下的 APK 签名使用。首次构建时由 `apps/android/build.ps1` 自动生成。

## 注意

- **已存在的 keystore 绝不被覆盖**；构建脚本只在文件缺失时生成。
- 请妥善备份：丢失该文件将无法对已发布版本做增量更新（只能换包名重装）。
- 该密码为开发/内部分发用途，不涉及任何线上服务凭据。

生成命令（脚本内自动执行）：

`powershell
keytool -genkeypair -keystore apps/android/keystore/mobellsite.keystore -storetype PKCS12 `
  -alias mobellsite -keyalg RSA -keysize 2048 -validity 36500 `
  -storepass mobellsite -keypass mobellsite `
  -dname "CN=MobellSite, OU=Android, O=MobellSite, L=Unknown, ST=Unknown, C=CN" -noprompt
`