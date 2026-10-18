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
 * [설계 50] TEXT 서식 본문 WPF 회귀 검증(저장소 추적).
 * 설계 28 서식 표시, 설계 38 기울임 오른쪽 여유, 설계 48 관용 변환기·표시 방어, 설계 49 문단 들여쓰기를
 * 실제 PopupFactory·TextPopupView 경로로 확인한다. 로컬 전용 Popup.BehaviorTests의 같은 검증을 옮겨
 * 다른 환경에서도 같은 명령으로 재현할 수 있게 둔다.
 * TODO55 설문·퀴즈 서식(surveyTitleBlocks·descriptionBlocks·titleBlocks·options[].textBlocks) 표시, 일반 문자열 대체,
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
        Console.WriteLine($"PASS: {_checks} rich text checks (design 28·38·48·49, TODO55)");
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

    /* [TODO55] 설문·퀴즈 서식 표시. 데모 SURVEY 샘플에 제목·설명·문항 제목·선택지(세로·가로) 서식이 있다. */
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
        Check(Plain((TextBlock)questionTitle.Children[^1]).EndsWith(" *")
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
        collapse.Invoke(withRich, new object[] { "영상 퀴즈", "설명" });
        var plainOnly = new SurveyPopupView("영상 퀴즈", "설명", new());
        collapse.Invoke(plainOnly, new object[] { "영상 퀴즈", "설명" });
        Check(((StackPanel)withRich.FindName("SurveyTitleRich")).Visibility == Visibility.Visible
              && ((TextBlock)withRich.FindName("SurveyDescriptionText")).Visibility == Visibility.Collapsed
              && ((TextBlock)plainOnly.FindName("SurveyTitleText")).Visibility == Visibility.Collapsed,
            "[55-8] a formatted quiz header stays visible while plain duplicates are still collapsed");

        // 7) Demo 저장: 서식에서 일반 문자열 파생, 필드별 길이 상한
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

        foreach (string font in new[] { "MALGUN_GOTHIC", "GULIM", "DOTUM", "BATANG" })
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
        // [설계 37] 콘텐츠 제목·설명은 본문 앞 문단이며 별도 제목 영역은 없다.
        var titleRun = paragraphs[0].Inlines.OfType<System.Windows.Documents.Run>().Single();
        Check(titleRun.Text == "사내 업무시스템 정기 점검 안내" && titleRun.FontWeight == FontWeights.Bold && titleRun.FontSize == 24
            && view.FindName("ContentHeaderPanel") == null && view.FindName("ContentTitleText") == null, "Content title is the first rich paragraph");
        Check(!sample.Content.TryGetProperty("contentTitle", out _) && !sample.Content.TryGetProperty("description", out _)
            && !sample.Content.TryGetProperty("showContentHeader", out _)
            && sample.Content.GetProperty("plainText").GetString()!.StartsWith("사내 업무시스템 정기 점검 안내\nIT운영팀"), "Demo TEXT sample has no separate title/description"); 
        Check(paragraphs[11].TextAlignment == TextAlignment.Right
            && paragraphs[11].Inlines.OfType<System.Windows.Documents.Run>().ElementAt(1).FontFamily.Source == "Malgun Gothic", "Alignment and font id map");
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
            "[{\"alignment\":\"JUSTIFY\",\"runs\":[{\"text\":\"<b>x</b>\",\"color\":\"red\",\"size\":0,\"font\":\"Comic Sans MS\"}]}]")));
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

    // [설계 48] WPF는 서버 정책 목록을 복제하지 않고 표시 방어(안전 범위·변환 실패 기본값·JSON 타입 오류 경계)만 한다.
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
        var wpfFonts = (Dictionary<string, string>)richText.GetField("Fonts", BindingFlags.Static | BindingFlags.NonPublic)!.GetValue(null)!;

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

        // 글꼴·정렬: 매핑 유지, 미지원 값은 기본값.
        var fonts = Runs("[{\"text\":\"a\",\"font\":\"GULIM\"},{\"text\":\"b\",\"font\":\"COMIC\"},{\"text\":\"c\",\"font\":\"gulim\"}]");
        Check(fonts[0].FontFamily.Source == "Gulim" && Unset(fonts[1], TextElement.FontFamilyProperty) && Unset(fonts[2], TextElement.FontFamilyProperty),
            "Font id maps; unknown id uses default font");
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

        // 서버 글꼴 ID ↔ WPF 매핑: 테스트에 목록을 복제하지 않고 서버·관리자 웹 정의 원본과 대조한다.
        string root = AppContext.BaseDirectory;
        while (!Directory.Exists(Path.Combine(root, "zero-rule-server"))) root = Path.GetDirectoryName(root.TrimEnd(Path.DirectorySeparatorChar))!;
        string server = File.ReadAllText(Path.Combine(root, "zero-rule-server", "service", "core", "src", "main", "java", "server", "service", "core", "popup", "PopupRichText.java"));
        var serverFonts = System.Text.RegularExpressions.Regex.Match(server, @"FONTS\s*=\s*Set\.of\(([^)]*)\)").Groups[1].Value
            .Split(',').Select(v => v.Trim().Trim('"')).Where(v => v.Length > 0).ToList();
        string web = File.ReadAllText(Path.Combine(root, "zero-rule-web", "main", "src", "features", "RgstPop", "popupRichText.ts"));
        var webFonts = System.Text.RegularExpressions.Regex.Matches(web, @"\{ id: '([A-Z_]+)'").Select(m => m.Groups[1].Value).ToList();
        Check(serverFonts.Count > 0 && serverFonts.All(wpfFonts.ContainsKey) && webFonts.ToHashSet().SetEquals(serverFonts),
            "Every server font id has a WPF mapping and matches admin editor ids: " + string.Join(",", serverFonts));
    }

    // [설계 49] 문단 들여쓰기(indent 단계 × 40 DIP): 왼쪽 여백·모든 줄 적용·정렬·기울임 여유·plainText 무영향·표시 방어.
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

        // 표시 방어: 서버 단계 목록(0~5)을 복제하지 않고 정수·최대 400 DIP(10단계)만 적용, 밖이면 0. 타입 오류도 0.
        var defended = Paragraphs("[{\"indent\":6,\"runs\":[{\"text\":\"a\"}]},{\"indent\":10,\"runs\":[{\"text\":\"b\"}]},{\"indent\":11,\"runs\":[{\"text\":\"c\"}]},"
            + "{\"indent\":-1,\"runs\":[{\"text\":\"d\"}]},{\"indent\":1.5,\"runs\":[{\"text\":\"e\"}]},{\"indent\":\"1\",\"runs\":[{\"text\":\"f\"}]},{\"indent\":1e308,\"runs\":[{\"text\":\"g\"}]},{\"indent\":null,\"runs\":[{\"text\":\"h\"}]}]");
        Check(defended.Select(p => p.Padding.Left).SequenceEqual(new double[] { 240, 400, 0, 0, 0, 0, 0, 0 }), "Indent display defense uses layout range, not server list");

        // Demo 옵션 창: 서버와 같은 indent 검증.
        TextBox Box(Popup.DemoOptionsWindow editor)
        {
            var draft = (System.Text.Json.Nodes.JsonObject)typeof(Popup.DemoOptionsWindow).GetField("_draft", flags)!.GetValue(editor)!;
            var inputs = (System.Collections.IDictionary)typeof(Popup.DemoOptionsWindow).GetField("_inputs", flags)!.GetValue(editor)!;
            return (TextBox)inputs[(draft["content"]!.AsObject(), "textBlocks")]!;
        }
        PopupResponseDto Read(Popup.DemoOptionsWindow editor) => (PopupResponseDto)typeof(Popup.DemoOptionsWindow).GetMethod("ReadResult", flags)!.Invoke(editor, null)!;
        var demoEditor = new Popup.DemoOptionsWindow(sample);
        Box(demoEditor).Text = "[{\"alignment\":\"LEFT\",\"indent\":5,\"runs\":[{\"text\":\"a\"}]},{\"alignment\":\"LEFT\",\"indent\":0,\"runs\":[{\"text\":\"b\"}]}]";
        Check(Read(demoEditor).Content.GetProperty("plainText").GetString() == "a\nb", "Demo accepts indent 0~5");
        foreach (string bad in new[] { "6", "-1", "1.5", "\"1\"", "true" })
        {
            Box(demoEditor).Text = "[{\"alignment\":\"LEFT\",\"indent\":" + bad + ",\"runs\":[{\"text\":\"a\"}]}]";
            try { Read(demoEditor); throw new Exception("Expected demo indent rejection: " + bad); }
            catch (TargetInvocationException e) when (e.InnerException is ArgumentException) { Check(true, "Demo rejects indent " + bad); }
        }
        demoEditor.Close();
    }
}
