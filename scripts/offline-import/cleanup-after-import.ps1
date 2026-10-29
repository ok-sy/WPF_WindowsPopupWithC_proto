<#
POL-15-01 : 배포 범위
■ 폐쇄망: 반입 후 정리(삭제 목록 반영 + 이전 CKEditor 제거)
- in : 이 폴더의 DELETE-SINCE-*.txt(반입본 삭제 목록), CKEDITOR-KEEP.txt(남길 CKEditor 패키지 이름@버전),
       반입 루트(-Root: zero-rule-server·zero-rule-web·popup-frameWork·docs 등이 있는 폴더)
- out: 삭제 목록 파일 삭제, zero-rule-web node_modules와 pnpm store에서 CKEDITOR-KEEP.txt에 없는 CKEditor 패키지 제거, 로그 파일
- 기본은 미리보기(지울 대상만 출력). -Apply를 주면 실제로 지운다.

  1) DELETE-SINCE-*.txt: '#'·빈 줄을 뺀 각 줄은 반입 루트 기준 상대 경로. 있으면 지우고, 그래서 빈 폴더가 되면 폴더도 지운다.
  2) node_modules: 이름에 ckeditor가 들어간 패키지(@ckeditor/*, ckeditor5, @cp949/ckeditor5-custom-build, @types/ckeditor__* 등) 중
     이름@버전이 CKEDITOR-KEEP.txt에 없는 것을 지운다(중첩 node_modules 포함).
  3) pnpm store(v3): 같은 기준의 패키지 색인(*-index.json)을 지우고, 그 패키지만 쓰던 파일을 지운다
     (다른 패키지가 같은 내용 파일을 쓰면 남긴다).

[사용] 반입본을 푼 폴더에서(폐쇄망 PC). 소스 병합·install-pnpm-store.ps1 실행 뒤에 한다.
  .\cleanup-after-import.ps1 -Root D:\경로\반입루트                     # 미리보기
  .\cleanup-after-import.ps1 -Root D:\경로\반입루트 -Apply              # 실제 삭제
  .\cleanup-after-import.ps1 -Root ... -SkipStore                        # pnpm store는 건드리지 않음
  .\cleanup-after-import.ps1 -Root ... -StoreDir D:\pnpm-store\v3        # store 경로 직접 지정
#>
param(
    [Parameter(Mandatory = $true)][string]$Root,
    [string]$WebRoot = "",
    [string]$StoreDir = "",
    [switch]$SkipDelete,
    [switch]$SkipNodeModules,
    [switch]$SkipStore,
    [switch]$Apply
)
$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
$Root = (Resolve-Path -LiteralPath $Root).Path
if ([string]::IsNullOrWhiteSpace($WebRoot)) { $WebRoot = Join-Path $Root "zero-rule-web" }
$mode = if ($Apply) { "삭제" } else { "미리보기" }
$log = New-Object System.Collections.Generic.List[string]
function Write-Log([string]$text) { Write-Host $text; $log.Add($text) }
Write-Log "[$mode] 반입 루트: $Root"

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
        $target = Join-Path $Root ($relative -replace '/', '\')
        if (-not (Test-Path -LiteralPath $target -PathType Leaf)) { continue }
        Write-Log "  삭제 목록: $relative"
        $deleted++
        if ($Apply) {
            Remove-Item -LiteralPath $target -Force
            # 비게 된 상위 폴더 정리(반입 루트까지)
            $parent = Split-Path -Parent $target
            while ($parent.Length -gt $Root.Length -and -not (Get-ChildItem -LiteralPath $parent -Force | Select-Object -First 1)) {
                Remove-Item -LiteralPath $parent -Force
                $parent = Split-Path -Parent $parent
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

# ---------- 2) node_modules ----------
$removedModules = 0
if (-not $SkipNodeModules) {
    $nodeModules = Join-Path $WebRoot "node_modules"
    if (Test-Path -LiteralPath $nodeModules) {
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
                        Write-Log "  node_modules: $($json.name)@$($json.version)  ($($package.FullName.Substring($WebRoot.Length + 1)))"
                        $removedModules++
                        if ($Apply) { Remove-Item -LiteralPath $package.FullName -Recurse -Force }
                        continue
                    }
                }
                $nested = Join-Path $package.FullName "node_modules"
                if (Test-Path -LiteralPath $nested) { $queue.Enqueue($nested) }
            }
        }
    } else { Write-Log "  node_modules 없음: $nodeModules" }
    Write-Log "[2/3] node_modules 이전 CKEditor: $removedModules 개 $(if ($Apply) { '삭제' } else { '삭제 예정' })"
}

# ---------- 3) pnpm store ----------
$removedIndexes = 0; $removedFiles = 0
if (-not $SkipStore) {
    if ([string]::IsNullOrWhiteSpace($StoreDir)) {
        Push-Location $WebRoot
        try { $StoreDir = (& pnpm store path).Trim() } finally { Pop-Location }
    }
    $filesRoot = Join-Path $StoreDir "files"
    if (-not (Test-Path -LiteralPath $filesRoot)) { throw "pnpm store(v3) files 폴더 없음: $filesRoot" }
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
