#!/usr/bin/env pwsh
<#
.SYNOPSIS
    构建并打包 MobellSite Windows x64 免安装版。

.DESCRIPTION
    1. 把冻结的站点快照 dist/ 全量复制到 apps/windows/site/
    2. 从品牌目录复制图标到 apps/windows/assets/
    3. 安装构建依赖（可跳过）并准备 Electron 运行时 zip 缓存
    4. 用 @electron/packager 生成 apps/windows/out/MobellSite-win32-x64/
    5. 压缩为 releases/windows/MobellSite-1.0.0-windows-x64.zip（根目录 MobellSite/）
    6. 生成 releases/windows/SHA256SUMS.txt

    脚本可重复执行；已存在的 node_modules / Electron 缓存会复用。

.PARAMETER SkipInstall
    跳过 npm install（依赖已安装时使用）。

.PARAMETER NoZip
    只打包到 apps/windows/out/，不生成 zip。

.PARAMETER SkipSiteCopy
    跳过从 dist/ 复制站点快照（site/ 已存在时使用）。

.PARAMETER Clean
    构建前清理 out/、site/、assets/ 与 site-meta.json（保留 node_modules 与 Electron 缓存）。

.PARAMETER ElectronVersion
    Electron 版本，默认 45.2.2。

.EXAMPLE
    pwsh -File apps/windows/build.ps1

.EXAMPLE
    pwsh -File apps/windows/build.ps1 -SkipInstall -NoZip
#>
[CmdletBinding()]
param(
    [switch]$SkipInstall,
    [switch]$NoZip,
    [switch]$SkipSiteCopy,
    [switch]$Clean,
    [string]$ElectronVersion = '45.2.2'
)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$AppDir = $PSScriptRoot
$RepoRoot = (Resolve-Path (Join-Path $AppDir '..\..')).Path
$DistDir = Join-Path $RepoRoot 'dist'
$SiteDir = Join-Path $AppDir 'site'
$AssetsDir = Join-Path $AppDir 'assets'
$CacheDir = Join-Path $AppDir '.electron-cache'
$OutDir = Join-Path $AppDir 'out'
$ReleasesDir = Join-Path $RepoRoot 'releases\windows'
$BrandingDir = Join-Path $RepoRoot 'apps\shared\branding'
$AppVersion = '1.0.0'
$ProductName = 'MobellSite'
$PackageDirName = "$ProductName-win32-x64"
$ZipName = "$ProductName-$AppVersion-windows-x64.zip"
$ElectronZipName = "electron-v$ElectronVersion-win32-x64.zip"
$ElectronZip = Join-Path $CacheDir $ElectronZipName
$IconIco = Join-Path $BrandingDir 'icon.ico'
$Icon256 = Join-Path $BrandingDir 'icon-256.png'
$Icon192 = Join-Path $BrandingDir 'icon-192.png'
$PackagerBin = Join-Path $AppDir 'node_modules\@electron\packager\bin\electron-packager.mjs'
$TarExe = Join-Path $env:SystemRoot 'System32\tar.exe'

$StartedAt = Get-Date

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Message)
    Write-Host "    $Message"
}

function Assert-Condition {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) {
        throw "断言失败：$Message"
    }
}

function Write-Utf8NoBom {
    param([string]$Path, [string]$Content)
    [System.IO.File]::WriteAllText($Path, $Content, (New-Object System.Text.UTF8Encoding($false)))
}

function Format-Size {
    param([int64]$Bytes)
    if ($Bytes -ge 1GB) { return ('{0:N2} GB' -f ($Bytes / 1GB)) }
    if ($Bytes -ge 1MB) { return ('{0:N1} MB' -f ($Bytes / 1MB)) }
    return ('{0:N0} KB' -f ($Bytes / 1KB))
}

Write-Host "MobellSite Windows 构建" -ForegroundColor Green
Write-Info "仓库根目录：$RepoRoot"
Write-Info "应用目录：$AppDir"
Write-Info "Electron 版本：$ElectronVersion（$ElectronZipName）"
Write-Info "开始时间：$($StartedAt.ToString('yyyy-MM-dd HH:mm:ss'))"

# ---------------------------------------------------------------- 环境检查
Write-Step '检查构建环境'
$nodeVersion = (& node -v).Trim()
$npmVersion = (& npm -v).Trim()
Assert-Condition ($LASTEXITCODE -eq 0) '未找到 Node.js（node 不在 PATH 中）'
$nodeMajor = [int](($nodeVersion -replace '^v', '') -split '\.')[0]
Assert-Condition ($nodeMajor -ge 20) "Node.js 版本过低：$nodeVersion（需要 >= 20）"
Write-Info "Node.js $nodeVersion / npm $npmVersion"
Assert-Condition (Test-Path $TarExe) "缺少 tar.exe：$TarExe"

if ($Clean) {
    Write-Step '清理旧的构建产物（保留 node_modules 与 .electron-cache）'
    foreach ($target in @($OutDir, $SiteDir, $AssetsDir)) {
        if (Test-Path $target) {
            Remove-Item $target -Recurse -Force
            Write-Info "已删除 $target"
        }
    }
    $metaFile = Join-Path $AppDir 'site-meta.json'
    if (Test-Path $metaFile) { Remove-Item $metaFile -Force }
}

# ---------------------------------------------------------------- 站点快照
if (-not $SkipSiteCopy) {
    Write-Step '复制站点快照 dist/ -> apps/windows/site/'
    Assert-Condition (Test-Path (Join-Path $DistDir 'index.html')) "dist/index.html 不存在，请先由 Lead 生成 dist/（$DistDir）"
    Assert-Condition (Test-Path (Join-Path $DistDir '_hash')) "dist/_hash 不存在，请先由 Lead 生成 dist/"

    New-Item -ItemType Directory -Force -Path $SiteDir | Out-Null
    & robocopy $DistDir $SiteDir /MIR /NFL /NDL /NJH /NJS /NP /R:2 /W:2 | Out-Null
    $robocopyExit = $LASTEXITCODE
    # robocopy 退出码 0–7 均视为成功
    if ($robocopyExit -ge 8) {
        throw "robocopy 复制站点快照失败（exit=$robocopyExit）"
    }
    Write-Info "robocopy 完成（exit=$robocopyExit）"
} else {
    Write-Step '按 -SkipSiteCopy 跳过站点快照复制'
}

Assert-Condition (Test-Path (Join-Path $SiteDir 'index.html')) "站点快照缺少 index.html：$SiteDir"
Assert-Condition (Test-Path (Join-Path $SiteDir '_hash')) "站点快照缺少 _hash：$SiteDir"

Write-Step '统计站点快照并写入 site-meta.json'
$siteFiles = @(Get-ChildItem -Path $SiteDir -Recurse -File)
$siteBytes = [int64](($siteFiles | Measure-Object -Property Length -Sum).Sum)
$hashEntries = @(
    Get-Content -Path (Join-Path $SiteDir '_hash') -Encoding UTF8 |
        Where-Object { $_.Trim().Length -gt 0 }
).Count
$siteMeta = [ordered]@{
    generatedAt   = (Get-Date).ToUniversalTime().ToString('o')
    files         = $siteFiles.Count
    bytes         = $siteBytes
    hashEntries   = [int]$hashEntries
    appVersion    = $AppVersion
    electronVersion = $ElectronVersion
}
Write-Utf8NoBom -Path (Join-Path $AppDir 'site-meta.json') -Content ($siteMeta | ConvertTo-Json)
Write-Info ("站点快照：{0} 个文件，{1}，_hash 条目 {2}" -f $siteFiles.Count, (Format-Size $siteBytes), $hashEntries)

# ---------------------------------------------------------------- 品牌图标
Write-Step '准备品牌图标 assets/'
Assert-Condition (Test-Path $IconIco) "缺少品牌图标：$IconIco"
Assert-Condition (Test-Path $Icon256) "缺少品牌图标：$Icon256"
New-Item -ItemType Directory -Force -Path $AssetsDir | Out-Null
Copy-Item -Path $IconIco -Destination (Join-Path $AssetsDir 'icon.ico') -Force
Copy-Item -Path $Icon256 -Destination (Join-Path $AssetsDir 'tray.png') -Force
if (Test-Path $Icon192) {
    Copy-Item -Path $Icon192 -Destination (Join-Path $AssetsDir 'icon-192.png') -Force
} else {
    Copy-Item -Path $Icon256 -Destination (Join-Path $AssetsDir 'icon-192.png') -Force
}
Write-Info 'icon.ico / tray.png / icon-192.png 已就绪'

# ---------------------------------------------------------------- 依赖
Write-Step '检查构建依赖（npm）'
if ($SkipInstall) {
    Write-Info '按 -SkipInstall 跳过 npm install'
} elseif (Test-Path $PackagerBin) {
    Write-Info '依赖已安装，跳过 npm install（需要重装时删除 apps/windows/node_modules 后重试）'
} else {
    $env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
    $env:ELECTRON_SKIP_BINARY_DOWNLOAD = '1'
    Push-Location $AppDir
    try {
        Write-Info '执行 npm install（registry.npmjs.org）…'
        & npm install --no-audit --no-fund --registry=https://registry.npmjs.org/
        if ($LASTEXITCODE -ne 0) {
            throw "npm install 失败（exit=$LASTEXITCODE）"
        }
    } finally {
        Pop-Location
    }
}
Assert-Condition (Test-Path $PackagerBin) "未找到 electron-packager：$PackagerBin（请先运行 npm install）"

# ---------------------------------------------------------------- Electron 运行时
Write-Step '准备 Electron 运行时 zip 缓存'
New-Item -ItemType Directory -Force -Path $CacheDir | Out-Null
if (-not (Test-Path $ElectronZip) -or (Get-Item $ElectronZip).Length -lt 50MB) {
    if (Test-Path $ElectronZip) { Remove-Item $ElectronZip -Force }
    $downloadUrls = @(
        "https://npmmirror.com/mirrors/electron/$ElectronVersion/$ElectronZipName",
        "https://registry.npmmirror.com/-/binary/electron/$ElectronVersion/$ElectronZipName"
    )
    $downloaded = $false
    foreach ($url in $downloadUrls) {
        Write-Info "下载 $url"
        & curl.exe -L --fail --retry 3 --connect-timeout 30 --max-time 1200 -o $ElectronZip $url
        if ($LASTEXITCODE -eq 0 -and (Test-Path $ElectronZip) -and (Get-Item $ElectronZip).Length -gt 50MB) {
            $downloaded = $true
            break
        }
        Write-Warning "下载失败（exit=$LASTEXITCODE）：$url"
    }
    Assert-Condition $downloaded "无法下载 Electron $ElectronVersion 运行时，请手动放置 $ElectronZip"
}
Write-Info ("Electron 运行时：{0}（{1}）" -f $ElectronZip, (Format-Size (Get-Item $ElectronZip).Length))

# ---------------------------------------------------------------- 打包
Write-Step "使用 @electron/packager 打包（$ProductName $AppVersion / win32-x64）"
if (Test-Path $OutDir) {
    Remove-Item $OutDir -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$ignoreRegex = '^/(node_modules|out|\.electron-cache|tests|build\.ps1|build-run.*\.log|package-lock\.json|README\.txt|\.git)'
Push-Location $AppDir
try {
    & node $PackagerBin $AppDir $ProductName `
        --platform=win32 `
        --arch=x64 `
        --electron-version=$ElectronVersion `
        --electron-zip-dir=$CacheDir `
        --icon=$IconIco `
        --out=$OutDir `
        --overwrite `
        --app-version=$AppVersion `
        --no-asar `
        --ignore=$ignoreRegex
    if ($LASTEXITCODE -ne 0) {
        throw "electron-packager 失败（exit=$LASTEXITCODE）"
    }
} finally {
    Pop-Location
}

$PackagedDir = Join-Path $OutDir $PackageDirName
$ExePath = Join-Path $PackagedDir "$ProductName.exe"
$AppResources = Join-Path $PackagedDir 'resources\app'
$SiteInApp = Join-Path $AppResources 'site'

Write-Step '校验打包产物'
Assert-Condition (Test-Path $ExePath) "打包产物缺少 $ProductName.exe：$ExePath"
Assert-Condition (Test-Path (Join-Path $AppResources 'main.mjs')) "打包产物缺少 resources/app/main.mjs"
Assert-Condition (Test-Path (Join-Path $SiteInApp 'index.html')) "打包产物缺少 resources/app/site/index.html"
Assert-Condition (Test-Path (Join-Path $AppResources 'assets\icon.ico')) "打包产物缺少 assets/icon.ico"
Assert-Condition (Test-Path (Join-Path $AppResources 'assets\tray.png')) "打包产物缺少 assets/tray.png"

$PackagedNodeModules = Join-Path $AppResources 'node_modules'
if (Test-Path $PackagedNodeModules) {
    Write-Warning '打包产物中出现 node_modules，已删除（本应用运行时不依赖第三方包）'
    Remove-Item $PackagedNodeModules -Recurse -Force
}

# README 随包分发：exe 同级 + resources/app 内各一份
Copy-Item -Path (Join-Path $AppDir 'README.txt') -Destination (Join-Path $PackagedDir 'README.txt') -Force
Copy-Item -Path (Join-Path $AppDir 'README.txt') -Destination (Join-Path $AppResources 'README.txt') -Force
Write-Info 'README.txt 已复制'

$packagedBytes = [int64]((Get-ChildItem -Path $PackagedDir -Recurse -File | Measure-Object -Property Length -Sum).Sum)
Write-Info ("打包目录：{0}（{1}）" -f $PackagedDir, (Format-Size $packagedBytes))

if ($NoZip) {
    Write-Step '按 -NoZip 跳过压缩'
    Write-Host "`n构建完成（未压缩）。" -ForegroundColor Green
    Write-Info "产物目录：$PackagedDir"
    return
}

# ---------------------------------------------------------------- 压缩
Write-Step "压缩发布包 $ZipName"
New-Item -ItemType Directory -Force -Path $ReleasesDir | Out-Null
$ZipPath = Join-Path $ReleasesDir $ZipName
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

$StageRoot = Join-Path $OutDir '_stage'
if (Test-Path $StageRoot) { Remove-Item $StageRoot -Recurse -Force }
New-Item -ItemType Directory -Force -Path $StageRoot | Out-Null
$StageApp = Join-Path $StageRoot $ProductName
& robocopy $PackagedDir $StageApp /E /NFL /NDL /NJH /NJS /NP /R:2 /W:2 | Out-Null
$stageRobocopyExit = $LASTEXITCODE
if ($stageRobocopyExit -ge 8) {
    throw "robocopy 准备 zip 根目录失败（exit=$stageRobocopyExit）"
}

try {
    & $TarExe -a -c -f $ZipPath -C $StageRoot $ProductName
    if ($LASTEXITCODE -ne 0) {
        throw "tar 压缩失败（exit=$LASTEXITCODE）"
    }
} finally {
    if (Test-Path $StageRoot) { Remove-Item $StageRoot -Recurse -Force }
}

Assert-Condition (Test-Path $ZipPath) "zip 未生成：$ZipPath"

Write-Step '校验 zip 内容'
$zipEntries = @(& $TarExe -tf $ZipPath)
if ($LASTEXITCODE -ne 0) {
    throw '无法读取 zip 条目列表'
}
$badEntries = @($zipEntries | Where-Object {
    $_ -match '^/' -or $_ -match '^[A-Za-z]:' -or $_ -match '(^|/)node_modules(/|$)'
})
Assert-Condition ($badEntries.Count -eq 0) ("zip 中存在绝对路径或 node_modules 条目：{0}" -f ($badEntries -join ', '))
Assert-Condition ($zipEntries -contains "$ProductName/$ProductName.exe") "zip 根目录缺少 $ProductName/$ProductName.exe"
Assert-Condition ($zipEntries -contains "$ProductName/resources/app/main.mjs") "zip 缺少 resources/app/main.mjs"
Assert-Condition ($zipEntries -contains "$ProductName/resources/app/site/index.html") "zip 缺少 resources/app/site/index.html"
Assert-Condition ($zipEntries -contains "$ProductName/README.txt") "zip 缺少 README.txt"
Write-Info ("zip 条目数：{0}" -f $zipEntries.Count)

# ---------------------------------------------------------------- 校验和
Write-Step '生成 SHA256SUMS.txt'
$zipHash = (Get-FileHash -Path $ZipPath -Algorithm SHA256).Hash.ToLowerInvariant()
$shaSumsPath = Join-Path $ReleasesDir 'SHA256SUMS.txt'
Write-Utf8NoBom -Path $shaSumsPath -Content "$zipHash  $ZipName"
Write-Info "SHA256：$zipHash"

# ---------------------------------------------------------------- 摘要
$zipBytes = (Get-Item $ZipPath).Length
$elapsed = (Get-Date) - $StartedAt
Write-Host "`n构建完成" -ForegroundColor Green
Write-Host "  产物：$ZipPath"
Write-Host ("  大小：{0}（{1:N0} 字节）" -f (Format-Size $zipBytes), $zipBytes)
Write-Host "  SHA256：$zipHash"
Write-Host "  校验和文件：$shaSumsPath"
Write-Host "  打包目录：$PackagedDir"
Write-Host ("  耗时：{0:N1} 秒" -f $elapsed.TotalSeconds)
Write-Host "  站点快照：$($siteFiles.Count) 个文件，$(Format-Size $siteBytes)，_hash 条目 $hashEntries"
