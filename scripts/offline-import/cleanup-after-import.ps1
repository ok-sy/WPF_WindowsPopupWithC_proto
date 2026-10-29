<#
POL-15-01 : 배포 범위
■ 폐쇄망: 반입 후 정리(삭제 목록 반영 + 이전 CKEditor 제거)
- in : 이 폴더의 DELETE-SINCE-*.txt(반입본 삭제 목록), CKEDITOR-KEEP.txt(남길 CKEditor 패키지 이름@버전),
       프로젝트 위치(-Root 하나로 자동 인식, 또는 -ServerRoot·-WebRoot·-FrameworkRoot·-DocsRoot에 위치를 여러 개 지정)
- out: 삭제 목록 파일 삭제, 웹 위치의 node_modules와 pnpm store에서 CKEDITOR-KEEP.txt에 없는 CKEditor 패키지 제거, 로그 파일
- 기본은 미리보기(지울 대상만 출력). -Apply를 주면 실제로 지운다.

  1) DELETE-SINCE-*.txt: '#'·빈 줄을 뺀 각 줄은 저장소 기준 상대 경로(zero-rule-server/…, zero-rule-web/…, popup-frameWork/…, docs/… 등).
     앞부분을 프로젝트 위치로 바꿔, 그 프로젝트의 위치 전부에서 지운다. 그래서 빈 폴더가 되면 폴더도 지운다(프로젝트 위치까지).
       zero-rule-server/<경로> → <서버 위치>\<경로>      (app·web·service 등이 있는 폴더)
       zero-rule-web/<경로>    → <웹 위치>\<경로>        (main·sub·package.json·node_modules가 있는 폴더)
       popup-frameWork/<경로>  → <WPF 위치>\<경로>       (Popup·MockSso가 있는 폴더)
       docs/·db/·api/<경로>    → <문서 위치>\docs|db|api\<경로>
     위치가 없는 프로젝트의 줄은 건너뛴다(로그에 표시).
  2) node_modules: 웹 위치마다 node_modules에서 이름에 ckeditor가 들어간 패키지(@ckeditor/*, ckeditor5, @cp949/ckeditor5-custom-build,
     @types/ckeditor__* 등) 중 이름@버전이 CKEDITOR-KEEP.txt에 없는 것을 지운다(중첩 node_modules 포함).
  3) pnpm store(v3): 같은 기준의 패키지 색인(*-index.json)을 지우고, 그 패키지만 쓰던 파일을 지운다
     (다른 패키지가 같은 내용 파일을 쓰면 남긴다).

  -Root 자동 인식(있는 폴더는 모두 사용):
     서버  zero-rule-server, 1-* 폴더, 8-dev\backend
     웹    zero-rule-web,    2-* 폴더, 8-dev\front
     WPF   popup-frameWork,  3-* 폴더(예: 3-csAgent)
     문서  -Root 아래 docs 폴더가 있을 때만(저장소 구조). 폐쇄망에는 위치가 없어 docs/ 항목은 건너뛴다.

[사용] 반입본을 푼 폴더에서(폐쇄망 PC). 소스 병합·install-pnpm-store.ps1 실행 뒤에 한다. 경로는 상대 경로도 된다.
  .\cleanup-after-import.ps1 -Root D:\폐쇄망최상위                  # 미리보기(찾은 위치가 맨 위에 나온다)
  .\cleanup-after-import.ps1 -Root D:\폐쇄망최상위 -Apply           # 실제 삭제
  # 위치를 직접 줄 때(여러 개는 쉼표로)
  .\cleanup-after-import.ps1 -ServerRoot D:\X\1-server,D:\X\8-dev\backend -WebRoot D:\X\2-web,D:\X\8-dev\front -FrameworkRoot D:\X\3-csAgent
  .\cleanup-after-import.ps1 ... -SkipStore                        # pnpm store는 건드리지 않음
  .\cleanup-after-import.ps1 ... -StoreDir D:\pnpm-store\v3        # store 경로 직접 지정
#>
param(
    [string]$Root = "",
    [string[]]$ServerRoot = @(),
    [string[]]$WebRoot = @(),
    [string[]]$FrameworkRoot = @(),
    [string[]]$DocsRoot = @(),
    [string]$StoreDir = "",
    [switch]$SkipDelete,
    [switch]$SkipNodeModules,
    [switch]$SkipStore,
    [switch]$Apply
)
$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$mode = if ($Apply) { "삭제" } else { "미리보기" }
$log = New-Object System.Collections.Generic.List[string]
function Write-Log([string]$text) { Write-Host $text; $log.Add($text) }

# 프로젝트 위치 목록: 직접 준 값이 있으면 그것만, 없으면 -Root 아래 후보(이름 또는 와일드카드) 중 있는 폴더 전부.
function Resolve-ProjectRoots([string[]]$values, [string[]]$candidates) {
    $found = New-Object System.Collections.Generic.List[string]
    $given = @($values | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if ($given.Count -gt 0) {
        foreach ($value in $given) {
            if (Test-Path -LiteralPath $value -PathType Container) { $found.Add((Resolve-Path -LiteralPath $value).Path) }
            else { Write-Log "  위치 없음(건너뜀): $value" }
        }
    } elseif ($Root) {
        foreach ($candidate in $candidates) {
            foreach ($dir in @(Get-Item -Path (Join-Path $Root $candidate) -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer })) {
                if (-not $found.Contains($dir.FullName)) { $found.Add($dir.FullName) }
            }
        }
    }
    return , $found.ToArray()
}
if (-not [string]::IsNullOrWhiteSpace($Root)) { $Root = (Resolve-Path -LiteralPath $Root).Path }
$serverRoots = Resolve-ProjectRoots $ServerRoot @("zero-rule-server", "1-*", "8-dev\backend")
$webRoots = Resolve-ProjectRoots $WebRoot @("zero-rule-web", "2-*", "8-dev\front")
$frameworkRoots = Resolve-ProjectRoots $FrameworkRoot @("popup-frameWork", "3-*")
# 문서·DB: 저장소 구조(-Root 아래 docs 폴더)일 때만 자동. 폐쇄망에는 위치가 없어 -DocsRoot를 줄 때만 지운다.
$docsCandidates = if ($Root -and (Test-Path -LiteralPath (Join-Path $Root "docs") -PathType Container)) { @(".") } else { @() }
$docsRoots = Resolve-ProjectRoots $DocsRoot $docsCandidates
if (($serverRoots.Count + $webRoots.Count + $frameworkRoots.Count + $docsRoots.Count) -eq 0) {
    throw "프로젝트 위치가 없습니다. -Root 또는 -ServerRoot·-WebRoot·-FrameworkRoot·-DocsRoot를 주세요."
}
function Show-Roots([string]$label, [string[]]$roots) {
    if ($roots.Count -eq 0) { Write-Log "[$mode] ${label}: (없음)" } else { foreach ($r in $roots) { Write-Log "[$mode] ${label}: $r" } }
}
Show-Roots "서버" $serverRoots
Show-Roots "웹" $webRoots
Show-Roots "WPF" $frameworkRoots
Show-Roots "문서·DB" $docsRoots

# 삭제 목록 한 줄 → 프로젝트 위치 목록과 그 아래 경로. 문서·DB·API는 docs|db|api 폴더 이름을 그대로 둔다.
function Get-DeleteTarget([string]$relative) {
    $parts = $relative -split '/', 2
    if ($parts.Count -lt 2) { return $null }
    switch ($parts[0]) {
        'zero-rule-server' { return @{ Roots = $serverRoots; Path = $parts[1] } }
        'zero-rule-web' { return @{ Roots = $webRoots; Path = $parts[1] } }
        'popup-frameWork' { return @{ Roots = $frameworkRoots; Path = $parts[1] } }
        { $_ -in @('docs', 'db', 'api') } { return @{ Roots = $docsRoots; Path = $relative } }
        default { return $null }
    }
}

# ---------- 1) 삭제 목록 ----------
$deleted = 0
if (-not $SkipDelete) {
    $lists = @(Get-ChildItem -LiteralPath $here -Filter "DELETE-SINCE-*.txt" -File)
    if ($lists.Count -eq 0) { throw "DELETE-SINCE-*.txt 없음: $here" }
    $paths = foreach ($list in $lists) {
        Get-Content -LiteralPath $list.FullName -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith("#") }
    }
    foreach ($relative in @($paths | Sort-Object -Unique)) {
        if ($relative -match '(^|[\\/])\.\.([\\/]|$)' -or [IO.Path]::IsPathRooted($relative)) { Write-Log "  건너뜀(잘못된 경로): $relative"; continue }
        $mapped = Get-DeleteTarget $relative
        if (-not $mapped) { Write-Log "  건너뜀(알 수 없는 프로젝트): $relative"; continue }
        if ($mapped.Roots.Count -eq 0) { Write-Log "  건너뜀(위치 없음): $relative"; continue }
        foreach ($base in $mapped.Roots) {
            $target = Join-Path $base ($mapped.Path -replace '/', '\')
            if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { continue }
            Write-Log "  삭제 목록: $relative  →  $target"
            $deleted++
            if ($Apply) {
                Remove-Item -LiteralPath $target -Force
                # 비게 된 상위 폴더 정리(프로젝트 위치까지)
                $parent = Split-Path -Parent $target
                while ($parent.Length -gt $base.Length -and -not (Get-ChildItem -LiteralPath $parent -Force | Select-Object -First 1)) {
                    Remove-Item -LiteralPath $parent -Force
                    $parent = Split-Path -Parent $parent
                }
            }
        }
    }
    Write-Log "[1/3] 삭제 목록: $deleted 개 $(if ($Apply) { '삭제' } else { '삭제 예정' })"
}

# ---------- 남길 CKEditor 목록 ----------
$keepFile = Join-Path $here "CKEDITOR-KEEP.txt"
if (-not (Test-Path -LiteralPath $keepFile)) { throw "CKEDITOR-KEEP.txt 없음: $here" }
$keep = New-Object 'System.Collections.Generic.HashSet[string]'
Get-Content -LiteralPath $keepFile -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith("#") } | ForEach-Object { [void]$keep.Add($_) }
if ($keep.Count -eq 0) { throw "CKEDITOR-KEEP.txt가 비어 있음" }
function Test-OldCkeditor([string]$name, [string]$version) {
    return ($name -match 'ckeditor') -and -not $keep.Contains("$name@$version")
}

# ---------- 2) node_modules(웹 위치마다) ----------
$removedModules = 0
if (-not $SkipNodeModules) {
    foreach ($web in $webRoots) {
        $nodeModules = Join-Path $web "node_modules"
        if (-not (Test-Path -LiteralPath $nodeModules)) { Write-Log "  node_modules 없음: $nodeModules"; continue }
        # node_modules 폴더와 패키지 폴더만 따라 내려간다(전체 트리를 훑지 않음)
        $queue = New-Object System.Collections.Generic.Queue[string]
        $queue.Enqueue($nodeModules)
        while ($queue.Count -gt 0) {
            $dir = $queue.Dequeue()
            $packages = foreach ($child in Get-ChildItem -LiteralPath $dir -Directory -Force) {
                if ($child.Name.StartsWith("@")) { Get-ChildItem -LiteralPath $child.FullName -Directory -Force } elseif ($child.Name -ne ".bin" -and $child.Name -ne ".cache") { $child }
            }
            foreach ($package in $packages) {
                $manifest = Join-Path $package.FullName "package.json"
                if (Test-Path -LiteralPath $manifest) {
                    $json = Get-Content -LiteralPath $manifest -Raw -Encoding UTF8 | ConvertFrom-Json
                    if ($json.name -and (Test-OldCkeditor $json.name $json.version)) {
                        Write-Log "  node_modules: $($json.name)@$($json.version)  ($($package.FullName))"
                        $removedModules++
                        if ($Apply) { Remove-Item -LiteralPath $package.FullName -Recurse -Force }
                        continue
                    }
                }
                $nested = Join-Path $package.FullName "node_modules"
                if (Test-Path -LiteralPath $nested) { $queue.Enqueue($nested) }
            }
        }
    }
    Write-Log "[2/3] node_modules 이전 CKEditor: $removedModules 개 $(if ($Apply) { '삭제' } else { '삭제 예정' })"
}

# ---------- 3) pnpm store ----------
$removedIndexes = 0; $removedFiles = 0
if (-not $SkipStore) {
    if ([string]::IsNullOrWhiteSpace($StoreDir)) {
        # 웹 위치의 pnpm 설정(.npmrc store-dir 등)을 따르도록 첫 웹 위치에서 묻는다(8-dev\front가 있으면 그곳).
        $askAt = @($webRoots | Where-Object { $_ -like '*\8-dev\front' }) + @($webRoots) | Select-Object -First 1
        if ($askAt) { Push-Location $askAt }
        try { $StoreDir = (& pnpm store path).Trim() } finally { if ($askAt) { Pop-Location } }
    }
    $filesRoot = Join-Path $StoreDir "files"
    if (-not (Test-Path -LiteralPath $filesRoot -PathType Container)) {
        # 앞 단계 결과와 로그는 남기고 store 단계만 건너뛴다.
        Write-Log "  pnpm store 없음(건너뜀): $StoreDir — -StoreDir로 store 경로(…\v3)를 직접 주세요."
        $SkipStore = $true
    }
}
if (-not $SkipStore) {
    $StoreDir = (Resolve-Path -LiteralPath $StoreDir).Path
    $filesRoot = Join-Path $StoreDir "files"
    Write-Log "  pnpm store: $StoreDir"
    $toHex = { param([string]$integrity)
        $bytes = [Convert]::FromBase64String($integrity.Substring(7))
        ([BitConverter]::ToString($bytes) -replace '-', '').ToLowerInvariant() }
    $integrityPattern = [regex]'"integrity":"(sha512-[A-Za-z0-9+/=]+)"'
    $oldIndexes = New-Object System.Collections.Generic.List[string]
    $oldHashes = New-Object 'System.Collections.Generic.HashSet[string]'
    $keepHashes = New-Object 'System.Collections.Generic.HashSet[string]'
    foreach ($index in Get-ChildItem -LiteralPath $filesRoot -Recurse -File -Filter "*-index.json") {
        $text = [IO.File]::ReadAllText($index.FullName)
        $head = [regex]::Match($text, '"name":"([^"]+)","version":"([^"]+)"')
        $isOld = $head.Success -and (Test-OldCkeditor $head.Groups[1].Value $head.Groups[2].Value)
        if ($isOld) { $oldIndexes.Add($index.FullName); Write-Log "  store: $($head.Groups[1].Value)@$($head.Groups[2].Value)" }
        # if 식으로 대입하면 빈 HashSet이 펼쳐져 $null이 된다. 분기마다 직접 대입한다.
        if ($isOld) { $target = $oldHashes } else { $target = $keepHashes }
        foreach ($match in $integrityPattern.Matches($text)) { [void]$target.Add((& $toHex $match.Groups[1].Value)) }
    }
    foreach ($hash in $oldHashes) {
        if ($keepHashes.Contains($hash)) { continue }   # 다른 패키지도 쓰는 내용 파일은 남긴다
        foreach ($suffix in @("", "-exec")) {
            $file = Join-Path (Join-Path $filesRoot $hash.Substring(0, 2)) ($hash.Substring(2) + $suffix)
            if (Test-Path -LiteralPath $file) { $removedFiles++; if ($Apply) { Remove-Item -LiteralPath $file -Force } }
        }
    }
    foreach ($index in $oldIndexes) { $removedIndexes++; if ($Apply) { Remove-Item -LiteralPath $index -Force } }
    Write-Log "[3/3] pnpm store 이전 CKEditor: 패키지 $removedIndexes 개·내용 파일 $removedFiles 개 $(if ($Apply) { '삭제' } else { '삭제 예정' })"
}

$logFile = Join-Path $here ("cleanup-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")
$log | Set-Content -LiteralPath $logFile -Encoding UTF8
if (-not $Apply) { Write-Host "미리보기만 했습니다. 지우려면 -Apply를 붙여 다시 실행하세요." }
Write-Host "로그: $logFile"
