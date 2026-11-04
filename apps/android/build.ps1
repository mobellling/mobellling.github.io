<#
.SYNOPSIS
    手工构建 MobellSite Android APK（无 Gradle / 无 AndroidX / 无 Google 依赖）。

.DESCRIPTION
    流程：
      1. 首次运行自动下载 build-tools 36 与 platform 36（解压到 apps/android/.toolchain/）
      2. 把 dist/ 全量复制到 app/src/main/assets/www/（内置网站快照）
      3. 生成 res/values/snapshot.xml（快照文件数、生成时间）
      4. aapt2 compile + link（--java 生成 R.java）
      5. javac --release 17 编译（android.jar classpath）
      6. d8 --min-api 24 生成 classes.dex
      7. 组装 APK（classes.dex + 全部 assets 兜底补齐）
      8. zipalign -f 4
      9. apksigner 签名（keystore 不存在则用 keytool 生成，绝不覆盖已有）
     10. 验证：apksigner verify / aapt2 dump badging / zip 内容清单 / SHA256

.PARAMETER SkipDownload
    不下载工具链；工具链缺失时直接报错。

.PARAMETER SkipAssets
    复用已有的 assets/www（默认每次都从 dist/ 重新镜像复制）。

.PARAMETER StorePass
    keystore 密码（首次生成时写入；默认 mobellsite，已写进 keystore/README.md）。

.PARAMETER KeyAlias
    keystore alias（默认 mobellsite）。

.EXAMPLE
    pwsh ./apps/android/build.ps1
    pwsh ./apps/android/build.ps1 -SkipDownload -SkipAssets
#>
# Windows PowerShell 5.1+ / PowerShell 7 均可运行（本仓库环境默认只有 5.1）。
[CmdletBinding()]
param(
    [switch]$SkipDownload,
    [switch]$SkipAssets,
    [string]$StorePass = 'mobellsite',
    [string]$KeyAlias = 'mobellsite'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue

$script:Utf8NoBom = New-Object System.Text.UTF8Encoding($false)

$script:StartedAt = Get-Date
$script:Root = $PSScriptRoot
$script:RepoRoot = Split-Path -Parent (Split-Path -Parent $script:Root)
$script:AppDir = Join-Path $script:Root 'app\src\main'
$script:ResDir = Join-Path $script:AppDir 'res'
$script:JavaSrcDir = Join-Path $script:AppDir 'java'
$script:Manifest = Join-Path $script:AppDir 'AndroidManifest.xml'
$script:AssetsParent = Join-Path $script:AppDir 'assets'
$script:AssetsDir = Join-Path $script:AssetsParent 'www'
$script:DistDir = Join-Path $script:RepoRoot 'dist'
$script:BuildDir = Join-Path $script:Root 'build'
$script:ObjDir = Join-Path $script:BuildDir 'obj'
$script:GenDir = Join-Path $script:BuildDir 'gen'
$script:ClassesDir = Join-Path $script:BuildDir 'classes'
$script:DexDir = Join-Path $script:BuildDir 'dex'
$script:LogDir = Join-Path $script:BuildDir 'logs'
$script:TcDir = Join-Path $script:Root '.toolchain'
$script:DlDir = Join-Path $script:TcDir 'downloads'
$script:KsDir = Join-Path $script:Root 'keystore'
$script:KsFile = Join-Path $script:KsDir 'mobellsite.keystore'
$script:OutDir = Join-Path $script:RepoRoot 'releases\android'
$script:ApkName = 'MobellSite-1.0.0-android.apk'
$script:ApkOut = Join-Path $script:OutDir $script:ApkName

$script:JavaHome = 'D:\code\Java'
if (-not (Test-Path (Join-Path $script:JavaHome 'bin\javac.exe'))) {
    if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME 'bin\javac.exe'))) {
        $script:JavaHome = $env:JAVA_HOME
    } else {
        $javaCmd = Get-Command java -ErrorAction SilentlyContinue
        if ($javaCmd) {
            $script:JavaHome = Split-Path -Parent (Split-Path -Parent $javaCmd.Source)
        }
    }
}
$script:Javac = Join-Path $script:JavaHome 'bin\javac.exe'
$script:Java = Join-Path $script:JavaHome 'bin\java.exe'
$script:Keytool = Join-Path $script:JavaHome 'bin\keytool.exe'

# ------------------------------------------------------------------ 工具函数

function Write-Step {
    param([string]$Message)
    Write-Host ''
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Message)
    Write-Host "    $Message" -ForegroundColor DarkGray
}

# 以 UTF-8（无 BOM）写文本文件，避免 5.1 的 Set-Content -Encoding UTF8 写入 BOM
function Write-TextFile {
    param([string]$Path, [string]$Text)
    [System.IO.File]::WriteAllText($Path, $Text, $script:Utf8NoBom)
}

# 以 UTF-8（无 BOM）写多行文件
function Write-LinesFile {
    param([string]$Path, [object[]]$Lines)
    $text = (@($Lines) | ForEach-Object { [string]$_ }) -join "`r`n"
    [System.IO.File]::WriteAllText($Path, $text + "`r`n", $script:Utf8NoBom)
}

function Stop-Build {
    param([string]$Message)
    Write-Host ''
    Write-Host "BUILD FAILED: $Message" -ForegroundColor Red
    exit 1
}

function Find-ToolchainDir {
    param([string]$ExeName)
    $hit = Get-ChildItem -Path $script:TcDir -Recurse -File -Filter $ExeName -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($hit) {
        return $hit.DirectoryName
    }
    return $null
}

function Find-AndroidJar {
    $hit = Get-ChildItem -Path $script:TcDir -Recurse -File -Filter 'android.jar' -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -like '*platform*' } |
        Select-Object -First 1
    if ($hit) {
        return $hit.FullName
    }
    return $null
}

function Install-ToolchainArchive {
    param([string]$ArchiveName, [string]$Url)
    New-Item -ItemType Directory -Force -Path $script:DlDir | Out-Null
    $zip = Join-Path $script:DlDir $ArchiveName
    if (-not (Test-Path $zip)) {
        Write-Info "downloading $ArchiveName ..."
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        Invoke-WebRequest -Uri $Url -OutFile $zip -UseBasicParsing -TimeoutSec 900
        $sw.Stop()
        $size = (Get-Item $zip).Length / 1MB
        Write-Info ("downloaded {0:N1} MB in {1:N1}s" -f $size, $sw.Elapsed.TotalSeconds)
    } else {
        Write-Info "archive already downloaded: $ArchiveName"
    }
    $dest = Join-Path $script:TcDir ([System.IO.Path]::GetFileNameWithoutExtension($ArchiveName))
    if (-not (Test-Path $dest)) {
        Write-Info "extracting $ArchiveName ..."
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        Expand-Archive -LiteralPath $zip -DestinationPath $dest -Force
        $sw.Stop()
        Write-Info ("extracted in {0:N1}s" -f $sw.Elapsed.TotalSeconds)
    } else {
        Write-Info "archive already extracted: $ArchiveName"
    }
}

# 调用原生 exe/bat：临时把 EAP 调成 Continue，避免 5.1 下 stderr 触发 NativeCommandError 终止。
# 返回 @{ Lines = 输出文本行; Code = 退出码 }，输出不再污染返回值。
function Invoke-Native {
    param([string]$Exe, [string[]]$Arguments)
    $old = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        $lines = @(& $Exe @Arguments 2>&1 | ForEach-Object {
            if ($_ -is [System.Management.Automation.ErrorRecord]) { $_.Exception.Message } else { $_.ToString() }
        })
        return @{ Lines = $lines; Code = $LASTEXITCODE }
    } finally {
        $ErrorActionPreference = $old
    }
}

# 调用原生工具并捕获 stdout+stderr 文本（Invoke-Native 的语义化别名）
function Invoke-NativeCapture {
    param([string]$Exe, [string[]]$Arguments)
    return Invoke-Native -Exe $Exe -Arguments $Arguments
}

function Invoke-External {
    param([string]$Exe, [string[]]$Arguments, [string]$Label)
    $result = Invoke-Native -Exe $Exe -Arguments $Arguments
    foreach ($line in $result.Lines) {
        if ($line.Trim().Length -gt 0) { Write-Host "    $line" }
    }
    if ($result.Code -ne 0) {
        Stop-Build "$Label failed with exit code $($result.Code)"
    }
}

function Add-OrReplaceZipEntry {
    param(
        [System.IO.Compression.ZipArchive]$Zip,
        [string]$EntryName,
        [string]$SourceFile
    )
    $entry = $Zip.GetEntry($EntryName)
    if ($entry) {
        $entry.Delete()
    }
    $newEntry = $Zip.CreateEntry($EntryName, [System.IO.Compression.CompressionLevel]::Optimal)
    $target = $newEntry.Open()
    try {
        $source = [System.IO.File]::OpenRead($SourceFile)
        try {
            $source.CopyTo($target)
        } finally {
            $source.Dispose()
        }
    } finally {
        $target.Dispose()
    }
}

function Get-ZipEntryNames {
    param([string]$Path)
    $names = New-Object System.Collections.Generic.List[string]
    $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
    try {
        foreach ($entry in $zip.Entries) {
            $names.Add($entry.FullName)
        }
    } finally {
        $zip.Dispose()
    }
    return $names
}

# ------------------------------------------------------------------ 0. 环境

Write-Step "MobellSite Android build"
Write-Info "repo: $script:RepoRoot"
Write-Info "java home: $script:JavaHome"
if (-not (Test-Path $script:Javac)) {
    Stop-Build "javac not found at $script:Javac (set JAVA_HOME or install JDK 17+)"
}
$env:JAVA_HOME = $script:JavaHome
$env:PATH = (Join-Path $script:JavaHome 'bin') + ';' + $env:PATH

foreach ($dir in @($script:BuildDir, $script:ObjDir, $script:GenDir, $script:ClassesDir,
        $script:DexDir, $script:LogDir, $script:OutDir, $script:KsDir)) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# ------------------------------------------------------------------ 1. 工具链

Write-Step "Toolchain"
$btDir = Find-ToolchainDir -ExeName 'aapt2.exe'
if (-not $btDir) {
    if ($SkipDownload) {
        Stop-Build "toolchain missing under $script:TcDir and -SkipDownload was specified"
    }
    Install-ToolchainArchive -ArchiveName 'build-tools_r36_windows.zip' `
        -Url 'https://dl.google.com/android/repository/build-tools_r36_windows.zip'
    $btDir = Find-ToolchainDir -ExeName 'aapt2.exe'
}
if (-not $btDir) {
    Stop-Build "aapt2.exe not found under $script:TcDir"
}
$androidJar = Find-AndroidJar
if (-not $androidJar) {
    if ($SkipDownload) {
        Stop-Build "android.jar missing under $script:TcDir and -SkipDownload was specified"
    }
    Install-ToolchainArchive -ArchiveName 'platform-36-ext19_r01.zip' `
        -Url 'https://dl.google.com/android/repository/platform-36-ext19_r01.zip'
    $androidJar = Find-AndroidJar
}
if (-not $androidJar) {
    Stop-Build "android.jar not found under $script:TcDir"
}

$aapt2 = Join-Path $btDir 'aapt2.exe'
$zipalign = Join-Path $btDir 'zipalign.exe'
$apksigner = Join-Path $btDir 'apksigner.bat'
$d8 = Join-Path $btDir 'd8.bat'
foreach ($tool in @($aapt2, $zipalign, $apksigner, $d8)) {
    if (-not (Test-Path $tool)) {
        Stop-Build "missing tool: $tool"
    }
}
Write-Info "build-tools: $btDir"
Write-Info "android.jar: $androidJar"

$toolVersions = @()
$toolVersions += "javac: $((Invoke-NativeCapture -Exe $script:Javac -Arguments @('-version')).Lines -join ' ')"
$toolVersions += "aapt2: $((Invoke-NativeCapture -Exe $aapt2 -Arguments @('version')).Lines -join ' ')"
$btRevision = ''
$btProps = Join-Path $btDir 'source.properties'
if (Test-Path $btProps) {
    $line = Get-Content $btProps | Where-Object { $_ -match '^\s*Pkg\.Revision\s*=\s*(.+)$' } | Select-Object -First 1
    if ($line -and $line -match '^\s*Pkg\.Revision\s*=\s*(.+)$') { $btRevision = $Matches[1].Trim() }
}
$toolVersions += "build-tools revision: $btRevision"
$toolVersions += "platform: $(Split-Path -Leaf (Split-Path -Parent $androidJar))"
$toolVersions | ForEach-Object { Write-Info $_ }
Write-LinesFile -Path (Join-Path $script:LogDir 'tool-versions.txt') -Lines $toolVersions

# ------------------------------------------------------------------ 2. 内置站点快照

Write-Step "Assets: site snapshot"
if (-not (Test-Path (Join-Path $script:DistDir 'index.html'))) {
    Stop-Build "dist/index.html not found; build the site first (dist/ is read-only input here)"
}
$reuseAssets = $SkipAssets -and (Test-Path (Join-Path $script:AssetsDir 'index.html'))
if ($reuseAssets) {
    Write-Info "reusing existing assets/www (-SkipAssets)"
} else {
    New-Item -ItemType Directory -Force -Path $script:AssetsDir | Out-Null
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    $robocopyResult = Invoke-Native -Exe 'robocopy' -Arguments @($script:DistDir, $script:AssetsDir, '/MIR', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/R:1', '/W:1')
    $rc = $robocopyResult.Code
    if ($rc -ge 8) {
        Stop-Build "robocopy failed with exit code $rc"
    }
    $sw.Stop()
    Write-Info ("mirrored dist -> assets/www in {0:N1}s (robocopy code {1})" -f $sw.Elapsed.TotalSeconds, $rc)
}
$assetFiles = @(Get-ChildItem -Path $script:AssetsDir -Recurse -File)
$assetCount = $assetFiles.Count
$assetBytes = ($assetFiles | Measure-Object -Property Length -Sum).Sum
Write-Info ("assets/www: {0} files, {1:N2} MB" -f $assetCount, ($assetBytes / 1MB))
if ($assetCount -lt 100) {
    Stop-Build "assets/www looks incomplete ($assetCount files)"
}

$hashFile = Join-Path $script:AssetsDir '_hash'
$snapshotBuilt = if (Test-Path $hashFile) {
    (Get-Item $hashFile).LastWriteTime.ToString('yyyy-MM-dd HH:mm')
} else {
    (Get-Date).ToString('yyyy-MM-dd HH:mm')
}
$snapshotXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="snapshot_files">$assetCount</string>
    <string name="snapshot_built">$snapshotBuilt</string>
</resources>
"@
Write-TextFile -Path (Join-Path $script:ResDir 'values\snapshot.xml') -Text $snapshotXml
Write-Info "snapshot: $assetCount files, built $snapshotBuilt"

# ------------------------------------------------------------------ 3. aapt2 compile / link

Write-Step "aapt2 compile + link"
$resZip = Join-Path $script:ObjDir 'resources.zip'
$baseApk = Join-Path $script:ObjDir 'base-unsigned.apk'
$javaOut = $script:GenDir
if (Test-Path $resZip) { Remove-Item $resZip -Force }
if (Test-Path $baseApk) { Remove-Item $baseApk -Force }
if (Test-Path $javaOut) { Remove-Item $javaOut -Recurse -Force }
New-Item -ItemType Directory -Force -Path $javaOut | Out-Null

Invoke-External -Exe $aapt2 -Label 'aapt2 compile' -Arguments @(
    'compile', '--dir', $script:ResDir, '-o', $resZip
)
if (-not (Test-Path $resZip)) {
    Stop-Build "aapt2 compile produced no output"
}

# build-tools 36 的 aapt2 link 已不接受 --ignore-assets（仅 compile 支持），而且 aapt2 在
# Windows 下打不开中文文件名的 asset（本仓库快照有 images/故事.jpg 等）。因此 aapt2 只负责
# res + manifest，assets/www 由第 6 步用 .NET ZipArchive 原样写入（UTF-8 entry name，保真）。
Invoke-External -Exe $aapt2 -Label 'aapt2 link' -Arguments @(
    'link',
    '-o', $baseApk,
    '-I', $androidJar,
    '--manifest', $script:Manifest,
    '--java', $javaOut,
    '--min-sdk-version', '24',
    '--target-sdk-version', '36',
    $resZip
)
if (-not (Test-Path $baseApk)) {
    Stop-Build "aapt2 link produced no APK"
}
$rJava = Join-Path $javaOut 'com\mobellsite\app\R.java'
if (-not (Test-Path $rJava)) {
    Stop-Build "aapt2 link did not generate R.java ($rJava)"
}
Write-Info ("base apk: {0:N2} MB, R.java generated" -f ((Get-Item $baseApk).Length / 1MB))

# ------------------------------------------------------------------ 4. javac

Write-Step "javac --release 17"
if (Test-Path $script:ClassesDir) { Remove-Item $script:ClassesDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $script:ClassesDir | Out-Null
$sources = @()
$sources += @(Get-ChildItem -Path $script:JavaSrcDir -Recurse -File -Filter '*.java' | ForEach-Object FullName)
$sources += @(Get-ChildItem -Path $javaOut -Recurse -File -Filter '*.java' | ForEach-Object FullName)
Write-Info "sources: $($sources.Count)"

$javacResult = Invoke-Native -Exe $script:Javac -Arguments (@('--release', '17', '-encoding', 'UTF-8', '-nowarn', '-classpath', $androidJar, '-d', $script:ClassesDir) + $sources)
$javacCode = $javacResult.Code
if ($javacCode -ne 0) {
    foreach ($line in $javacResult.Lines) { Write-Host "    $line" }
    Write-Host "javac --release 17 failed (exit $javacCode); retrying with -source/-target 17 (android.jar may be newer than JDK 17 class format)." -ForegroundColor Yellow
    $fallbackResult = Invoke-Native -Exe $script:Javac -Arguments (@('-source', '17', '-target', '17', '-Xlint:-options', '-encoding', 'UTF-8', '-nowarn', '-classpath', $androidJar, '-d', $script:ClassesDir) + $sources)
    foreach ($line in $fallbackResult.Lines) { Write-Host "    $line" }
    if ($fallbackResult.Code -ne 0) {
        Stop-Build "javac failed with exit code $($fallbackResult.Code)"
    }
}
$classCount = @(Get-ChildItem -Path $script:ClassesDir -Recurse -File -Filter '*.class').Count
if ($classCount -lt 5) {
    Stop-Build "javac produced too few classes ($classCount)"
}
Write-Info "classes: $classCount"

# ------------------------------------------------------------------ 5. d8

Write-Step "d8 --release --min-api 24"
if (Test-Path $script:DexDir) { Remove-Item $script:DexDir -Recurse -Force }
New-Item -ItemType Directory -Force -Path $script:DexDir | Out-Null
$classFiles = @(Get-ChildItem -Path $script:ClassesDir -Recurse -File -Filter '*.class' | ForEach-Object FullName)
$d8Result = Invoke-Native -Exe $d8 -Arguments (@('--release', '--min-api', '24', '--lib', $androidJar, '--output', $script:DexDir) + $classFiles)
foreach ($line in $d8Result.Lines) { if ($line.Trim().Length -gt 0) { Write-Host "    $line" } }
if ($d8Result.Code -ne 0) {
    Stop-Build "d8 failed with exit code $($d8Result.Code)"
}
$dexFile = Join-Path $script:DexDir 'classes.dex'
if (-not (Test-Path $dexFile)) {
    Stop-Build "d8 did not produce classes.dex"
}
Write-Info ("classes.dex: {0:N2} MB" -f ((Get-Item $dexFile).Length / 1MB))

# ------------------------------------------------------------------ 6. 组装 APK

Write-Step "Assemble APK"
$unsignedApk = Join-Path $script:ObjDir 'app-unsigned.apk'
if (Test-Path $unsignedApk) { Remove-Item $unsignedApk -Force }

# 6.1 解包 aapt2 产物（res + manifest），加入 classes.dex 与 assets/www，再用 ZipArchive 重新打包。
# 这样避免 aapt2 的 Windows 中文文件名问题，且能精确控制 resources.arsc 必须“不压缩”。
$stage = Join-Path $script:BuildDir 'stage'
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null
[System.IO.Compression.ZipFile]::ExtractToDirectory($baseApk, $stage)
Copy-Item $dexFile (Join-Path $stage 'classes.dex') -Force
New-Item -ItemType Directory -Force -Path (Join-Path $stage 'assets') | Out-Null
Copy-Item -Path $script:AssetsDir -Destination (Join-Path $stage 'assets\www') -Recurse -Force
$stageFiles = @(Get-ChildItem -Path $stage -Recurse -File)

# 6.2 用 JDK 的 ZipOutputStream 打包（scripts/app/android/PackApk.java）：
# resources.arsc 必须 STORED（targetSdk>=30 的安装要求）；.NET ZipArchive 的
# NoCompression 实际仍写 method 8，因此改用 Java 打包器精确控制压缩方法。
$packer = Join-Path $script:RepoRoot 'scripts\app\android\PackApk.java'
if (-not (Test-Path $packer)) {
    Stop-Build "PackApk.java not found: $packer"
}
$packResult = Invoke-Native -Exe $script:Java -Arguments @($packer, $stage, $unsignedApk)
foreach ($line in $packResult.Lines) { if ($line.Trim().Length -gt 0) { Write-Host "    $line" } }
if ($packResult.Code -ne 0) {
    Stop-Build "PackApk failed with exit code $($packResult.Code)"
}
if (-not (Test-Path $unsignedApk)) {
    Stop-Build "PackApk did not produce $unsignedApk"
}
Write-Info "entries: $($stageFiles.Count) (assets/www + res + classes.dex)"
Write-Info ("packed apk: {0:N2} MB" -f ((Get-Item $unsignedApk).Length / 1MB))

# ------------------------------------------------------------------ 7. zipalign

Write-Step "zipalign -f 4"
$alignedApk = Join-Path $script:ObjDir 'app-aligned.apk'
if (Test-Path $alignedApk) { Remove-Item $alignedApk -Force }
Invoke-External -Exe $zipalign -Label 'zipalign' -Arguments @('-f', '4', $unsignedApk, $alignedApk)
$alignResult = Invoke-NativeCapture -Exe $zipalign -Arguments @('-c', '-v', '4', $alignedApk)
$alignCheck = $alignResult.Lines
Write-LinesFile -Path (Join-Path $script:LogDir 'zipalign-check.txt') -Lines $alignCheck
if ($alignResult.Code -ne 0) {
    Stop-Build "zipalign verification failed"
}

# ------------------------------------------------------------------ 8. keystore + 签名

Write-Step "Keystore"
if (Test-Path $script:KsFile) {
    Write-Info "using existing keystore: $script:KsFile (never overwritten)"
} else {
    $dname = 'CN=MobellSite, OU=Android, O=MobellSite, L=Unknown, ST=Unknown, C=CN'
    $keytoolResult = Invoke-Native -Exe $script:Keytool -Arguments @('-genkeypair', '-keystore', $script:KsFile, '-storetype', 'PKCS12', '-alias', $KeyAlias, '-keyalg', 'RSA', '-keysize', '2048', '-validity', '36500', '-storepass', $StorePass, '-keypass', $StorePass, '-dname', $dname, '-noprompt')
    foreach ($line in $keytoolResult.Lines) { if ($line.Trim().Length -gt 0) { Write-Host "    $line" } }
    if ($keytoolResult.Code -ne 0) {
        Stop-Build "keytool failed with exit code $($keytoolResult.Code)"
    }
    $readme = @"
# Android 签名密钥（MobellSite）

| 项 | 值 |
| --- | --- |
| keystore | ``mobellsite.keystore``（PKCS12） |
| alias | ``$KeyAlias`` |
| store password | ``$StorePass`` |
| key password | ``$StorePass`` |
| 算法 | RSA 2048 |
| 有效期 | 36500 天 |

## 用途

仅供本仓库 ``releases/android/`` 下的 APK 签名使用。首次构建时由 ``apps/android/build.ps1`` 自动生成。

## 注意

- **已存在的 keystore 绝不被覆盖**；构建脚本只在文件缺失时生成。
- 请妥善备份：丢失该文件将无法对已发布版本做增量更新（只能换包名重装）。
- 该密码为开发/内部分发用途，不涉及任何线上服务凭据。

生成命令（脚本内自动执行）：

```powershell
keytool -genkeypair -keystore apps/android/keystore/mobellsite.keystore -storetype PKCS12 ``
  -alias $KeyAlias -keyalg RSA -keysize 2048 -validity 36500 ``
  -storepass $StorePass -keypass $StorePass ``
  -dname "CN=MobellSite, OU=Android, O=MobellSite, L=Unknown, ST=Unknown, C=CN" -noprompt
```
"@
    Write-TextFile -Path (Join-Path $script:KsDir 'README.md') -Text $readme
    Write-Info "generated keystore: $script:KsFile"
}

Write-Step "apksigner sign"
if (Test-Path $script:ApkOut) { Remove-Item $script:ApkOut -Force }
$idsig = "$($script:ApkOut).idsig"
if (Test-Path $idsig) { Remove-Item $idsig -Force }
$signResult = Invoke-Native -Exe $apksigner -Arguments @('sign', '--ks', $script:KsFile, '--ks-key-alias', $KeyAlias, '--ks-pass', "pass:$StorePass", '--key-pass', "pass:$StorePass", '--v1-signing-enabled', 'true', '--v2-signing-enabled', 'true', '--v3-signing-enabled', 'true', '--v4-signing-enabled', 'false', '--out', $script:ApkOut, $alignedApk)
foreach ($line in $signResult.Lines) { if ($line.Trim().Length -gt 0) { Write-Host "    $line" } }
if ($signResult.Code -ne 0) {
    Stop-Build "apksigner sign failed with exit code $($signResult.Code)"
}
if (-not (Test-Path $script:ApkOut)) {
    Stop-Build "signed APK not created"
}

# ------------------------------------------------------------------ 9. 验证

Write-Step "Verify"
$verifyLog = Join-Path $script:LogDir 'apksigner-verify.txt'
$verifyResult = Invoke-NativeCapture -Exe $apksigner -Arguments @('verify', '--verbose', '--print-certs', $script:ApkOut)
$verifyOut = $verifyResult.Lines
$verifyCode = $verifyResult.Code
Write-LinesFile -Path $verifyLog -Lines $verifyOut
$verifyOut | ForEach-Object { Write-Host "    $_" }
if ($verifyCode -ne 0) {
    Stop-Build "apksigner verify failed (exit $verifyCode)"
}
if (-not ($verifyOut -match 'Verified using v2 scheme.*true')) {
    Stop-Build "APK is not v2-signed"
}

$badgingLog = Join-Path $script:LogDir 'aapt2-badging.txt'
$badgingResult = Invoke-NativeCapture -Exe $aapt2 -Arguments @('dump', 'badging', $script:ApkOut)
$badgingOut = $badgingResult.Lines
if ($badgingResult.Code -ne 0) {
    Stop-Build "aapt2 dump badging failed"
}
Write-LinesFile -Path $badgingLog -Lines $badgingOut
$badgingOut | ForEach-Object { Write-Host "    $_" }

$listingLog = Join-Path $script:LogDir 'apk-listing.txt'
$entries = @(Get-ZipEntryNames -Path $script:ApkOut)
Write-LinesFile -Path $listingLog -Lines @($entries | Sort-Object)

$required = @(
    'AndroidManifest.xml',
    'classes.dex',
    'resources.arsc',
    'assets/www/index.html',
    'assets/www/_hash',
    'assets/www/app/latest.json'
)
$requiredMissing = @()
foreach ($name in $required) {
    if ($entries -notcontains $name) { $requiredMissing += $name }
}
if ($requiredMissing.Count -gt 0) {
    Stop-Build "APK missing required entries: $($requiredMissing -join ', ')"
}
$launcherEntries = @($entries | Where-Object { $_ -like 'res/mipmap-*hdpi*' -and $_ -like '*ic_launcher*' })
if ($launcherEntries.Count -eq 0) {
    Stop-Build "APK missing launcher icon resources"
}
$assetEntries = @($entries | Where-Object { $_ -like 'assets/www/*' -and -not $_.EndsWith('/') })
Write-Info "assets/www entries in APK: $($assetEntries.Count) (snapshot files: $assetCount)"
if ($assetEntries.Count -ne $assetCount) {
    Write-Host "    WARNING: assets entry count differs from snapshot file count" -ForegroundColor Yellow
}

$apkSize = (Get-Item $script:ApkOut).Length
$apkSizeMb = [math]::Round($apkSize / 1MB, 2)
$sha256 = (Get-FileHash -Path $script:ApkOut -Algorithm SHA256).Hash.ToLower()
Write-LinesFile -Path (Join-Path $script:OutDir 'SHA256SUMS.txt') -Lines @("$sha256  $script:ApkName")

# ------------------------------------------------------------------ 10. 汇总

$elapsed = (Get-Date) - $script:StartedAt
Write-Step "Done"
Write-Host "    APK      : $script:ApkOut" -ForegroundColor Green
Write-Host "    size     : $apkSizeMb MB ($apkSize bytes)" -ForegroundColor Green
Write-Host "    sha256   : $sha256" -ForegroundColor Green
Write-Host "    elapsed  : $([math]::Round($elapsed.TotalSeconds, 1))s" -ForegroundColor Green
if ($apkSizeMb -ge 30) {
    Write-Host "    WARNING: APK exceeds the 30 MB budget (APP-SPEC 11)." -ForegroundColor Yellow
}
Write-Host ''
Write-Host "    logs: $script:LogDir" -ForegroundColor DarkGray
