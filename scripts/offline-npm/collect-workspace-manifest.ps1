<#
POL-15-01 : 배포 범위
■ 폐쇄망: front_end workspace 의존성 선언 파일 수집(lockfile 불일치 분석용)
- in : 폐쇄망 front_end 루트(pnpm-workspace.yaml이 있는 폴더)
- out: workspace-manifest-<yyyyMMdd-HHmmss>.zip
       (루트·main·sub/* package.json, pnpm-workspace.yaml, .npmrc, pnpm-lock.yaml, env.txt)
- 소스 코드·node_modules는 담지 않는다. 의존성 선언과 도구 버전만 수집한다.
- 결과 zip은 외부망에서 compare-workspace-manifest.ps1로 zero-rule-web과 비교한다.

[사용] 폐쇄망 PC에서
  .\collect-workspace-manifest.ps1 -WebRoot D:\경로\front_end
  .\collect-workspace-manifest.ps1 -WebRoot D:\경로\front_end -OutDir D:\반출
#>
param(
    [Parameter(Mandatory = $true)][string]$WebRoot,
    [string]$OutDir = ""
)
$ErrorActionPreference = "Stop"
$WebRoot = (Get-Item -LiteralPath $WebRoot).FullName   # 8.3 짧은 경로도 실제 경로로 맞춘다
if (-not (Test-Path -LiteralPath (Join-Path $WebRoot "pnpm-workspace.yaml"))) { throw "pnpm workspace 루트가 아님: $WebRoot" }
if ([string]::IsNullOrWhiteSpace($OutDir)) { $OutDir = $PSScriptRoot }

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$temp = Join-Path $env:TEMP ("workspace-manifest-" + $stamp)
New-Item -ItemType Directory -Force -Path $temp | Out-Null
try {
    # 1) 루트 설정 파일(없는 파일은 건너뜀)
    foreach ($name in @("package.json", "pnpm-workspace.yaml", ".npmrc", "pnpm-lock.yaml")) {
        $src = Join-Path $WebRoot $name
        if (Test-Path -LiteralPath $src) { Copy-Item -LiteralPath $src -Destination (Join-Path $temp $name) }
    }

    # 2) workspace 패키지 package.json(main, sub/*). node_modules 하위는 제외
    $count = 0
    $dirs = @(Get-Item -LiteralPath (Join-Path $WebRoot "main") -ErrorAction SilentlyContinue)
    $dirs += @(Get-ChildItem -LiteralPath (Join-Path $WebRoot "sub") -Directory -ErrorAction SilentlyContinue)
    foreach ($dir in $dirs) {
        if ($null -eq $dir) { continue }
        $pj = Join-Path $dir.FullName "package.json"
        if (-not (Test-Path -LiteralPath $pj)) { continue }
        $rel = $dir.FullName.Substring($WebRoot.Length).TrimStart('\')
        $dest = Join-Path $temp $rel
        New-Item -ItemType Directory -Force -Path $dest | Out-Null
        Copy-Item -LiteralPath $pj -Destination (Join-Path $dest "package.json")
        $count++
    }

    # 3) 도구 버전·store 위치
    Push-Location $WebRoot
    try {
        $pnpmVer = try { (& pnpm -v) -join "" } catch { "pnpm 실행 실패" }
        $nodeVer = try { (& node -v) -join "" } catch { "node 실행 실패" }
        $store = try { (& pnpm store path) -join "" } catch { "확인 실패" }
    }
    finally { Pop-Location }
    @(
        "collected=$stamp",
        "webRoot=$WebRoot",
        "pnpm=$pnpmVer",
        "node=$nodeVer",
        "storePath=$store",
        "workspacePackages=$count"
    ) | Set-Content -Encoding utf8 -Path (Join-Path $temp "env.txt")

    $zip = Join-Path $OutDir ("workspace-manifest-" + $stamp + ".zip")
    Compress-Archive -Path (Join-Path $temp "*") -DestinationPath $zip -Force
    Write-Host "수집 완료: $zip (workspace 패키지 $count 개, pnpm $pnpmVer, node $nodeVer)"
}
finally {
    Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
}
