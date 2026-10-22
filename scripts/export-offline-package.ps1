<#
POL-15-01 : 배포 범위
■ 폐쇄망 반입 패키지 생성
- in : 저장소 HEAD 커밋(작업 트리가 아니라 커밋 기준), 직전 반입본, 선택 패치노트·변경 요약
- out: offline-export\<날짜>\ — 묶음 폴더·TAR, 통합 TGZ, MANIFEST, DELETE 목록, SHA256, README-IMPORT.md
- HEAD를 깨끗한 worktree로 꺼내 팝업 관련 소스만 묶는다. 작업 트리의 미커밋 변경(개발 PC 전용 설정 등)은 들어가지 않는다.

  1-zero-rule-server  서버 — 공통 베이스라인(업스트림 56bb0c5 = 커밋 0294d1e) 대비 추가·수정 파일(git diff)
  2-zero-rule-web     관리자 웹 — sample 베이스라인(커밋 f66e8ed) 대비 추가·수정 파일(git diff)
  3-popup-frameWork   WPF·MockSso 소스, 오프라인 빌드 스크립트(bin/obj/publish/EXE/DLL/PDB·검증 하네스·개인 launchSettings 제외)
  4-docs              docs·db·api·README·변경 이력
  6-offline-packages  (선택 -IncludeDevDependencies) NuGet·SDK 개발 의존 — 통합 TGZ에는 넣지 않는다

이유: 폐쇄망에는 zero-rule-server/zero-rule-web 전체가 이미 있으므로 팝업 관련 변경분만 반입하고,
WPF는 외부망 산출물(EXE)이 아니라 폐쇄망에서 직접 빌드할 수 있게 소스만 가져간다.
MANIFEST(A=신규/M=수정/D=삭제/S=소스 복사)는 폐쇄망 기존 프로젝트와의 충돌 확인에 쓴다.

[사용] 저장소 루트에서, 반입할 변경을 커밋한 뒤
  .\scripts\export-offline-package.ps1                                  # offline-export\<오늘 날짜>
  .\scripts\export-offline-package.ps1 -NotesFile notes.md -PatchNotesDir patch\   # 변경 요약·묶음별 패치노트 포함
  .\scripts\export-offline-package.ps1 -UseWorkingChangelog              # 반입본 생성 기록을 적은(미커밋) CHANGELOG로 교체
  .\scripts\export-offline-package.ps1 -VerifyBuild                      # 20261006 NuGet 반입본만으로 WPF 오프라인 빌드 확인
  .\scripts\export-offline-package.ps1 -Force                            # 같은 날짜 폴더가 있으면 지우고 다시 생성

[출력] <OutputRoot>\
  1-zero-rule-server\ 2-zero-rule-web\ 3-popup-frameWork\ 4-docs\ 와 각 .tar  — 원본 경로 구조 유지
  <날짜>.tgz / <날짜>.tgz.sha256                                         — README·체크섬·DELETE·TAR·MANIFEST 통합본
  MANIFEST-<묶음>.txt, DELETE-SINCE-<기준>.txt, SHA256SUMS.txt(TAR), SOURCE-SHA256SUMS.txt(파일별), README-IMPORT.md
#>
param(
    [string]$Date = (Get-Date -Format "yyyyMMdd"),
    [string]$OutputRoot = "",
    [string]$ServerBaseline = "0294d1e",
    [string]$WebBaseline = "f66e8ed",
    # 삭제 목록 누적 기준(20260930 반입본 소스)
    [string]$DeleteBaseline = "5b58e59",
    [string]$DeleteBaselineName = "20260930",
    # 직전 반입본 이름·소스 커밋. 비우면 offline-export 아래 가장 최근 반입본의 README-IMPORT.md에서 읽는다.
    [string]$PreviousExport = "",
    [string]$PreviousCommit = "",
    [string]$NotesFile = "",
    [string]$PatchNotesDir = "",
    [string]$NuGetBundle = "",
    [switch]$UseWorkingChangelog,
    [switch]$IncludeDevDependencies,
    [switch]$VerifyBuild,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
# git은 UTF-8로, Windows tar(bsdtar)는 시스템 코드 페이지(CP949)로 목록을 출력한다 — 한글 경로를 읽을 때 각각 맞춘다.
$utf8 = New-Object System.Text.UTF8Encoding $false
$cp949 = [System.Text.Encoding]::GetEncoding(949)
[Console]::OutputEncoding = $utf8
$repositoryRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repositoryRoot
$exportsRoot = Join-Path $repositoryRoot "offline-export"
if ([string]::IsNullOrWhiteSpace($OutputRoot)) { $OutputRoot = Join-Path $exportsRoot $Date }
if (Test-Path -LiteralPath $OutputRoot) {
    if (-not $Force) { throw "이미 있습니다: $OutputRoot (다시 만들려면 -Force)" }
    Remove-Item -LiteralPath $OutputRoot -Recurse -Force
}
New-Item -ItemType Directory -Force $OutputRoot | Out-Null

$head = (& git rev-parse --short HEAD).Trim()
$dirty = @(& git status --porcelain -- zero-rule-server zero-rule-web popup-frameWork docs db api | Where-Object { $_ })
if ($dirty) {
    Write-Warning "커밋되지 않은 변경은 반입본에 들어가지 않습니다(HEAD $head 기준):"
    $dirty | ForEach-Object { Write-Warning "  $_" }
}

# 직전 반입본: 지정이 없으면 가장 최근 반입본 README에서 소스 커밋을 읽는다("기준 커밋: <sha>" 또는 "기준: main / <sha> 소스").
if ([string]::IsNullOrWhiteSpace($PreviousExport)) {
    $previous = Get-ChildItem -LiteralPath $exportsRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match '^\d{8}$' -and $_.Name -lt $Date -and (Test-Path (Join-Path $_.FullName "README-IMPORT.md")) } |
        Sort-Object Name | Select-Object -Last 1
    if ($previous) { $PreviousExport = $previous.Name }
}
if ($PreviousExport -and [string]::IsNullOrWhiteSpace($PreviousCommit)) {
    $readme = Get-Content -Encoding UTF8 (Join-Path $exportsRoot "$PreviousExport\README-IMPORT.md") -TotalCount 5
    $match = [regex]::Match(($readme -join "`n"), '기준 커밋: ([0-9a-f]{7,40})|기준: main / ([0-9a-f]{7,40})')
    if ($match.Success) { $PreviousCommit = ($match.Groups[1].Value + $match.Groups[2].Value) }
}
if ($PreviousCommit) { $PreviousCommit = (& git rev-parse --short $PreviousCommit).Trim() }

# HEAD 깨끗한 사본
$worktree = Join-Path $repositoryRoot ".offline-verify\wt-$Date"
# git 진행 메시지(stderr)를 PowerShell 5.1이 오류로 바꾸지 않도록 이 구간만 Continue로 둔다.
$ErrorActionPreference = "Continue"
if (Test-Path -LiteralPath $worktree) { & git worktree remove --force $worktree 2>&1 | Out-Null; if (Test-Path -LiteralPath $worktree) { Remove-Item -LiteralPath $worktree -Recurse -Force } }
& git worktree prune 2>&1 | Out-Null
& git worktree add --quiet --detach $worktree HEAD 2>&1 | Out-Null
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath (Join-Path $worktree "zero-rule-server"))) { throw "worktree 생성 실패" }

function Copy-Preserve {
    param([string]$RelativePath, [string]$BundleRoot)
    $source = Join-Path $worktree $RelativePath
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) { return $false }
    $target = Join-Path $BundleRoot $RelativePath
    New-Item -ItemType Directory -Force (Split-Path -Parent $target) | Out-Null
    Copy-Item -LiteralPath $source -Destination $target -Force
    return $true
}

function Test-Excluded {
    param([string]$Path, [string[]]$Patterns)
    foreach ($pattern in $Patterns) { if ($Path -like $pattern) { return $true } }
    return $false
}

function Export-GitDiffBundle {
    param([string]$Name, [string]$Baseline, [string]$PathSpec, [string[]]$ExcludePatterns)
    $bundleRoot = Join-Path $OutputRoot $Name
    New-Item -ItemType Directory -Force $bundleRoot | Out-Null
    $lines = & git -C $worktree -c core.quotepath=false diff --name-status --no-renames "$Baseline..HEAD" -- $PathSpec
    $manifest = New-Object System.Collections.Generic.List[string]
    $manifest.Add("# $Name — baseline $Baseline..$head ($PathSpec)")
    $manifest.Add("# 상태: A=신규(폐쇄망에 없음, 그대로 추가)  M=수정(폐쇄망 기존 파일과 diff 확인 후 반영)  D=삭제")
    $counts = @{ A = 0; M = 0; D = 0 }
    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $parts = $line -split "`t"
        $status = $parts[0].Substring(0, 1)
        $path = $parts[-1]
        if (Test-Excluded $path $ExcludePatterns) { continue }
        if ($status -eq "D") { $manifest.Add("D`t$path"); $counts.D++; continue }
        if (Copy-Preserve -RelativePath $path -BundleRoot $bundleRoot) { $manifest.Add("$status`t$path"); $counts[$status]++ }
    }
    $manifest | Set-Content -Encoding UTF8 (Join-Path $OutputRoot "MANIFEST-$Name.txt")
    Write-Host "[$Name] A $($counts.A) / M $($counts.M) / D $($counts.D)"
    return $counts
}

function Export-TreeBundle {
    param([string]$Name, [string[]]$Roots, [string[]]$ExcludeDirs, [string[]]$ExcludeExtensions, [string[]]$ExcludePatterns, [string[]]$ExtraFiles)
    $bundleRoot = Join-Path $OutputRoot $Name
    New-Item -ItemType Directory -Force $bundleRoot | Out-Null
    $manifest = New-Object System.Collections.Generic.List[string]
    $manifest.Add("# $Name — 소스 트리 복사(커밋 $head) (제외 디렉터리: $($ExcludeDirs -join ', ') / 제외 확장자: $($ExcludeExtensions -join ', ') / 제외 경로: $($ExcludePatterns -join ', '))")
    foreach ($root in $Roots) {
        $rootPath = Join-Path $worktree $root
        if (-not (Test-Path -LiteralPath $rootPath)) { continue }
        Get-ChildItem -LiteralPath $rootPath -Recurse -File -Force | Sort-Object FullName | ForEach-Object {
            $relative = $_.FullName.Substring($worktree.Length + 1) -replace "\\", "/"
            $segments = $relative -split "/"
            foreach ($dir in $ExcludeDirs) { if ($segments -contains $dir) { return } }
            if ($ExcludeExtensions -contains $_.Extension.ToLowerInvariant()) { return }
            if ($_.Name -eq ".gitkeep" -or $_.Name -like '~$*') { return }
            if (Test-Excluded $relative $ExcludePatterns) { return }
            if (Copy-Preserve -RelativePath $relative -BundleRoot $bundleRoot) { $manifest.Add("S`t$relative") }
        }
    }
    foreach ($file in $ExtraFiles) {
        if (Copy-Preserve -RelativePath $file -BundleRoot $bundleRoot) { $manifest.Add("S`t$file") }
    }
    $manifest | Set-Content -Encoding UTF8 (Join-Path $OutputRoot "MANIFEST-$Name.txt")
    $count = $manifest.Count - 1
    Write-Host "[$Name] S $count"
    return $count
}

try {
    $server = Export-GitDiffBundle -Name "1-zero-rule-server" -Baseline $ServerBaseline -PathSpec "zero-rule-server" `
        -ExcludePatterns @("*/build/*", "zero-rule-server/.git-upstream-*/*", "*.class", "zero-rule-server/popup-videos/*")
    $web = Export-GitDiffBundle -Name "2-zero-rule-web" -Baseline $WebBaseline -PathSpec "zero-rule-web" `
        -ExcludePatterns @("*/node_modules/*", "*/.next/*", "*/dist/*", "*/coverage/*")
    # WPF: Popup·MockSso 소스만. 검증 하네스(Popup.BehaviorTests·Popup.RecoveryTests·scripts/*Tests)와 개인 실행 설정은 넣지 않는다.
    $wpf = Export-TreeBundle -Name "3-popup-frameWork" -Roots @("popup-frameWork/Popup", "popup-frameWork/MockSso") `
        -ExcludeDirs @("bin", "obj", "publish", ".vs") `
        -ExcludeExtensions @(".exe", ".dll", ".pdb", ".deps.json", ".runtimeconfig.json", ".cache", ".user") `
        -ExcludePatterns @("popup-frameWork/MockSso/Properties/launchSettings.json") `
        -ExtraFiles @("popup-frameWork/Popup.slnx", "global.json", "NuGet.config", "scripts/build-wpf-offline.ps1")
    # 문서: docs/interfaces/OLD는 Git 제외 로컬 보관, AGENTS.md는 개발 저장소 작업 규칙이라 넣지 않는다.
    $docs = Export-TreeBundle -Name "4-docs" -Roots @("docs", "db", "api") -ExcludeDirs @("OLD") -ExcludeExtensions @() -ExcludePatterns @() `
        -ExtraFiles @("README.md", "OFFLINE_WPF_BUILD.md", "version-history/CHANGELOG.md", "popup-frameWork/README.md")
    if ($UseWorkingChangelog) {
        # 반입본 생성 기록을 적은 최신 변경 이력으로 교체(커밋 전 기록용)
        Copy-Item -LiteralPath (Join-Path $repositoryRoot "version-history\CHANGELOG.md") -Destination (Join-Path $OutputRoot "4-docs\version-history\CHANGELOG.md") -Force
    }
    if ($IncludeDevDependencies) {
        $null = Export-TreeBundle -Name "6-offline-packages" -Roots @("offline-packages", "offline-sdk") -ExcludeDirs @() -ExcludeExtensions @() -ExcludePatterns @() `
            -ExtraFiles @("global.json", "NuGet.config", "scripts/prepare-offline-packages.ps1", "scripts/build-wpf-offline.ps1", "OFFLINE_WPF_BUILD.md")
    }

    # 삭제 목록: 누적(기준 반입본 이후) + 직전 반입본 이후 생겼다가 지워진 파일(누적 diff에 안 잡힘)
    $deleteName = "DELETE-SINCE-$DeleteBaselineName.txt"
    $deleteScope = @("popup-frameWork", "zero-rule-web", "zero-rule-server", "docs", "db", "api")
    $cumulative = @(& git -C $worktree -c core.quotepath=false diff --no-renames --name-only --diff-filter=D $DeleteBaseline HEAD -- $deleteScope)
    $deleteLines = @("# $DeleteBaselineName ($DeleteBaseline) 이후 삭제 파일(누적). 기존 반입 소스에 있으면 삭제.") + $cumulative
    $sincePrevious = @()
    if ($PreviousCommit) {
        $sincePrevious = @(& git -C $worktree -c core.quotepath=false diff --no-renames --name-only --diff-filter=D $PreviousCommit HEAD -- $deleteScope)
        $extra = @($sincePrevious | Where-Object { $cumulative -notcontains $_ })
        if ($extra) {
            $deleteLines += ""
            $deleteLines += "# $PreviousExport ($PreviousCommit) 이후 삭제 파일 중 위 누적 목록에 없는 것($DeleteBaselineName 뒤에 생겼다가 지워짐). $PreviousExport 반입 상태라면 삭제."
            $deleteLines += $extra
        }
    }
    $deleteLines | Set-Content -Encoding UTF8 (Join-Path $OutputRoot $deleteName)

    # 묶음별 패치노트(선택): <PatchNotesDir>\README-PATCH-<묶음>.md → 묶음 루트
    $bundles = @("1-zero-rule-server", "2-zero-rule-web", "3-popup-frameWork", "4-docs")
    if ($PatchNotesDir) {
        foreach ($bundle in $bundles) {
            $note = Join-Path $PatchNotesDir "README-PATCH-$bundle.md"
            if (Test-Path -LiteralPath $note) { Copy-Item -LiteralPath $note -Destination (Join-Path $OutputRoot $bundle) }
        }
    }

    # 개인 PC 절대경로 누출 검사(코드·설정 파일)
    # -LiteralPath에서는 -Include가 적용되지 않아 확장자로 거른다. 문서·변경 이력은 과거 경로를 기록으로 담고 있어 검사하지 않는다.
    $codeExtensions = @(".cs", ".xaml", ".json", ".yml", ".yaml", ".properties", ".ps1", ".java", ".ts", ".tsx", ".xml")
    $leak = @(Get-ChildItem -LiteralPath $OutputRoot -Recurse -File | Where-Object { $codeExtensions -contains $_.Extension.ToLowerInvariant() } |
        Select-String -Pattern 'D:\\work|C:\\Users\\Administrator|D:/work' -List)
    if ($leak) { throw "개인 PC 절대경로 포함: $($leak.Path -join ', ')" }

    # README-IMPORT.md
    $notes = "(변경 요약 미작성 — -NotesFile로 직전 반입본 이후 변경·DB 적용 순서·호환성을 넣는다)"
    if ($NotesFile) { $notes = (Get-Content -Encoding UTF8 -Raw $NotesFile).TrimEnd() }
    $previousText = "직전 반입본 없음"
    $previousDeletes = ""
    if ($PreviousExport) {
        $previousText = "직전 반입본 $PreviousExport($PreviousCommit)"
        $previousDeletes = " $PreviousExport 이후 새로 삭제할 파일 $($sincePrevious.Count)개."
    }
    @"
# 폐쇄망 반입 패키지 — $Date

기준 커밋: $head (main, 깨끗한 worktree에서 생성 — 작업 트리의 미커밋 변경 미포함). 서버 baseline $ServerBaseline, 웹 baseline $WebBaseline. $previousText.

| 묶음 | 내용 | 반입 |
|---|---|---|
| 1-zero-rule-server.tar | 서버 팝업 관련 신규(A $($server.A))·수정(M $($server.M))·삭제(D $($server.D)) (baseline $ServerBaseline) | MANIFEST의 A는 추가, M은 폐쇄망 기존 파일과 비교 후 반영, D는 삭제 |
| 2-zero-rule-web.tar | 관리자 웹 팝업 기능 신규(A $($web.A))·수정(M $($web.M))·삭제(D $($web.D)) (baseline $WebBaseline) | 위와 같음. package.json·pnpm-lock.yaml이 바뀌었으면 폐쇄망 pnpm store 확인 |
| 3-popup-frameWork.tar | WPF/MockSso 소스 $wpf 파일, 오프라인 빌드 스크립트 | 소스 트리 덮어쓰기. EXE/DLL/PDB/bin/obj/publish·검증 하네스·개인 launchSettings 제외 |
| 4-docs.tar | docs·db/oracle·api 예제·README·변경 이력 $docs 파일 | 계약 문서와 DB 스크립트 적용 순서 확인 |

삭제: $deleteName(누적 $($cumulative.Count)개).$previousDeletes

## 이번 변경

$notes

## 반입 절차

1. ``tar -xzf $Date.tgz`` 후 SHA256SUMS.txt로 TAR 체크섬을 확인한다.
2. 1·2·4 TAR을 반입 루트에 풀고 MANIFEST와 $deleteName 에 따라 병합·삭제한다.
3. NuGet·SDK(20261006의 6-offline-packages)를 먼저 반입 루트에 푼 다음 3-popup-frameWork.tar를 풀어 덮어쓴다(scripts/build-wpf-offline.ps1은 3-popup-frameWork의 것이 남아야 한다).
4. DB 스크립트는 4-docs의 db/oracle/README.md 순서로 적용한다.
5. 서버: custom.wpf-popup.dev-user-header는 운영 프로파일에서 false, custom.wpf-auth-prototype.enabled는 로컬 전용, custom.wpf-client 버전 값은 반입 WPF 버전과 맞춘다.
6. WPF: appsettings.json의 BaseUrl·Auth.SsoUrl을 폐쇄망 주소로, DevUserId는 비운다. Popup/Properties/launchSettings.json은 개발용 POPUP_DEV_USER_ID를 담고 있어 폐쇄망 실행 설정과 맞춰 조정한다. scripts/build-wpf-offline.ps1(폴더형) 또는 -SingleFile로 빌드한다. WebView2 Runtime은 대상 PC에 별도 설치.

SOURCE-SHA256SUMS.txt는 반입 소스 파일별, SHA256SUMS.txt는 개별 TAR, $Date.tgz.sha256은 통합 TGZ 체크섬이다.
"@ | Set-Content -Encoding UTF8 (Join-Path $OutputRoot "README-IMPORT.md")

    # TAR·체크섬·TGZ
    $sums = @()
    foreach ($bundle in $bundles) {
        $bundlePath = Join-Path $OutputRoot $bundle
        $tarPath = Join-Path $OutputRoot "$bundle.tar"
        & tar -cf $tarPath -C $bundlePath .
        if ($LASTEXITCODE -ne 0) { throw "tar 실패: $bundle" }
        [Console]::OutputEncoding = $cp949
        $listed = @(& tar -tf $tarPath)
        [Console]::OutputEncoding = $utf8
        $entries = @($listed | Where-Object { -not $_.EndsWith('/') } | ForEach-Object { $_.Substring(2) })
        $files = @(Get-ChildItem -LiteralPath $bundlePath -Recurse -File)
        if ($entries.Count -ne $files.Count) { throw "TAR 파일 수 불일치: $bundle ($($entries.Count) / $($files.Count))" }
        foreach ($file in $files) {
            $relative = $file.FullName.Substring($bundlePath.Length + 1).Replace('\', '/')
            if ($entries -notcontains $relative) { throw "TAR 누락: $bundle $relative" }
        }
        if ($entries -match '(^|/)(bin|obj|publish|build|node_modules|\.next|Popup\.BehaviorTests|Popup\.RecoveryTests|popup-videos)/|\.(exe|dll|pdb|class)$|MockSso/Properties/launchSettings\.json') {
            throw "제외 대상 포함: $bundle"
        }
        $sums += "$((Get-FileHash -LiteralPath $tarPath -Algorithm SHA256).Hash.ToLower())  $bundle.tar"
        Write-Host "$bundle.tar : $($files.Count) files verified"
    }
    $sums | Set-Content -Encoding ASCII (Join-Path $OutputRoot "SHA256SUMS.txt")
    $sourceSums = foreach ($bundle in $bundles) {
        Get-ChildItem -LiteralPath (Join-Path $OutputRoot $bundle) -Recurse -File | Sort-Object FullName | ForEach-Object {
            "$((Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLower())  $($_.FullName.Substring($OutputRoot.Length + 1).Replace('\', '/'))"
        }
    }
    $sourceSums | Set-Content -Encoding UTF8 (Join-Path $OutputRoot "SOURCE-SHA256SUMS.txt")

    $payload = @("README-IMPORT.md", "SHA256SUMS.txt", "SOURCE-SHA256SUMS.txt", $deleteName)
    foreach ($bundle in $bundles) { $payload += "$bundle.tar"; $payload += "MANIFEST-$bundle.txt" }
    $tgz = Join-Path $OutputRoot "$Date.tgz"
    & tar -czf $tgz -C $OutputRoot @payload
    if ($LASTEXITCODE -ne 0) { throw "tgz 실패" }
    if (@(& tar -tzf $tgz).Count -ne $payload.Count) { throw "TGZ 항목 수 불일치" }
    $tgzHash = (Get-FileHash -LiteralPath $tgz -Algorithm SHA256).Hash.ToLower()
    "$tgzHash  $Date.tgz" | Set-Content -Encoding ASCII (Join-Path $OutputRoot "$Date.tgz.sha256")

    # TGZ를 풀어 TAR 체크섬 대조
    $check = Join-Path $repositoryRoot ".offline-verify\tgz-check-$Date"
    if (Test-Path -LiteralPath $check) { Remove-Item -LiteralPath $check -Recurse -Force }
    New-Item -ItemType Directory -Path $check | Out-Null
    & tar -xzf $tgz -C $check
    foreach ($line in $sums) {
        $parts = $line -split '  '
        if ((Get-FileHash -LiteralPath (Join-Path $check $parts[1]) -Algorithm SHA256).Hash.ToLower() -ne $parts[0]) { throw "TGZ 안 TAR 체크섬 불일치: $($parts[1])" }
    }
    Remove-Item -LiteralPath $check -Recurse -Force

    # 선택: 반입 소스 + NuGet 반입본만으로 외부 feed 없이 WPF 빌드
    if ($VerifyBuild) {
        if ([string]::IsNullOrWhiteSpace($NuGetBundle)) { $NuGetBundle = Join-Path $exportsRoot "20261006\6-offline-packages" }
        if (-not (Test-Path -LiteralPath $NuGetBundle)) { throw "NuGet 반입본 없음: $NuGetBundle" }
        $verify = Join-Path $repositoryRoot (".offline-verify\package-$Date-" + (Get-Date -Format "HHmmss"))
        New-Item -ItemType Directory -Path $verify -Force | Out-Null
        Copy-Item -Path (Join-Path $NuGetBundle "*") -Destination $verify -Recurse -Force
        Copy-Item -Path (Join-Path $OutputRoot "3-popup-frameWork\*") -Destination $verify -Recurse -Force
        & (Join-Path $verify "scripts\build-wpf-offline.ps1")
        if (-not (Test-Path -LiteralPath (Join-Path $verify "popup-frameWork\publish\win-x64\popupSample.exe"))) { throw "폴더형 publish 실패" }
        & (Join-Path $verify "scripts\build-wpf-offline.ps1") -SingleFile
        $single = @(Get-ChildItem -LiteralPath (Join-Path $verify "popup-frameWork\publish\win-x64-single") -File)
        if ($single.Count -ne 1 -or $single[0].Name -ne "popupSample.exe") { throw "단일 EXE publish 결과: $($single.Name -join ', ')" }
        Write-Host "VERIFY_BUILD ok: $verify (single $($single[0].Length) bytes)"
    }

    Write-Host "TGZ SHA256: $tgzHash"
    Write-Host "Done: $OutputRoot (커밋 $head)"
}
finally {
    $ErrorActionPreference = "Continue"
    & git worktree remove --force $worktree 2>&1 | Out-Null
    & git worktree prune 2>&1 | Out-Null
}
