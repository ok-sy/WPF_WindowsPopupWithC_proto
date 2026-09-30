param([string]$OutputPath = 'docs/interfaces/WPF_Popup_API_Interface_v3.5.docx')
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
if (-not [IO.Path]::IsPathRooted($OutputPath)) { $OutputPath = Join-Path $repo $OutputPath }
& node (Join-Path $PSScriptRoot 'export-interface-word.cjs') $OutputPath
if ($LASTEXITCODE -ne 0) { throw 'Word document generation failed.' }