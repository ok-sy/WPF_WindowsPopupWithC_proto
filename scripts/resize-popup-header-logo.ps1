# 팝업 헤더 로고 리사이즈: 원본 그림의 여백을 잘라 헤더 로고 칸(100x24, Uniform) 비율의 PNG로 만든다.
# - 입력은 System.Drawing이 읽는 형식(PNG·JPG·BMP)이다. WEBP는 읽지 못하므로 PNG 원본을 쓴다.
# - 배경은 왼쪽 위 픽셀 색으로 판단해 투명하게 바꾼다(-KeepBackground면 유지). 알파가 있는 원본은 투명 영역만 잘라낸다.
# - 출력만 만들고 WPF Resources/HeaderLogo.png, public/images/popup-header-logo.png는 바꾸지 않는다.
#
# 예) powershell -ExecutionPolicy Bypass -File scripts/resize-popup-header-logo.ps1 `
#       -InputPath docs/interfaces/examples/hyundaiCi.png -OutputPath docs/interfaces/examples/hyundaiCi.header.png
param(
    [Parameter(Mandatory = $true)][string]$InputPath,
    [Parameter(Mandatory = $true)][string]$OutputPath,
    # 헤더 로고 칸 크기(WPF PopupWindow.xaml HeaderLogo, PopupPreview 100x24)
    [int]$LogoWidth = 100,
    [int]$LogoHeight = 24,
    # 고해상도 화면을 위한 배율. 4면 400x96으로 저장한다.
    [ValidateRange(1, 8)][int]$Scale = 4,
    # 배경과 같은 색으로 볼 RGB 채널별 허용 차이
    [ValidateRange(0, 255)][int]$Tolerance = 16,
    [switch]$KeepBackground,
    [switch]$Force
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$source = (Resolve-Path -LiteralPath $InputPath).Path
$target = [IO.Path]::GetFullPath($(if ([IO.Path]::IsPathRooted($OutputPath)) { $OutputPath } else { Join-Path (Get-Location).Path $OutputPath }))
if ($source -ieq $target) { throw '입력과 출력 경로가 같습니다. 원본을 덮어쓰지 않습니다.' }
if ((Test-Path -LiteralPath $target) -and -not $Force) { throw "출력 파일이 이미 있습니다. 덮어쓰려면 -Force: $target" }

$original = [Drawing.Image]::FromFile($source)
$canvas = $null; $output = $null; $graphics = $null
try {
    # 어떤 픽셀 형식이든 같은 방식으로 읽도록 32bpp ARGB로 옮긴다.
    $canvas = New-Object Drawing.Bitmap($original.Width, $original.Height, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $copy = [Drawing.Graphics]::FromImage($canvas)
    $copy.DrawImage($original, 0, 0, $original.Width, $original.Height)
    $copy.Dispose()

    $background = $canvas.GetPixel(0, 0)
    $isBackground = {
        param($pixel)
        if ($pixel.A -eq 0) { return $true }
        return $background.A -ne 0 `
            -and [Math]::Abs($pixel.R - $background.R) -le $Tolerance `
            -and [Math]::Abs($pixel.G - $background.G) -le $Tolerance `
            -and [Math]::Abs($pixel.B - $background.B) -le $Tolerance
    }

    # 배경이 아닌 픽셀의 영역을 찾고, 필요하면 배경을 투명하게 바꾼다.
    $left = $canvas.Width; $top = $canvas.Height; $right = -1; $bottom = -1
    for ($y = 0; $y -lt $canvas.Height; $y++) {
        for ($x = 0; $x -lt $canvas.Width; $x++) {
            $pixel = $canvas.GetPixel($x, $y)
            if (& $isBackground $pixel) {
                if (-not $KeepBackground) { $canvas.SetPixel($x, $y, [Drawing.Color]::Transparent) }
                continue
            }
            if ($x -lt $left) { $left = $x }; if ($x -gt $right) { $right = $x }
            if ($y -lt $top) { $top = $y }; if ($y -gt $bottom) { $bottom = $y }
        }
    }
    if ($right -lt 0) { throw '배경과 구분되는 그림이 없습니다. -Tolerance를 확인하세요.' }
    $cropWidth = $right - $left + 1; $cropHeight = $bottom - $top + 1

    # 비율을 유지해 칸 안에 넣고 오른쪽 가운데에 둔다(헤더 로고는 오른쪽 정렬).
    $boxWidth = $LogoWidth * $Scale; $boxHeight = $LogoHeight * $Scale
    $ratio = [Math]::Min($boxWidth / $cropWidth, $boxHeight / $cropHeight)
    $drawWidth = [int][Math]::Max(1, [Math]::Round($cropWidth * $ratio))
    $drawHeight = [int][Math]::Max(1, [Math]::Round($cropHeight * $ratio))

    $output = New-Object Drawing.Bitmap($boxWidth, $boxHeight, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [Drawing.Graphics]::FromImage($output)
    if ($KeepBackground) { $graphics.Clear($background) } else { $graphics.Clear([Drawing.Color]::Transparent) }
    $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [Drawing.Drawing2D.CompositingQuality]::HighQuality
    $attributes = New-Object Drawing.Imaging.ImageAttributes
    $attributes.SetWrapMode([Drawing.Drawing2D.WrapMode]::TileFlipXY)
    $destination = New-Object Drawing.Rectangle(($boxWidth - $drawWidth), [int](($boxHeight - $drawHeight) / 2), $drawWidth, $drawHeight)
    $graphics.DrawImage($canvas, $destination, $left, $top, $cropWidth, $cropHeight, [Drawing.GraphicsUnit]::Pixel, $attributes)
    $attributes.Dispose()

    $directory = Split-Path -Parent $target
    if (-not (Test-Path -LiteralPath $directory)) { New-Item -ItemType Directory -Path $directory | Out-Null }
    $output.Save($target, [Drawing.Imaging.ImageFormat]::Png)
    Write-Output ("원본 {0}x{1} / 그림 영역 {2}x{3} / 출력 {4}x{5} (그림 {6}x{7}) -> {8}" -f $original.Width, $original.Height, $cropWidth, $cropHeight, $boxWidth, $boxHeight, $drawWidth, $drawHeight, $target)
}
finally {
    if ($graphics) { $graphics.Dispose() }
    if ($output) { $output.Dispose() }
    if ($canvas) { $canvas.Dispose() }
    $original.Dispose()
}
