
<#
[역할 — 설계 14 §2·§3·§4·§7] 폐쇄망 반입 패키지를 소스 기준으로 만든다.

  A. 문서        docs/interfaces, docs/design, db/oracle, api/examples, README, 변경 이력
  B. Server      zero-rule-server — 공통 베이스라인(업스트림 56bb0c5 = 커밋 0294d1e) 대비 추가·수정된 파일만 (git diff)
  C. Web         zero-rule-web    — sample 베이스라인(커밋 f66e8ed) 대비 추가·수정된 파일만 (git diff)
  D. WPF         popup-frameWork  — 소스만 (bin/obj/publish/*.exe/*.dll/*.pdb 제외)
  E. 개발 의존   offline-packages/nuget, offline-sdk, global.json, NuGet.config 은 별도 묶음(소스와 분리 — §7 E)

[추가 이유] 폐쇄망에는 zero-rule-server/zero-rule-web 전체가 이미 있으므로 팝업 관련 변경분만 반입해야 하고(§2.1·§3.1),
WPF는 외부망 산출물(EXE)이 아니라 폐쇄망에서 직접 빌드할 수 있게 소스만 가져간다(§4.1).
각 묶음마다 파일 목록(manifest, A=신규/M=수정)을 함께 만들어 폐쇄망 기존 프로젝트와의 충돌 파일 확인(§2.4·§3.4)에 쓴다.

[사용] 저장소 루트에서 (변경분은 커밋된 상태여야 git diff에 잡힌다)
  .\scripts\export-offline-package.ps1                       # 기본: 저장소 루트\offline-export\<날짜>
  .\scripts\export-offline-package.ps1 -OutputRoot D:\out    # 출력 위치 지정
  .\scripts\export-offline-package.ps1 -IncludeMockSso       # 임시 SSO 프로그램 포함(§4.2 선택 항목)
  .\scripts\export-offline-package.ps1 -IncludeDevDependencies  # E. 개발 의존 패키지 묶음도 생성(용량 큼)

[출력]
  <OutputRoot>\A-docs\, B-server\, C-web\, D-wpf\, (E-dev-deps\)  — 원본 경로 구조 유지
  <OutputRoot>\*.zip                                              — 묶음별 압축
  <OutputRoot>\MANIFEST-*.txt                                     — 묶음별 파일 목록(상태·경로)
  <OutputRoot>\README-IMPORT.md                                   — 반입 절차 요약
#>
param(
    [string]$OutputRoot = "",
    [string]$ServerBaseline = "0294d1e",
    [string]$WebBaseline = "f66e8ed",
    [switch]$IncludeMockSso,
    [switch]$IncludeDevDependencies,
    [switch]$NoZip
)

$ErrorActionPreference = "Stop"
$repositoryRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repositoryRoot

if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    $OutputRoot = Join-Path $repositoryRoot ("offline-export\" + (Get-Date -Format "yyyyMMdd-HHmm"))
}
New-Item -ItemType Directory -Force $OutputRoot | Out-Null

$dirty = (& git status --porcelain -- zero-rule-server zero-rule-web popup-frameWork docs) | Where-Object { $_ }
if ($dirty) {
    Write-Warning "커밋되지 않은 변경이 있습니다. git diff 기준 목록(B/C)에 반영되지 않을 수 있습니다:"
    $dirty | ForEach-Object { Write-Warning "  $_" }
}

function Copy-Preserve {
    param([string]$RelativePath, [string]$BundleRoot)
    $source = Join-Path $repositoryRoot $RelativePath
    if (-not (Test-Path $source -PathType Leaf)) { return $false }
    $target = Join-Path $BundleRoot $RelativePath
    New-Item -ItemType Directory -Force (Split-Path -Parent $target) | Out-Null
    Copy-Item -LiteralPath $source -Destination $target -Force
    return $true
}

function Export-GitDiffBundle {
    param([string]$Name, [string]$Baseline, [string]$PathSpec, [string[]]$ExcludePatterns)
    $bundleRoot = Join-Path $OutputRoot $Name
    New-Item -ItemType Directory -Force $bundleRoot | Out-Null
    $lines = & git diff --name-status "$Baseline..HEAD" -- $PathSpec
    $manifest = New-Object System.Collections.Generic.List[string]
    $manifest.Add("# $Name — baseline $Baseline..HEAD ($PathSpec)")
    $manifest.Add("# 상태: A=신규(폐쇄망에 없음, 그대로 추가)  M=수정(폐쇄망 기존 파일과 diff 확인 후 반영)  D=삭제")
    $count = 0
    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $parts = $line -split "`t"
        $status = $parts[0].Substring(0, 1)
        $path = $parts[-1]
        $skip = $false
        foreach ($pattern in $ExcludePatterns) { if ($path -like $pattern) { $skip = $true; break } }
        if ($skip) { continue }
        if ($status -eq "D") { $manifest.Add("D`t$path"); continue }
        if (Copy-Preserve -RelativePath $path -BundleRoot $bundleRoot) {
            $manifest.Add("$status`t$path"); $count++
        }
    }
    $manifest | Set-Content -Encoding utf8 (Join-Path $OutputRoot "MANIFEST-$Name.txt")
    Write-Host "[$Name] $count files -> $bundleRoot"
}

function Export-TreeBundle {
    param([string]$Name, [string[]]$Roots, [string[]]$ExcludeDirs, [string[]]$ExcludeExtensions, [string[]]$ExtraFiles)
    $bundleRoot = Join-Path $OutputRoot $Name
    New-Item -ItemType Directory -Force $bundleRoot | Out-Null
    $manifest = New-Object System.Collections.Generic.List[string]
    $manifest.Add("# $Name — 소스 트리 복사 (제외 디렉터리: $($ExcludeDirs -join ', ') / 제외 확장자: $($ExcludeExtensions -join ', '))")
    $count = 0
    foreach ($root in $Roots) {
        $rootPath = Join-Path $repositoryRoot $root
        if (-not (Test-Path $rootPath)) { continue }
        Get-ChildItem -LiteralPath $rootPath -Recurse -File -Force | ForEach-Object {
            $relative = $_.FullName.Substring($repositoryRoot.Length + 1) -replace "\\", "/"
            $segments = $relative -split "/"
            foreach ($dir in $ExcludeDirs) { if ($segments -contains $dir) { return } }
            if ($ExcludeExtensions -contains $_.Extension.ToLowerInvariant()) { return }
            if ($_.Name -eq ".gitkeep") { return }
            if (Copy-Preserve -RelativePath $relative -BundleRoot $bundleRoot) { $manifest.Add("S`t$relative"); $count++ }
        }
    }
    foreach ($file in $ExtraFiles) {
        if (Copy-Preserve -RelativePath $file -BundleRoot $bundleRoot) { $manifest.Add("S`t$file"); $count++ }
    }
    $manifest | Set-Content -Encoding utf8 (Join-Path $OutputRoot "MANIFEST-$Name.txt")
    Write-Host "[$Name] $count files -> $bundleRoot"
}

# A. 문서
Export-TreeBundle -Name "A-docs" -Roots @("docs", "db", "api") -ExcludeDirs @() -ExcludeExtensions @() `
    -ExtraFiles @("README.md", "AGENTS.md", "OFFLINE_WPF_BUILD.md", "version-history/CHANGELOG.md", "popup-frameWork/README.md", "zero-rule-web/POPUP_PREVIEW_WPF_PARITY.md")

# B. Server — 팝업 관련 변경분만. 빌드 산출물·업스트림 보관 .git 은 제외.
Export-GitDiffBundle -Name "B-server" -Baseline $ServerBaseline -PathSpec "zero-rule-server" `
    -ExcludePatterns @("*/build/*", "zero-rule-server/.git-upstream-*/*", "*.class")

# C. Web — 팝업 관리자 기능 변경분만. node_modules/.next/dist 는 git 에 없으므로 자동 제외.
Export-GitDiffBundle -Name "C-web" -Baseline $WebBaseline -PathSpec "zero-rule-web" `
    -ExcludePatterns @("*/node_modules/*", "*/.next/*", "*/dist/*", "*/coverage/*")

# D. WPF — 소스만. bin/obj/publish 및 실행 산출물 제외.
$wpfRoots = @("popup-frameWork/Popup")
if ($IncludeMockSso) { $wpfRoots += "popup-frameWork/MockSso" }
Export-TreeBundle -Name "D-wpf" -Roots $wpfRoots `
    -ExcludeDirs @("bin", "obj", "publish", ".vs") `
    -ExcludeExtensions @(".exe", ".dll", ".pdb", ".deps.json", ".runtimeconfig.json", ".cache", ".user") `
    -ExtraFiles @("popup-frameWork/Popup.slnx", "popup-frameWork/README.md", "global.json", "NuGet.config", "scripts/build-wpf-offline.ps1")

# E. 개발 의존(선택) — 소스와 분리해 별도 묶음
if ($IncludeDevDependencies) {
    Export-TreeBundle -Name "E-dev-deps" -Roots @("offline-packages", "offline-sdk") -ExcludeDirs @() -ExcludeExtensions @() `
        -ExtraFiles @("global.json", "NuGet.config", "scripts/prepare-offline-packages.ps1", "scripts/build-wpf-offline.ps1", "OFFLINE_WPF_BUILD.md")
}

# 산출물 검사: D-wpf 에 실행 산출물이 섞이지 않았는지 (§4.5)
$leaked = Get-ChildItem -LiteralPath (Join-Path $OutputRoot "D-wpf") -Recurse -File | Where-Object { $_.Extension -in @(".exe", ".dll", ".pdb") }
if ($leaked) { throw "D-wpf 에 실행 산출물이 포함되었습니다: $($leaked.FullName -join ', ')" }

# 반입 절차 요약
$head = (& git rev-parse --short HEAD)
@"
# 폐쇄망 반입 패키지 (생성: $(Get-Date -Format "yyyy-MM-dd HH:mm"), 커밋 $head)

| 묶음 | 내용 | 반입 방법 |
|---|---|---|
| A-docs | 인터페이스 정의서·설계 문서·Oracle DDL·API 예제·README·변경 이력 | 참고 자료로 보관 |
| B-server | zero-rule-server 팝업 관련 신규(A)/수정(M) 파일 (baseline $ServerBaseline) | MANIFEST-B-server.txt 의 A 파일은 그대로 추가, M 파일은 폐쇄망 기존 파일과 diff 후 병합 |
| C-web | zero-rule-web 팝업 관리자 기능 신규/수정 파일 (baseline $WebBaseline) | 위와 같음. package.json/pnpm-lock.yaml 변경은 폐쇄망 pnpm store 에 패키지 존재 여부 확인 |
| D-wpf | popup-frameWork 소스(csproj/slnx/xaml/cs/json/Media) — EXE/DLL/PDB/bin/obj/publish 제외 | 폐쇄망 PC에서 scripts\build-wpf-offline.ps1 로 restore·publish |
| E-dev-deps | .NET SDK 설치 파일·NuGet 오프라인 패키지 (옵션 -IncludeDevDependencies) | 소스와 별도 관리 |

## 반입 전 확인 (설계 14 §2.4·§3.4·§4.5)
- B: `custom.wpf-popup.dev-user-header` 는 운영 프로파일에서 false, `custom.wpf-auth-prototype.enabled` 는 로컬 전용(운영 false).
- B: `custom.wpf-client.minimum-supported-version` / `latest-version` 을 반입하는 WPF 버전(Popup.csproj <Version>)과 맞춘다.
- C: 서버 DTO(WpfPopupItem / PopupResponseDto)와 PopupAdmin.ts 필드 일치 확인.
- D: appsettings.json 의 BaseUrl / Auth.SsoUrl 을 폐쇄망 주소로 변경. DevUserId 는 비운다.
- D: 소스에 개인 PC 절대경로가 없는지 `Select-String -Path D-wpf -Pattern "D:\\\\|C:\\\\Users"` 로 확인.
"@ | Set-Content -Encoding utf8 (Join-Path $OutputRoot "README-IMPORT.md")

if (-not $NoZip) {
    Get-ChildItem -LiteralPath $OutputRoot -Directory | ForEach-Object {
        $zip = Join-Path $OutputRoot ($_.Name + ".zip")
        if (Test-Path $zip) { Remove-Item $zip -Force }
        Compress-Archive -Path (Join-Path $_.FullName "*") -DestinationPath $zip
        Write-Host "zip -> $zip"
    }
}

Write-Host "Done: $OutputRoot"
