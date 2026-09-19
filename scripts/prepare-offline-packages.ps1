$ErrorActionPreference = "Stop"

# Run this script on an Internet-connected Windows PC.
# It downloads WebView2 and win-x64 runtime packs required by the WPF project,
# then copies the original .nupkg files into offline-packages/nuget.

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$solutionPath = Join-Path $repositoryRoot "popup-frameWork\Popup.slnx"
$downloadCache = Join-Path $repositoryRoot ".offline-cache\online-download"
$verifyCache = Join-Path $repositoryRoot ".offline-verify\packages"
$offlineFeed = Join-Path $repositoryRoot "offline-packages\nuget"
$offlineConfig = Join-Path $repositoryRoot "NuGet.config"

if (-not (Test-Path $solutionPath)) {
    throw "WPF solution not found: $solutionPath"
}

$sdkVersion = (& dotnet --version).Trim()
if ($sdkVersion -ne "10.0.400") {
    throw ".NET SDK 10.0.400 is required. Current version: $sdkVersion"
}

New-Item -ItemType Directory -Force -Path $downloadCache | Out-Null
New-Item -ItemType Directory -Force -Path $verifyCache | Out-Null
New-Item -ItemType Directory -Force -Path $offlineFeed | Out-Null

Write-Host "[1/3] Restoring win-x64 packages from NuGet"
dotnet restore $solutionPath `
    --runtime win-x64 `
    --packages $downloadCache `
    --source "https://api.nuget.org/v3/index.json" `
    --force

Write-Host "[2/3] Copying original .nupkg files into the repository feed"
$packages = Get-ChildItem $downloadCache -Recurse -File -Filter "*.nupkg"
if ($packages.Count -eq 0) {
    throw "No .nupkg files were found. Check the restore output."
}

foreach ($package in $packages) {
    Copy-Item $package.FullName `
        (Join-Path $offlineFeed $package.Name) `
        -Force
}

Write-Host "[3/3] Verifying restore with the offline feed only"
dotnet restore $solutionPath `
    --runtime win-x64 `
    --packages $verifyCache `
    --configfile $offlineConfig `
    --force

Write-Host "Completed: collected $($packages.Count) packages and verified offline restore."
Write-Host "Next: add the .nupkg files under offline-packages/nuget to Git."
