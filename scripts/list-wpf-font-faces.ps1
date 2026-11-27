<#
  POL-03-02 : 문단·글자 서식
  ■ [TODO28-15] 설치 글꼴을 WPF가 보는 패밀리·서체·굵기로 나열
  - in : -Filter 패밀리 이름 일부(예: Youandi). 생략하면 전체.
  - out: 콘솔 표 — Family(WPF FontFamily 이름 = runs[].font에 넣을 값), Face, Weight, Style, Win32Family(GDI 패밀리),
         Strike·StrikeThk·Underline(글꼴의 취소선 위치·두께, 밑줄 위치, em, 기준선 위가 +), Check, File
  - [TODO62-5, 2026-11-28] 취소선 위치 확인: WPF 실제 팝업은 TextDecorations.Strikethrough를 이 글꼴 값(Strike) 그대로 그린다.
    보통 0.25~0.33em(글자 가운데)이며, 0.15 미만·0.45 초과면 Check에 '취소선 위치 이상'을 표시한다(글자 아래·윗부분에 그려짐).
    폐쇄망 확인: powershell -ExecutionPolicy Bypass -File scripts\list-wpf-font-faces.ps1 -Filter Youandi  (Noto·Malgun도 각각)
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
        $strike = $typeface.StrikethroughPosition
        [pscustomobject]@{
            Family      = $familyName
            Face        = Get-LocalizedName $typeface.FaceNames
            Weight      = $typeface.Weight.ToOpenTypeWeight()
            Style       = $typeface.Style
            Win32Family = $win32
            Strike      = [math]::Round($strike, 4)
            StrikeThk   = [math]::Round($typeface.StrikethroughThickness, 4)
            Underline   = [math]::Round($typeface.UnderlinePosition, 4)
            Check       = if ($strike -lt 0.15 -or $strike -gt 0.45) { '취소선 위치 이상' } else { '' }
            File        = if ($glyph) { [System.IO.Path]::GetFileName($glyph.FontUri.LocalPath) } else { '' }
        }
    }
}
# 열이 많아 콘솔 폭에서 잘리지 않게 넓게 출력한다. 파일로 남기려면 끝에 '> fonts.txt'.
$rows | Sort-Object Family, Weight, Style | Format-Table -AutoSize | Out-String -Width 400
