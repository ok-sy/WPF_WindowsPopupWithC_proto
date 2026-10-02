using System.ComponentModel;
using System.IO;
using System.Reflection;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Popup.Dtos;
using Popup.Factories;
using Popup.Models;
using Popup.Services;
using Popup.Views.Contents;
using Popup.Views.Windows;

internal static class Program
{
    private static int _checks;
    private static void Check(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
        _checks++;
    }

    private static VideoProgressSnapshot Snapshot(decimal watched, decimal position = 100) => new()
    {
        DurationSeconds = 100, PositionSeconds = position, MaximumPositionSeconds = position, WatchedSeconds = watched
    };

    // 플레이어 콜백 경계에 누적 시청 스냅샷을 주입한다. GUI·실제 브라우저를 열지 않는다.
    private static void Report(VideoQuizPopupView view, VideoProgressSnapshot progress)
    {
        var callback = (EventHandler<VideoProgressSnapshot>?)typeof(VideoPopupView)
            .GetField("ProgressUpdated", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(view.Video);
        callback!.Invoke(view.Video, progress);
    }

    [STAThread]
    private static void Main()
    {
        CheckOriginalImages();
        CheckPollingSchedule();
        CheckPopupClipping();
        CheckCombinedScrolling();
        CheckWebVideoControls();
        CheckVideoOverlay();
        CheckDemoScoreLogging();
        CheckFooterSubmission();
        CheckAlertLayout();
        var dto = DemoPopupDataService.CreatePopups("VIDEO_QUIZ").Single();
        dto.AllowCloseBeforeComplete = false;
        var options = PopupFactory.Create(dto);
        var view = (VideoQuizPopupView)options.Content!;
        var window = new PopupWindow(options);
        var footer = (Grid)window.FindName("FooterArea");
        Check(!view.Quiz.IsEnabled && !footer.IsEnabled, "Initially quiz and whole footer must be disabled");
        Report(view, Snapshot(1, 100));
        Check(!view.IsUnlocked, "Seeking to end must not unlock quiz");
        Report(view, Snapshot(79.999m));
        Check(!view.Quiz.IsEnabled && !footer.IsEnabled, "Below threshold stays disabled");
        var closing = new CancelEventArgs();
        typeof(PopupWindow).GetMethod("OnClosing", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(window, new object[] { closing });
        Check(closing.Cancel, "Mandatory video cannot be bypassed with Alt+F4");
        int unlocks = 0;
        view.Unlocked += (_, _) => unlocks++;
        Report(view, Snapshot(80));
        Check(view.IsUnlocked && view.Quiz.IsEnabled && footer.IsEnabled, "Exact threshold unlocks quiz and footer");
        Report(view, Snapshot(80, 10));
        Report(view, Snapshot(100));
        Check(unlocks == 1 && view.IsUnlocked, "Rewind or replay must not lock the quiz or fire twice");
        foreach (var size in new[] { new Size(400, 200), new Size(800, 600) })
        {
            view.Measure(size);
            view.Arrange(new Rect(size));
            Check(view.DesiredSize.Height <= size.Height, "Combined content must scroll within available height");
        }
        closing = new CancelEventArgs();
        typeof(PopupWindow).GetMethod("OnClosing", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(window, new object[] { closing });
        Check(!closing.Cancel, "Closing is available after watching");
        window.Close();

        foreach (double ratio in new[] { 0d, 1d })
        {
            dto.CompletionRatio = ratio;
            var boundary = (VideoQuizPopupView)PopupFactory.Create(dto).Content!;
            Report(boundary, new VideoProgressSnapshot());
            Check(!boundary.IsUnlocked, "Unknown duration must not unlock");
            Report(boundary, Snapshot(ratio == 0 ? 0 : 99.99m));
            Check(boundary.IsUnlocked == (ratio == 0), "Zero/100 percent boundary");
            Report(boundary, Snapshot(100));
            Check(boundary.IsUnlocked, "Full viewing unlocks every valid threshold");
        }

        var linkOptions = PopupFactory.Create(DemoPopupDataService.CreatePopups("FOOTER_LINK").Single());
        var linkWindow = new PopupWindow(linkOptions);
        Check(linkOptions.OpenFooterLinkAndClose && linkOptions.FooterLinkUrl == "https://example.com/", "Footer link survives DTO conversion");
        Check((string)((Button)linkWindow.FindName("FooterCloseButton")).Content == "바로가기", "Footer label is shortcut");
        linkWindow.Close();
        var plainWindow = new PopupWindow(PopupFactory.Create(DemoPopupDataService.CreatePopups("TEXT").Single()));
        Check((string)((Button)plainWindow.FindName("FooterCloseButton")).Content == "닫기", "Default close mode stays unchanged");
        plainWindow.Close();

        var builder = new PopupResultBuilder(dto.PopupId, null);
        builder.SetVideoProgress(Snapshot(80));
        var submission = builder.BuildSubmitted(new SurveySubmission
        {
            Answers = new() { new SurveyAnswer { QuestionId = 1, SelectedOptionIds = new() { 1 } } },
            Score = 100, Passed = true
        }, DateTimeOffset.Now);
        Check(submission.ResultType == WpfResultType.Submitted && submission.Video?.WatchedSeconds == 80
            && submission.Answers?.Count == 1, "Submission must include video and answers in one item");
        var gateway = new DemoPopupGateway();
        var earlyClose = builder.BuildClosed(DateTimeOffset.Now, false);
        var result = gateway.PostResultsAsync(new WpfResultRequestDto { Results = new() { earlyClose } }).GetAwaiter().GetResult();
        Check(result.Results.Single().Completed != true, "Watching alone must not complete a combined quiz");
        submission.ResultId = Guid.NewGuid().ToString();
        submission.Video = null;
        result = gateway.PostResultsAsync(new WpfResultRequestDto { Results = new() { submission } }).GetAwaiter().GetResult();
        Check(result.Results.Single().Status == "REJECTED", "Combined quiz rejects missing video evidence");
        submission.ResultId = Guid.NewGuid().ToString();
        submission.Video = new WpfVideoProgressDto { DurationSeconds = 100, WatchedSeconds = 80, PositionSeconds = 80, MaximumPositionSeconds = 80 };
        result = gateway.PostResultsAsync(new WpfResultRequestDto { Results = new() { submission } }).GetAwaiter().GetResult();
        Check(result.Results.Single().Completed == true, "Watched and passed quiz completes");
        var api = new PopupApiService("http://localhost:8080/zero-rule-server/p");
        var wireOptions = (JsonSerializerOptions)typeof(PopupApiService)
            .GetField("_jsonOptions", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(api)!;
        var queueOptions = (JsonSerializerOptions)typeof(PopupResultQueue)
            .GetField("FileJsonOptions", BindingFlags.Static | BindingFlags.NonPublic)!.GetValue(null)!;
        foreach (bool withVideo in new[] { false, true })
        foreach (double score in new[] { 0d, 87.5d, 100d })
        {
            var scoreBuilder = new PopupResultBuilder(withVideo ? "VIDEO-QUIZ" : "QUIZ", null);
            if (withVideo) scoreBuilder.SetVideoProgress(Snapshot(80));
            var scored = scoreBuilder.BuildSubmitted(new SurveySubmission { Score = score, Passed = true }, DateTimeOffset.Now);
            var request = new WpfResultRequestDto { Results = new() { scored } };
            using var wire = JsonDocument.Parse(JsonSerializer.Serialize(request, wireOptions));
            var item = wire.RootElement.GetProperty("results")[0];
            Check(item.GetProperty("score").GetDouble() == score && item.GetProperty("passed").GetBoolean(),
                $"Wire JSON must preserve score {score} for video={withVideo}");
            var restored = JsonSerializer.Deserialize<List<WpfResultItemDto>>(
                JsonSerializer.Serialize(request.Results, queueOptions), queueOptions)!;
            Check(restored.Single().Score == score && restored.Single().Passed == true,
                "Queued JSON round trip must preserve score for retry");
        }
        Console.WriteLine($"PASS: {_checks} popup behavior checks");
    }

    private static void CheckAlertLayout()
    {
        var create = typeof(PopupAlert).GetMethod("CreateDialog", BindingFlags.Static | BindingFlags.NonPublic)!;
        var dialog = (Window)create.Invoke(null, new object?[] { null,
            "점수: 100점 (통과 점수 80점)\n\n평가를 통과했습니다.", "평가를 통과했어요", "완료" })!;
        var body = (Border)dialog.Content;
        body.Measure(new Size(430, double.PositiveInfinity));
        body.Arrange(new Rect(new Point(), body.DesiredSize));
        body.UpdateLayout();
        Check(body.DesiredSize.Height > 200 && body.DesiredSize.Height < 450, "Alert sizes to message without clipping");
        var button = ((StackPanel)body.Child).Children.OfType<Button>().Single();
        Check(button.IsDefault && button.IsCancel && (string)button.Content == "완료", "Alert supports Enter and Escape confirmation");
        var bitmap = new RenderTargetBitmap((int)Math.Ceiling(body.ActualWidth), (int)Math.Ceiling(body.ActualHeight), 96, 96, PixelFormats.Pbgra32);
        bitmap.Render(body);
        var encoder = new PngBitmapEncoder();
        encoder.Frames.Add(BitmapFrame.Create(bitmap));
        using var file = File.Create(Path.Combine(AppContext.BaseDirectory, "submission-alert-preview.png"));
        encoder.Save(file);
        dialog.Close();
    }

    private static void CheckFooterSubmission()
    {
        foreach (var type in new[] { "QUIZ", "VIDEO_QUIZ" })
        foreach (var showFooter in new[] { true, false })
        foreach (var showClose in new[] { true, false })
        {
            var options = PopupFactory.Create(DemoPopupDataService.CreatePopups(type).Single());
            options.ShowFooter = showFooter;
            options.ShowCloseButton = showClose;
            var window = new PopupWindow(options);
            var combined = options.Content as VideoQuizPopupView;
            var quiz = combined?.Quiz ?? (SurveyPopupView)options.Content!;
            var footer = (Button)window.FindName("FooterCloseButton");
            var inner = (Button)quiz.FindName("SubmitButton");
            Check((string)footer.Content == "제출", $"{type} footer uses submission label");
            Check(footer.Visibility == Visibility.Visible, "Hiding close does not hide submission action");
            Check(inner.Visibility == (showFooter ? Visibility.Collapsed : Visibility.Visible), "Exactly one submission button remains visible");
            int submitted = 0;
            SurveySubmission? result = null;
            quiz.SurveySubmitted += (_, value) => { submitted++; result = value; };
            var controls = (Dictionary<long, FrameworkElement>)typeof(SurveyPopupView)
                .GetField("_answerControls", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(quiz)!;
            foreach (var panel in controls.Values.OfType<Panel>())
            foreach (var control in panel.Children.OfType<System.Windows.Controls.Primitives.ToggleButton>())
                control.IsChecked = ((SurveyOption)control.Tag).IsCorrect == true;
            void ClickFooter() => typeof(PopupWindow).GetMethod("CloseButton_Click", BindingFlags.Instance | BindingFlags.NonPublic)!
                .Invoke(window, new object[] { footer, new RoutedEventArgs(Button.ClickEvent) });
            if (combined != null)
            {
                ClickFooter();
                Check(submitted == 0, "Locked video quiz cannot submit from footer");
                Report(combined, Snapshot(80));
            }
            if (showFooter) ClickFooter(); else quiz.Submit();
            Check(submitted == 1 && result?.Score == 100 && result.Passed == true,
                $"{type} single button collects answers and grades before emitting submission");
            window.Close();
        }
    }

    private static void CheckDemoScoreLogging()
    {
        var demo = new Popup.DemoWindow();
        var gateway = (DemoPopupGateway)typeof(Popup.DemoWindow)
            .GetField("_gateway", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(demo)!;
        foreach (var type in new[] { "VIDEO_QUIZ", "QUIZ" })
        {
            var dto = DemoPopupDataService.CreatePopups(type).Single();
            var builder = new PopupResultBuilder(dto.PopupId, null);
            if (type == "VIDEO_QUIZ") builder.SetVideoProgress(Snapshot(80));
            var item = builder.BuildSubmitted(new SurveySubmission
            {
                Score = 100, Passed = true,
                Answers = new() { new SurveyAnswer { QuestionId = 2001, SelectedOptionIds = new() { 2101 } } }
            }, DateTimeOffset.Now);
            var response = gateway.PostResultsAsync(new WpfResultRequestDto { Results = new() { item } })
                .GetAwaiter().GetResult().Results.Single();
            Check(response.TotalScore == 100 && response.Passed == true, $"{type} response preserves score and passed");
            var summary = ((TextBlock)demo.FindName("QuizScoreText")).Text;
            Check(summary.Contains(dto.PopupId) && summary.Contains("score: 100") && summary.Contains("passed: true"),
                $"{type} updates DemoWindow score summary");
            var log = (ListBox)demo.FindName("ResultLogList");
            var requestJson = JsonDocument.Parse(((string)log.Items[log.Items.Count - 2]).Substring(6));
            var responseJson = JsonDocument.Parse(((string)log.Items[log.Items.Count - 1]).Substring(6));
            Check(requestJson.RootElement.GetProperty("score").GetDouble() == 100
                && requestJson.RootElement.GetProperty("passed").GetBoolean(), $"{type} request log includes score and passed");
            Check(responseJson.RootElement.GetProperty("totalScore").GetDouble() == 100
                && responseJson.RootElement.GetProperty("passed").GetBoolean(), $"{type} response log includes totalScore and passed");
            requestJson.Dispose();
            responseJson.Dispose();
        }
        demo.Close();
    }

    // Windows에서 실행: 실제 외곽 Grid를 렌더링해 경계를 넘는 콘텐츠의 픽셀이 잘리는지 검사한다.
    private static void CheckPopupClipping()
    {
        foreach (PopupSizeMode mode in Enum.GetValues<PopupSizeMode>())
        {
            var overflow = new Canvas();
            var paint = new Border { Width = 2000, Height = 2000, Background = Brushes.Red };
            Canvas.SetLeft(paint, -50);
            Canvas.SetTop(paint, -50);
            overflow.Children.Add(paint);
            var window = new PopupWindow(new PopupOptions
            {
                Content = overflow, SizeMode = mode, Width = 760, Height = 620,
                ShowHeader = false, ShowFooter = false, UseBackgroundOverlay = false
            });
            var border = (Border)window.FindName("PopupBodyBorder");
            var body = (Grid)window.FindName("PopupBodyContent");
            foreach (Size size in new[] { new Size(240, 160), new Size(480, 320) })
            {
                border.Measure(size);
                border.Arrange(new Rect(size));
                border.UpdateLayout();
                var clip = (RectangleGeometry)body.Clip;
                Check(clip.Rect.Size == body.RenderSize, $"{mode}: clip follows resized body");
                Check(clip.IsFrozen && clip.FillContains(new Point(50, 50)), "Clip preserves central content");
                Check(clip.RadiusX == (mode == PopupSizeMode.Fullscreen ? 0 : 15.5), "Clip matches WPF inner border radius");
                Check(!clip.FillContains(new Point(-1, 50)), "Overflow beyond popup body is excluded");
                foreach (double scale in new[] { 1d, 1.25, 1.5, 2d })
                {
                    int width = (int)Math.Ceiling(body.ActualWidth * scale);
                    int height = (int)Math.Ceiling(body.ActualHeight * scale);
                    var bitmap = new RenderTargetBitmap(width, height, 96 * scale, 96 * scale, PixelFormats.Pbgra32);
                    bitmap.Render(body);
                    byte[] corner = new byte[4];
                    bitmap.CopyPixels(new Int32Rect(0, 0, 1, 1), corner, 4, 0);
                    Check(mode == PopupSizeMode.Fullscreen || corner[3] == 0, "Rounded corner excludes painted overflow at requested rendering DPI");
                }
            }
            window.Close();
        }
        foreach (string type in new[] { "TEXT", "IMAGE", "VIDEO", "SURVEY", "QUIZ", "VIDEO_QUIZ" })
        {
            var window = new PopupWindow(PopupFactory.Create(DemoPopupDataService.CreatePopups(type).First()));
            var border = (Border)window.FindName("PopupBodyBorder");
            border.Measure(new Size(760, 620));
            border.Arrange(new Rect(0, 0, 760, 620));
            border.UpdateLayout();
            Check(((Grid)window.FindName("PopupBodyContent")).Clip != null, $"{type} uses common clipping");
            window.Close();
        }
    }

    private static void CheckPollingSchedule()
    {
        var method = typeof(Popup.MainWindow).GetMethod("GetPollingDelay", BindingFlags.Static | BindingFlags.NonPublic)!;
        TimeSpan Delay(int interval, double elapsed) => (TimeSpan)method.Invoke(null, new object[] { interval, TimeSpan.FromSeconds(elapsed) })!;
        Check(Delay(0, 0).TotalSeconds == 1800 && Delay(99999, 0).TotalSeconds == 3600, "Polling always respects 30/60 minute bounds");
        Check(Delay(3600, 15).TotalSeconds == 3585, "Initial response latency must not shift startup cadence");
        Check(Delay(3600, 3602).TotalSeconds == 3598, "Delayed UI tick must preserve subsequent cadence");
        Check(Delay(1800, 3610).TotalSeconds == 1790, "Changed server interval still uses startup epoch");
    }

    private static void CheckCombinedScrolling()
    {
        var questions = Enumerable.Range(1, 50).Select(i => new SurveyQuestion
        {
            QuestionId = i, Title = $"Long question {i}", QuestionType = SurveyQuestionType.Text
        }).ToList();
        var standalone = new SurveyPopupView("Survey", "Description", questions);
        var inner = (ScrollViewer)standalone.FindName("QuestionScrollViewer");
        Check(inner.Parent != null && inner.VerticalScrollBarVisibility == ScrollBarVisibility.Auto, "Standalone survey keeps own scrolling");
        var video = new VideoPopupView("Video", "test.mp4", "", autoPlay: false);
        var combined = new VideoQuizPopupView(video, standalone, .8);
        var scroll = (ScrollViewer)combined.Content;
        Check(inner.Parent == null && inner.Content == null, "Combined mode physically removes inner scroll owner so wheel bubbles");
        foreach (var size in new[] { new Size(450, 220), new Size(800, 600), new Size(1200, 900) })
        {
            combined.Measure(size);
            combined.Arrange(new Rect(size));
            combined.UpdateLayout();
            double extent = scroll.ExtentHeight;
            Check(extent > 3000 && scroll.ViewportHeight <= size.Height, "All long questions contribute to a single scroll extent");
            scroll.ScrollToEnd();
            combined.UpdateLayout();
            Check(Math.Abs(scroll.VerticalOffset - scroll.ScrollableHeight) < 1, "Single scroll reaches last question and submit area");
            Check(ReferenceEquals(combined.Video, video), "Scrolling retains the player instance");
            Report(combined, Snapshot(80));
            combined.UpdateLayout();
            Check(Math.Abs(scroll.ExtentHeight - extent) < 1, "Unlocking does not change content height");
        }
    }

    private static void CheckVideoOverlay()
    {
        var stateMethod = typeof(VideoPopupView).GetMethod("ApplyWebPlaybackState", BindingFlags.Instance | BindingFlags.NonPublic)!;
        var hideMethod = typeof(VideoPopupView).GetMethod("ControlsHideTimer_Tick", BindingFlags.Instance | BindingFlags.NonPublic)!;
        var showMethod = typeof(VideoPopupView).GetMethod("ShowVideoControls", BindingFlags.Instance | BindingFlags.NonPublic)!;
        foreach (bool showControls in new[] { false, true })
        {
            var player = new VideoPopupView("Overlay", "https://example.com/video.mp4", "", showControls: showControls, autoPlay: false);
            var surface = (Grid)player.FindName("VideoSurface");
            var controls = (Border)player.FindName("LocalVideoControlArea");
            var layer = (Border)player.FindName("VideoInteractionLayer");
            Check(surface.RowDefinitions.Count == 0 && Grid.GetRow(controls) == 0, "Controls and video share one overlay surface");
            Check(player.FindName("VideoWebView") is Microsoft.Web.WebView2.Wpf.WebView2CompositionControl,
                "Web player supports WPF visual composition");
            void State(string type, bool paused) => stateMethod.Invoke(player, new object[] {
                JsonSerializer.SerializeToElement(new { type, duration = 100, position = 0, paused, seeking = false,
                    volume = .7, rate = 1, buffered = new[] { new[] { 0d, 20d }, new[] { 40d, 60d } } }) });
            State("opened", true);
            State("ready", true);
            State("play", false);
            showMethod.Invoke(player, null);
            Check(controls.Visibility == (showControls ? Visibility.Visible : Visibility.Collapsed), "Overlay respects showControls");
            var enterMethod = typeof(VideoPopupView).GetMethod("VideoContainer_MouseEnter", BindingFlags.Instance | BindingFlags.NonPublic)!;
            var leaveMethod = typeof(VideoPopupView).GetMethod("VideoContainer_MouseLeave", BindingFlags.Instance | BindingFlags.NonPublic)!;
            leaveMethod.Invoke(player, new object[] { surface, new MouseEventArgs(Mouse.PrimaryDevice, 0) });
            Check(controls.Visibility == Visibility.Collapsed, "Leaving playing video hides controls immediately");
            enterMethod.Invoke(player, new object[] { surface, new MouseEventArgs(Mouse.PrimaryDevice, 0) });
            Check(controls.Visibility == (showControls ? Visibility.Visible : Visibility.Collapsed), "Entering video immediately restores controls within policy");
            hideMethod.Invoke(player, new object?[] { null, EventArgs.Empty });
            Check(controls.Visibility == Visibility.Collapsed, "Idle playing state hides controls");
            typeof(VideoPopupView).GetField("_controlsPointerDown", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(player, true);
            showMethod.Invoke(player, null);
            hideMethod.Invoke(player, new object?[] { null, EventArgs.Empty });
            Check(controls.Visibility == (showControls ? Visibility.Visible : Visibility.Collapsed), "Control drag pins overlay without overriding policy");
            leaveMethod.Invoke(player, new object[] { surface, new MouseEventArgs(Mouse.PrimaryDevice, 0) });
            Check(controls.Visibility == (showControls ? Visibility.Visible : Visibility.Collapsed), "Mouse leave preserves active control drag");
            typeof(VideoPopupView).GetField("_controlsPointerDown", BindingFlags.Instance | BindingFlags.NonPublic)!.SetValue(player, false);
            State("pause", true);
            hideMethod.Invoke(player, new object?[] { null, EventArgs.Empty });
            Check(controls.Visibility == (showControls ? Visibility.Visible : Visibility.Collapsed), "Paused controls stay available");
            leaveMethod.Invoke(player, new object[] { surface, new MouseEventArgs(Mouse.PrimaryDevice, 0) });
            Check(controls.Visibility == (showControls ? Visibility.Visible : Visibility.Collapsed), "Mouse leave preserves paused controls");
            var click = new MouseButtonEventArgs(Mouse.PrimaryDevice, 0, MouseButton.Left) { RoutedEvent = UIElement.MouseLeftButtonUpEvent };
            layer.RaiseEvent(click);
            Check(((Border)player.FindName("PlaybackFeedback")).Visibility == Visibility.Visible && click.Handled,
                "Video clicks show central feedback and handle input");
            Check(((TextBlock)player.FindName("PlaybackFeedbackIcon")).Text == "\uE768", "Requested play has play feedback");
            ((Button)player.FindName("PlayPauseButton")).RaiseEvent(new MouseButtonEventArgs(Mouse.PrimaryDevice, 0, MouseButton.Left)
                { RoutedEvent = UIElement.MouseLeftButtonUpEvent });
            Check(((TextBlock)player.FindName("PlaybackFeedbackIcon")).Text == "\uE768", "Control input does not bubble into video interaction layer");
            var track = (Canvas)player.FindName("BufferedTrack");
            track.Measure(new Size(100, 4)); track.Arrange(new Rect(0, 0, 100, 4)); track.UpdateLayout();
            Check(track.Children.Count == 2 && Math.Abs(((FrameworkElement)track.Children[0]).Width - 20) < .001
                && Canvas.GetLeft(track.Children[1]) == 40, "Disjoint buffered ranges occupy actual timeline positions");
            typeof(VideoPopupView).GetMethod("VideoPopupView_Unloaded", BindingFlags.Instance | BindingFlags.NonPublic)!.Invoke(player,
                new object[] { player, new RoutedEventArgs(FrameworkElement.UnloadedEvent) });
            Check(!((System.Windows.Threading.DispatcherTimer)typeof(VideoPopupView).GetField("_controlsHideTimer", BindingFlags.Instance | BindingFlags.NonPublic)!.GetValue(player)!).IsEnabled,
                "Unload stops overlay timers");
        }
    }

    private static void CheckWebVideoControls()
    {
        var method = typeof(VideoPopupView).GetMethod("ApplyWebPlaybackState", BindingFlags.Instance | BindingFlags.NonPublic)!;
        var htmlMethod = typeof(VideoPopupView).GetMethod("BuildWebVideoHtml", BindingFlags.Instance | BindingFlags.NonPublic)!;
        foreach (bool allowRate in new[] { false, true })
        {
            var player = new VideoPopupView("Web", "https://example.com/video.mp4?a=1&b=2", "",
                allowFullScreen: false, allowPlaybackRateChange: allowRate, autoPlay: false, defaultVolume: .35);
            string html = (string)htmlMethod.Invoke(player, null)!;
            Check(html.Contains("a=1&amp;b=2") && !html.Contains(" controls"), "HTML5 URL query is preserved without native controls");
            File.WriteAllText(Path.Combine(AppContext.BaseDirectory, $"video-controls-{allowRate}.html"), html);
            Check(((Button)player.FindName("FullScreenButton")).Visibility == Visibility.Collapsed, "Web fullscreen option hides shared button");
            Check(((Button)player.FindName("PlaybackRateButton")).Visibility == (allowRate ? Visibility.Visible : Visibility.Collapsed), "Web rate option controls shared button");
            void State(string type, double position, bool paused = false, bool seeking = false, double volume = .35, double rate = 1)
            {
                var state = JsonSerializer.SerializeToElement(new { type, duration = 100, position, paused, seeking, volume, rate });
                method.Invoke(player, new object[] { state });
            }
            State("opened", 0, true);
            Check(((Border)player.FindName("VideoMessageArea")).Visibility == Visibility.Visible,
                "Metadata alone does not hide initial video loading");
            State("volumechange", 0, true);
            Check(((FrameworkElement)player.FindName("VideoLoadingProgress")).Visibility == Visibility.Visible,
                "Control changes preserve initial loading indicator");
            State("ready", 0, true);
            Check(((Border)player.FindName("VideoMessageArea")).Visibility == Visibility.Collapsed,
                "Playable video clears loading with autoplay disabled");
            State("playblocked", 0, true);
            State("volumechange", 0, true);
            Check(!player.HasPlaybackFailed && ((Border)player.FindName("VideoMessageArea")).Visibility == Visibility.Visible
                && ((FrameworkElement)player.FindName("VideoLoadingProgress")).Visibility == Visibility.Collapsed,
                "Blocked playback preserves actionable guidance without granting failure escape");
            Check(((Border)player.FindName("LocalVideoControlArea")).Visibility == Visibility.Visible, "URL metadata enables shared WPF controls");
            State("play", 0);
            State("progress", .5);
            Check(player.GetFinalProgress()!.WatchedSeconds == .5m, "Web playback advances watched time");
            State("seeking", 90, seeking: true);
            State("seeked", 90);
            State("playing", 90);
            State("progress", 90.5);
            Check(player.GetFinalProgress()!.WatchedSeconds == 1m, "Seeking does not add skipped footage to watched time");
            State("waiting", 90.5);
            State("volumechange", 90.5, volume: 0);
            Check(((Border)player.FindName("VideoMessageArea")).Visibility == Visibility.Visible, "Buffering persists during control changes");
            State("playing", 90.5);
            State("pause", 91, true);
            Check(((Slider)player.FindName("ProgressSlider")).Value == 91, "Web pause synchronizes WPF progress");
            Check(((Border)player.FindName("VideoMessageArea")).Visibility == Visibility.Collapsed, "Resume clears buffering message");
            Check(player.GetFinalProgress()!.WatchedSeconds == 1.5m, "Pause includes final played interval exactly once");
            State("ended", 100, true);
            State("play", 0);
            State("progress", .5);
            Check(player.GetFinalProgress()!.WatchedSeconds == 2m, "Replay retains cumulative watched time");
            State("error", .5, true);
            Check(player.HasPlaybackFailed, "Web error enables existing failure escape policy");
            Check(((FrameworkElement)player.FindName("VideoLoadingProgress")).Visibility == Visibility.Collapsed,
                "Playback errors stop loading indicator");
        }
        var autoplayPlayer = new VideoPopupView("Web", "https://example.com/video.mp4", "", autoPlay: true, defaultVolume: .35);
        File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "video-autoplay.html"), (string)htmlMethod.Invoke(autoplayPlayer, null)!);
        var hidden = new VideoPopupView("Web", "https://example.com/video.mp4", "", showControls: false);
        method.Invoke(hidden, new object[] { JsonSerializer.SerializeToElement(new { type = "opened", duration = 100, position = 0, paused = true, seeking = false, volume = .7, rate = 1 }) });
        Check(((Border)hidden.FindName("LocalVideoControlArea")).Visibility == Visibility.Collapsed, "Hidden controls remain hidden for URL playback");
    }

    private static void CheckOriginalImages()
    {
        foreach (int width in new[] { 80, 400 })
        foreach (double dpi in new[] { 96d, 192d })
        {
            int height = width * 3 / 4;
            byte[] pixels = new byte[width * height * 4];
            for (int y = 0; y < height; y++)
            for (int x = 0; x < width; x++)
            {
                int offset = (y * width + x) * 4;
                pixels[offset + (x < width / 2 ? 0 : 2)] = 255;
                pixels[offset + 3] = 255;
            }
            var bitmap = BitmapSource.Create(width, height, dpi, dpi, PixelFormats.Bgra32, null, pixels, width * 4);
            var encoder = new PngBitmapEncoder();
            encoder.Frames.Add(BitmapFrame.Create(bitmap));
            using var stream = new MemoryStream();
            encoder.Save(stream);
            var dto = DemoPopupDataService.CreatePopups("IMAGE").Single();
            dto.Content = JsonSerializer.SerializeToElement(new
            {
                imageSizeMode = "ORIGINAL", imageUrl = "data:image/png;base64," + Convert.ToBase64String(stream.ToArray()),
                imageWidth = 1, imageHeight = 1, linkUrl = "https://example.com/"
            });
            var view = (ImageFillPopupView)PopupFactory.Create(dto).Content!;
            view.RaiseEvent(new RoutedEventArgs(FrameworkElement.LoadedEvent));
            view.Margin = new Thickness(24); // PopupWindow의 본문 여백 재현
            // sizeMode=AUTO(SizeToContent)는 무한 크기로 측정한다. 이때도 원본 이미지 크기가 팝업 크기로 전달되면 안 된다.
            view.Measure(new Size(double.PositiveInfinity, double.PositiveInfinity));
            Check(view.DesiredSize.Width < width && view.DesiredSize.Height < height,
                "Original image must not grow popup under SizeToContent");
            var host = new Grid { Width = 200, Height = 150, ClipToBounds = true };
            host.Children.Add(view);
            host.Measure(new Size(200, 150));
            host.Arrange(new Rect(0, 0, 200, 150));
            host.UpdateLayout();
            var image = (Image)view.FindName("OriginalImage");
            Check(image.Width == width && image.Height == height, "ORIGINAL ignores requested size and metadata DPI");
            Check(host.ActualWidth == 200 && host.ActualHeight == 150, "Original image must not resize popup");
            var rendered = new RenderTargetBitmap(200, 150, 96, 96, PixelFormats.Pbgra32);
            rendered.Render(host);
            var output = new byte[200 * 150 * 4];
            rendered.CopyPixels(output, 200 * 4, 0);
            int first = (10 * 200 + 10) * 4;
            Check(output[first] == 255 && output[first + 2] == 0, "Original is anchored top-left");
            int edge = (10 * 200 + 190) * 4;
            Check(width == 400 ? output[edge] == 255 && output[edge + 2] == 0
                : output[edge] == 255 && output[edge + 1] == 255 && output[edge + 2] == 255,
                "Large images are clipped, small images leave white space without enlargement");
        }
    }
}
