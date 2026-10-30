<#
POL-15-01 : 배포 범위
■ 외부망: 폐쇄망 front_end 의존성 선언과 zero-rule-web 비교(lockfile 불일치 분석용)
- in : collect-workspace-manifest.ps1이 만든 zip(또는 압축을 푼 폴더), 외부망 zero-rule-web
- out: <OutDir>\workspace-diff.csv (workspace × 패키지별 비교표), 콘솔 요약
- 비교 항목
  · 폐쇄망 package.json 범위 / 외부망 package.json 범위 / 외부망 lockfile 해결 버전
  · 폐쇄망 lockfile specifier·해결 버전(폐쇄망 lockfile을 함께 수집한 경우)
  · 상태: 동일 / 범위다름 / 폐쇄망만 / 외부망만
  · 폐쇄망잠금불일치: 폐쇄망 package.json과 반입 대상 lockfile(외부망)의 specifier가 다르면 Y
    → ERR_PNPM_OUTDATED_LOCKFILE을 일으키는 행이다.
- lockfile은 v9/v6 형식(specifier·version 하위 키)과 v5 형식(specifiers 블록)을 읽는다.

[사용] 저장소 루트에서
  .\scripts\offline-npm\compare-workspace-manifest.ps1 -Manifest D:\반입\workspace-manifest-20261030-150000.zip
  .\scripts\offline-npm\compare-workspace-manifest.ps1 -Manifest D:\풀어둔폴더 -OutDir D:\결과
#>
param(
    [Parameter(Mandatory = $true)][string]$Manifest,
    [string]$WebRoot = (Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "zero-rule-web"),
    [string]$OutDir = ""
)
$ErrorActionPreference = "Stop"

# lockfile importers → @{ importer = @{ 패키지 = @{ Spec; Version } } }
function Read-LockImporters([string]$path) {
    $result = @{}
    if (-not (Test-Path -LiteralPath $path)) { return $result }
    $inImporters = $false; $importer = $null; $section = $null; $pkg = $null
    foreach ($line in [System.IO.File]::ReadAllLines($path)) {
        if ($line -eq "importers:") { $inImporters = $true; continue }
        if (-not $inImporters -or $line.Trim() -eq "") { continue }
        if ($line -match '^\S') { break }   # 다음 최상위 키(packages: 등)에서 종료
        if ($line -match "^  (\S.*):$") { $importer = $Matches[1].Trim("'"); $result[$importer] = @{}; continue }
        if ($line -match "^    (\S+):$") { $section = $Matches[1]; $pkg = $null; continue }
        $deps = $result[$importer]
        if ($section -eq "specifiers") {
            # v5: specifiers 블록에 "이름: 범위"
            if ($line -match "^      (\S.*?): (.+)$") {
                $n = $Matches[1].Trim("'"); if (-not $deps[$n]) { $deps[$n] = @{} }
                $deps[$n].Spec = $Matches[2].Trim("'")
            }
            continue
        }
        if ($line -match "^      (\S.*?): (.+)$") {
            # v5: dependencies 블록에 "이름: 해결버전"
            $n = $Matches[1].Trim("'"); if (-not $deps[$n]) { $deps[$n] = @{} }
            $deps[$n].Version = $Matches[2].Trim("'")
            continue
        }
        if ($line -match "^      (\S.*):$") { $pkg = $Matches[1].Trim("'"); if (-not $deps[$pkg]) { $deps[$pkg] = @{} }; continue }
        if ($pkg -and $line -match "^        specifier: (.+)$") { $deps[$pkg].Spec = $Matches[1].Trim("'"); continue }
        if ($pkg -and $line -match "^        version: (.+)$") { $deps[$pkg].Version = $Matches[1].Trim("'"); continue }
    }
    return $result
}

# workspace 루트 → @{ importer = @{ 패키지 = 범위 } } (lockfile importer 이름 규칙: ".", "main", "sub/ui")
function Read-Manifests([string]$root) {
    $result = @{}
    $root = (Get-Item -LiteralPath $root).FullName   # 8.3 짧은 경로(ADMINI~1)를 실제 경로로 맞춘다
    $files = @(Get-Item -LiteralPath (Join-Path $root "package.json"))
    $files += @(Get-ChildItem -LiteralPath $root -Recurse -Filter package.json |
        Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.DirectoryName -ne $root })
    foreach ($f in $files) {
        $rel = $f.DirectoryName.Substring($root.Length).TrimStart('\').Replace('\', '/')
        if ($rel -eq "") { $rel = "." }
        if ($rel -ne "." -and $rel -ne "main" -and $rel -notmatch '^sub/[^/]+$') { continue }
        $json = Get-Content -Raw -Encoding utf8 -LiteralPath $f.FullName | ConvertFrom-Json
        $deps = @{}
        foreach ($sec in @("dependencies", "devDependencies", "optionalDependencies")) {
            if ($json.$sec) { $json.$sec.PSObject.Properties | ForEach-Object { $deps[$_.Name] = [string]$_.Value } }
        }
        $result[$rel] = $deps
    }
    return $result
}

# 1) 폐쇄망 수집본 준비(zip이면 임시 폴더에 해제)
$temp = $null
if ((Test-Path -LiteralPath $Manifest -PathType Leaf) -and $Manifest -like "*.zip") {
    $temp = Join-Path $env:TEMP ("workspace-diff-" + [guid]::NewGuid().ToString("N"))
    Expand-Archive -LiteralPath $Manifest -DestinationPath $temp
    $closedRoot = $temp
}
else { $closedRoot = (Resolve-Path -LiteralPath $Manifest).Path }
$WebRoot = (Resolve-Path -LiteralPath $WebRoot).Path
if ([string]::IsNullOrWhiteSpace($OutDir)) { $OutDir = Split-Path -Parent (Resolve-Path -LiteralPath $Manifest).Path }

try {
    $closedPkg = Read-Manifests $closedRoot
    $closedLock = Read-LockImporters (Join-Path $closedRoot "pnpm-lock.yaml")
    $extPkg = Read-Manifests $WebRoot
    $extLock = Read-LockImporters (Join-Path $WebRoot "pnpm-lock.yaml")

    # 2) workspace × 패키지 비교표
    $rows = New-Object System.Collections.Generic.List[object]
    $importers = @($closedPkg.Keys) + @($extPkg.Keys) | Sort-Object -Unique
    foreach ($imp in $importers) {
        $c = if ($closedPkg[$imp]) { $closedPkg[$imp] } else { @{} }
        $e = if ($extPkg[$imp]) { $extPkg[$imp] } else { @{} }
        $cl = if ($closedLock[$imp]) { $closedLock[$imp] } else { @{} }
        $el = if ($extLock[$imp]) { $extLock[$imp] } else { @{} }
        foreach ($name in (@($c.Keys) + @($e.Keys) | Sort-Object -Unique)) {
            $status = if (-not $e.ContainsKey($name)) { "폐쇄망만" }
                elseif (-not $c.ContainsKey($name)) { "외부망만" }
                elseif ($c[$name] -ceq $e[$name]) { "동일" } else { "범위다름" }
            # 반입 lockfile(외부망)이 폐쇄망 package.json 선언을 그대로 담고 있는가
            $lockSpec = if ($el[$name]) { $el[$name].Spec } else { $null }
            $outdated = if ($c.ContainsKey($name) -and $lockSpec -cne $c[$name]) { "Y" } else { "" }
            $rows.Add([pscustomobject]@{
                Workspace         = $imp
                Package           = $name
                Status            = $status
                ClosedSpec        = $c[$name]
                ExternalSpec      = $e[$name]
                ExternalLockVer   = if ($el[$name]) { $el[$name].Version } else { "" }
                ClosedLockSpec    = if ($cl[$name]) { $cl[$name].Spec } else { "" }
                ClosedLockVer     = if ($cl[$name]) { $cl[$name].Version } else { "" }
                ClosedLockOutdated = $outdated
            })
        }
    }

    New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
    $csv = Join-Path $OutDir "workspace-diff.csv"
    $rows | Export-Csv -NoTypeInformation -Encoding UTF8 -Path $csv

    # 3) 콘솔 요약
    $envFile = Join-Path $closedRoot "env.txt"
    if (Test-Path -LiteralPath $envFile) { Write-Host "[폐쇄망 환경]"; Get-Content -LiteralPath $envFile | ForEach-Object { Write-Host "  $_" } }
    Write-Host "[workspace별 요약]"
    $rows | Group-Object Workspace | ForEach-Object {
        $g = $_.Group
        Write-Host ("  {0,-20} 동일 {1,4} / 범위다름 {2,4} / 폐쇄망만 {3,4} / 외부망만 {4,4} / 잠금불일치 {5,4}" -f $_.Name,
            @($g | Where-Object Status -eq "동일").Count, @($g | Where-Object Status -eq "범위다름").Count,
            @($g | Where-Object Status -eq "폐쇄망만").Count, @($g | Where-Object Status -eq "외부망만").Count,
            @($g | Where-Object ClosedLockOutdated -eq "Y").Count)
    }
    $missing = @($closedPkg.Keys | Where-Object { -not $extPkg.ContainsKey($_) })
    if ($missing.Count -gt 0) { Write-Host "  외부망에 없는 폐쇄망 workspace: $($missing -join ', ')" }
    Write-Host "비교표: $csv"
}
finally {
    if ($temp) { Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue }
}
