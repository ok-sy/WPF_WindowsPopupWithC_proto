# 백엔드(zero-rule-server)와 프런트엔드(zero-rule-web)를 각각 별도 PowerShell 창으로 동시에 띄운다.
#
# 실행 (저장소 아무 위치에서):
#   powershell -ExecutionPolicy Bypass -File .\shell\start-dev.ps1              # 기본: 원격 개발 DB(VPN) + 프런트 → http://localhost:8080/zero-rule-server
#   powershell -ExecutionPolicy Bypass -File .\shell\start-dev.ps1 -LocalDb     # 로컬 Oracle XE 21c(POPUP 계정)로 백엔드 기동
#   powershell -ExecutionPolicy Bypass -File .\shell\start-dev.ps1 -SkipFrontend
#
# 백엔드 : .\gradlew :app:bootRun -Pprofile=local  (JndiResource 기본값 = 공통 개발 DB 192.168.114.71:4004/XE, 팝업 테이블은 앱 계정 스키마)
#          -LocalDb 이면 ZERO_RULE_DB_URL/USER/PASSWORD + CUSTOM_POPUP_SCHEMA=POPUP 환경변수를 창에 넣어 로컬 XE로 붙인다.
# 프런트 : pnpm run dev (turbo → next dev, http://localhost:3000). next.config.mjs가 읽는 API_BASE_URL/ROUTER_BASE_URL을
#          창 환경변수로 넣는다(.env 파일이 없어도 동작). node_modules가 없으면 pnpm install을 먼저 실행한다.
# WPF    : 별도. popup-frameWork/Popup/appsettings.json 의 BaseUrl=http://localhost:8080/zero-rule-server/p, DevUserId=E1001.
[CmdletBinding()]
param(
    [switch]$LocalDb,                                            # 로컬 XE 21c로 백엔드 기동
    [string]$LocalDbUrl = 'jdbc:log4jdbc:oracle:thin:@//localhost:1521/XEPDB1',
    [string]$LocalDbUser = 'ZERO_RULE',
    [string]$LocalDbPassword = 'zero_rule',
    [string]$LocalPopupSchema = 'POPUP',                         # 로컬은 별도 POPUP 계정(설계 기본)
    [string]$ApiBaseUrl = 'http://localhost:8080/zero-rule-server',  # 프런트가 호출할 백엔드 주소
    [string]$RouterBaseUrl = '/',
    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot 'zero-rule-server'
$frontendPath = Join-Path $projectRoot 'zero-rule-web'
$powerShellPath = Join-Path $PSHOME 'powershell.exe'

# ---- 사전 점검 -------------------------------------------------------------
if (-not $SkipBackend) {
    if (-not (Test-Path -LiteralPath (Join-Path $backendPath 'gradlew.bat'))) {
        throw "Backend Gradle wrapper was not found: $backendPath"
    }
    # JDK 17: JAVA_HOME이 없으면 표준 설치 경로를 찾아 창에 넣는다.
    $javaHome = $env:JAVA_HOME
    if (-not $javaHome -or -not (Test-Path -LiteralPath (Join-Path $javaHome 'bin/java.exe'))) {
        $candidate = Get-ChildItem 'C:\Program Files\Java' -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($candidate) { $javaHome = $candidate.FullName } else { throw 'JDK 17 not found. Set JAVA_HOME.' }
    }
}
if (-not $SkipFrontend) {
    $pnpmCmd = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
    if (-not $pnpmCmd) { $pnpmCmd = Get-Command pnpm -ErrorAction SilentlyContinue }
    if (-not $pnpmCmd) { throw 'pnpm is missing. Install Node.js 18+ and pnpm (corepack enable).' }
    $pnpmPath = $pnpmCmd.Source
}

function Start-DevWindow {
    param([string]$Title, [string]$Directory, [hashtable]$EnvVars, [string]$Command)
    $lines = @("`$Host.UI.RawUI.WindowTitle = '$Title'")
    foreach ($k in $EnvVars.Keys) {
        $v = [string]$EnvVars[$k]
        $lines += ('$env:{0} = ''{1}''' -f $k, $v.Replace("'", "''"))
    }
    $lines += ("Set-Location -LiteralPath '{0}'" -f $Directory.Replace("'", "''"))
    $lines += $Command
    $windowCommand = $lines -join '; '
    $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($windowCommand))
    Start-Process -FilePath $powerShellPath -WorkingDirectory $Directory -WindowStyle Normal `
        -ArgumentList @('-NoProfile', '-NoExit', '-EncodedCommand', $encodedCommand) | Out-Null
}

# ---- 백엔드 --------------------------------------------------------------------
if (-not $SkipBackend) {
    $backendEnv = @{ JAVA_HOME = $javaHome }
    if ($LocalDb) {
        # JndiResource(추가 분기)·MyBatisConfig(custom.popup.schema)가 읽는 환경변수
        $backendEnv.ZERO_RULE_DB_URL = $LocalDbUrl
        $backendEnv.ZERO_RULE_DB_USER = $LocalDbUser
        $backendEnv.ZERO_RULE_DB_PASSWORD = $LocalDbPassword
        $backendEnv.CUSTOM_POPUP_SCHEMA = $LocalPopupSchema
        $dbLabel = "local XE ($LocalDbUrl, popup schema=$LocalPopupSchema)"
    } else {
        $dbLabel = 'remote dev DB 192.168.114.71:4004/XE (VPN required, popup tables in app schema)'
    }
    Start-DevWindow -Title "Popup Backend - bootRun [$dbLabel]" -Directory $backendPath -EnvVars $backendEnv `
        -Command 'Write-Host "DB: ' + $dbLabel + '" -ForegroundColor Cyan; & .\gradlew.bat :app:bootRun -Pprofile=local'
    Write-Host "Backend  -> http://localhost:8080/zero-rule-server  [$dbLabel]"
}

# ---- 프런트엔드 --------------------------------------------------------------
if (-not $SkipFrontend) {
    $frontendEnv = @{ API_BASE_URL = $ApiBaseUrl; ROUTER_BASE_URL = $RouterBaseUrl }
    $escapedPnpm = $pnpmPath.Replace("'", "''")
    $install = ''
    if (-not (Test-Path -LiteralPath (Join-Path $frontendPath 'node_modules'))) {
        Write-Host 'Frontend node_modules missing -> pnpm install will run first.' -ForegroundColor Yellow
        $install = "& '$escapedPnpm' install; "
    }
    Start-DevWindow -Title "Popup Frontend - pnpm dev [API $ApiBaseUrl]" -Directory $frontendPath -EnvVars $frontendEnv `
        -Command ($install + "& '$escapedPnpm' run dev --env-mode=loose")
    Write-Host "Frontend -> http://localhost:3000  (API_BASE_URL=$ApiBaseUrl)"
}

Write-Host 'Opened terminals. Check each window for startup logs. Press Ctrl+C in each window to stop.'
