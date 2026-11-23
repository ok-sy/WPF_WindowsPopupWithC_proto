<#
  POL-03-02 : 문단·글자 서식
  ■ [TODO28-15] 설치 글꼴을 WPF가 보는 패밀리·서체·굵기로 나열
  - in : -Filter 패밀리 이름 일부(예: Youandi). 생략하면 전체.
  - out: 콘솔 표 — Family(WPF FontFamily 이름 = runs[].font에 넣을 값), Face, Weight, Style, Win32Family(GDI 패밀리)
  - 폐쇄망 PC에서 회사 글꼴의 일반체·굵은체가 같은 Windows 패밀리에 묶여 있는지 확인한다.
    같은 Family 안에 Normal(400)과 Bold(700)이 함께 보이면 기존 계약(font + bold)으로 웹·WPF가 같은 서체를 고른다.
    굵은체가 다른 Family로만 보이면 TODO28 §15의 '전달 표현 결정' 대상이다.
  - Windows PowerShell 5.1 기본 실행(추가 설치 없음):
      powershell -ExecutionPolicy Bypass -File scripts\list-wpf-font-faces.ps1 -Filter Youandi
#>
param([string]$Filter = '')

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

$rows = foreach ($family in [System.Windows.Media.Fonts]::SystemFontFamilies) {
    $familyName = Get-LocalizedName $family.FamilyNames
    if ($Filter -and $familyName -notlike "*$Filter*") { continue }
    foreach ($typeface in $family.GetTypefaces()) {
        $glyph = $null
        $win32 = ''
        if ($typeface.TryGetGlyphTypeface([ref]$glyph)) { $win32 = Get-LocalizedName $glyph.Win32FamilyNames }
        [pscustomobject]@{
            Family      = $familyName
            Face        = Get-LocalizedName $typeface.FaceNames
            Weight      = $typeface.Weight.ToOpenTypeWeight()
            Style       = $typeface.Style
            Win32Family = $win32
        }
    }
}
$rows | Sort-Object Family, Weight, Style | Format-Table -AutoSize
