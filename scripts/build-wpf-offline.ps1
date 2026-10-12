param(
    # Publish a single self-contained popupSample.exe (runtime, appsettings.json and Demo media embedded)
    # into popup-frameWork\publish\win-x64-single instead of the multi-file folder output.
    # WebView2 Runtime is still required on the target PC.
    [switch]$SingleFile
)

$ErrorActionPreference = "Stop"

# Run this script on the isolated Windows development PC.
# NuGet.config removes remote feeds, so restore and publish stay offline.

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$solutionPath = Join-Path $repositoryRoot "popup-frameWork\Popup.slnx"
$projectPath = Join-Path $repositoryRoot "popup-frameWork\Popup\Popup.csproj"
$offlineConfig = Join-Path $repositoryRoot "NuGet.config"
$packageCache = Join-Path $repositoryRoot ".offline-cache\packages"
$publishFolder = if ($SingleFile) { "win-x64-single" } else { "win-x64" }
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
if ($LASTEXITCODE -ne 0) { throw "dotnet restore failed ($LASTEXITCODE)" }

$mode = if ($SingleFile) { "single EXE" } else { "folder" }
Write-Host "[2/2] Publishing win-x64 self-contained output ($mode)"
dotnet publish $projectPath `
    --configuration Release `
    --runtime win-x64 `
    --self-contained true `
    --no-restore `
    --output $publishPath `
    @singleFileArguments
if ($LASTEXITCODE -ne 0) { throw "dotnet publish failed ($LASTEXITCODE)" }

Write-Host "Publish completed: $publishPath"
