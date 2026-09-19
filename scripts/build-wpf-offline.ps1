$ErrorActionPreference = "Stop"

# Run this script on the isolated Windows development PC.
# NuGet.config removes remote feeds, so restore and publish stay offline.

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$solutionPath = Join-Path $repositoryRoot "popup-frameWork\Popup.slnx"
$projectPath = Join-Path $repositoryRoot "popup-frameWork\Popup\Popup.csproj"
$offlineConfig = Join-Path $repositoryRoot "NuGet.config"
$packageCache = Join-Path $repositoryRoot ".offline-cache\packages"
$publishPath = Join-Path $repositoryRoot "popup-frameWork\publish\win-x64"

$sdkVersion = (& dotnet --version).Trim()
if ($sdkVersion -ne "10.0.400") {
    throw ".NET SDK 10.0.400 is required. Current version: $sdkVersion"
}

Write-Host "[1/2] Restoring from repository-local NuGet packages"
dotnet restore $solutionPath `
    --runtime win-x64 `
    --packages $packageCache `
    --configfile $offlineConfig `
    --force

Write-Host "[2/2] Publishing win-x64 self-contained output"
dotnet publish $projectPath `
    --configuration Release `
    --runtime win-x64 `
    --self-contained true `
    --no-restore `
    --output $publishPath

Write-Host "Publish completed: $publishPath"
