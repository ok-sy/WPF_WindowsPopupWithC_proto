using System.Globalization;
using System.IO;
using System.Reflection;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Popup.Models;
using Popup.Views.Windows;

/*
 * POL-16-02 : 재현 가능한 검증
 * ■ 완료·안내 팝업(PopupAlert) UI 가이드 캡처(2026-11-25)
 * - in : 출력 폴더
 * - out: <출력 폴더>/ALERT-<ID>.png(창 전체 = 흰 판 430 + 그림자 여백 24, 회색 바탕 위, 96 DPI),
 *        ALERTS.sheet.png(전체 모음), alerts.json(창·흰 판·글자·버튼 상자)
 * - 실제 호출과 같은 값으로 만든다: 퀴즈 결과는 PopupManager처럼 QuizResultNotice.Build 결과를 제목 없이(showHeading false),
 *   설문 완료도 제목 없이, 필수 미응답·저장 실패는 제목을 그린다. PopupAlert.CreateDialog·QuizResultNotice는 internal이라 리플렉션으로 부른다.
 * - 문구가 바뀌면 이 캡처도 바뀐다(문구를 여기 따로 적지 않음). 단, 필수 미응답·저장 실패 본문은 호출부 문자열과 같은 예시다.
 */
internal static class AlertCapture
{
    private static readonly Color Backdrop = Color.FromRgb(0xE5, 0xE7, 0xEB);

    private sealed record Case(string Id, string Label, string Message, string Title, string Button, bool Heading);

    internal static int Run(string outDir)
    {
        Directory.CreateDirectory(outDir);
        var assembly = typeof(PopupAlert).Assembly;
        var create = typeof(PopupAlert).GetMethod("CreateDialog", BindingFlags.Static | BindingFlags.NonPublic)!;
        var noticeType = assembly.GetType("Popup.Managers.QuizResultNotice")!;
        var build = noticeType.GetMethod("Build", BindingFlags.Static | BindingFlags.NonPublic)!;
        string surveyDone = (string)assembly.GetType("Popup.Managers.PopupManager")!
            .GetField("SurveyCompletedMessage", BindingFlags.Static | BindingFlags.NonPublic)!.GetValue(null)!;

        // 10문항(문항당 1점) 퀴즈 "보안 퀴즈". correct = 맞힌 수, passing = 통과 점수, requires = 합격 필요(참여형 false).
        Case Quiz(string id, string label, int correct, double passing, bool requires)
        {
            var submission = new SurveySubmission
            {
                Score = correct, Passed = correct >= passing, PassingScore = passing, RequiresPassing = requires,
                CorrectCount = correct, ScoredCount = 10, MaxScore = 10, UnitScored = true,
                IncorrectQuestionNumbers = Enumerable.Range(correct + 1, 10 - correct).ToList(),
            };
            object notice = build.Invoke(null, new object?[] { submission, "보안 퀴즈", false })!;
            string Get(string name) => (string)notice.GetType().GetProperty(name)!.GetValue(notice)!;
            return new Case(id, label, Get("Message"), Get("Title"), Get("ButtonText"), false);
        }

        var cases = new List<Case>
        {
            Quiz("QUIZ-CUTOFF-PASS", "커트라인형 통과(8/10, 기준 6개)", 8, 6, true),
            Quiz("QUIZ-CUTOFF-FAIL", "커트라인형 미달(3/10, 기준 6개)", 3, 6, true),
            Quiz("QUIZ-FULL-PASS", "만점형 통과(10/10)", 10, 10, true),
            Quiz("QUIZ-FULL-FAIL", "만점형 미달(9/10)", 9, 10, true),
            Quiz("QUIZ-PARTICIPATION", "참여형 완료(2/10, 미달이어도 완료)", 2, 6, false),
            new("SURVEY-DONE", "설문 제출 완료", surveyDone, "설문조사 완료", "확인", false),
            new("REQUIRED", "필수 문항 미응답(설문·퀴즈)", "필수 문항을 입력해주세요.\n\n개인정보 처리 교육을 이수하셨나요?", "답안을 확인해 주세요", "확인", true),
            new("SAVE-FAILED", "결과 저장 실패(제출 시)", "응답을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.\n\n(예외 메시지)", "저장하지 못했어요", "다시 시도", true),
        };

        var shots = new List<(Case Case, BitmapSource Image)>();
        var report = new List<object>();
        foreach (var item in cases)
        {
            var dialog = (Window)create.Invoke(null, new object?[] { null, item.Message, item.Title, item.Button, item.Heading })!;
            dialog.ShowActivated = false; dialog.Topmost = false; dialog.Left = 0; dialog.Top = 0;
            dialog.Show();
            for (int i = 0; i < 3; i++) { dialog.Dispatcher.Invoke(() => { }, System.Windows.Threading.DispatcherPriority.ApplicationIdle); Thread.Sleep(60); }
            dialog.UpdateLayout();
            int w = (int)Math.Ceiling(dialog.ActualWidth), h = (int)Math.Ceiling(dialog.ActualHeight);
            var raw = new RenderTargetBitmap(w, h, 96, 96, PixelFormats.Pbgra32);
            raw.Render(dialog);
            var image = OnBackdrop(raw, w, h);
            Save(image, Path.Combine(outDir, $"ALERT-{item.Id}.png"));
            shots.Add((item, image));

            var root = (Grid)dialog.Content;
            var plate = root.Children.OfType<Border>().First();
            // 제목이 있는 안내(필수 미응답)로 구조 그림을 만든다: 흰 판·안쪽 여백·제목·본문·버튼과 간격.
            if (item.Id == "REQUIRED") Save(Anatomy(image, root, plate), Path.Combine(outDir, "ALERT-ANATOMY.png"));
            report.Add(new
            {
                id = item.Id, label = item.Label, heading = item.Heading, title = item.Title,
                window = new { width = dialog.ActualWidth, height = dialog.ActualHeight },
                plate = new { width = plate.ActualWidth, height = plate.ActualHeight, margin = root.Margin.Left },
                texts = Descendants(root).OfType<TextBlock>().Where(t => t.IsVisible && t.ActualWidth > 0 && !string.IsNullOrEmpty(t.Text))
                    .Select(t => new { text = t.Text, size = t.FontSize, weight = t.FontWeight.ToOpenTypeWeight(), lineHeight = double.IsNaN(t.LineHeight) ? (double?)null : t.LineHeight, box = Box(t, plate) }).ToList(),
                buttons = Descendants(root).OfType<Button>().Where(b => b.IsVisible)
                    .Select(b => new { text = b.Content as string, b.FontSize, weight = b.FontWeight.ToOpenTypeWeight(), box = Box(b, plate) }).ToList(),
            });
            dialog.Close();
        }
        File.WriteAllText(Path.Combine(outDir, "alerts.json"), JsonSerializer.Serialize(report, new JsonSerializerOptions { WriteIndented = true }));
        Save(Sheet(shots), Path.Combine(outDir, "ALERTS.sheet.png"));
        Console.WriteLine($"WPF alerts captured {cases.Count}");
        return 0;
    }

    /*
     * 구조 그림: 캡처 위에 레이아웃 가이드와 같은 색으로 표시한다(파랑 흰 판, 초록 점선 안쪽 여백 안 내용, 보라 버튼, 빨강 번호 글자).
     * 오른쪽에 설명 칸을 붙인다. 수치는 실제 요소 위치에서 잰 값이다.
     */
    private static BitmapSource Anatomy(BitmapSource image, Grid root, Border plate)
    {
        const int side = 300;
        double ox = root.Margin.Left, oy = root.Margin.Top;   // 창 → 흰 판 원점
        var texts = Descendants(root).OfType<TextBlock>().Where(t => t.IsVisible && t.ActualWidth > 0 && !string.IsNullOrEmpty(t.Text) && t.TemplatedParent == null).ToList();
        var button = Descendants(root).OfType<Button>().First(b => b.IsVisible);
        Rect R(FrameworkElement e) { var p = e.TransformToAncestor(root).Transform(new Point(0, 0)); return new Rect(p.X + ox, p.Y + oy, e.ActualWidth, e.ActualHeight); }
        var plateRect = new Rect(ox, oy, plate.ActualWidth, plate.ActualHeight);
        var title = R(texts[0]); var message = R(texts[1]); var buttonRect = R(button);
        var content = new Rect(title.Left, title.Top, message.Width, buttonRect.Bottom - title.Top);
        int width = image.PixelWidth + side, height = image.PixelHeight;
        var ko = CultureInfo.GetCultureInfo("ko-KR");
        var regular = new Typeface(new FontFamily("Malgun Gothic"), FontStyles.Normal, FontWeights.Normal, FontStretches.Normal);
        var bold = new Typeface(new FontFamily("Malgun Gothic"), FontStyles.Normal, FontWeights.SemiBold, FontStretches.Normal);
        Brush blue = new SolidColorBrush(Color.FromRgb(0x25, 0x63, 0xEB)), green = new SolidColorBrush(Color.FromRgb(0x16, 0xA3, 0x4A)),
              purple = new SolidColorBrush(Color.FromRgb(0x93, 0x33, 0xEA)), red = new SolidColorBrush(Color.FromRgb(0xDC, 0x26, 0x26));
        FormattedText F(string s, Brush b, double size = 12, bool strong = false) => new(s, ko, FlowDirection.LeftToRight, strong ? bold : regular, size, b, 1.0);
        var visual = new DrawingVisual();
        using (var dc = visual.RenderOpen())
        {
            dc.DrawRectangle(Brushes.White, null, new Rect(0, 0, width, height));
            dc.DrawImage(image, new Rect(0, 0, image.PixelWidth, image.PixelHeight));
            dc.DrawRectangle(null, new Pen(blue, 2), plateRect);
            dc.DrawRectangle(null, new Pen(green, 1.5) { DashStyle = DashStyles.Dash }, content);
            dc.DrawRectangle(null, new Pen(purple, 2), buttonRect);
            void Badge(int n, Point at) { dc.DrawEllipse(red, null, at, 9, 9); var t = F(n.ToString(), Brushes.White, 11, true); dc.DrawText(t, new Point(at.X - t.Width / 2, at.Y - t.Height / 2)); }
            Badge(1, new Point(title.Left - 12, title.Top + 10));
            Badge(2, new Point(message.Left - 12, message.Top + 10));
            Badge(3, new Point(buttonRect.Left - 14, buttonRect.Top + buttonRect.Height / 2));
            // 간격 표시: 제목↓본문, 본문↓버튼, 버튼↓흰 판 아래
            void Gap(double x, double top, double bottom)
            {
                var pen = new Pen(red, 1);
                dc.DrawLine(pen, new Point(x, top), new Point(x, bottom));
                dc.DrawLine(pen, new Point(x - 4, top), new Point(x + 4, top)); dc.DrawLine(pen, new Point(x - 4, bottom), new Point(x + 4, bottom));
                dc.DrawText(F(Math.Round(bottom - top).ToString(CultureInfo.InvariantCulture), red, 11, true), new Point(x + 5, (top + bottom) / 2 - 7));
            }
            Gap(plateRect.Left + 14, plateRect.Top, title.Top);
            Gap(message.Left + 200, title.Bottom, message.Top);
            Gap(message.Left + 200, message.Bottom, buttonRect.Top);
            Gap(buttonRect.Left + 60, buttonRect.Bottom, plateRect.Bottom);
            dc.DrawText(F($"{Math.Round(buttonRect.Width)}×{Math.Round(buttonRect.Height)}", purple, 11, true), new Point(buttonRect.Left, buttonRect.Bottom + 2));
            dc.DrawText(F($"흰 판 {Math.Round(plateRect.Width)}", blue, 11, true), new Point(plateRect.Right - 70, plateRect.Top - 16));

            double y = 16, x = image.PixelWidth + 12;
            void Line(string s, Brush b, bool strong = false) { var t = F(s, b, 12, strong); t.MaxTextWidth = side - 20; dc.DrawText(t, new Point(x, y)); y += t.Height + 6; }
            Line("완료·안내 팝업(PopupAlert)", Brushes.Black, true);
            Line($"창 {Math.Round(plateRect.Width + ox * 2)} = 흰 판 {Math.Round(plateRect.Width)} + 그림자 여백 {Math.Round(ox)}×2", blue);
            Line("흰 판: 흰색, 모서리 22, 섀도우 검정 0.16·Blur 20·아래 4", blue);
            Line($"안쪽 여백 {Math.Round(title.Left - ox)} (내용 너비 {Math.Round(message.Width)})", green);
            Line($"① 제목 {texts[0].FontSize}/{texts[0].FontWeight.ToOpenTypeWeight()} — 제목 있는 안내만", red);
            Line($"② 본문 {texts[1].FontSize}/{texts[1].FontWeight.ToOpenTypeWeight()}, 줄 간격 {texts[1].LineHeight}", red);
            Line($"③ 버튼 최소 {Math.Round(buttonRect.Width)}×{Math.Round(buttonRect.Height)}, 오른쪽 정렬, #111827·흰 글자 {button.FontSize}/{button.FontWeight.ToOpenTypeWeight()}, 모서리 9", purple);
            Line("Enter·Esc로 닫힘(확인 버튼 기본·취소)", Brushes.Black);
            Line("높이는 내용에 맞춤(SizeToContent)", Brushes.Black);
        }
        var bitmap = new RenderTargetBitmap(width, height, 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(visual);
        return bitmap;
    }

    /* 투명 창(그림자 포함)을 회색 바탕에 올린다. 흰 판과 그림자가 보이도록. */
    private static BitmapSource OnBackdrop(BitmapSource raw, int w, int h)
    {
        var visual = new DrawingVisual();
        using (var dc = visual.RenderOpen())
        {
            dc.DrawRectangle(new SolidColorBrush(Backdrop), null, new Rect(0, 0, w, h));
            dc.DrawImage(raw, new Rect(0, 0, w, h));
        }
        var bitmap = new RenderTargetBitmap(w, h, 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(visual);
        return bitmap;
    }

    /* 2열 모음. 각 칸 위에 번호·설명. */
    private static BitmapSource Sheet(List<(Case Case, BitmapSource Image)> shots)
    {
        const int columns = 2, gap = 16, label = 28;
        int cellW = shots.Max(s => s.Image.PixelWidth);
        var rows = shots.Select((s, i) => (s, i)).GroupBy(x => x.i / columns).Select(g => g.Max(x => x.s.Image.PixelHeight)).ToList();
        int width = gap + columns * (cellW + gap), height = gap + rows.Sum(r => r + label + gap);
        var visual = new DrawingVisual();
        var typeface = new Typeface(new FontFamily("Malgun Gothic"), FontStyles.Normal, FontWeights.SemiBold, FontStretches.Normal);
        using (var dc = visual.RenderOpen())
        {
            dc.DrawRectangle(Brushes.White, null, new Rect(0, 0, width, height));
            int y = gap;
            for (int row = 0; row < rows.Count; row++)
            {
                for (int column = 0; column < columns; column++)
                {
                    int index = row * columns + column;
                    if (index >= shots.Count) break;
                    var (item, image) = shots[index];
                    int x = gap + column * (cellW + gap);
                    var text = new FormattedText($"{index + 1}. {item.Label}", CultureInfo.GetCultureInfo("ko-KR"), FlowDirection.LeftToRight, typeface, 14, Brushes.Black, 1.0);
                    dc.DrawText(text, new Point(x, y + 4));
                    dc.DrawImage(image, new Rect(x, y + label, image.PixelWidth, image.PixelHeight));
                }
                y += rows[row] + label + gap;
            }
        }
        var bitmap = new RenderTargetBitmap(width, height, 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(visual);
        return bitmap;
    }

    private static void Save(BitmapSource image, string path)
    {
        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(image));
        using var file = File.Create(path);
        encoder.Save(file);
    }

    private static object Box(FrameworkElement element, FrameworkElement plate)
    {
        var p = element.TransformToAncestor(plate.Parent as Visual ?? plate).Transform(new Point(0, 0));
        var origin = plate.TransformToAncestor(plate.Parent as Visual ?? plate).Transform(new Point(0, 0));
        return new { x = Math.Round(p.X - origin.X, 1), y = Math.Round(p.Y - origin.Y, 1), w = Math.Round(element.ActualWidth, 1), h = Math.Round(element.ActualHeight, 1) };
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
