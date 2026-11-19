using System.IO;
using System.Text.Json;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Popup.Dtos;
using Popup.Factories;
using Popup.Views.Windows;

/*
 * POL-16-02 : 재현 가능한 검증
 * ■ 관리자 미리보기·WPF 나란히 비교용 WPF 캡처(2026-11-17)
 * - in : args[0] WPF 응답 형식 팝업 배열 JSON 파일, args[1] 출력 폴더
 * - out: <출력 폴더>/<popupId>.wpf.png(창 내용, 96 DPI = 100% 논리 크기), <popupId>.wpf.json(창 크기·주요 요소 크기,
 *         texts = 보이는 글자 요소별 글자·크기·굵기·패밀리·흰 판 기준 위치, regions = 헤더·본문·푸터·버튼 상자, TODO61-20)
 * - 서버 응답과 같은 JSON을 PopupFactory로 만들고 실제 PopupWindow를 띄워 그린다. Overlay·Demo 미디어는 쓰지 않는다.
 *   주 모니터 배율과 관계없이 96 DPI로 렌더링해 웹 CSS px(deviceScaleFactor 1)와 같은 논리 크기로 비교한다.
 */
internal static class Program
{
    [STAThread]
    private static int Main(string[] args)
    {
        if (args.Length < 2) { Console.Error.WriteLine("usage: PopupParityCapture <popups.json> <outDir>"); return 2; }
        var json = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var popups = JsonSerializer.Deserialize<List<PopupResponseDto>>(File.ReadAllText(args[0]), json)!;
        Directory.CreateDirectory(args[1]);
        foreach (var dto in popups)
        {
            var options = PopupFactory.Create(dto);
            options.UseBackgroundOverlay = false;
            var window = new PopupWindow(options) { ShowActivated = false, Left = 0, Top = 0 };
            window.Show();
            window.UpdateLayout();
            // 레이아웃·지연 로드(서식 문단 기울임 여유, 로컬 이미지 디코딩 등)가 끝나도록 대기열을 비운다.
            for (int i = 0; i < 5; i++)
            {
                window.Dispatcher.Invoke(() => { }, System.Windows.Threading.DispatcherPriority.ApplicationIdle);
                Thread.Sleep(100);
            }
            window.UpdateLayout();
            var root = (FrameworkElement)window.Content;
            // 창 전체(그림자용 바깥 여백 포함)를 그대로 그린 뒤 흰 판(PopupOuterGrid 안쪽)만 잘라 낸다. 배율 변환 없음.
            var outer = (FrameworkElement)window.FindName("PopupOuterGrid");
            int windowWidth = (int)Math.Ceiling(window.ActualWidth), windowHeight = (int)Math.Ceiling(window.ActualHeight);
            var full = new RenderTargetBitmap(windowWidth, windowHeight, 96, 96, PixelFormats.Pbgra32);
            full.Render(window);
            var m = outer.Margin;
            int width = (int)Math.Round(outer.ActualWidth), height = (int)Math.Round(outer.ActualHeight);
            BitmapSource bitmap = new CroppedBitmap(full, new Int32Rect((int)m.Left, (int)m.Top, Math.Min(width, windowWidth - (int)m.Left), Math.Min(height, windowHeight - (int)m.Top)));
            var encoder = new PngBitmapEncoder();
            encoder.Frames.Add(BitmapFrame.Create(bitmap));
            using (var file = File.Create(Path.Combine(args[1], dto.PopupId + ".wpf.png"))) encoder.Save(file);
            File.WriteAllText(Path.Combine(args[1], dto.PopupId + ".wpf.json"), JsonSerializer.Serialize(new
            {
                window = new { width = window.ActualWidth, height = window.ActualHeight },
                content = new { width, height, margin = m.Left },
                choices = Descendants(root).OfType<System.Windows.Controls.Primitives.ToggleButton>()
                    .Select(c => new { name = System.Windows.Automation.AutomationProperties.GetName(c), c.ActualWidth, c.ActualHeight, c.FontSize }),
                // TODO61-20: 같은 글자끼리 웹과 대조할 수 있도록 보이는 TextBlock 전부(흰 판 기준 좌표).
                // 서식 문단(Inlines)은 Text가 비어 있으므로 Run 글자를 이어 붙이고, Run이 여럿이면 Run마다도 남긴다(웹 span과 대조).
                texts = Descendants(outer).OfType<System.Windows.Controls.TextBlock>()
                    .Where(t => t.IsVisible && t.ActualWidth > 0)
                    .SelectMany(t =>
                    {
                        var runs = t.Inlines.OfType<System.Windows.Documents.Run>().ToList();
                        string text = string.IsNullOrEmpty(t.Text) ? string.Concat(t.Inlines.Select(i => i is System.Windows.Documents.Run r ? r.Text : i is System.Windows.Documents.LineBreak ? "\n" : "")) : t.Text;
                        // Run이 하나뿐이면 그 Run의 실제 크기·굵기·패밀리가 표시값이다(문단 TextBlock 값은 본문 기본값).
                        var style = runs.Count == 1 ? (System.Windows.Documents.TextElement)runs[0] : null;
                        var own = new[] { new { text = text.Trim(), size = style?.FontSize ?? t.FontSize, weight = (style?.FontWeight ?? t.FontWeight).ToOpenTypeWeight(),
                            family = (style?.FontFamily ?? t.FontFamily).Source, box = Box(t, outer) } };
                        return runs.Count > 1
                            ? own.Concat(runs.Select(r => new { text = r.Text.Trim(), size = r.FontSize, weight = r.FontWeight.ToOpenTypeWeight(), family = r.FontFamily.Source, box = Box(t, outer) }))
                            : own;
                    })
                    .Where(t => t.text.Length > 0),
                regions = new
                {
                    header = Box(window.FindName("HeaderArea") as FrameworkElement, outer),
                    title = Box(window.FindName("PopupTitleText") as FrameworkElement, outer),
                    content = Box(window.FindName("PopupContent") as FrameworkElement, outer),
                    footer = Box(window.FindName("FooterArea") as FrameworkElement, outer),
                    buttons = Descendants(outer).OfType<System.Windows.Controls.Button>().Where(x => x.IsVisible && x.ActualWidth > 0)
                        .Select(x => new { text = (x.Content as string) ?? System.Windows.Automation.AutomationProperties.GetName(x), x.FontSize, box = Box(x, outer) }),
                },
            }));
            window.Close();
        }
        Console.WriteLine($"WPF captured {popups.Count}");
        return 0;
    }

    /// <summary>흰 판(PopupOuterGrid) 기준 위치·크기. 보이지 않으면 null.</summary>
    private static object? Box(FrameworkElement? element, FrameworkElement outer)
    {
        if (element == null || !element.IsVisible || element.ActualWidth <= 0) return null;
        var p = element.TransformToAncestor(outer).Transform(new Point(0, 0));
        return new { x = Math.Round(p.X, 1), y = Math.Round(p.Y, 1), w = Math.Round(element.ActualWidth, 1), h = Math.Round(element.ActualHeight, 1) };
    }

    private static IEnumerable<DependencyObject> Descendants(DependencyObject root)
    {
        for (int i = 0; i < VisualTreeHelper.GetChildrenCount(root); i++)
        {
            var child = VisualTreeHelper.GetChild(root, i);
            yield return child;
            foreach (var nested in Descendants(child)) yield return nested;
        }
    }
}
