<#
  POL-03-02 : 문단·글자 서식
  ■ [TODO28-15] 설치 글꼴을 WPF가 보는 패밀리·서체·굵기로 나열
  - in : -Filter 패밀리 이름 일부(예: Youandi). 생략하면 전체.
         -Path 글꼴 파일(.ttf/.otf) 또는 폴더(2026-11-24). 주면 설치 글꼴 대신 그 파일들을 WPF가 묶는 방식 그대로 읽는다(설치 불필요).
  - out: 콘솔 표 1 — Family(WPF FontFamily 이름 = runs[].font에 넣을 값), Face, Weight, Style, Win32Family(GDI 패밀리), FullName(웹 local() 이름)
         콘솔 표 2 — 패밀리별로 일반(400)·굵게(700)를 요청했을 때 WPF가 실제로 고르는 서체와 인위적 굵게(BoldSim) 여부(2026-11-24)
  - 폐쇄망 PC에서 회사 글꼴의 일반체·굵은체가 같은 Windows 패밀리에 묶여 있는지 확인한다.
    같은 Family 안에 Normal(400)과 Bold(700)이 함께 보이면 기존 계약(font + bold)으로 웹·WPF가 같은 서체를 고른다.
    굵은체가 다른 Family로만 보이면 TODO28 §15의 '전달 표현 결정' 대상이다.
  - Windows PowerShell 5.1 기본 실행(추가 설치 없음):
      powershell -ExecutionPolicy Bypass -File scripts\list-wpf-font-faces.ps1 -Filter Youandi
      powershell -ExecutionPolicy Bypass -File scripts\list-wpf-font-faces.ps1 -Path C:onts\Youandi_Modern_TextBold.ttf, C:onts\Youandi_Modern_TextRegular.ttf  (폴더도 가능)
  - BoldSim = True면 그 패밀리에 굵은 서체가 없어 WPF가 일반 서체를 인위적으로 굵게 그린다(웹 faces.bold 실제 서체와 달라짐 → boldFamily 검토).
#>
param([string]$Filter = '', [string[]]$Path = @())

Add-Type -AssemblyName PresentationCore
# FamilyNames·FaceNames는 XmlLanguage 키, GlyphTypeface.Win32*Names는 CultureInfo 키를 쓴다.
$enXml = [System.Windows.Markup.XmlLanguage]::GetLanguage('en-us')
$enCulture = [System.Globalization.CultureInfo]::GetCultureInfo('en-US')
function Get-LocalizedName($names) {
    foreach ($key in $names.Keys) {
        if (($key -is [System.Windows.Markup.XmlLanguage] -and $key -eq $enXml) -or ($key -is [System.Globalization.CultureInfo] -and $key -eq $enCulture)) { return $names[$key] }
    }
    foreach ($value in $names.Values) { return $value }
    return ''
}

$families = @()
if ($Path.Count -gt 0) {
    # 파일·폴더를 각각 임시 폴더에 모아 WPF Fonts.GetFontFamilies로 읽는다(같은 폴더의 서체는 설치했을 때처럼 패밀리로 묶인다).
    $temp = Join-Path ([System.IO.Path]::GetTempPath()) ("wpf-font-faces-" + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Force $temp | Out-Null
    # -File 실행에서는 쉼표 목록이 한 문자열로 들어오므로 직접 나눈다.
    foreach ($item in ($Path | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
        if (Test-Path $item -PathType Container) { Get-ChildItem $item -File | Where-Object { $_.Extension -in '.ttf', '.otf', '.ttc' } | Copy-Item -Destination $temp }
        else { Copy-Item $item -Destination $temp }
    }
    $families = [System.Windows.Media.Fonts]::GetFontFamilies($temp + '\')
}
else { $families = [System.Windows.Media.Fonts]::SystemFontFamilies }

$rows = foreach ($family in $families) {
    $familyName = Get-LocalizedName $family.FamilyNames
    if ($Filter -and $familyName -notlike "*$Filter*") { continue }
    foreach ($typeface in $family.GetTypefaces()) {
        $glyph = $null
        $win32 = ''
        $full = ''
        if ($typeface.TryGetGlyphTypeface([ref]$glyph)) { $win32 = Get-LocalizedName $glyph.Win32FamilyNames; $full = ($win32 + ' ' + (Get-LocalizedName $glyph.Win32FaceNames)) -replace ' Regular$', '' }
        [pscustomobject]@{
            Family      = $familyName
            Face        = Get-LocalizedName $typeface.FaceNames
            Weight      = $typeface.Weight.ToOpenTypeWeight()
            Style       = $typeface.Style
            Win32Family = $win32
            FullName    = $full
        }
    }
}
$rows | Sort-Object Family, Weight, Style | Format-Table -AutoSize

# 일반(400)·굵게(700) 요청 시 WPF가 고르는 서체. runs[].font = Family, bold = 굵게 요청.
$picks = foreach ($family in $families) {
    $familyName = Get-LocalizedName $family.FamilyNames
    if ($Filter -and $familyName -notlike "*$Filter*") { continue }
    foreach ($request in @(@{ Name = 'Normal(400)'; Weight = [System.Windows.FontWeights]::Normal }, @{ Name = 'Bold(700)'; Weight = [System.Windows.FontWeights]::Bold })) {
        $typeface = New-Object System.Windows.Media.Typeface($family, [System.Windows.FontStyles]::Normal, $request.Weight, [System.Windows.FontStretches]::Normal)
        $glyph = $null
        $face = ''
        if ($typeface.TryGetGlyphTypeface([ref]$glyph)) { $face = (Get-LocalizedName $glyph.FaceNames) + ' (' + $glyph.Weight.ToOpenTypeWeight() + ')' }
        [pscustomobject]@{ Family = $familyName; Request = $request.Name; PickedFace = $face; BoldSim = $typeface.IsBoldSimulated }
    }
}
$picks | Sort-Object Family, Request -Descending | Format-Table -AutoSize
if ($temp) { Remove-Item -Recurse -Force $temp -ErrorAction SilentlyContinue }
