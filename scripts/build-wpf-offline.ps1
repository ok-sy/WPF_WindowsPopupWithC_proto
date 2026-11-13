param(
    # Publish a single self-contained popupSample.exe (runtime, appsettings.json and Demo media embedded)
    # into popup-frameWork\publish\win-x64-single instead of the multi-file folder output.
    # WebView2 Runtime is still required on the target PC.
    [switch]$SingleFile,
    # [Design 75] Development build: allow appsettings.json next to the EXE and app environment variables
    # (POPUP_DEV_USER_ID, WPF_POPUP_TRAY_ENABLED, WPF_POPUP_AUTOSTART_ENABLED). Default (production) uses
    # only the embedded appsettings.json. Output goes to a separate "-dev" folder so the two EXEs are not mixed.
    [switch]$DevConfig
)

$ErrorActionPreference = "Stop"

# Run this script on the isolated Windows development PC.
# NuGet.config removes remote feeds, so restore and publish stay offline.

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$projectPath = Join-Path $repositoryRoot "popup-frameWork\Popup\Popup.csproj"
$offlineConfig = Join-Path $repositoryRoot "NuGet.config"
$packageCache = Join-Path $repositoryRoot ".offline-cache\packages"
$publishFolder = if ($SingleFile) { "win-x64-single" } else { "win-x64" }
if ($DevConfig) { $publishFolder = "$publishFolder-dev" }
$publishPath = Join-Path $repositoryRoot "popup-frameWork\publish\$publishFolder"

# Same settings as Properties\PublishProfiles\FolderProfile.pubxml. Reference documentation (.xml) files are excluded
# so the output folder contains only the EXE.
$singleFileArguments = @()
if ($SingleFile) {
    $singleFileArguments = @(
        "-p:PublishSingleFile=true",
        "-p:IncludeNativeLibrariesForSelfExtract=true",
        "-p:EnableCompressionInSingleFile=true",
        "-p:DebugType=None",
        "-p:DebugSymbols=false",
        "-p:AllowedReferenceRelatedFileExtensions=.pdb"
    )
}

# Production is the default: never pass PopupAllowExternalConfig=true unless -DevConfig is given.
$profileArguments = @("-p:PopupAllowExternalConfig=$(if ($DevConfig) { 'true' } else { 'false' })")

$sdkVersion = (& dotnet --version).Trim()
if ($sdkVersion -ne "10.0.400") {
    throw ".NET SDK 10.0.400 is required. Current version: $sdkVersion"
}

Write-Host "[1/2] Restoring from repository-local NuGet packages"
# Restore the WPF project only: Popup.slnx also lists the dev-only MockSso, which the offline package no longer ships (2026-11-03).
dotnet restore $projectPath `
    --runtime win-x64 `
    --packages $packageCache `
    --configfile $offlineConfig `
    --force
if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed ($LASTEXITCODE)" }

$mode = if ($SingleFile) { "single EXE" } else { "folder" }
$mode = "$mode, $(if ($DevConfig) { 'DEV config (external settings allowed)' } else { 'PROD config (embedded settings only)' })"
Write-Host "[2/2] Publishing win-x64 self-contained output ($mode)"
dotnet publish $projectPath `
    --configuration Release `
    --runtime win-x64 `
    --self-contained true `
    --no-restore `
    --output $publishPath `
    @singleFileArguments `
    @profileArguments
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed ($LASTEXITCODE)" }

Write-Host "Publish completed: $publishPath"
