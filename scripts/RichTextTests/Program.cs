using System.IO;
using System.Reflection;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Popup.Dtos;
using Popup.Factories;
using Popup.Services;
using Popup.Views.Contents;

/*
 * POL-03-01 : 저장·표시 경계
 * POL-03-02 : 문단·글자 서식
 * POL-06-01 : 문항·서식
 * POL-16-02 : 재현 가능한 검증
 * ■ TEXT 서식 본문 WPF 회귀 검증(저장소 추적)
 * - in : 없음
 * - out: 콘솔 PASS 검사 건수 · 실패 시 Exception(메시지)
 * - 서식 표시, 기울임 오른쪽 여유, 관용 변환기·표시 방어, 문단 들여쓰기를
 * 실제 PopupFactory·TextPopupView 경로로 확인한다. 로컬 전용 Popup.BehaviorTests의 같은 검증을 옮겨
 * 다른 환경에서도 같은 명령으로 재현할 수 있게 둔다.
 * 설문·퀴즈 서식(surveyTitleBlocks·descriptionBlocks·titleBlocks·options[].textBlocks) 표시, 일반 문자열 대체,
 *   접근성 이름·답변 ID 불변, VIDEO+QUIZ 머리말 숨김 예외, Demo 저장 시 일반 문자열 파생·길이 상한
 *   실행: dotnet run --project scripts/RichTextTests
 * 내부(internal·private) 멤버는 리플렉션으로 접근하므로 이름을 바꾸면 이 검증도 함께 고친다.
 */
internal static class Program
{
    private static int _checks;
    private static void Check(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
        _checks++;
    }

    [STAThread]
    private static void Main()
    {
        CheckRichText28();
        CheckRichTextDisplayDefense48();
        CheckParagraphIndent49();
        CheckItalicOverhang38();
        CheckSurveyRichText55();
        CheckStrikethrough62();
        CheckFontWeight28_15();
        Console.WriteLine($"PASS: {_checks} rich text checks (design 28·38·48·49, TODO28-15·55·62)");
    }

    private static void CheckStrikethrough62()
    {
        // 실제 DTO 관용 변환 → Factory → WPF Run 표시 경로. 누락·잘못된 타입이 본문을 없애지 않아야 한다.
        var sample = DemoPopupDataService.CreatePopups().Single(p => p.PopupId == "DEMO-TEXT-001");
        var content = System.Text.Json.Nodes.JsonNode.Parse(sample.Content.GetRawText())!.AsObject();
        content["textBlocks"] = System.Text.Json.Nodes.JsonNode.Parse("""
            [{"alignment":"RIGHT","indent":1,"runs":[
                {"text":"취소","strikethrough":true},
                {"text":"둘 다","strikethrough":true,"underline":true},
                {"text":"밑줄","underline":true},
                {"text":"기존"},{"text":"해제","strikethrough":false},
                {"text":"타입 오류","strikethrough":"true"}]}]
            """);
        sample.Content = JsonSerializer.SerializeToElement(content);
        var view = (TextPopupView)PopupFactory.Create(sample).Content!;
        var paragraph = ((StackPanel)view.FindName("RichTextPanel")).Children.OfType<TextBlock>().Single();
        var runs = paragraph.Inlines.OfType<Run>().ToList();
        Check(runs.Count == 6 && paragraph.Padding.Left == 40 && paragraph.TextAlignment == TextAlignment.Right,
            "[62] strikethrough preserves text, indent and alignment through the factory");
        Check(runs[0].TextDecorations.Count == 1 && runs[0].TextDecorations[0].Location == TextDecorationLocation.Strikethrough,
            "[62] strikethrough maps to WPF decoration");
        Check(runs[1].TextDecorations.Count == 2 && runs[1].TextDecorations.Any(d => d.Location == TextDecorationLocation.Underline)
            && runs[1].TextDecorations.Any(d => d.Location == TextDecorationLocation.Strikethrough),
            "[62] underline and strikethrough are displayed together");
        Check(runs[2].TextDecorations == TextDecorations.Underline && TextDecorations.Underline.Count == 1,
            "[62] combining decorations does not mutate the shared underline collection");
        Check(runs.Skip(3).All(r => r.TextDecorations == null || r.TextDecorations.Count == 0),
            "[62] omitted, false and invalid-type strikethrough use the normal style");
        var validate = typeof(Popup.DemoOptionsWindow).GetMethod("ValidateTextBlocks", BindingFlags.Static | BindingFlags.NonPublic)!;
        var valid = System.Text.Json.Nodes.JsonNode.Parse("[{\"runs\":[{\"text\":\"본문\",\"strikethrough\":true,\"underline\":true}]}]")!.AsArray();
        Check((string)validate.Invoke(null, new object[] { valid })! == "본문", "[62] Demo accepts strikethrough without changing plain text");
        foreach (string invalid in new[] { "\"true\"", "1", "[]", "{}" })
        {
            var blocks = System.Text.Json.Nodes.JsonNode.Parse("[{\"runs\":[{\"text\":\"본문\",\"strikethrough\":" + invalid + "}]}]")!.AsArray();
            try { validate.Invoke(null, new object[] { blocks }); throw new Exception("Expected invalid strikethrough rejection"); }
            catch (TargetInvocationException e) when (e.InnerException is ArgumentException) { Check(true, "[62] Demo rejects strikethrough " + invalid); }
        }
    }

    private static IEnumerable<DependencyObject> Logical(DependencyObject root)
    {
        foreach (object child in LogicalTreeHelper.GetChildren(root))
        {
            if (child is not DependencyObject node) continue;
            yield return node;
            foreach (DependencyObject nested in Logical(node)) yield return nested;
        }
    }

    private static string Plain(TextBlock block) => string.Concat(block.Inlines.OfType<Run>().Select(r => r.Text));

    /* POL-06-01 : 문항·서식 — 설문·퀴즈 서식 표시. 데모 SURVEY 샘플에 제목·설명·문항 제목·선택지(세로·가로) 서식이 있다. */
    private static void CheckSurveyRichText55()
    {
        const BindingFlags flags = BindingFlags.Instance | BindingFlags.NonPublic;
        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        PopupResponseDto Sample() => DemoPopupDataService.CreatePopups().Single(p => p.PopupId == "DEMO-SURVEY-001");
        SurveyPopupView ViewOf(PopupResponseDto dto) => (SurveyPopupView)PopupFactory.Create(dto).Content!;

        // 1) 머리말: 서식 문단 표시, 일반 문자열은 숨긴 채 유지
        SurveyPopupView view = ViewOf(Sample());
        var titleRich = (StackPanel)view.FindName("SurveyTitleRich");
        var titlePlain = (TextBlock)view.FindName("SurveyTitleText");
        Check(titleRich.Visibility == Visibility.Visible && titlePlain.Visibility == Visibility.Collapsed && titlePlain.Text == "교육 만족도 설문"
              && ((TextBlock)titleRich.Children[0]).Inlines.OfType<Run>().Any(r => r.Text == "만족도" && r.FontWeight == FontWeights.Bold),
            "[55-5] survey title shows the formatted paragraph and keeps the plain text hidden");
        var descriptionRich = (StackPanel)view.FindName("SurveyDescriptionRich");
        Check(descriptionRich.Children.Count == 2 && ((TextBlock)descriptionRich.Children[1]).Padding.Left == 40,
            "[55-2] description keeps every paragraph and its indent");

        // 2) 문항 제목: 필수 표시는 마지막 문단 끝, 접근성 이름은 일반 문자열
        StackPanel questionTitle = Logical(view).OfType<StackPanel>()
            .Single(p => System.Windows.Automation.AutomationProperties.GetName(p) == "화면 구성이 이해하기 쉬웠나요?");
        // 마지막 문단: ... 서식 구간 → 필수 표시 " *" → (V2) 선택 방식 안내 "   하나 선택"
        List<Run> lastTitleRuns = ((TextBlock)questionTitle.Children[^1]).Inlines.OfType<Run>().ToList();
        Check(lastTitleRuns[^2].Text == " *" && lastTitleRuns[^1].Text.Trim() == "하나 선택" && Plain((TextBlock)questionTitle.Children[^1]).StartsWith("화면 구성")
              && ((TextBlock)questionTitle.Children[0]).Inlines.OfType<Run>().Any(r => r.Text == "화면 구성" && r.TextDecorations == TextDecorations.Underline),
            "[55-5] question title shows formatting and the required mark after the last paragraph");

        // 3) 선택지: 세로·가로 서식, 접근성 이름은 일반 문구, 서식 없는 선택지는 기존 문구
        var answerControls = (System.Collections.IDictionary)typeof(SurveyPopupView).GetField("_answerControls", flags)!.GetValue(view)!;
        var first = ((Panel)answerControls[1001L]!).Children.OfType<RadioButton>().ToList();
        RadioButton help = first.Single(r => ((Popup.Models.SurveyOption)r.Tag).OptionId == 1013);
        RadioButton easy = first.Single(r => ((Popup.Models.SurveyOption)r.Tag).OptionId == 1011);
        Check(help.Content is StackPanel helpPanel && helpPanel.Children.Count == 2 && ((TextBlock)helpPanel.Children[1]).Padding.Left == 40
              && ((TextBlock)helpPanel.Children[1]).Inlines.OfType<Run>().All(r => r.FontStyle == FontStyles.Italic && r.FontSize == 12)
              && System.Windows.Automation.AutomationProperties.GetName(help) == ((Popup.Models.SurveyOption)help.Tag).Text
              && easy.Content is TextBlock,
            "[55-6] vertical option shows formatted paragraphs, keeps the plain accessible name, plain options are unchanged");
        RadioButton chip = ((Panel)answerControls[1002L]!).Children.OfType<RadioButton>().Single(r => ((Popup.Models.SurveyOption)r.Tag).OptionId == 1102);
        Check(chip.Content is StackPanel chipPanel && ((TextBlock)chipPanel.Children[0]).Inlines.OfType<Run>().Single().FontSize == 16,
            "[55-6] horizontal chip option shows its formatting");

        // 4) 답변·채점 불변: 서식 선택지를 골라도 응답은 OptionId
        help.IsChecked = true;
        var collect = typeof(SurveyPopupView).GetMethod("CollectAnswers", flags)!;
        var answers = ((System.Collections.IEnumerable)collect.Invoke(view, null)!).Cast<object>().ToList();
        Check(answers.Any(a => (long)a.GetType().GetProperty("QuestionId")!.GetValue(a)! == 1001
              && ((IEnumerable<long>)a.GetType().GetProperty("SelectedOptionIds")!.GetValue(a)!).SequenceEqual(new[] { 1013L })),
            "[55-7] answering a formatted option still records its option id");

        // 5) 일반 문자열 대체: 빈 배열·깨진 구조·글자 없는 문단이면 기존 문자열
        foreach ((string label, string blocks) in new[] { ("empty", "[]"), ("broken", "[{\"runs\":5}]"), ("blank", "[{\"runs\":[{\"text\":\"  \"}]}]") })
        {
            var node = System.Text.Json.Nodes.JsonNode.Parse(JsonSerializer.Serialize(Sample(), jsonOptions))!.AsObject();
            node["questions"]![0]!["titleBlocks"] = System.Text.Json.Nodes.JsonNode.Parse(blocks);
            node["content"]!["surveyTitleBlocks"] = System.Text.Json.Nodes.JsonNode.Parse(blocks);
            SurveyPopupView fallback = ViewOf(node.Deserialize<PopupResponseDto>(jsonOptions)!);
            Check(((TextBlock)fallback.FindName("SurveyTitleText")).Visibility == Visibility.Visible
                  && ((StackPanel)fallback.FindName("SurveyTitleRich")).Visibility == Visibility.Collapsed
                  && Logical(fallback).OfType<TextBlock>().Any(t => t.Text == "화면 구성이 이해하기 쉬웠나요? *"),
                $"[55-1] {label} formatting falls back to the plain strings");
        }

        // 6) VIDEO+QUIZ 머리말: 서식이 있으면 같은 문자열이어도 숨기지 않는다
        var blocksOnly = new List<PopupTextBlockDto> { new() { Runs = new() { new() { Text = "영상 퀴즈", Bold = true } } } };
        var collapse = typeof(SurveyPopupView).GetMethod("CollapseHeaderShownAbove", flags)!;
        var withRich = new SurveyPopupView("영상 퀴즈", "설명", new(), titleBlocks: blocksOnly);
        collapse.Invoke(withRich, new object?[] { "영상 퀴즈" });
        var plainOnly = new SurveyPopupView("영상 퀴즈", "설명", new());
        collapse.Invoke(plainOnly, new object?[] { "영상 퀴즈" });
        // 2026-11-18(d4cd3ef): 설명은 퀴즈 머리말에 한 번만 그리므로 이 메서드는 제목만 비교한다(설명 인자 삭제).
        Check(((StackPanel)withRich.FindName("SurveyTitleRich")).Visibility == Visibility.Visible
              && ((TextBlock)plainOnly.FindName("SurveyTitleText")).Visibility == Visibility.Collapsed,
            "[55-8] a formatted quiz header stays visible while plain duplicates are still collapsed");

        // 7) 서식 선택지는 본문 크기·선택 강조를 상속하고 Run 지정 서식만 우선한다. 크기가 바뀌면 기울임 여유도 다시 맞춘다.
        var inherit = System.Text.Json.Nodes.JsonNode.Parse(JsonSerializer.Serialize(Sample(), jsonOptions))!.AsObject();
        inherit["questions"]![0]!["options"]![0]!["textBlocks"] = System.Text.Json.Nodes.JsonNode.Parse(
            "[{\"runs\":[{\"text\":\"색만 지정\",\"color\":\"#B42318\"},{\"text\":\" 기울임\",\"italic\":true},{\"text\":\" 굵게\",\"bold\":true}]}]");
        SurveyPopupView sized = ViewOf(inherit.Deserialize<PopupResponseDto>(jsonOptions)!);
        sized.ApplyBodyFontSize(40);
        var sizedControls = (System.Collections.IDictionary)typeof(SurveyPopupView).GetField("_answerControls", flags)!.GetValue(sized)!;
        RadioButton colored = ((Panel)sizedControls[1001L]!).Children.OfType<RadioButton>().First();
        RadioButton plainOption = ((Panel)sizedControls[1001L]!).Children.OfType<RadioButton>().Single(r => ((Popup.Models.SurveyOption)r.Tag).OptionId == 1012);
        TextBlock coloredParagraph = (TextBlock)((StackPanel)colored.Content).Children[0];
        List<Run> coloredRuns = coloredParagraph.Inlines.OfType<Run>().ToList();
        // 2026-11-17(8a96d3b): 선택지 글자 = bodyFontSize - 2(일반·서식 선택지 공통).
        Check(coloredRuns.All(r => r.FontSize == 38) && ((TextBlock)plainOption.Content).FontSize == 38,
            "[55-6] formatted option without size follows bodyFontSize - 2 like a plain option");
        Check(coloredParagraph.Padding.Right == Math.Ceiling(38 * 0.35),
            "[55-6] italic overhang is recalculated for the inherited body font size");
        colored.ApplyTemplate();
        colored.IsChecked = true;
        // POL-06-03 : 표현·수명 — V2는 선택해도 굵기·글자색을 바꾸지 않는다: 지정 없는 구간은 기본 굵기·#222222, Run 지정 굵게·색은 유지.
        Check(coloredRuns[1].FontWeight == FontWeights.Normal && coloredRuns[2].FontWeight == FontWeights.Bold
              && ((SolidColorBrush)coloredRuns[1].Foreground).Color == Color.FromRgb(0x22, 0x22, 0x22)
              && ((SolidColorBrush)coloredRuns[0].Foreground).Color == Color.FromRgb(0xB4, 0x23, 0x18),
            "[56-4] selecting a formatted option keeps run formatting and does not bold or recolor it");
        // 선택 시 굵게 바뀌는 V1에서는 지정 없는 구간이 선택 강조를 상속한다(설문·퀴즈 서식 상속 경로 유지).
        SurveyDesign.Current = "V1";
        try
        {
            SurveyPopupView v1 = ViewOf(inherit.Deserialize<PopupResponseDto>(jsonOptions)!);
            var v1Controls = (System.Collections.IDictionary)typeof(SurveyPopupView).GetField("_answerControls", flags)!.GetValue(v1)!;
            RadioButton v1Colored = ((Panel)v1Controls[1001L]!).Children.OfType<RadioButton>().First();
            List<Run> v1Runs = ((TextBlock)((StackPanel)v1Colored.Content).Children[0]).Inlines.OfType<Run>().ToList();
            v1Colored.ApplyTemplate();
            v1Colored.IsChecked = true;
            Check(v1Runs[1].FontWeight == FontWeights.SemiBold && v1Runs[2].FontWeight == FontWeights.Bold
                  && v1Runs[1].Foreground == v1Colored.Foreground && ((SolidColorBrush)v1Runs[0].Foreground).Color == Color.FromRgb(0xB4, 0x23, 0x18),
                "[55-6] (V1) selected formatted option inherits the selection weight/color and keeps run-specified formatting");
        }
        finally { SurveyDesign.Current = SurveyDesign.Latest; }
        StackPanel sizedTitle = Logical(sized).OfType<StackPanel>()
            .Single(p => System.Windows.Automation.AutomationProperties.GetName(p) == "화면 구성이 이해하기 쉬웠나요?");
        Check(((TextBlock)sizedTitle.Children[0]).FontSize == 44, "[55-5] formatted question title still follows bodyFontSize + 4");

        // 8) Demo 저장: 서식에서 일반 문자열 파생, 필드별 길이 상한
        var demoJson = (JsonSerializerOptions)typeof(Popup.DemoOptionsWindow).GetField("JsonOptions", BindingFlags.Static | BindingFlags.NonPublic)!.GetValue(null)!;
        var normalize = typeof(Popup.DemoOptionsWindow).GetMethod("NormalizeAndValidate", BindingFlags.Static | BindingFlags.NonPublic)!;
        void Normalize(System.Text.Json.Nodes.JsonObject value)
        {
            try { normalize.Invoke(null, new object[] { value }); }
            catch (TargetInvocationException exception) when (exception.InnerException != null) { throw exception.InnerException; }
        }
        var draft = System.Text.Json.Nodes.JsonNode.Parse(JsonSerializer.Serialize(Sample(), demoJson))!.AsObject();
        draft["questions"]![0]!["titleBlocks"] = System.Text.Json.Nodes.JsonNode.Parse("[{\"runs\":[{\"text\":\"새 \"},{\"text\":\"제목\",\"bold\":true}]},{\"runs\":[{\"text\":\"둘째 줄\"}]}]");
        Normalize(draft);
        Check(draft["questions"]![0]!["title"]!.GetValue<string>() == "새 제목\n둘째 줄", "[55-4] demo save derives the plain title from its formatting");
        draft["questions"]![0]!["options"]![0]!["textBlocks"] = System.Text.Json.Nodes.JsonNode.Parse(
            "[{\"runs\":[{\"text\":\"" + new string('가', 1001) + "\"}]}]");
        Check(Throws(() => Normalize(draft)), "[55-4] option formatting longer than 1000 characters is rejected");
    }

    private static bool Throws(Action action)
    {
        try { action(); return false; }
        catch (ArgumentException) { return true; }
    }

    private static void CheckItalicOverhang38()
    {
        const double width = 300;
        // 문단을 폭 width로 배치하고, 경계 밖까지 그려지도록 넓은 비트맵에 렌더링해 가장 오른쪽 잉크 열을 찾는다.
        int InkRight(TextBlock block)
        {
            ((Panel?)block.Parent)?.Children.Remove(block);
            block.Width = width; block.HorizontalAlignment = HorizontalAlignment.Left; block.VerticalAlignment = VerticalAlignment.Top;
            var host = new Grid { Width = width + 60 };
            host.Children.Add(block);
            host.Measure(new Size(width + 60, double.PositiveInfinity)); host.Arrange(new Rect(host.DesiredSize)); host.UpdateLayout();
            int w = (int)(width + 60), h = (int)Math.Ceiling(host.ActualHeight);
            var bitmap = new RenderTargetBitmap(w, h, 96, 96, PixelFormats.Pbgra32); bitmap.Render(host);
            var pixels = new byte[w * h * 4]; bitmap.CopyPixels(pixels, w * 4, 0);
            int right = -1;
            for (int y = 0; y < h; y++)
                for (int x = 0; x < w; x++)
                    if (pixels[(y * w + x) * 4 + 3] > 0 && x > right) right = x;
            return right;
        }
        List<TextBlock> Paragraphs(string runs, double? bodySize = null)
        {
            var dto = DemoPopupDataService.CreatePopups().Single(p => p.PopupId == "DEMO-TEXT-001");
            var content = System.Text.Json.Nodes.JsonNode.Parse(dto.Content.GetRawText())!.AsObject();
            content["textBlocks"] = System.Text.Json.Nodes.JsonNode.Parse(runs);
            dto.Content = JsonSerializer.SerializeToElement(content);
            var view = (TextPopupView)PopupFactory.Create(dto).Content!;
            if (bodySize is double size) view.ApplyBodyFontSize(size);
            return ((StackPanel)view.FindName("RichTextPanel")).Children.OfType<TextBlock>().ToList();
        }

        foreach (string font in new[] { "Malgun Gothic", "Gulim", "Dotum", "Batang" })
            foreach (string size in new[] { "", ",\"size\":32" })
                foreach (string text in new[] { "기울임 끝 글자", "Italic ending fff", "WWW" })
                {
                    var block = Paragraphs($"[{{\"alignment\":\"RIGHT\",\"runs\":[{{\"text\":\"{text}\",\"italic\":true,\"bold\":true,\"font\":\"{font}\"{size}}}]}}]").Single();
                    int right = InkRight(block);
                    Check(right >= 0 && right < width, $"Italic right-aligned glyph stays inside paragraph ({font}{size}, {text}, ink {right}, pad {block.Padding.Right})");
                }
        // 본문 기본 크기를 키운 뒤에도 여유 폭이 커진 글자에 맞춰진다.
        var resized = Paragraphs("[{\"alignment\":\"RIGHT\",\"runs\":[{\"text\":\"본문 크기 기울임\",\"italic\":true}]}]", 32).Single();
        Check(InkRight(resized) < width, "Italic overhang follows body font size change");
        // 기울임이 없는 문단은 기존 배치를 그대로 유지한다.
        var upright = Paragraphs("[{\"alignment\":\"RIGHT\",\"runs\":[{\"text\":\"기울임 없음\"}]}]").Single();
        Check(upright.Padding == new Thickness(0), "Paragraph without italic keeps zero padding");
    }

    private static void CheckRichText28()
    {
        var flags = BindingFlags.Instance | BindingFlags.NonPublic;
        var sample = DemoPopupDataService.CreatePopups().Single(p => p.PopupId == "DEMO-TEXT-001");
        Check(sample.Content.GetProperty("textBlocks").GetArrayLength() == 12, "Demo TEXT sample carries rich body");
        TextPopupView Create(PopupResponseDto dto) => (TextPopupView)PopupFactory.Create(dto).Content!;
        PopupResponseDto WithContent(Action<System.Text.Json.Nodes.JsonObject> change)
        {
            var dto = DemoPopupDataService.CreatePopups().Single(p => p.PopupId == "DEMO-TEXT-001");
            var content = System.Text.Json.Nodes.JsonNode.Parse(dto.Content.GetRawText())!.AsObject();
            change(content);
            dto.Content = JsonSerializer.SerializeToElement(content);
            return dto;
        }

        var view = Create(sample);
        var panel = (StackPanel)view.FindName("RichTextPanel");
        var plain = (TextBlock)view.FindName("PlainTextBlock");
        var paragraphs = panel.Children.OfType<TextBlock>().ToList();
        Check(panel.Visibility == Visibility.Visible && plain.Visibility == Visibility.Collapsed && paragraphs.Count == 12,
            "Rich body replaces plain body paragraph by paragraph");
        var first = paragraphs[2].Inlines.OfType<System.Windows.Documents.Run>().ToList();
        Check(first[1].Text == "2026년 9월 12일 22:00 ~ 9월 13일 02:00" && first[1].FontWeight == FontWeights.Bold
            && ((SolidColorBrush)first[1].Foreground).Color == (Color)ColorConverter.ConvertFromString("#DC2626"), "Run bold and color reach WPF");
        Check(first[2].FontSize == 12, "Run size reaches WPF");
        Check(paragraphs[5].Inlines.OfType<System.Windows.Documents.Run>().Single().Text == " ", "Empty paragraph keeps one line");
        // POL-03-01 : 저장·표시 경계 — 콘텐츠 제목·설명은 본문 앞 문단이며 별도 제목 영역은 없다.
        var titleRun = paragraphs[0].Inlines.OfType<System.Windows.Documents.Run>().Single();
        Check(titleRun.Text == "사내 업무시스템 정기 점검 안내" && titleRun.FontWeight == FontWeights.Bold && titleRun.FontSize == 24
            && view.FindName("ContentHeaderPanel") == null && view.FindName("ContentTitleText") == null, "Content title is the first rich paragraph");
        Check(!sample.Content.TryGetProperty("contentTitle", out _) && !sample.Content.TryGetProperty("description", out _)
            && !sample.Content.TryGetProperty("showContentHeader", out _)
            && sample.Content.GetProperty("plainText").GetString()!.StartsWith("사내 업무시스템 정기 점검 안내\nIT운영팀"), "Demo TEXT sample has no separate title/description"); 
        Check(paragraphs[11].TextAlignment == TextAlignment.Right
            && paragraphs[11].Inlines.OfType<System.Windows.Documents.Run>().ElementAt(1).FontFamily.Source == "Malgun Gothic, " + SystemFonts.MessageFontFamily.Source, "Alignment and built-in font name (Demo stores Malgun Gothic, default font fallback)");
        Check(paragraphs[4].Inlines.OfType<System.Windows.Documents.Run>().ElementAt(2).TextDecorations == TextDecorations.Underline, "Underline maps");

        view.ApplyBodyFontSize(20);
        Check(paragraphs[3].FontSize == 20 && first[2].FontSize == 12, "Body size applies to paragraphs while run size wins");

        var tall = Create(WithContent(c => c["textBlocks"] = System.Text.Json.Nodes.JsonNode.Parse(
            "[{\"alignment\":\"LEFT\",\"runs\":[{\"text\":\"작은 \"},{\"text\":\"큰 글자\",\"size\":32},{\"text\":\"\\n둘째 줄\"}]}]")));
        var tallBlock = ((StackPanel)tall.FindName("RichTextPanel")).Children.OfType<TextBlock>().Single();
        tallBlock.Measure(new Size(400, double.PositiveInfinity));
        Check(tallBlock.DesiredSize.Height >= 32 + 15, "Large run grows its line instead of overlapping");
        Check(tallBlock.Inlines.OfType<System.Windows.Documents.LineBreak>().Count() == 1, "Run newline becomes LineBreak");

        var filtered = Create(WithContent(c => c["textBlocks"] = System.Text.Json.Nodes.JsonNode.Parse(
            "[{\"alignment\":\"JUSTIFY\",\"runs\":[{\"text\":\"<b>x</b>\",\"color\":\"red\",\"size\":0,\"font\":\"Comic Sans MS, serif\"}]}]")));
        var filteredBlock = ((StackPanel)filtered.FindName("RichTextPanel")).Children.OfType<TextBlock>().Single();
        var filteredRun = filteredBlock.Inlines.OfType<System.Windows.Documents.Run>().Single();
        Check(filteredRun.Text == "<b>x</b>" && filteredBlock.TextAlignment == TextAlignment.Left
            && filteredRun.ReadLocalValue(TextElement.ForegroundProperty) == DependencyProperty.UnsetValue
            && filteredRun.ReadLocalValue(TextElement.FontSizeProperty) == DependencyProperty.UnsetValue
            && filteredRun.ReadLocalValue(TextElement.FontFamilyProperty) == DependencyProperty.UnsetValue,
            "Unusable values fall back to defaults and markup text stays literal");

        // 색은 팔레트가 아니라 형식·명도 대비로 판단한다.
        var colors = Create(WithContent(c => c["textBlocks"] = System.Text.Json.Nodes.JsonNode.Parse(
            "[{\"alignment\":\"LEFT\",\"runs\":[{\"text\":\"a\",\"color\":\"#0891B2\"},{\"text\":\"b\",\"color\":\"#FDE047\"},{\"text\":\"c\",\"color\":\"#0891b2\"}]}]")));
        var colorRuns = ((StackPanel)colors.FindName("RichTextPanel")).Children.OfType<TextBlock>().Single().Inlines.OfType<System.Windows.Documents.Run>().ToList();
        Check(((SolidColorBrush)colorRuns[0].Foreground).Color == (Color)ColorConverter.ConvertFromString("#0891B2")
            && ((SolidColorBrush)colorRuns[1].Foreground).Color == (Color)ColorConverter.ConvertFromString("#FDE047")
            && ((SolidColorBrush)colorRuns[2].Foreground).Color == (Color)ColorConverter.ConvertFromString("#0891B2"),
            "Any hex color shows without palette; lowercase is converted too (design 48)");

        var legacy = Create(WithContent(c => c.Remove("textBlocks")));
        Check(((TextBlock)legacy.FindName("PlainTextBlock")).Visibility == Visibility.Visible
            && ((StackPanel)legacy.FindName("RichTextPanel")).Visibility == Visibility.Collapsed, "Content without textBlocks keeps plainText");
        var hidden = Create(WithContent(c => c["showPlainText"] = false));
        Check(((StackPanel)hidden.FindName("RichTextPanel")).Visibility == Visibility.Collapsed, "showPlainText=false hides rich body");

        var host = new Border { Background = Brushes.White, Padding = new Thickness(24), Child = Create(sample) };
        host.Measure(new Size(560, 760)); host.Arrange(new Rect(0, 0, 560, 760)); host.UpdateLayout();
        var bitmap = new RenderTargetBitmap(560, 760, 96, 96, PixelFormats.Pbgra32); bitmap.Render(host);
        var encoder = new PngBitmapEncoder(); encoder.Frames.Add(BitmapFrame.Create(bitmap));
        using (var file = File.Create(Path.Combine(AppContext.BaseDirectory, "rich-text-28.png"))) encoder.Save(file);

        // Demo 옵션 창: textBlocks JSON 편집·서버와 같은 검증·plainText 파생
        PopupResponseDto Read(Popup.DemoOptionsWindow editor) => (PopupResponseDto)typeof(Popup.DemoOptionsWindow)
            .GetMethod("ReadResult", flags)!.Invoke(editor, null)!;
        TextBox Box(Popup.DemoOptionsWindow editor)
        {
            var draft = (System.Text.Json.Nodes.JsonObject)typeof(Popup.DemoOptionsWindow).GetField("_draft", flags)!.GetValue(editor)!;
            var inputs = (System.Collections.IDictionary)typeof(Popup.DemoOptionsWindow).GetField("_inputs", flags)!.GetValue(editor)!;
            return (TextBox)inputs[(draft["content"]!.AsObject(), "textBlocks")]!;
        }
        var demoEditor = new Popup.DemoOptionsWindow(sample);
        Check(Box(demoEditor).Text.Contains("\"주요 작업\""), "Demo options show rich body JSON with readable Korean");
        Box(demoEditor).Text = "[{\"alignment\":\"CENTER\",\"runs\":[{\"text\":\"새 \"},{\"text\":\"본문\",\"bold\":true,\"color\":\"#2563EB\"}]},{\"alignment\":\"LEFT\",\"runs\":[]}]";
        var edited = Read(demoEditor);
        Check(edited.Content.GetProperty("plainText").GetString() == "새 본문\n", "Demo derives plainText from rich body like server");
        var editedParagraphs = ((StackPanel)Create(edited).FindName("RichTextPanel")).Children.OfType<TextBlock>().ToList();
        Check(editedParagraphs.Count == 2 && editedParagraphs[0].TextAlignment == TextAlignment.Center, "Demo edit reaches WPF popup");
        foreach (string bad in new[] { "{", "{}", "[{\"alignment\":\"LEFT\",\"runs\":[{\"text\":\"a\",\"color\":\"red\"}]}]",
                     "[{\"alignment\":\"LEFT\",\"runs\":[{\"text\":\"a\",\"color\":\"#fde047\"}]}]",
                     "[{\"alignment\":\"LEFT\",\"runs\":[{\"text\":\"a\",\"style\":\"x\"}]}]", "[{\"alignment\":\"LEFT\",\"runs\":[{\"text\":\"\"}]}]" })
        {
            Box(demoEditor).Text = bad;
            try { Read(demoEditor); throw new Exception("Expected demo rich body rejection: " + bad); }
            catch (TargetInvocationException e) when (e.InnerException is ArgumentException) { Check(true, "Demo rejects invalid rich body"); }
        }
        Box(demoEditor).Text = "";
        var cleared = Read(demoEditor);
        Check(!cleared.Content.TryGetProperty("textBlocks", out _)
            && ((TextBlock)Create(cleared).FindName("PlainTextBlock")).Visibility == Visibility.Visible, "Clearing demo rich body falls back to plain text");
        demoEditor.Close();

        var demo = new Popup.DemoWindow();
        var combo = (ComboBox)demo.FindName("ScenarioCombo");
        combo.SelectedItem = combo.Items.OfType<ComboBoxItem>().Single(i => (string)i.Tag == "DEMO-TEXT-001");
        typeof(Popup.DemoWindow).GetMethod("UpdateScenarioSummary", flags)!.Invoke(demo, null);
        Check(((TextBlock)demo.FindName("ScenarioSummaryText")).Text.Contains("본문: 서식 본문 12문단"), "Demo summary shows rich body");
        demo.Close();
    }

    // POL-03-01 : 저장·표시 경계 — WPF는 서버 정책 목록을 복제하지 않고 표시 방어(안전 범위·변환 실패 기본값·JSON 타입 오류 경계)만 한다.
    private static void CheckRichTextDisplayDefense48()
    {
        PopupResponseDto WithContent(Action<System.Text.Json.Nodes.JsonObject> change)
        {
            var dto = DemoPopupDataService.CreatePopups().Single(p => p.PopupId == "DEMO-TEXT-001");
            var content = System.Text.Json.Nodes.JsonNode.Parse(dto.Content.GetRawText())!.AsObject();
            change(content);
            dto.Content = JsonSerializer.SerializeToElement(content);
            return dto;
        }
        TextPopupView Create(string textBlocksJson, string plainText = "파생 본문") => (TextPopupView)PopupFactory.Create(WithContent(c =>
        {
            c["textBlocks"] = System.Text.Json.Nodes.JsonNode.Parse(textBlocksJson);
            c["plainText"] = plainText;
        })).Content!;
        List<TextBlock> Paragraphs(TextPopupView view) => ((StackPanel)view.FindName("RichTextPanel")).Children.OfType<TextBlock>().ToList();
        List<System.Windows.Documents.Run> Runs(string runsJson) =>
            Paragraphs(Create("[{\"alignment\":\"LEFT\",\"runs\":" + runsJson + "}]")).Single().Inlines.OfType<System.Windows.Documents.Run>().ToList();
        bool Unset(System.Windows.Documents.Run run, DependencyProperty property) => run.ReadLocalValue(property) == DependencyProperty.UnsetValue;
        var richText = typeof(PopupFactory).Assembly.GetType("Popup.Views.Contents.PopupRichText")!;
        double? SafeFontSize(double? size) => (double?)richText.GetMethod("SafeFontSize", BindingFlags.Static | BindingFlags.NonPublic)!.Invoke(null, new object?[] { size });
        bool IsWpfFontName(string value) => (bool)richText.GetMethod("IsFontName", BindingFlags.Static | BindingFlags.NonPublic)!.Invoke(null, new object?[] { value })!;

        // 크기: 서버 목록과 무관하게 안전 범위(1~200) 안이면 표시, 밖이면 본문 기본 크기.
        var sizes = Runs("[{\"text\":\"a\",\"size\":22},{\"text\":\"b\",\"size\":12.5},{\"text\":\"c\",\"size\":1},{\"text\":\"d\",\"size\":200},"
            + "{\"text\":\"e\",\"size\":0},{\"text\":\"f\",\"size\":-12},{\"text\":\"g\",\"size\":200.5},{\"text\":\"h\",\"size\":1e308}]");
        Check(sizes[0].FontSize == 22 && sizes[1].FontSize == 12.5 && sizes[2].FontSize == 1 && sizes[3].FontSize == 200,
            "Size outside current server list but inside safe range is shown (not a server policy change)");
        Check(sizes.Skip(4).All(r => Unset(r, TextElement.FontSizeProperty)), "Zero, negative and oversized sizes use body default");
        Check(SafeFontSize(double.NaN) == null && SafeFontSize(double.PositiveInfinity) == null
            && SafeFontSize(null) == null, "NaN/Infinity/null size use body default");

        // 색: #RRGGBB 대소문자 무관 변환, 실패하면 그 구간만 기본 색.
        var colors = Runs("[{\"text\":\"a\",\"color\":\"#fde047\"},{\"text\":\"b\",\"color\":\"#AbCdEf\"},{\"text\":\"c\",\"color\":\"red\"},"
            + "{\"text\":\"d\",\"color\":\"#12345\"},{\"text\":\"e\",\"color\":\"#GGGGGG\"},{\"text\":\"f\",\"color\":\"#+12345\"},{\"text\":\"g\",\"color\":\"#FF000000\"},{\"text\":\"h\",\"color\":\"#DC2626\"}]");
        Check(((SolidColorBrush)colors[0].Foreground).Color == Color.FromRgb(0xFD, 0xE0, 0x47)
            && ((SolidColorBrush)colors[1].Foreground).Color == Color.FromRgb(0xAB, 0xCD, 0xEF), "Lowercase and mixed-case hex colors are shown");
        Check(colors.Skip(2).Take(5).All(r => Unset(r, TextElement.ForegroundProperty))
            && ((SolidColorBrush)colors[7].Foreground).Color == Color.FromRgb(0xDC, 0x26, 0x26), "Unconvertible color falls back for that run only");

        // 글꼴·정렬: Windows 글꼴 이름(기본 4종 포함)은 "이름, 기본 글꼴"로 적용, 형식이 틀린 값은 기본 글꼴. 2026-11-24 글꼴 ID 매핑 삭제.
        var fonts = Runs("[{\"text\":\"a\",\"font\":\"Gulim\"},{\"text\":\"b\",\"font\":\"Comic Sans MS\"},{\"text\":\"c\",\"font\":\"gulim\"},"
            + "{\"text\":\"d\",\"font\":\"Arial, sans-serif\"},{\"text\":\"e\",\"font\":\"./#Family\"},{\"text\":\"f\",\"font\":\" Gulim\"},"
            + "{\"text\":\"g\",\"font\":\"\"},{\"text\":\"h\",\"font\":\"C:\\\\Fonts\\\\a.ttf\"},{\"text\":\"i\",\"font\":\"" + new string('a', 65) + "\"},"
            + "{\"text\":\"j\",\"font\":\"없는글꼴TODO28\",\"bold\":true}]");
        string fallback = ", " + SystemFonts.MessageFontFamily.Source;
        Check(fonts[0].FontFamily.Source == "Gulim" + fallback && fonts[1].FontFamily.Source == "Comic Sans MS" + fallback && fonts[2].FontFamily.Source == "gulim" + fallback,
            "[28] Built-in and other Windows family names are applied first with the popup default font as fallback (no font id mapping)");
        Check(fonts.Skip(3).Take(6).All(r => Unset(r, TextElement.FontFamilyProperty)),
            "[28] CSS list, file path/URI form, leading space, empty and 65-char names use the default font");
        Check(fonts[9].FontFamily.Source == "없는글꼴TODO28" + fallback && fonts[9].FontWeight == FontWeights.Bold,
            "[28] Uninstalled family name is still applied with the default fallback and bold stays");
        // 미설치 이름은 기본 글꼴로 그려진다: 기본 글꼴 구간과 같은 폭(한글·영문)이어야 한다. 설치된 글꼴은 다르게 그려진다.
        double Width(FontFamily family, string text = "가나다 ABC abc 123") => new FormattedText(text, System.Globalization.CultureInfo.GetCultureInfo("ko-KR"), FlowDirection.LeftToRight,
            new Typeface(family, FontStyles.Normal, FontWeights.Normal, FontStretches.Normal), 16, Brushes.Black, 1.0).WidthIncludingTrailingWhitespace;
        double missingWidth = Width(fonts[9].FontFamily), defaultWidth = Width(SystemFonts.MessageFontFamily), installedWidth = Width(fonts[1].FontFamily, "ABC abc 123 WWW"), latinDefault = Width(SystemFonts.MessageFontFamily, "ABC abc 123 WWW");
        Check(Math.Abs(missingWidth - defaultWidth) < 0.01 && Math.Abs(installedWidth - latinDefault) > 0.5,
            $"[28] Uninstalled name renders with the popup default font ({missingWidth:F2} = {defaultWidth:F2}) while an installed name differs (Latin {installedWidth:F2} vs {latinDefault:F2})");
        var aligned = Paragraphs(Create("[{\"alignment\":\"CENTER\",\"runs\":[{\"text\":\"a\"}]},{\"alignment\":\"JUSTIFY\",\"runs\":[{\"text\":\"b\"}]},{\"runs\":[{\"text\":\"c\"}]}]"));
        Check(aligned[0].TextAlignment == TextAlignment.Center && aligned[1].TextAlignment == TextAlignment.Left && aligned[2].TextAlignment == TextAlignment.Left,
            "Unknown or missing alignment uses left");

        // 서식 값 JSON 타입 오류: 그 값만 기본값, 본문과 다른 서식은 유지(이전에는 content 변환 예외로 팝업 전체 실패).
        var typed = Paragraphs(Create("[{\"alignment\":7,\"runs\":[{\"text\":\"본문\",\"bold\":\"yes\",\"italic\":1,\"underline\":true,"
            + "\"color\":255,\"size\":\"big\",\"font\":[\"GULIM\"]},{\"text\":\" 둘\",\"size\":{\"v\":1},\"color\":\"#2563EB\"}]},null,{\"alignment\":\"RIGHT\",\"runs\":[null,{\"text\":\"셋\"}]}]"));
        var typedRuns = typed[0].Inlines.OfType<System.Windows.Documents.Run>().ToList();
        Check(typed.Count == 2 && typed[0].TextAlignment == TextAlignment.Left && typedRuns[0].Text == "본문"
            && Unset(typedRuns[0], TextElement.FontWeightProperty) && Unset(typedRuns[0], TextElement.FontStyleProperty)
            && typedRuns[0].TextDecorations == TextDecorations.Underline && Unset(typedRuns[0], TextElement.ForegroundProperty)
            && Unset(typedRuns[0], TextElement.FontSizeProperty) && Unset(typedRuns[0], TextElement.FontFamilyProperty)
            && Unset(typedRuns[1], TextElement.FontSizeProperty) && ((SolidColorBrush)typedRuns[1].Foreground).Color == Color.FromRgb(0x25, 0x63, 0xEB)
            && typed[1].TextAlignment == TextAlignment.Right && typed[1].Inlines.OfType<System.Windows.Documents.Run>().Single().Text == "셋",
            "Wrong JSON type on a format value only resets that value; null paragraph/run is skipped");

        // 글자를 읽을 수 없는 구조 오류: 서식 본문 대신 plainText 전체를 표시한다(일부 글자 누락·팝업 실패 없음).
        foreach (string broken in new[] { "{}", "\"text\"", "[{\"alignment\":\"LEFT\",\"runs\":\"x\"}]", "[{\"alignment\":\"LEFT\"}]", "[\"문단\"]",
                     "[{\"alignment\":\"LEFT\",\"runs\":[{\"text\":5}]}]", "[{\"alignment\":\"LEFT\",\"runs\":[\"글자\"]}]",
                     "[{\"alignment\":\"LEFT\",\"runs\":[{\"text\":\"앞\"}]},{\"alignment\":\"LEFT\",\"runs\":[{\"bold\":true}]}]" })
        {
            var view = Create(broken, "앞\n파생 본문");
            Check(((StackPanel)view.FindName("RichTextPanel")).Visibility == Visibility.Collapsed
                && ((TextBlock)view.FindName("PlainTextBlock")).Visibility == Visibility.Visible
                && ((TextBlock)view.FindName("PlainTextBlock")).Text == "앞\n파생 본문", "Unreadable rich body structure falls back to plainText: " + broken);
        }
        var nullBlocks = Create("null");
        Check(((TextBlock)nullBlocks.FindName("PlainTextBlock")).Visibility == Visibility.Visible, "textBlocks null keeps plainText");

        // 본문 자체를 읽을 수 없는 입력(plainText 타입 오류)은 기존과 같이 content 변환 오류다.
        try
        {
            PopupFactory.Create(WithContent(c => c["plainText"] = 5));
            throw new Exception("Expected content conversion error for non-string plainText");
        }
        catch (JsonException) { Check(true, "Non-string plainText keeps content conversion error path"); }

        // 2026-11-24 글꼴 ID 삭제: 서버 ID 허용 목록·WPF ID 매핑이 없고, 관리자 웹 기본 4종 저장값은 WPF·서버 이름 규칙을 통과하는 Windows 글꼴 이름이다.
        string root = AppContext.BaseDirectory;
        while (!Directory.Exists(Path.Combine(root, "zero-rule-server"))) root = Path.GetDirectoryName(root.TrimEnd(Path.DirectorySeparatorChar))!;
        string server = File.ReadAllText(Path.Combine(root, "zero-rule-server", "service", "core", "src", "main", "java", "server", "service", "core", "popup", "PopupRichText.java"));
        string web = File.ReadAllText(Path.Combine(root, "zero-rule-web", "main", "src", "features", "PopupcommonComponent", "popupRichText.ts"));
        var webFonts = System.Text.RegularExpressions.Regex.Matches(web, @"\{ id: '([^']+)', css:").Select(m => m.Groups[1].Value).ToList();
        Check(!System.Text.RegularExpressions.Regex.IsMatch(server, @"FONTS\s*=\s*Set\.of") && richText.GetField("Fonts", BindingFlags.Static | BindingFlags.NonPublic) == null
            && webFonts.SequenceEqual(new[] { "Malgun Gothic", "Gulim", "Dotum", "Batang" }) && webFonts.All(IsWpfFontName),
            "No font id list remains in server/WPF; built-in web fonts are Windows family names: " + string.Join(",", webFonts));
    }

    // POL-03-02 : 문단·글자 서식 — 문단 들여쓰기(indent 단계 × 40 DIP): 왼쪽 여백·모든 줄 적용·정렬·기울임 여유·plainText 무영향·표시 방어.
    private static void CheckParagraphIndent49()
    {
        var flags = BindingFlags.Instance | BindingFlags.NonPublic;
        PopupResponseDto WithBlocks(string textBlocksJson)
        {
            var dto = DemoPopupDataService.CreatePopups().Single(p => p.PopupId == "DEMO-TEXT-001");
            var content = System.Text.Json.Nodes.JsonNode.Parse(dto.Content.GetRawText())!.AsObject();
            content["textBlocks"] = System.Text.Json.Nodes.JsonNode.Parse(textBlocksJson);
            dto.Content = JsonSerializer.SerializeToElement(content);
            return dto;
        }
        List<TextBlock> Paragraphs(string json, double? bodySize = null)
        {
            var view = (TextPopupView)PopupFactory.Create(WithBlocks(json)).Content!;
            if (bodySize is double size) view.ApplyBodyFontSize(size);
            return ((StackPanel)view.FindName("RichTextPanel")).Children.OfType<TextBlock>().ToList();
        }

        // Demo 샘플: 목록 문단 3개가 1단계(40) 들여쓰기, 나머지는 0.
        var sample = DemoPopupDataService.CreatePopups().Single(p => p.PopupId == "DEMO-TEXT-001");
        var sampleParagraphs = ((StackPanel)((TextPopupView)PopupFactory.Create(sample).Content!).FindName("RichTextPanel")).Children.OfType<TextBlock>().ToList();
        Check(sampleParagraphs.Select(p => p.Padding.Left).SequenceEqual(new double[] { 0, 0, 0, 0, 0, 0, 0, 40, 40, 40, 0, 0 }),
            "Demo sample indents list paragraphs by one level");
        Check(!sample.Content.GetProperty("plainText").GetString()!.Contains("\t") && sample.Content.GetProperty("plainText").GetString()!.Contains("\n- 서버 보안"),
            "Indent adds no spaces/tabs to plainText");

        var mixed = Paragraphs("[{\"alignment\":\"LEFT\",\"indent\":1,\"runs\":[{\"text\":\"한 단계\"}]},{\"alignment\":\"LEFT\",\"runs\":[{\"text\":\"일반\"}]},"
            + "{\"alignment\":\"CENTER\",\"indent\":2,\"runs\":[{\"text\":\"가운데\"}]},{\"alignment\":\"RIGHT\",\"indent\":5,\"runs\":[{\"text\":\"오른쪽 기울임\",\"italic\":true,\"size\":32}]},"
            + "{\"alignment\":\"LEFT\",\"indent\":3,\"runs\":[]}]");
        Check(mixed[0].Padding.Left == 40 && mixed[1].Padding.Left == 0 && mixed[2].Padding.Left == 80 && mixed[2].TextAlignment == TextAlignment.Center
            && mixed[3].Padding.Left == 200 && mixed[3].TextAlignment == TextAlignment.Right && mixed[4].Padding.Left == 120,
            "Indent level maps to 40 DIP per level and keeps alignment; empty paragraph keeps indent");
        Check(mixed[3].Padding.Right == Math.Ceiling(32 * 0.35), "Italic right overhang is kept with indent");
        var resized = Paragraphs("[{\"alignment\":\"RIGHT\",\"indent\":2,\"runs\":[{\"text\":\"본문 기울임\",\"italic\":true}]}]", 30).Single();
        Check(resized.Padding.Left == 80 && resized.Padding.Right == Math.Ceiling(30 * 0.35), "Body font size change keeps indent and refreshes italic overhang");

        // 줄바꿈된 모든 줄이 같은 왼쪽 여백을 쓴다(첫 줄만 들여쓰는 text-indent가 아님).
        var wrapped = Paragraphs("[{\"alignment\":\"LEFT\",\"indent\":2,\"runs\":[{\"text\":\"" + string.Concat(Enumerable.Repeat("가나다라 ", 40)) + "\"}]}]").Single();
        wrapped.Width = 300; wrapped.Measure(new Size(300, double.PositiveInfinity)); wrapped.Arrange(new Rect(0, 0, 300, wrapped.DesiredSize.Height)); wrapped.UpdateLayout();
        var start = wrapped.ContentStart.GetInsertionPosition(LogicalDirection.Forward);
        var lineLefts = new List<double>();
        for (TextPointer? line = start; line != null; line = line.GetLineStartPosition(1)) lineLefts.Add(line.GetCharacterRect(LogicalDirection.Forward).Left);
        Check(lineLefts.Count >= 3 && lineLefts.All(left => Math.Abs(left - 80) < 0.5), "Every wrapped line starts at the indent: " + string.Join(",", lineLefts));

        // POL-03-02 : 문단·글자 서식 — 표시 방어: 단계 수 제한 없이 0 이상 정수(int 범위)면 그대로 적용, 소수·음수·범위 초과·타입 오류만 0.
        var defended = Paragraphs("[{\"indent\":6,\"runs\":[{\"text\":\"a\"}]},{\"indent\":10,\"runs\":[{\"text\":\"b\"}]},{\"indent\":11,\"runs\":[{\"text\":\"c\"}]},"
            + "{\"indent\":-1,\"runs\":[{\"text\":\"d\"}]},{\"indent\":1.5,\"runs\":[{\"text\":\"e\"}]},{\"indent\":\"1\",\"runs\":[{\"text\":\"f\"}]},{\"indent\":1e308,\"runs\":[{\"text\":\"g\"}]},{\"indent\":null,\"runs\":[{\"text\":\"h\"}]},"
            + "{\"indent\":2147483648,\"runs\":[{\"text\":\"i\"}]}]");
        Check(defended.Select(p => p.Padding.Left).SequenceEqual(new double[] { 240, 400, 440, 0, 0, 0, 0, 0, 0 }), "Indent above level 10 keeps 40 DIP steps; invalid values fall back to 0");
        // 본문 폭보다 큰 여백: 예외 없이 남은 폭에서 줄바꿈하고 높이가 늘어난다.
        var deep = Paragraphs("[{\"alignment\":\"LEFT\",\"indent\":20,\"runs\":[{\"text\":\"깊은 들여쓰기 문단\"}]}]").Single();
        deep.Measure(new Size(560, double.PositiveInfinity)); deep.Arrange(new Rect(deep.DesiredSize));
        Check(deep.Padding.Left == 800 && double.IsFinite(deep.DesiredSize.Height) && deep.DesiredSize.Height > 0, "Indent wider than the content measures without exception");

        // Demo 옵션 창: 서버와 같은 indent 검증.
        TextBox Box(Popup.DemoOptionsWindow editor)
        {
            var draft = (System.Text.Json.Nodes.JsonObject)typeof(Popup.DemoOptionsWindow).GetField("_draft", flags)!.GetValue(editor)!;
            var inputs = (System.Collections.IDictionary)typeof(Popup.DemoOptionsWindow).GetField("_inputs", flags)!.GetValue(editor)!;
            return (TextBox)inputs[(draft["content"]!.AsObject(), "textBlocks")]!;
        }
        PopupResponseDto Read(Popup.DemoOptionsWindow editor) => (PopupResponseDto)typeof(Popup.DemoOptionsWindow).GetMethod("ReadResult", flags)!.Invoke(editor, null)!;
        var demoEditor = new Popup.DemoOptionsWindow(sample);
        Box(demoEditor).Text = "[{\"alignment\":\"LEFT\",\"indent\":11,\"runs\":[{\"text\":\"a\"}]},{\"alignment\":\"LEFT\",\"indent\":0,\"runs\":[{\"text\":\"b\"}]}]";
        Check(Read(demoEditor).Content.GetProperty("plainText").GetString() == "a\nb", "Demo accepts indent above 5 (11)");
        foreach (string bad in new[] { "-1", "1.5", "\"1\"", "true", "2147483648" })
        {
            Box(demoEditor).Text = "[{\"alignment\":\"LEFT\",\"indent\":" + bad + ",\"runs\":[{\"text\":\"a\"}]}]";
            try { Read(demoEditor); throw new Exception("Expected demo indent rejection: " + bad); }
            catch (TargetInvocationException e) when (e.InnerException is ArgumentException) { Check(true, "Demo rejects indent " + bad); }
        }
        demoEditor.Close();
    }

    /*
     * POL-03-02 : 문단·글자 서식
     * ■ [TODO28-15] 저장 계약(runs[].font = Windows 패밀리, bold)으로 WPF가 실제 고르는 서체 측정
     * - 관리자 웹 verify-rich-text-49 [28-15]와 같은 구성(같은 패밀리 Arial, 굵기별 다른 패밀리 Georgia/Arial Bold,
     *   Modern형 Segoe UI, NewKr형 Segoe UI Semilight)의 저장값을 실제 PopupFactory 경로로 그려 Typeface 결과를 기록한다.
     * - 결과는 .offline-verify/rich49/font-weight-28-15-wpf.json. 웹과의 차이는 기록·판단 대상이며 여기서는 WPF 동작만 고정한다.
     */
    private static void CheckFontWeight28_15()
    {
        string[] families = { "Arial", "Georgia", "Segoe UI", "Segoe UI Semilight" };
        var blocks = new System.Text.Json.Nodes.JsonArray();
        var runs = new System.Text.Json.Nodes.JsonArray();
        foreach (string family in families)
        {
            runs.Add(new System.Text.Json.Nodes.JsonObject { ["text"] = family + " R", ["font"] = family });
            runs.Add(new System.Text.Json.Nodes.JsonObject { ["text"] = " | " });
            runs.Add(new System.Text.Json.Nodes.JsonObject { ["text"] = family + " B", ["font"] = family, ["bold"] = true });
            runs.Add(new System.Text.Json.Nodes.JsonObject { ["text"] = " | " });
        }
        blocks.Add(new System.Text.Json.Nodes.JsonObject { ["alignment"] = "LEFT", ["runs"] = runs });
        var dto = DemoPopupDataService.CreatePopups().Single(p => p.PopupId == "DEMO-TEXT-001");
        var content = System.Text.Json.Nodes.JsonNode.Parse(dto.Content.GetRawText())!.AsObject();
        content["textBlocks"] = blocks;
        dto.Content = JsonSerializer.SerializeToElement(content);
        var view = (TextPopupView)PopupFactory.Create(dto).Content!;
        var all = ((StackPanel)view.FindName("RichTextPanel")).Children.OfType<TextBlock>().Single().Inlines.OfType<Run>().ToList();
        var measured = new Dictionary<string, string>();
        foreach (Run run in all.Where(r => r.Text.Trim() != "|"))
        {
            // 대체 목록("이름, 기본 글꼴")의 첫 패밀리가 설치돼 있으면 그 패밀리에서 굵기·기울임에 맞는 서체를 고른다.
            string first = run.FontFamily.Source.Split(',')[0].Trim();
            var typeface = new Typeface(new FontFamily(first), run.FontStyle, run.FontWeight, run.FontStretch);
            Check(typeface.TryGetGlyphTypeface(out GlyphTypeface glyph), "[28-15] WPF resolves an installed face for " + run.Text);
            var en = System.Globalization.CultureInfo.GetCultureInfo("en-US");
            string Name(IDictionary<System.Globalization.CultureInfo, string> names) => names.TryGetValue(en, out string? v) ? v : names.Values.FirstOrDefault() ?? "";
            string face = Name(glyph.Win32FamilyNames) + " / " + Name(glyph.Win32FaceNames) + " / " + glyph.Weight
                + (glyph.StyleSimulations.HasFlag(StyleSimulations.BoldSimulation) || typeface.IsBoldSimulated ? " (bold simulated)" : "");
            // 합성 굵게는 GlyphTypeface 플래그에 드러나지 않을 수 있어, 같은 문구를 일반 굵기로 그린 너비와 비교한다(굵게 합성 시 넓어짐).
            double Width(FontWeight weight) => new FormattedText("Weight sample 0123 가나다", en, FlowDirection.LeftToRight,
                new Typeface(new FontFamily(first), run.FontStyle, weight, run.FontStretch), 20, Brushes.Black, 1.0).WidthIncludingTrailingWhitespace;
            // 잉크 양: 같은 문구를 실제로 그려 어두운 픽셀 수를 비교한다(합성 굵게는 획을 두껍게 그려 잉크가 늘어남).
            double Ink(FontWeight weight)
            {
                var text = new FormattedText("Weight sample 0123 가나다", en, FlowDirection.LeftToRight,
                    new Typeface(new FontFamily(first), run.FontStyle, weight, run.FontStretch), 20, Brushes.Black, 1.0);
                var visual = new DrawingVisual();
                using (var dc = visual.RenderOpen()) { dc.DrawRectangle(Brushes.White, null, new Rect(0, 0, 400, 40)); dc.DrawText(text, new Point(4, 4)); }
                var bitmap = new RenderTargetBitmap(400, 40, 96, 96, PixelFormats.Pbgra32); bitmap.Render(visual);
                var pixels = new byte[400 * 40 * 4]; bitmap.CopyPixels(pixels, 400 * 4, 0);
                double ink = 0; for (int i = 0; i < pixels.Length; i += 4) ink += 255 - pixels[i + 1];
                return ink;
            }
            measured[run.Text] = face + $" / width x{Width(run.FontWeight) / Width(FontWeights.Normal):0.000} / ink x{Ink(run.FontWeight) / Ink(FontWeights.Normal):0.000}";
        }
        Directory.CreateDirectory(Path.Combine(RepoRoot(), ".offline-verify", "rich49"));
        File.WriteAllText(Path.Combine(RepoRoot(), ".offline-verify", "rich49", "font-weight-28-15-wpf.json"),
            JsonSerializer.Serialize(measured, new JsonSerializerOptions { WriteIndented = true, Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping }));
        Console.WriteLine("[28-15] WPF faces " + string.Join(" ; ", measured.Select(m => m.Key + " => " + m.Value)));
        Check(all.Single(r => r.Text == "Arial B").FontWeight == FontWeights.Bold && all.Single(r => r.Text == "Arial R").FontWeight == FontWeights.Normal,
            "[28-15] bold flag maps to FontWeights.Bold, plain to Normal");
        Check(measured["Arial R"].StartsWith("Arial / Regular / Normal") && measured["Arial B"].StartsWith("Arial / Bold") && !measured["Arial B"].Contains("simulated"),
            "[28-15] same family: Regular and real Bold face");
        Check(measured["Georgia B"].StartsWith("Georgia / Bold"), "[28-15] split alias: WPF stays in the stored family (Georgia Bold), unlike the browser alias");
    }

    private static string RepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir != null && !File.Exists(Path.Combine(dir.FullName, "AGENTS.md"))) dir = dir.Parent;
        return dir?.FullName ?? Directory.GetCurrentDirectory();
    }
}
