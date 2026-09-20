# Run from any directory: powershell -ExecutionPolicy Bypass -File .\shell\start-dev.ps1
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot 'zero-rule-server'
$frontendPath = Join-Path $projectRoot 'zero-rule-web'

if (-not (Test-Path -LiteralPath (Join-Path $backendPath 'gradlew.bat'))) {
    throw 'Backend Gradle wrapper was not found.'
}
if (-not (Test-Path -LiteralPath (Join-Path $frontendPath 'node_modules'))) {
    throw 'Frontend dependencies are missing. Run pnpm install in zero-rule-web first.'
}
if ($env:JAVA_HOME) {
    if (-not (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin/java.exe'))) {
        throw 'JAVA_HOME does not point to a valid Java installation.'
    }
} elseif (-not (Get-Command java.exe -ErrorAction SilentlyContinue)) {
    throw 'Java is missing. Install JDK 17 and configure JAVA_HOME or PATH.'
}
$pnpmPath = (Get-Command pnpm.cmd -ErrorAction Stop).Source
$powerShellPath = Join-Path $PSHOME 'powershell.exe'

function Start-DevWindow {
    param([string]$Title, [string]$Directory, [string]$Command)
    $escapedDirectory = $Directory.Replace("'", "''")
    $windowCommand = "`$Host.UI.RawUI.WindowTitle = '$Title'; Set-Location -LiteralPath '$escapedDirectory'; $Command"
    $encodedCommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($windowCommand))
    Start-Process -FilePath $powerShellPath -WorkingDirectory $Directory -WindowStyle Normal -ArgumentList @('-NoProfile', '-NoExit', '-EncodedCommand', $encodedCommand) | Out-Null
}

Start-DevWindow -Title 'Popup Backend - bootRun' -Directory $backendPath -Command '& .\gradlew.bat :app:bootRun -Pprofile=local'
$escapedPnpmPath = $pnpmPath.Replace("'", "''")
Start-DevWindow -Title 'Popup Frontend - pnpm dev' -Directory $frontendPath -Command "& '$escapedPnpmPath' run dev"
Write-Host 'Opened backend and frontend terminals. Check each window for startup logs. Press Ctrl+C in each window to stop.'
