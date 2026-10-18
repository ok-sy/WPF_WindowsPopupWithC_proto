using System.ComponentModel;
using System.Reflection;
using System.Windows;
using System.Windows.Controls;
using Popup.Factories;
using Popup.Models;
using Popup.Services;
using Popup.Views.Contents;
using Popup.Views.Windows;

/*
 * [설계 50] PopupWindow 회귀 검증(저장소 추적).
 * A1  '{N}일간 보지 않기' 문구가 실제 숨김 일수(서버 hideDays, 없으면 30)와 같은지,
 * A10 일반 VIDEO도 allowCloseBeforeComplete=false면 창 닫기(Alt+F4 등)가 시청 기준 전에는 취소되고
 *     시청 후·재생 실패·앱 종료(Application.Shutdown과 같은 InternalClose(shutdown, ignoreCancel))에서는 닫히는지
 * 50-B displayMode(효과 없는 계약 필드)가 모르는 값·null이어도 팝업 생성이 실패하지 않는지
 * 43  완료 조건 버튼 표현: VIDEO 미달 닫기 비활성·사유 문구·도달/재생 실패 후 활성, VIDEO+QUIZ 잠금 사유 문구,
 *     보조 닫기 표시 규칙, QUIZ 미달 안내의 틀린 문항 번호
 * 52-4 useBackgroundOverlay를 생략한 서버 응답(JSON)이 기본 true로 해석되어 모든 유형에서 Overlay가 표시되는지(명시 false는 그대로)
 * 53-16 시청 비율 경계(일반 VIDEO·VIDEO+QUIZ·Demo가 서버와 같은 4자리 내림 판정·code)와 VIDEO+QUIZ 퀴즈 머리말 중복 숨김(50-D3·D4)
 * 52-2 나중에 보기: showFooter·showLater 표시 규칙, 버튼으로 닫으면 LATER(다시 보지 않기·영상 시청량보다 우선),
 *      완료 전 닫기 잠금(VIDEO·VIDEO+QUIZ) 중에도 닫힘, Overlay 출구로 인정
 * 44  Background Overlay 켜짐: Alt+F4·시스템 메뉴 닫기·외부 WM_CLOSE 취소, 앱 닫기 경로 허용, 화면 출구가 없으면 허용,
 *     Overlay 꺼짐 기존 동작, Esc 무시, 창 제목, 앱 종료 시 결과 저장(결함 1), 생성 실패 시 Overlay 정리(결함 2)
 * 실제 PopupFactory·PopupWindow·PopupManager 경로로 확인한다. 로컬 전용 Popup.BehaviorTests의 같은 검증을 옮겨
 * 다른 환경에서도 같은 명령으로 재현할 수 있게 둔다. 실제 창을 잠깐 띄운다.
 *   실행: dotnet run --project scripts/PopupWindowTests
 * 내부(internal·private) 멤버는 리플렉션으로 접근하므로 이름을 바꾸면 이 검증도 함께 고친다.
 */
internal static class Program
{
    /* [설계 50-B] DemoPopupDataService.CreatePopups의 유형 필터를 삭제해 테스트에서 같은 기준(DemoPopupGateway.Candidates와 동일)으로 고른다. */
    private static List<Popup.Dtos.PopupResponseDto> DemoPopups(string type) => DemoPopupDataService.CreatePopups()
        .Where(p => type == "VIDEO_QUIZ" ? p.PopupId == "DEMO-VIDEO-QUIZ"
            : type == "FOOTER_LINK" ? p.PopupId == "DEMO-FOOTER-LINK"
            : p.PopupType.Equals(type, StringComparison.OrdinalIgnoreCase) && p.PopupId is not ("DEMO-VIDEO-QUIZ" or "DEMO-FOOTER-LINK"))
        .ToList();

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

    [STAThread]
    private static void Main()
    {
        CheckHideDaysLabel50();
        CheckVideoClose50();
        CheckDisplayModeIgnored50();
        CheckVideoFooter43();
        CheckVideoQuizFooter43();
        CheckAuxClose43();
        CheckQuizFailedMessage43();
        CheckOverlayKeyboardClose44();
        CheckShutdownSavesResult44();
        CheckOverlayCleanupOnFailure44();
        CheckOverlayDefault52();
        CheckVideoCompletion53();
        CheckLater52();
        Console.WriteLine($"PASS: {_checks} popup window checks (design 50 A1·A10·B, 43, 44, 52-2, 52-4, 53-16)");
    }

    /* [설계 50-B] displayMode는 효과 없는 계약 필드라 WPF가 읽지 않는다. 모르는 값·null이어도 팝업 생성이 실패하지 않는다. */
    private static void CheckDisplayModeIgnored50()
    {
        foreach (string? mode in new[] { "SEQUENTIAL", "SIMULTANEOUS", "UNKNOWN", "", null })
        {
            var dto = DemoPopups("TEXT").Single();
            dto.DisplayMode = mode!;
            Exception? error = null;
            try { PopupFactory.Create(dto); } catch (Exception exception) { error = exception; }
            Check(error == null, $"[설계 50-B] displayMode '{mode ?? "null"}' does not fail popup creation: {error?.Message}");
        }
    }

    /* [설계 50 A1] 체크박스 문구와 HIDDEN 결과의 hideDays가 같은 값(서버 값, 없으면 30)이다. */
    private static void CheckHideDaysLabel50()
    {
        foreach ((int? days, int expected) in new (int?, int)[] { (7, 7), (null, 30) })
        {
            var dto = DemoPopups("TEXT").Single();
            dto.HideDays = days;
            dto.ShowFooter = true;
            dto.ShowDoNotShowAgain = true;
            var options = PopupFactory.Create(dto);
            var window = new PopupWindow(options);
            var checkBox = (CheckBox)window.FindName("DoNotShowAgainCheckBox");
            Check((string)checkBox.Content == $"{expected}일간 보지 않기" && checkBox.Visibility == Visibility.Visible,
                $"[설계 50 A1] hideDays {days?.ToString() ?? "null"} label is '{checkBox.Content}'");
            var hidden = new PopupResultBuilder(options.PopupId, options.HideDays).BuildClosed(DateTimeOffset.Now, true);
            Check(hidden.HideDays == expected, $"[설계 50 A1] HIDDEN hideDays {hidden.HideDays} matches label {expected}");
            window.Close();
        }
    }

    /* [설계 50 A10] 일반 VIDEO의 창 닫기 제한과 VIDEO·VIDEO+QUIZ 공통 앱 종료 예외. */
    private static void CheckVideoClose50()
    {
        var flags = BindingFlags.Instance | BindingFlags.NonPublic;
        var onClosing = typeof(PopupWindow).GetMethod("OnClosing", flags)!;
        var internalClose = typeof(Window).GetMethod("InternalClose", flags, null, new[] { typeof(bool), typeof(bool) }, null);
        Check(internalClose != null, "[설계 50 A10] WPF Window.InternalClose(shutdown, ignoreCancel) is available for the shutdown check");
        var latest = typeof(VideoPopupView).GetField("_latestProgress", flags)!;
        (PopupWindow Window, VideoPopupView Video, Func<bool> Closed) Open(string type, bool allowClose = false)
        {
            var dto = DemoPopups(type).Single();
            dto.AllowCloseBeforeComplete = allowClose;
            dto.CompletionRatio = 0.8;
            var options = PopupFactory.Create(dto);
            options.UseBackgroundOverlay = false;
            var video = options.Content as VideoPopupView ?? ((VideoQuizPopupView)options.Content!).Video;
            var window = new PopupWindow(options);
            bool closed = false;
            window.Closed += (_, _) => closed = true;
            window.Show();
            typeof(VideoPopupView).GetProperty("HasPlaybackFailed")!.SetValue(video, false);
            return (window, video, () => closed);
        }
        bool CancelledByOnClosing(PopupWindow window)
        {
            var args = new CancelEventArgs();
            onClosing.Invoke(window, new object[] { args });
            return args.Cancel;
        }

        // 시청 전: Alt+F4와 같은 창 닫기(OnClosing·Close)는 취소되고 창이 남는다.
        var before = Open("VIDEO");
        Check(CancelledByOnClosing(before.Window), "[설계 50 A10] VIDEO close before watching is cancelled (Alt+F4)");
        before.Window.Close();
        Check(!before.Closed() && before.Window.IsVisible, "[설계 50 A10] VIDEO Window.Close before watching keeps the window");
        // 시청 기준 도달 후에는 같은 경로로 닫힌다.
        latest.SetValue(before.Video, Snapshot(80));
        Check(!CancelledByOnClosing(before.Window), "[설계 50 A10] VIDEO close is allowed after reaching the ratio");
        before.Window.Close();
        Check(before.Closed(), "[설계 50 A10] VIDEO window closes after watching");

        // 기준 미만(79.9%)은 계속 취소된다.
        var below = Open("VIDEO");
        latest.SetValue(below.Video, Snapshot(79.9m));
        Check(CancelledByOnClosing(below.Window), "[설계 50 A10] VIDEO below the ratio stays blocked");
        // 재생 실패면 VIDEO+QUIZ와 같이 닫기를 막지 않는다.
        typeof(VideoPopupView).GetProperty("HasPlaybackFailed")!.SetValue(below.Video, true);
        Check(!CancelledByOnClosing(below.Window), "[설계 50 A10] VIDEO playback failure does not block closing");
        below.Window.Close();
        Check(below.Closed(), "[설계 50 A10] VIDEO with playback failure closes");

        // 완료 전 닫기 허용(기본값)은 기존처럼 바로 닫힌다.
        var allowed = Open("VIDEO", allowClose: true);
        Check(!CancelledByOnClosing(allowed.Window), "[설계 50 A10] allowCloseBeforeComplete=true VIDEO is not blocked");
        allowed.Window.Close();
        Check(allowed.Closed(), "[설계 50 A10] allowCloseBeforeComplete=true VIDEO closes");

        // 앱 종료(Application.Shutdown → InternalClose(true, true))는 VIDEO·VIDEO+QUIZ 모두 시청 전이어도 닫힌다.
        foreach (string type in new[] { "VIDEO", "VIDEO_QUIZ" })
        {
            var exiting = Open(type);
            Check(CancelledByOnClosing(exiting.Window), $"[설계 50 A10] {type} user close before watching is cancelled");
            internalClose!.Invoke(exiting.Window, new object[] { true, true });
            Check(exiting.Closed(), $"[설계 50 A10] {type} closes on application shutdown before watching");
        }
    }

    /* ───────────────────────── [설계 43·44] 공통 도우미 ───────────────────────── */

    private static readonly BindingFlags Flags = BindingFlags.Instance | BindingFlags.NonPublic;

    [System.Runtime.InteropServices.DllImport("user32.dll")]
    private static extern IntPtr SendMessage(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam);
    private const uint WM_CLOSE = 0x0010;
    private const uint WM_SYSCOMMAND = 0x0112;
    private static readonly IntPtr SC_CLOSE = new(0xF060);

    private sealed record Opened(PopupWindow Window, PopupOptions Options, Func<bool> Closed)
    {
        public T Find<T>(string name) => (T)Window.FindName(name);
        public VideoPopupView? Video => Options.Content as VideoPopupView ?? (Options.Content as VideoQuizPopupView)?.Video;
    }

    private static Opened OpenPopup(string type, Action<Popup.Dtos.PopupResponseDto>? configure = null, bool overlay = false)
    {
        var dto = DemoPopups(type).Single();
        configure?.Invoke(dto);
        var options = PopupFactory.Create(dto);
        options.UseBackgroundOverlay = overlay;   // PopupWindow 단독 검증이라 실제 Overlay 창은 띄우지 않는다(정책 판단만 이 값을 본다)
        var window = new PopupWindow(options);
        bool closed = false;
        window.Closed += (_, _) => closed = true;
        window.Show();
        var opened = new Opened(window, options, () => closed);
        if (opened.Video != null) SetPlaybackFailed(opened.Video, false);
        return opened;
    }

    private static void SetPlaybackFailed(VideoPopupView video, bool failed) =>
        typeof(VideoPopupView).GetProperty("HasPlaybackFailed")!.SetValue(video, failed);

    /* 재생 진행 틱과 같은 경로: 마지막 스냅샷을 바꾸고 ProgressUpdated 구독자(VideoQuizPopupView·PopupWindow)를 부른다. */
    private static void Report(VideoPopupView video, VideoProgressSnapshot progress)
    {
        typeof(VideoPopupView).GetField("_latestProgress", Flags)!.SetValue(video, progress);
        var callback = (EventHandler<VideoProgressSnapshot>?)typeof(VideoPopupView).GetField("ProgressUpdated", Flags)!.GetValue(video);
        callback?.Invoke(video, progress);
    }

    /* 재생 실패 경로(ShowVideoError가 HasPlaybackFailed를 세우고 PlaybackFailed를 올린다). */
    private static void FailPlayback(VideoPopupView video)
    {
        SetPlaybackFailed(video, true);
        var callback = (EventHandler?)typeof(VideoPopupView).GetField("PlaybackFailed", Flags)!.GetValue(video);
        callback?.Invoke(video, EventArgs.Empty);
    }

    private static void Click(PopupWindow window, Button button) =>
        typeof(PopupWindow).GetMethod("CloseButton_Click", Flags)!
            .Invoke(window, new object[] { button, new RoutedEventArgs(Button.ClickEvent) });

    /* Application.Shutdown이 남은 창을 닫는 경로와 같은 InternalClose(shutdown, ignoreCancel). */
    private static void ShutdownClose(Window window) =>
        typeof(Window).GetMethod("InternalClose", Flags, null, new[] { typeof(bool), typeof(bool) }, null)!
            .Invoke(window, new object[] { true, true });

    private static IntPtr Hwnd(Window window) => new System.Windows.Interop.WindowInteropHelper(window).Handle;

    private static System.Windows.Input.KeyEventArgs Key(Window window, System.Windows.Input.Key key, RoutedEvent routedEvent) =>
        new(System.Windows.Input.Keyboard.PrimaryDevice, PresentationSource.FromVisual(window)!, 0, key) { RoutedEvent = routedEvent };

    /* Alt+F4 키 입력(Key.System + SystemKey F4)을 창에 올리고 PopupWindow가 처리(Handled)했는지 돌려준다. */
    private static bool AltF4Handled(Window window)
    {
        var args = Key(window, System.Windows.Input.Key.F4, System.Windows.Input.Keyboard.PreviewKeyDownEvent);
        var markSystem = typeof(System.Windows.Input.KeyEventArgs).GetMethod("MarkSystem", Flags);
        if (markSystem != null) markSystem.Invoke(args, null);
        else typeof(System.Windows.Input.KeyEventArgs).GetField("_key", Flags)!.SetValue(args, System.Windows.Input.Key.System);
        Check(args.Key == System.Windows.Input.Key.System && args.SystemKey == System.Windows.Input.Key.F4,
            "[설계 44] simulated key event is Alt+F4 (Key.System + SystemKey F4)");
        window.RaiseEvent(args);
        return args.Handled;
    }

    private static void PressEscape(Window window)
    {
        window.RaiseEvent(Key(window, System.Windows.Input.Key.Escape, System.Windows.Input.Keyboard.PreviewKeyDownEvent));
        window.RaiseEvent(Key(window, System.Windows.Input.Key.Escape, System.Windows.Input.Keyboard.KeyDownEvent));
    }

    private static HashSet<PopupWindow> OpenWindows(Popup.Managers.PopupManager manager) =>
        (HashSet<PopupWindow>)typeof(Popup.Managers.PopupManager).GetField("_openWindows", Flags)!.GetValue(manager)!;

    private static Popup.Managers.BackgroundOverlayManager Overlay(Popup.Managers.PopupManager manager) =>
        (Popup.Managers.BackgroundOverlayManager)typeof(Popup.Managers.PopupManager).GetField("_backgroundOverlayManager", Flags)!.GetValue(manager)!;

    private static Window NewOwner()
    {
        var owner = new Window { Width = 10, Height = 10, ShowInTaskbar = false, WindowStyle = WindowStyle.None };
        owner.Show();
        return owner;
    }

    /* ───────────────────────── [설계 43] 완료 조건 버튼 표현 ───────────────────────── */

    /* 일반 VIDEO(완료 전 닫기 금지): 미달이면 닫기 비활성 + 시청 %·기준 사유, 도달·재생 실패면 활성. 허용이면 기존처럼 활성·문구 없음. */
    private static void CheckVideoFooter43()
    {
        void Configure(Popup.Dtos.PopupResponseDto dto)
        {
            dto.AllowCloseBeforeComplete = false;
            dto.CompletionRatio = 0.8;
            dto.ShowFooter = true;
            dto.ShowFooterButton = true;
        }
        var watching = OpenPopup("VIDEO", Configure);
        var button = watching.Find<Button>("FooterCloseButton");
        var reason = watching.Find<TextBlock>("FooterResponseProgressText");
        Check(!button.IsEnabled && reason.Visibility == Visibility.Visible
            && reason.Text == "영상 0% 시청 · 기준 80% 이상 시청하면 닫을 수 있습니다",
            $"[설계 43] VIDEO before watching: close disabled with reason ({reason.Text})");
        Check(System.Windows.Automation.AutomationProperties.GetLiveSetting(reason) == System.Windows.Automation.AutomationLiveSetting.Polite
            && System.Windows.Automation.AutomationProperties.GetHelpText(button) == reason.Text,
            "[설계 43] reason text is a polite live region and the disabled button carries it as HelpText");
        Report(watching.Video!, Snapshot(50));
        Check(!button.IsEnabled && reason.Text.StartsWith("영상 50% 시청"), $"[설계 43] reason follows progress ({reason.Text})");
        Report(watching.Video!, Snapshot(79.99m));
        Check(!button.IsEnabled && reason.Text.StartsWith("영상 79% 시청"),
            $"[설계 43] shown percent is floored so a disabled button never shows the threshold ({reason.Text})");
        Click(watching.Window, button);   // 방어 가드: 안내창 없이 창 유지(예전 '필수 영상 시청' MessageBox 제거)
        Check(!watching.Closed() && watching.Window.IsVisible, "[설계 43] click guard keeps the window without a modal");
        Report(watching.Video!, Snapshot(80));
        Check(button.IsEnabled && reason.Text == "시청 기준을 충족했습니다. 닫을 수 있습니다."
            && System.Windows.Automation.AutomationProperties.GetHelpText(button) == string.Empty,
            $"[설계 43] reaching the ratio enables close ({reason.Text})");
        Click(watching.Window, button);
        Check(watching.Closed(), "[설계 43] footer close works after reaching the ratio");

        var failed = OpenPopup("VIDEO", Configure);
        var failedButton = failed.Find<Button>("FooterCloseButton");
        var failedReason = failed.Find<TextBlock>("FooterResponseProgressText");
        Check(!failedButton.IsEnabled, "[설계 43] VIDEO starts disabled before playback failure");
        FailPlayback(failed.Video!);
        Check(failedButton.IsEnabled && failedReason.Text == "영상을 재생할 수 없어 시청 기준과 관계없이 닫을 수 있습니다.",
            $"[설계 43] playback failure enables close with a reason ({failedReason.Text})");
        Click(failed.Window, failedButton);
        Check(failed.Closed(), "[설계 43] VIDEO with playback failure closes from the footer");

        var allowed = OpenPopup("VIDEO", dto => { Configure(dto); dto.AllowCloseBeforeComplete = true; });
        Check(allowed.Find<Button>("FooterCloseButton").IsEnabled
            && allowed.Find<TextBlock>("FooterResponseProgressText").Visibility == Visibility.Collapsed,
            "[설계 43] allowCloseBeforeComplete=true VIDEO keeps an enabled close without reason text");
        Click(allowed.Window, allowed.Find<Button>("FooterCloseButton"));
        Check(allowed.Closed(), "[설계 43] allowCloseBeforeComplete=true VIDEO closes");
    }

    /* VIDEO+QUIZ 잠금 중: 제출·'보지 않기' 비활성(기존 계약) + 시청 사유 문구, 해제 뒤에는 문항 진행 문구. */
    private static void CheckVideoQuizFooter43()
    {
        var locked = OpenPopup("VIDEO_QUIZ", dto => { dto.AllowCloseBeforeComplete = false; dto.CompletionRatio = 0.8; dto.ShowFooter = true; });
        var view = (VideoQuizPopupView)locked.Options.Content!;
        var submit = locked.Find<Button>("FooterCloseButton");
        var reason = locked.Find<TextBlock>("FooterResponseProgressText");
        var aux = locked.Find<Button>("FooterAuxCloseButton");
        var hide = locked.Find<CheckBox>("DoNotShowAgainCheckBox");
        Report(view.Video, Snapshot(30));
        Check(!view.IsUnlocked && !submit.IsEnabled && !hide.IsEnabled && aux.Visibility == Visibility.Collapsed
            && reason.Text == "영상 30% 시청 · 기준 80% 이상 시청하면 퀴즈와 제출이 활성화됩니다",
            $"[설계 43] locked VIDEO+QUIZ shows the watch reason ({reason.Text})");
        Check(System.Windows.Automation.AutomationProperties.GetHelpText(submit) == reason.Text,
            "[설계 43] locked submit carries the watch reason as HelpText");
        Report(view.Video, Snapshot(80));
        Check(view.IsUnlocked && hide.IsEnabled && reason.Text == view.Quiz.ResponseProgressText && reason.Text.StartsWith("필수 문항"),
            $"[설계 43] unlocking switches back to the question progress text ({reason.Text})");
        ShutdownClose(locked.Window);

        // 잠금 중 재생 실패: 보조 닫기가 보이고(제출 전 이탈 허용) 누르면 닫힌다.
        var failed = OpenPopup("VIDEO_QUIZ", dto => { dto.AllowCloseBeforeComplete = false; dto.CompletionRatio = 0.8; dto.ShowFooter = true; });
        var failedAux = failed.Find<Button>("FooterAuxCloseButton");
        Check(failedAux.Visibility == Visibility.Collapsed, "[설계 43] aux close hidden while watching (allowCloseBeforeComplete=false)");
        FailPlayback(failed.Video!);
        Check(failedAux.Visibility == Visibility.Visible && failedAux.IsEnabled
            && failed.Find<TextBlock>("FooterResponseProgressText").Text.Contains("닫기 버튼으로 닫을 수 있습니다"),
            "[설계 43] playback failure shows the aux close for locked VIDEO+QUIZ");
        Click(failed.Window, failedAux);
        Check(failed.Closed(), "[설계 43] aux close closes locked VIDEO+QUIZ after playback failure");

        // 완료 전 닫기 허용: 잠금 여부와 관계없이 보조 닫기 표시. showFooter=false면 숨김.
        var allowed = OpenPopup("VIDEO_QUIZ", dto => { dto.AllowCloseBeforeComplete = true; dto.CompletionRatio = 0.8; dto.ShowFooter = true; });
        var allowedView = (VideoQuizPopupView)allowed.Options.Content!;
        var allowedAux = allowed.Find<Button>("FooterAuxCloseButton");
        Check(!allowedView.IsUnlocked && allowedAux.Visibility == Visibility.Visible && allowedAux.IsEnabled
            && !allowed.Find<Button>("FooterCloseButton").IsEnabled,
            "[설계 43] allowCloseBeforeComplete=true VIDEO+QUIZ shows an enabled aux close while submit stays locked");
        Report(allowedView.Video, Snapshot(100));
        Check(allowedView.IsUnlocked && allowedAux.Visibility == Visibility.Visible, "[설계 43] aux close stays after unlocking");
        Click(allowed.Window, allowedAux);
        Check(allowed.Closed(), "[설계 43] aux close closes VIDEO+QUIZ without submitting");
        var noFooter = OpenPopup("VIDEO_QUIZ", dto => { dto.AllowCloseBeforeComplete = true; dto.ShowFooter = false; });
        Check(noFooter.Find<Button>("FooterAuxCloseButton").Visibility == Visibility.Collapsed, "[설계 43] showFooter=false hides the aux close");
        ShutdownClose(noFooter.Window);
    }

    /* 보조 닫기: QUIZ는 미달 1회 이후 + Overlay 꺼짐 + 푸터 표시일 때만, SURVEY·TEXT는 표시하지 않는다. */
    private static void CheckAuxClose43()
    {
        var notifyFailed = typeof(PopupWindow).GetMethod("NotifyQuizFailed", Flags)!;
        foreach ((bool overlay, bool showFooter, bool expected) in new[] { (false, true, true), (true, true, false), (false, false, false) })
        {
            var quiz = OpenPopup("QUIZ", dto => dto.ShowFooter = showFooter, overlay);
            var aux = quiz.Find<Button>("FooterAuxCloseButton");
            Check(aux.Visibility == Visibility.Collapsed, $"[설계 43] QUIZ aux close hidden before a failed attempt (overlay {overlay}, footer {showFooter})");
            notifyFailed.Invoke(quiz.Window, null);
            Check((aux.Visibility == Visibility.Visible) == expected,
                $"[설계 43] QUIZ aux close after failure is {(expected ? "shown" : "hidden")} (overlay {overlay}, footer {showFooter})");
            if (expected)
            {
                Click(quiz.Window, aux);
                Check(quiz.Closed(), "[설계 43] QUIZ aux close closes the window (CLOSED path)");
            }
            else
            {
                ShutdownClose(quiz.Window);
            }
        }
        foreach (string type in new[] { "SURVEY", "TEXT" })
        {
            var other = OpenPopup(type, dto => dto.ShowFooter = true);
            notifyFailed.Invoke(other.Window, null);
            Check(other.Find<Button>("FooterAuxCloseButton").Visibility == Visibility.Collapsed, $"[설계 43] {type} never shows the aux close");
            ShutdownClose(other.Window);
        }
    }

    /* QUIZ 미달 안내의 틀린 문항 번호(화면 번호). 결과 항목에는 담지 않는다. */
    private static void CheckQuizFailedMessage43()
    {
        var dto = DemoPopups("QUIZ").Single();
        var options = PopupFactory.Create(dto);
        var view = (SurveyPopupView)options.Content!;
        var questions = (List<SurveyQuestion>)typeof(SurveyPopupView).GetField("_questions", Flags)!.GetValue(view)!;
        var scoredNumbers = questions.Select((question, index) => (question, index)).Where(x => x.question.IsScored)
            .Select(x => x.index + 1).ToList();
        Check(scoredNumbers.Count >= 2, "[설계 43] demo QUIZ has at least two scored questions");

        var none = QuizGrader.Grade(questions, new List<SurveyAnswer>(), dto.PassingScore);
        Check(!none.Passed && none.IncorrectQuestionNumbers.SequenceEqual(scoredNumbers),
            "[설계 43] unanswered scored questions are all listed as incorrect");

        var first = questions.First(question => question.IsScored);
        var correct = new SurveyAnswer { QuestionId = first.QuestionId };
        if (first.QuestionType == SurveyQuestionType.Text) correct.TextAnswer = first.CorrectAnswer ?? string.Empty;
        else correct.SelectedOptionIds.AddRange(first.Options.Where(option => option.IsCorrect == true).Select(option => option.OptionId));
        var answers = new List<SurveyAnswer> { correct };
        var graded = QuizGrader.Grade(questions, answers, dto.PassingScore);
        var expectedWrong = scoredNumbers.Skip(1).ToList();
        Check(graded.IncorrectQuestionNumbers.SequenceEqual(expectedWrong), "[설계 43] a correct answer is removed from the incorrect list");

        var submission = new SurveySubmission
        {
            Answers = answers, Score = graded.Score, Passed = graded.Passed, PassingScore = graded.PassingScore,
            IncorrectQuestionNumbers = graded.IncorrectQuestionNumbers
        };
        var build = typeof(Popup.Managers.PopupManager).GetMethod("BuildQuizFailedMessage", BindingFlags.Static | BindingFlags.NonPublic)!;
        string noAux = (string)build.Invoke(null, new object[] { submission, false })!;
        Check(noAux.Contains($"틀린 문항: {string.Join(", ", expectedWrong)}번") && noAux.Contains("다시 제출해 주세요")
            && !noAux.Contains("'닫기'"), $"[설계 43] failed QUIZ notice lists wrong question numbers ({noAux})");
        string withAux = (string)build.Invoke(null, new object[] { submission, true })!;
        Check(withAux.Contains("하단 '닫기'로 닫을 수 있습니다"), "[설계 43] the notice mentions the aux close only when it is shown");

        // 안내의 보조 닫기 문장은 창의 실제 표시 조건(HasAuxClose)을 따른다: Overlay 꺼진 QUIZ는 표시, 완료 전 닫기 금지 VIDEO+QUIZ는 미표시.
        var hasAux = typeof(PopupWindow).GetProperty("HasAuxClose", Flags)!;
        var notifyFailed = typeof(PopupWindow).GetMethod("NotifyQuizFailed", Flags)!;
        var quiz = OpenPopup("QUIZ", d => d.ShowFooter = true, overlay: false);
        notifyFailed.Invoke(quiz.Window, null);
        var videoQuiz = OpenPopup("VIDEO_QUIZ", d => { d.ShowFooter = true; d.AllowCloseBeforeComplete = false; }, overlay: false);
        notifyFailed.Invoke(videoQuiz.Window, null);
        Check((bool)hasAux.GetValue(quiz.Window)! && !(bool)hasAux.GetValue(videoQuiz.Window)!,
            "[설계 43] aux close notice follows the window's actual aux close state");
        ShutdownClose(quiz.Window);
        ShutdownClose(videoQuiz.Window);

        var item = new PopupResultBuilder("Q43", null).BuildSubmitted(submission, DateTimeOffset.Now);
        string json = System.Text.Json.JsonSerializer.Serialize(item);
        Check(!json.Contains("ncorrect", StringComparison.OrdinalIgnoreCase) && item.Score == graded.Score && item.Passed == graded.Passed,
            "[설계 43] result contract (score·passed) is unchanged and carries no wrong-question list");
    }

    /* ───────────────────────── [설계 44] Background Overlay 키보드 종료 ───────────────────────── */

    private static void CheckOverlayKeyboardClose44()
    {
        var closeByApp = typeof(PopupWindow).GetMethod("CloseByApp", Flags)!;

        // Overlay 켜짐 + 화면에 닫기 버튼: 앱 닫기만 허용
        var text = OpenPopup("TEXT", dto => { dto.ShowFooter = true; dto.ShowFooterButton = true; dto.Title = "공지 제목 44"; }, overlay: true);
        Check(text.Window.Title == "공지 제목 44", $"[설계 44] window title is the popup title ({text.Window.Title})");
        Check(AltF4Handled(text.Window), "[설계 44] Overlay on: Alt+F4 is swallowed at the key level");
        SendMessage(Hwnd(text.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(!text.Closed() && text.Window.IsVisible, "[설계 44] Overlay on: external WM_CLOSE (Alt+F4 path) is cancelled");
        SendMessage(Hwnd(text.Window), WM_SYSCOMMAND, SC_CLOSE, IntPtr.Zero);
        Check(!text.Closed(), "[설계 44] Overlay on: system menu close (SC_CLOSE) is cancelled");
        text.Window.Close();
        Check(!text.Closed(), "[설계 44] Overlay on: external Window.Close is cancelled");
        PressEscape(text.Window);
        Check(!text.Closed(), "[설계 44] Esc does nothing");
        Click(text.Window, text.Find<Button>("FooterCloseButton"));
        Check(text.Closed(), "[설계 44] Overlay on: footer close (app path) is allowed");

        var direct = OpenPopup("TEXT", dto => { dto.ShowFooter = true; dto.ShowFooterButton = true; }, overlay: true);
        closeByApp.Invoke(direct.Window, null);
        Check(direct.Closed(), "[설계 44] Overlay on: CloseByApp (submit/flow close) is allowed");

        // 화면에 닫기 수단이 없으면(showFooter=false 또는 showFooterButton=false) 키보드 닫기를 막지 않는다(교착 방지).
        foreach ((bool footer, bool button) in new[] { (false, true), (true, false) })
        {
            var bare = OpenPopup("TEXT", dto => { dto.ShowFooter = footer; dto.ShowFooterButton = button; }, overlay: true);
            Check(!AltF4Handled(bare.Window), $"[설계 44] no visible exit (footer {footer}, button {button}): Alt+F4 is not swallowed");
            SendMessage(Hwnd(bare.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
            Check(bare.Closed(), $"[설계 44] no visible exit (footer {footer}, button {button}): keyboard close is allowed");
        }

        // VIDEO는 화면 출구가 없어도 완료 전 닫기 제한(A10)이 그대로 적용된다.
        var video = OpenPopup("VIDEO", dto => { dto.ShowFooter = false; dto.AllowCloseBeforeComplete = false; dto.CompletionRatio = 0.8; }, overlay: true);
        SendMessage(Hwnd(video.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(!video.Closed(), "[설계 44] Overlay on VIDEO without footer still keeps the completion rule before watching");
        Report(video.Video!, Snapshot(80));
        SendMessage(Hwnd(video.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(video.Closed(), "[설계 44] Overlay on VIDEO without footer closes by keyboard after watching");

        // QUIZ Overlay 켜짐: 제출 버튼이 보이므로 키보드 닫기 차단(통과해야 닫힘).
        var quiz = OpenPopup("QUIZ", null, overlay: true);
        SendMessage(Hwnd(quiz.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(!quiz.Closed(), "[설계 44] Overlay on QUIZ blocks keyboard close (submit is visible)");
        ShutdownClose(quiz.Window);

        // VIDEO+QUIZ 잠금 + 푸터 없음 + 재생 실패: 제출에 도달할 수 없으므로 키보드 닫기를 허용한다.
        var stuck = OpenPopup("VIDEO_QUIZ", dto => { dto.ShowFooter = false; dto.AllowCloseBeforeComplete = false; dto.CompletionRatio = 0.8; }, overlay: true);
        SendMessage(Hwnd(stuck.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(!stuck.Closed(), "[설계 44] locked VIDEO+QUIZ blocks keyboard close while the video can play");
        FailPlayback(stuck.Video!);
        SendMessage(Hwnd(stuck.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(stuck.Closed(), "[설계 44] locked VIDEO+QUIZ without a reachable exit allows keyboard close after playback failure");

        // Overlay 꺼짐: 기존 동작(Alt+F4·WM_CLOSE 허용), Esc는 무시.
        var off = OpenPopup("TEXT", dto => { dto.ShowFooter = true; dto.ShowFooterButton = true; }, overlay: false);
        Check(!AltF4Handled(off.Window), "[설계 44] Overlay off: Alt+F4 is not swallowed");
        PressEscape(off.Window);
        Check(!off.Closed(), "[설계 44] Overlay off: Esc does nothing");
        SendMessage(Hwnd(off.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(off.Closed(), "[설계 44] Overlay off: keyboard close is allowed");
    }

    /* [설계 44 결함 1] 앱 종료(InternalClose(true, true))로 닫히면 사용자 닫기가 취소되는 상태여도 PopupManager가 결과를 저장한다. */
    private static void CheckShutdownSavesResult44()
    {
        var owner = NewOwner();
        try
        {
            foreach ((string type, bool overlay) in new[] { ("VIDEO", false), ("VIDEO_QUIZ", false), ("VIDEO", true) })
            {
                var manager = new Popup.Managers.PopupManager(owner);
                var dto = DemoPopups(type).Single();
                dto.AllowCloseBeforeComplete = false;
                dto.CompletionRatio = 0.8;
                var options = PopupFactory.Create(dto);
                options.UseBackgroundOverlay = overlay;
                var saved = new List<Popup.Dtos.WpfResultItemDto>();
                options.EnqueueResult = saved.Add;
                manager.Show(options);
                var window = OpenWindows(manager).Single();
                var video = options.Content as VideoPopupView ?? ((VideoQuizPopupView)options.Content!).Video;
                SetPlaybackFailed(video, false);
                Report(video, Snapshot(30, 30));
                window.Close();
                Check(saved.Count == 0 && window.IsVisible, $"[설계 44] {type} (overlay {overlay}) user close before watching saves nothing");
                ShutdownClose(window);
                Check(saved.Count == 1 && saved[0].ResultType == Popup.Dtos.WpfResultType.VideoWatched && saved[0].Video?.WatchedSeconds == 30,
                    $"[설계 44 결함 1] {type} (overlay {overlay}) shutdown close saves VIDEO_WATCHED with watched seconds ({saved.Count})");
                Check(!manager.HasOpenPopups && !Overlay(manager).IsVisible, $"[설계 44] {type} (overlay {overlay}) shutdown cleans up window and overlay");
            }
        }
        finally { owner.Close(); }
    }

    /*
     * [TODO52-2] 나중에 보기. 모든 유형에서 showFooter·showLater가 모두 true일 때만 버튼이 보이고, 누르면 결과 LATER로 닫힌다.
     * 다시 보지 않기 체크·영상 시청량이 있어도 LATER이며 hideDays·video를 싣지 않는다. 완료 전 닫기 잠금 중에도 닫힌다.
     */
    private static void CheckLater52()
    {
        foreach (string type in new[] { "TEXT", "IMAGE", "VIDEO", "SURVEY", "QUIZ", "VIDEO_QUIZ", "FOOTER_LINK" })
        {
            foreach ((bool footer, bool showLater, bool expected) in new[] { (true, true, true), (true, false, false), (false, true, false) })
            {
                var opened = OpenPopup(type, dto => { dto.ShowFooter = footer; dto.ShowLater = showLater; });
                Check((opened.Find<Button>("FooterLaterButton").Visibility == Visibility.Visible) == expected,
                    $"[52-2] {type} later button {(expected ? "shown" : "hidden")} (footer {footer}, showLater {showLater})");
                ShutdownClose(opened.Window);
            }
        }
        Check(!new Popup.Dtos.PopupResponseDto().ShowLater, "[52-2] ShowLater defaults to false");

        var builder = new PopupResultBuilder("P1", 7, "D-1");
        builder.SetVideoProgress(Snapshot(30));
        var later = builder.BuildOnClose(DateTimeOffset.Now, true, true);
        Check(later.ResultType == Popup.Dtos.WpfResultType.Later && later.HideDays == null && later.Video == null && later.DeliveryId == "D-1",
            $"[52-2] later wins over do-not-show-again and video ({later.ResultType})");
        Check(builder.BuildOnClose(DateTimeOffset.Now, false, true).ResultType == Popup.Dtos.WpfResultType.Hidden,
            "[52-2] without later the do-not-show-again choice still produces HIDDEN");

        var owner = NewOwner();
        try
        {
            foreach ((string type, bool overlay) in new[] { ("TEXT", false), ("VIDEO", false), ("VIDEO_QUIZ", false), ("QUIZ", true), ("VIDEO", true) })
            {
                var manager = new Popup.Managers.PopupManager(owner);
                var dto = DemoPopups(type).Single();
                dto.ShowFooter = true;
                dto.ShowLater = true;
                dto.ShowDoNotShowAgain = true;
                dto.AllowCloseBeforeComplete = false;
                dto.CompletionRatio = 0.8;
                var options = PopupFactory.Create(dto);
                options.UseBackgroundOverlay = overlay;
                var saved = new List<Popup.Dtos.WpfResultItemDto>();
                options.EnqueueResult = saved.Add;
                manager.Show(options);
                var window = OpenWindows(manager).Single();
                var video = options.Content as VideoPopupView ?? (options.Content as VideoQuizPopupView)?.Video;
                if (video != null)
                {
                    SetPlaybackFailed(video, false);
                    Report(video, Snapshot(30, 30));
                }
                ((CheckBox)window.FindName("DoNotShowAgainCheckBox")).IsChecked = true;
                if (overlay)
                    Check((bool)typeof(PopupWindow).GetProperty("BlocksExternalClose", Flags)!.GetValue(window)!, $"[52-2] {type} overlay counts the later button as a visible exit");
                var button = (Button)window.FindName("FooterLaterButton");
                Check(button.IsEnabled, $"[52-2] {type} later button stays enabled while closing is locked");
                typeof(PopupWindow).GetMethod("LaterButton_Click", Flags)!
                    .Invoke(window, new object[] { button, new RoutedEventArgs(Button.ClickEvent) });
                Check(!window.IsVisible && saved.Count == 1 && saved[0].ResultType == Popup.Dtos.WpfResultType.Later
                    && saved[0].HideDays == null && saved[0].Video == null,
                    $"[52-2] {type} (overlay {overlay}) later closes a locked popup and saves LATER only ({saved.Count}, {saved.FirstOrDefault()?.ResultType})");
                Check(!manager.HasOpenPopups, $"[52-2] {type} (overlay {overlay}) later cleans up the window");
            }
        }
        finally { owner.Close(); }
    }

    /* [설계 44 결함 2] Overlay를 띄운 뒤 팝업 생성이 실패하면 Overlay를 닫고 예외를 그대로 올린다. */
    /*
     * [설계 52-4] 모든 팝업은 백그라운드 동작을 차단한다 — useBackgroundOverlay 기본값 true를 보장한다.
     * 서버 응답 JSON에서 필드를 뺐을 때(PopupApiService와 같은 역직렬화 옵션) DTO·PopupOptions가 true이고
     * PopupManager가 실제로 Overlay를 띄우는지 유형별로 확인한다. 명시 false는 정상 명시값이라 그대로 따른다.
     */
    private static void CheckOverlayDefault52()
    {
        var json = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
        Popup.Dtos.PopupResponseDto FromServerJson(Popup.Dtos.PopupResponseDto dto, bool? overlay)
        {
            var node = System.Text.Json.Nodes.JsonNode.Parse(System.Text.Json.JsonSerializer.Serialize(dto, json))!.AsObject();
            node.Remove("useBackgroundOverlay");
            if (overlay is bool value) node["useBackgroundOverlay"] = value;
            return System.Text.Json.JsonSerializer.Deserialize<Popup.Dtos.PopupResponseDto>(node.ToJsonString(), json)!;
        }
        var owner = NewOwner();
        try
        {
            var closeByApp = typeof(PopupWindow).GetMethod("CloseByApp", Flags)!;
            foreach (string type in new[] { "TEXT", "IMAGE", "VIDEO", "SURVEY", "QUIZ", "VIDEO_QUIZ" })
            {
                var dto = FromServerJson(DemoPopups(type).First(), overlay: null);
                Check(dto.UseBackgroundOverlay, $"[설계 52-4] {type}: omitted useBackgroundOverlay deserializes as true");
                var options = PopupFactory.Create(dto);
                Check(options.UseBackgroundOverlay, $"[설계 52-4] {type}: PopupOptions default keeps the overlay on");
                var manager = new Popup.Managers.PopupManager(owner);
                manager.Show(options);
                Check(Overlay(manager).IsVisible, $"[설계 52-4] {type}: PopupManager shows the background overlay by default");
                closeByApp.Invoke(OpenWindows(manager).Single(), null);
                Check(!Overlay(manager).IsVisible && !manager.HasOpenPopups, $"[설계 52-4] {type}: overlay closes with the popup");
            }
            var explicitOff = PopupFactory.Create(FromServerJson(DemoPopups("TEXT").Single(), overlay: false));
            Check(!explicitOff.UseBackgroundOverlay, "[설계 52-4] explicit false is a valid value and is kept");
        }
        finally
        {
            owner.Close();
        }
    }

    private static void CheckOverlayCleanupOnFailure44()
    {
        var owner = NewOwner();
        try
        {
            var manager = new Popup.Managers.PopupManager(owner);
            var broken = PopupFactory.Create(DemoPopups("TEXT").Single());
            broken.UseBackgroundOverlay = true;
            broken.SizeMode = (PopupSizeMode)999;   // PopupWindow 생성자(ApplyWindowSize)가 예외를 던진다
            Exception? error = null;
            try { manager.Show(broken); } catch (Exception exception) { error = exception; }
            Check(error is InvalidOperationException && !Overlay(manager).IsVisible && !manager.HasOpenPopups,
                $"[설계 44 결함 2] creation failure rethrows and closes the overlay ({error?.GetType().Name})");

            var ok = PopupFactory.Create(DemoPopups("TEXT").Single());
            ok.UseBackgroundOverlay = true;
            manager.Show(ok);
            Check(Overlay(manager).IsVisible && manager.HasOpenPopups, "[설계 44] the next popup shows with its overlay");
            ShutdownClose(OpenWindows(manager).Single());
            Check(!Overlay(manager).IsVisible, "[설계 44] overlay closes with the popup");
        }
        finally { owner.Close(); }
    }

    /*
     * [설계 53-16 · 50-D3/D4] VIDEO+QUIZ 중복 머리말과 시청 비율 경계.
     * D4: 일반 VIDEO·VIDEO+QUIZ·Demo 결과 판정이 서버(PopupService: min(watched,duration)/duration 4자리 내림)와 같은 식을 쓴다.
     * D3: 서버가 videoTitle=surveyTitle·같은 description을 내려주면 퀴즈 머리말에서 반복하지 않는다.
     */
    private static void CheckVideoCompletion53()
    {
        // 기준 바로 아래 decimal 비율(double 변환 시 0.8로 올라가던 값), 정확한 도달, 직후, 상한·비정상 기준.
        decimal justBelow = 0.7999999999999999999999999999m * 100m;
        var cases = new (decimal Watched, decimal Duration, double Required, bool Expected, string Label)[]
        {
            (justBelow, 100m, 0.8, false, "decimal 0.79999… just below 0.8"),
            (79.99m, 100m, 0.8, false, "0.7999 below 0.8"),
            (80m, 100m, 0.8, true, "exactly 0.8"),
            (80.01m, 100m, 0.8, true, "0.8001 above 0.8"),
            (5.6m, 7m, 0.8, true, "5.6/7 = 0.8 exact"),
            (80.009m, 100m, 0.80005, false, "5-digit required: floor 0.8000 < 0.80005"),
            (150m, 100m, 1.0, true, "watched over duration is clamped to 1"),
            (99.99m, 100m, double.NaN, false, "NaN required falls back to 1.0"),
            (10m, 100m, -1, true, "negative required clamps to 0"),
            (10m, 0m, 0, false, "zero duration never completes"),
        };
        foreach (var c in cases)
        {
            bool helper = VideoCompletion.IsReached(c.Watched, c.Duration, c.Required);
            Check(helper == c.Expected, $"[설계 53-16 D4] VideoCompletion {c.Label}: {helper}");
            var snapshot = new VideoProgressSnapshot { DurationSeconds = c.Duration, PositionSeconds = 0, MaximumPositionSeconds = 0, WatchedSeconds = c.Watched };
            Check(VideoPopupView.IsCompletionReached(snapshot, c.Required) == c.Expected,
                $"[설계 53-16 D4] plain VIDEO close rule matches server formula: {c.Label}");
        }
        Check(VideoCompletion.WatchedRatio(justBelow, 100m) == 0.7999m, "[설계 53-16 D4] watched ratio floors to 4 digits like the server");

        // VIDEO+QUIZ 잠금 해제와 Demo 결과 판정(서버 code)이 같은 경계를 쓴다.
        var owner = NewOwner();
        try
        {
            foreach (var (watched, unlocked) in new[] { (justBelow, false), (80m, true) })
            {
                var dto = DemoPopups("VIDEO_QUIZ").Single();
                dto.CompletionRatio = 0.8;
                var view = (VideoQuizPopupView)PopupFactory.Create(dto).Content!;
                typeof(VideoQuizPopupView).GetMethod("UpdateProgress", Flags)!.Invoke(view,
                    new object[] { new VideoProgressSnapshot { DurationSeconds = 100, PositionSeconds = 100, MaximumPositionSeconds = 100, WatchedSeconds = watched } });
                Check(view.IsUnlocked == unlocked, $"[설계 53-16 D4] VIDEO+QUIZ unlock at {watched}/100 is {unlocked}");
                Check(VideoPopupView.IsCompletionReached(new VideoProgressSnapshot { DurationSeconds = 100, WatchedSeconds = watched }, 0.8) == view.IsUnlocked,
                    $"[설계 53-16 D4] VIDEO and VIDEO+QUIZ agree at {watched}/100");

                var gateway = new DemoPopupGateway();
                var source = DemoPopups("VIDEO_QUIZ").Single();
                source.CompletionRatio = 0.8;
                gateway.ConfigurePopup(source);
                var delivered = gateway.GetNextPopupAsync("VIDEO_QUIZ").Result.Popup!;
                var question = delivered.Questions.First();
                var response = gateway.PostResultAsync(new Popup.Dtos.WpfResultItemDto
                {
                    DeliveryId = delivered.DeliveryId, PopupId = delivered.PopupId, ResultType = Popup.Dtos.WpfResultType.Submitted,
                    Answers = new() { new Popup.Dtos.PopupSubmitAnswerRequestDto { QuestionId = question.QuestionId, OptionIds = new() { question.Options.First().OptionId } } },
                    Score = 100, Passed = true,
                    Video = new Popup.Dtos.WpfVideoProgressDto { DurationSeconds = 100, PositionSeconds = 100, MaximumPositionSeconds = 100, WatchedSeconds = watched }
                }).Result;
                Check(unlocked ? response.Status == "ACCEPTED" : response.Status == "REJECTED" && response.Code == "WPF_INVALID_VIDEO",
                    $"[설계 53-16 D4] Demo VIDEO+QUIZ submit at {watched}/100 → {response.Status}/{response.Code} (server code WPF_INVALID_VIDEO)");
            }

            // D3: 서버 형태(같은 제목·설명)는 퀴즈 머리말을 숨기고, 다른 값·영상 설명 숨김은 그대로 보인다.
            (string Label, Action<Popup.Dtos.PopupResponseDto> Edit, bool TitleShown, bool DescriptionShown)[] headers =
            {
                ("server shape (same title/description)", _ => { }, false, false),
                ("video description hidden", d => d.Content = WithContent(d, "showDescription", false), false, true),
                ("different survey title", d => d.Content = WithContent(d, "surveyTitle", "퀴즈 별도 제목"), true, false),
            };
            foreach (var h in headers)
            {
                var dto = DemoPopups("VIDEO_QUIZ").Single();
                h.Edit(dto);
                var view = (VideoQuizPopupView)PopupFactory.Create(dto).Content!;
                var title = (TextBlock)view.Quiz.FindName("SurveyTitleText");
                var description = (TextBlock)view.Quiz.FindName("SurveyDescriptionText");
                Check((title.Visibility == Visibility.Visible) == h.TitleShown, $"[설계 53-16 D3] {h.Label}: quiz title visible={title.Visibility}");
                Check((description.Visibility == Visibility.Visible) == h.DescriptionShown, $"[설계 53-16 D3] {h.Label}: quiz description visible={description.Visibility}");
            }
            var quizOnly = (SurveyPopupView)PopupFactory.Create(DemoPopups("QUIZ").First()).Content!;
            Check(((TextBlock)quizOnly.FindName("SurveyTitleText")).Visibility == Visibility.Visible
                && ((TextBlock)quizOnly.FindName("SurveyDescriptionText")).Visibility == Visibility.Visible,
                "[설계 53-16 D3] plain QUIZ keeps its title and description");
        }
        finally { owner.Close(); }
    }

    private static System.Text.Json.JsonElement WithContent(Popup.Dtos.PopupResponseDto dto, string key, System.Text.Json.Nodes.JsonNode value)
    {
        var node = System.Text.Json.Nodes.JsonNode.Parse(dto.Content.GetRawText())!.AsObject();
        node[key] = value;
        return System.Text.Json.JsonDocument.Parse(node.ToJsonString()).RootElement.Clone();
    }
}
