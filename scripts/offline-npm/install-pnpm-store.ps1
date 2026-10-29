<#
POL-15-01 : 배포 범위
■ 폐쇄망: CKEditor npm 패키지를 pnpm store에 넣고 오프라인 설치
- in : 이 폴더의 pnpm-store-v3.tgz, 반입한 zero-rule-web(package.json·pnpm-lock.yaml 반영 후)
- out: 폐쇄망 pnpm store에 CKEditor 패키지 추가, zero-rule-web node_modules 설치
- store는 내용 주소 방식이라 같은 파일은 건너뛰고 없는 파일만 추가한다(기존 store 파일을 덮어쓰지 않음).

[사용] 이 폴더에서(폐쇄망 PC, pnpm 9.15.2)
  .\install-pnpm-store.ps1 -WebRoot D:\경로\zero-rule-web           # store 추가 + 오프라인 설치
  .\install-pnpm-store.ps1 -WebRoot D:\경로\zero-rule-web -SkipInstall  # store 추가만
  .\install-pnpm-store.ps1 -StoreDir D:\pnpm-store -WebRoot ...         # store 경로를 직접 지정
#>
param(
    [Parameter(Mandatory = $true)][string]$WebRoot,
    [string]$StoreDir = "",
    [switch]$SkipInstall
)
$ErrorActionPreference = "Stop"
$bundle = $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $WebRoot "pnpm-lock.yaml"))) { throw "zero-rule-web 루트가 아님: $WebRoot" }

# 1) pnpm store 위치(pnpm 9 → store v3). 지정하지 않으면 zero-rule-web 기준 pnpm 설정을 따른다.
if ([string]::IsNullOrWhiteSpace($StoreDir)) {
    Push-Location $WebRoot
    try { $storePath = (& pnpm store path).Trim() } finally { Pop-Location }
    # pnpm store path는 ...\v3까지 돌려준다. 묶음은 v3 폴더를 담고 있으므로 상위 폴더에 푼다.
    if ((Split-Path -Leaf $storePath) -ne "v3") { throw "pnpm store 형식이 v3가 아님: $storePath (pnpm 9.15.2 필요)" }
    $StoreDir = Split-Path -Parent $storePath
}
New-Item -ItemType Directory -Force -Path $StoreDir | Out-Null
Write-Host "[1/3] pnpm store: $StoreDir"

# 2) 임시 폴더에 풀고 없는 파일만 복사(/XC /XN /XO: 이미 있는 파일은 건너뜀)
$temp = Join-Path $env:TEMP ("ckeditor-store-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $temp | Out-Null
try {
    & tar -xzf (Join-Path $bundle "pnpm-store-v3.tgz") -C $temp
    if ($LASTEXITCODE -ne 0) { throw "pnpm-store-v3.tgz 압축 해제 실패" }
    & robocopy (Join-Path $temp "v3") (Join-Path $StoreDir "v3") /E /XC /XN /XO /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "store 복사 실패(robocopy $LASTEXITCODE)" }
    Write-Host "[2/3] CKEditor 패키지를 store에 추가"
}
finally {
    Remove-Item -LiteralPath $temp -Recurse -Force -ErrorAction SilentlyContinue
}

# 3) 오프라인 설치(lockfile 그대로)
if ($SkipInstall) { Write-Host "[3/3] 설치 건너뜀(-SkipInstall)"; return }
Push-Location $WebRoot
try {
    & pnpm install --offline --frozen-lockfile --store-dir $StoreDir
    if ($LASTEXITCODE -ne 0) { throw "pnpm install --offline 실패. 다른 패키지가 store에 없으면 README-NPM.md의 '설치 실패 시'를 확인" }
    $version = (Get-Content -Raw (Join-Path $WebRoot "node_modules\ckeditor5\package.json") | ConvertFrom-Json).version
    Write-Host "[3/3] 설치 완료: ckeditor5 $version"
}
finally { Pop-Location }
