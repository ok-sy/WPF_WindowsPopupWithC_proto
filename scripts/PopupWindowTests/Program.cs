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
 * A10 → TODO57 외부 닫기(Alt+F4 등)는 시청 기준이 아니라 Overlay로만 판단: Overlay 꺼짐이면 시청 전에도 닫히고,
 *     켜짐이면 시청 후에도 막히며 앱 종료(Application.Shutdown과 같은 InternalClose(shutdown, ignoreCancel))는 항상 닫히는지.
 *     구 서버가 보낸 allowCloseBeforeComplete는 무시되는지
 * 50-B displayMode(효과 없는 계약 필드)가 모르는 값·null이어도 팝업 생성이 실패하지 않는지
 * 43  완료 조건 버튼 표현: VIDEO 미달 닫기 비활성·사유 문구·도달/재생 실패 후 활성, VIDEO+QUIZ 잠금 사유 문구,
 *     보조 닫기 표시 규칙, QUIZ 미달 안내의 틀린 문항 번호
 * 52-4 useBackgroundOverlay를 생략한 서버 응답(JSON)이 기본 true로 해석되어 모든 유형에서 Overlay가 표시되는지(명시 false는 그대로)
 * 53-16 시청 비율 경계(일반 VIDEO·VIDEO+QUIZ·Demo가 서버와 같은 4자리 내림 판정·code)와 VIDEO+QUIZ 퀴즈 머리말 중복 숨김(50-D3·D4)
 * 57  완료 전 닫기 옵션 폐기: 화면 버튼은 completionRatio, 외부 닫기는 Overlay, 완료 전 연기는 showLater
 * 60  VIDEO+QUIZ 재생 영역 = 원본 비율 × 실제 너비(메타데이터 전 16:9, 세로 영상 상한, 잘못된 크기·이전 문서 메시지 무시,
 *     크기 갱신이 시청량·잠금에 영향 없음, 단독 VIDEO는 기존 * 행)
 * 59  VIDEO+QUIZ 영상·퀴즈 사이 시스템 안내 제거(전용 행 없음), 푸터 숨김 시 본문 제출 영역의 잠금 사유
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
            : type == "SURVEY_PLAIN" ? p.PopupId == "DEMO-SURVEY-PLAIN"
            : p.PopupType.Equals(type, StringComparison.OrdinalIgnoreCase) && p.PopupId is not ("DEMO-VIDEO-QUIZ" or "DEMO-FOOTER-LINK" or "DEMO-SURVEY-PLAIN"))
        .ToList();

    private static int _checks;
    private static void Check(bool condition, string message)
    {
        if (!condition) throw new Exception(message);
        _checks++;
    }

    /* [TODO57] 구 서버 응답처럼 폐기된 allowCloseBeforeComplete를 넣은 JSON을 실제 조회와 같은 옵션으로 역직렬화한다(무시되어야 한다). */
    private static Popup.Dtos.PopupResponseDto WithLegacyAllowClose(Popup.Dtos.PopupResponseDto dto, bool allowClose)
    {
        var json = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true, PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase };
        var node = System.Text.Json.Nodes.JsonNode.Parse(System.Text.Json.JsonSerializer.Serialize(dto, json))!.AsObject();
        node["allowCloseBeforeComplete"] = allowClose;
        return System.Text.Json.JsonSerializer.Deserialize<Popup.Dtos.PopupResponseDto>(node.ToJsonString(), json)!;
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
        CheckVideoQuizNotice59();
        CheckVideoQuizAspect60();
        CheckAuxClose43();
        CheckQuizFailedMessage43();
        CheckOverlayKeyboardClose44();
        CheckShutdownSavesResult44();
        CheckOwnerCloseSavesResult();
        CheckOverlayCleanupOnFailure44();
        CheckOverlayDefault52();
        CheckVideoCompletion53();
        CheckLater52();
        CheckSurveyColors();
        Console.WriteLine($"PASS: {_checks} popup window checks (design 50 A1·B, 43, 44, 52-2, 52-4, 53-16, 57, 59, 60)");
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

    /*
     * [TODO57] 외부 닫기(Alt+F4·Window.Close 등 OnClosing 경로)는 시청 기준이 아니라 Background Overlay로만 판단한다.
     * (설계 50 A10의 allowCloseBeforeComplete=false 시청 전 창 닫기 취소를 대체한다.)
     *  - Overlay 꺼짐: VIDEO·VIDEO+QUIZ 모두 시청 전에도 닫힌다.
     *  - Overlay 켜짐(화면 출구 있음): 시청 전·후, 재생 실패 모두 외부 닫기를 막는다(시청을 마쳐도 Alt+F4 자동 허용 없음).
     *  - 앱 종료는 항상 닫힌다. 구 서버의 allowCloseBeforeComplete 값은 결과를 바꾸지 않는다.
     */
    private static void CheckVideoClose50()
    {
        var flags = BindingFlags.Instance | BindingFlags.NonPublic;
        var onClosing = typeof(PopupWindow).GetMethod("OnClosing", flags)!;
        var internalClose = typeof(Window).GetMethod("InternalClose", flags, null, new[] { typeof(bool), typeof(bool) }, null);
        Check(internalClose != null, "[TODO57] WPF Window.InternalClose(shutdown, ignoreCancel) is available for the shutdown check");
        var latest = typeof(VideoPopupView).GetField("_latestProgress", flags)!;
        (PopupWindow Window, VideoPopupView Video, Func<bool> Closed) Open(string type, bool overlay, bool? legacyAllowClose = null)
        {
            var dto = DemoPopups(type).Single();
            dto.CompletionRatio = 0.8;
            dto.ShowFooter = true;
            dto.ShowLater = false;
            if (legacyAllowClose is bool allow) dto = WithLegacyAllowClose(dto, allow);
            var options = PopupFactory.Create(dto);
            options.UseBackgroundOverlay = overlay;
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

        foreach (string type in new[] { "VIDEO", "VIDEO_QUIZ" })
        {
            // Overlay 꺼짐: 시청 전에도 외부 닫기가 된다(구 allowCloseBeforeComplete=false를 보내도 같다).
            foreach (bool? legacy in new bool?[] { null, false })
            {
                var off = Open(type, overlay: false, legacy);
                latest.SetValue(off.Video, Snapshot(10));
                Check(!CancelledByOnClosing(off.Window), $"[TODO57] {type} overlay off: external close before watching is allowed (legacy {legacy?.ToString() ?? "none"})");
                off.Window.Close();
                Check(off.Closed(), $"[TODO57] {type} overlay off: Window.Close before watching closes (legacy {legacy?.ToString() ?? "none"})");
            }

            // Overlay 켜짐: 시청 전·후 모두 외부 닫기를 막는다(구 allowCloseBeforeComplete=true여도 같다).
            foreach (bool? legacy in new bool?[] { null, true })
            {
                var on = Open(type, overlay: true, legacy);
                Check(CancelledByOnClosing(on.Window), $"[TODO57] {type} overlay on: external close before watching is cancelled (legacy {legacy?.ToString() ?? "none"})");
                on.Window.Close();
                Check(!on.Closed() && on.Window.IsVisible, $"[TODO57] {type} overlay on: Window.Close before watching keeps the window");
                Report(on.Video, Snapshot(80));
                Check(CancelledByOnClosing(on.Window), $"[TODO57] {type} overlay on: watching does not auto-allow external close");
                // 앱 종료(Application.Shutdown → InternalClose(true, true))는 Overlay·시청과 관계없이 닫힌다.
                internalClose!.Invoke(on.Window, new object[] { true, true });
                Check(on.Closed(), $"[TODO57] {type} overlay on: application shutdown closes");
            }
        }

        // Overlay 켜짐 + 재생 실패: 화면 닫기 수단이 생기므로 외부 닫기는 계속 막고 버튼으로 닫는다.
        var failed = Open("VIDEO", overlay: true);
        FailPlayback(failed.Video);
        Check(CancelledByOnClosing(failed.Window), "[TODO57] VIDEO overlay on: playback failure keeps the overlay rule for external close");
        Click(failed.Window, (Button)failed.Window.FindName("FooterCloseButton"));
        Check(failed.Closed(), "[TODO57] VIDEO overlay on: playback failure closes from the enabled footer button");
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

    private static Opened OpenPopup(string type, Action<Popup.Dtos.PopupResponseDto>? configure = null, bool overlay = false,
        Func<Popup.Dtos.PopupResponseDto, Popup.Dtos.PopupResponseDto>? transform = null)
    {
        var dto = DemoPopups(type).Single();
        configure?.Invoke(dto);
        if (transform != null) dto = transform(dto);
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

    /* 일반 VIDEO: 미달이면 닫기 비활성 + 시청 %·기준 사유, 도달·재생 실패면 활성. [TODO57] 구 allowCloseBeforeComplete=true여도 같다. */
    private static void CheckVideoFooter43()
    {
        void Configure(Popup.Dtos.PopupResponseDto dto)
        {
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

        // [TODO57] 구 서버가 allowCloseBeforeComplete=true를 보내도 무시하고 시청 기준 전 닫기는 비활성이다.
        var legacy = OpenLegacy("VIDEO", Configure, allowClose: true);
        var legacyButton = legacy.Find<Button>("FooterCloseButton");
        Check(!legacyButton.IsEnabled && legacy.Find<TextBlock>("FooterResponseProgressText").Text.StartsWith("영상 0% 시청"),
            "[TODO57] legacy allowCloseBeforeComplete=true VIDEO still disables close before watching");
        Click(legacy.Window, legacyButton);
        Check(!legacy.Closed(), "[TODO57] legacy allowCloseBeforeComplete=true VIDEO click guard keeps the window");
        ShutdownClose(legacy.Window);
    }

    private static Opened OpenLegacy(string type, Action<Popup.Dtos.PopupResponseDto> configure, bool allowClose, bool overlay = false) =>
        OpenPopup(type, null, overlay, dto => { configure(dto); return WithLegacyAllowClose(dto, allowClose); });

    /* VIDEO+QUIZ 잠금 중: 제출·'보지 않기' 비활성(기존 계약) + 시청 사유 문구, 해제 뒤에는 문항 진행 문구. */
    private static void CheckVideoQuizFooter43()
    {
        var locked = OpenPopup("VIDEO_QUIZ", dto => { dto.CompletionRatio = 0.8; dto.ShowFooter = true; });
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
        Check(view.IsUnlocked && hide.IsEnabled && reason.Text == view.Quiz.ResponseProgressText && reason.Text.StartsWith("필수 응답"),
            $"[설계 43] unlocking switches back to the question progress text ({reason.Text})");
        ShutdownClose(locked.Window);

        // 잠금 중 재생 실패: 보조 닫기가 보이고(제출 전 이탈 허용) 누르면 닫힌다.
        var failed = OpenPopup("VIDEO_QUIZ", dto => { dto.CompletionRatio = 0.8; dto.ShowFooter = true; });
        var failedAux = failed.Find<Button>("FooterAuxCloseButton");
        Check(failedAux.Visibility == Visibility.Collapsed, "[설계 43] aux close hidden while watching");
        FailPlayback(failed.Video!);
        Check(failedAux.Visibility == Visibility.Visible && failedAux.IsEnabled
            && failed.Find<TextBlock>("FooterResponseProgressText").Text.Contains("닫기 버튼으로 닫을 수 있습니다"),
            "[설계 43] playback failure shows the aux close for locked VIDEO+QUIZ");
        Click(failed.Window, failedAux);
        Check(failed.Closed(), "[설계 43] aux close closes locked VIDEO+QUIZ after playback failure");

        // [TODO57] 완료 전 닫기 허용 기반 보조 닫기는 폐기: 구 allowCloseBeforeComplete=true여도 정상 재생 중에는 잠금 전·후 모두 숨김.
        var legacy = OpenLegacy("VIDEO_QUIZ", dto => { dto.CompletionRatio = 0.8; dto.ShowFooter = true; }, allowClose: true);
        var legacyView = (VideoQuizPopupView)legacy.Options.Content!;
        var legacyAux = legacy.Find<Button>("FooterAuxCloseButton");
        Check(!legacyView.IsUnlocked && legacyAux.Visibility == Visibility.Collapsed && !legacy.Find<Button>("FooterCloseButton").IsEnabled,
            "[TODO57] legacy allowCloseBeforeComplete=true VIDEO+QUIZ shows no aux close while locked");
        Click(legacy.Window, legacyAux);
        Check(!legacy.Closed(), "[TODO57] a bypassed aux close click does not close a locked VIDEO+QUIZ during normal playback");
        Report(legacyView.Video, Snapshot(100));
        Check(legacyView.IsUnlocked && legacyAux.Visibility == Visibility.Collapsed, "[TODO57] aux close stays hidden after unlocking");
        ShutdownClose(legacy.Window);
        var noFooter = OpenPopup("VIDEO_QUIZ", dto => { dto.ShowFooter = false; });
        FailPlayback(noFooter.Video!);
        Check(noFooter.Find<Button>("FooterAuxCloseButton").Visibility == Visibility.Collapsed, "[설계 43] showFooter=false hides the aux close");
        ShutdownClose(noFooter.Window);
    }

    /* [TODO59] 영상과 퀴즈 사이 시스템 안내가 없고, 푸터를 숨기면 본문 제출 영역이 잠금 사유 → 필수 응답 진행 문구를 보여 준다. */
    private static void CheckVideoQuizNotice59()
    {
        foreach (bool showFooter in new[] { true, false })
        {
            var opened = OpenPopup("VIDEO_QUIZ", dto => { dto.CompletionRatio = 0.8; dto.ShowFooter = showFooter; });
            var view = (VideoQuizPopupView)opened.Options.Content!;
            var scroll = ((Grid)view.Content).Children.OfType<ScrollViewer>().Single();
            var body = (Grid)scroll.Content;
            Check(body.RowDefinitions.Count == 2 && body.Children.Count == 2
                && body.Children.Contains(view.Video) && body.Children.Contains(view.Quiz) && Grid.GetRow(view.Quiz) == 1,
                $"[TODO59] VIDEO+QUIZ body has only video and quiz rows without a notice (footer {showFooter})");
            var inline = (TextBlock)view.Quiz.FindName("RequiredProgressText");
            var area = (FrameworkElement)view.Quiz.FindName("SubmissionArea");
            Report(view.Video, Snapshot(30));
            if (showFooter)
            {
                Check(area.Visibility == Visibility.Collapsed
                    && opened.Find<TextBlock>("FooterResponseProgressText").Text.StartsWith("영상 30% 시청"),
                    "[TODO59] footer ON: the footer alone shows the watch reason");
            }
            else
            {
                Check(area.Visibility == Visibility.Visible
                    && inline.Text == "영상 30% 시청 · 기준 80% 이상 시청하면 퀴즈와 제출이 활성화됩니다",
                    $"[TODO59] footer OFF: the inline submission area shows the watch reason ({inline.Text})");
                Check(System.Windows.Automation.AutomationProperties.GetHelpText((Button)view.Quiz.FindName("SubmitButton")) == inline.Text,
                    "[TODO59] footer OFF: the locked inline submit carries the watch reason as HelpText");
                Report(view.Video, Snapshot(80));
                Check(view.IsUnlocked && inline.Text == view.Quiz.ResponseProgressText && inline.Text.StartsWith("필수 응답"),
                    $"[TODO59] footer OFF: unlocking switches the inline text to the question progress ({inline.Text})");
            }
            ShutdownClose(opened.Window);
        }
        var failed = OpenPopup("VIDEO_QUIZ", dto => { dto.CompletionRatio = 0.8; dto.ShowFooter = false; });
        var failedView = (VideoQuizPopupView)failed.Options.Content!;
        FailPlayback(failedView.Video);
        Check(((TextBlock)failedView.Quiz.FindName("RequiredProgressText")).Text == "영상을 재생할 수 없어 퀴즈를 진행할 수 없습니다.",
            "[TODO59] footer OFF: playback failure shows the failure reason in the inline area");
        ShutdownClose(failed.Window);
    }

    /* [TODO60] 영상 결합 화면의 재생 행 높이는 원본 비율과 실제 가용 너비로 정해지고 제목·설명은 별도 행이다. */
    private static void CheckVideoQuizAspect60()
    {
        var calc = typeof(VideoPopupView).GetMethod("CalculateAspectHeight", BindingFlags.Static | BindingFlags.NonPublic)!;
        double Calc(double width, Size? natural, double available) =>
            (double)calc.Invoke(null, new object?[] { width, new Thickness(1), natural, available })!;
        // TODO60 검증 예시(가용 너비 640 + 테두리 2): 16:9 360, 4:3 480, 정사각 640, 세로 9:16은 상한 전 약 1137.8.
        Check(Math.Abs(Calc(642, new Size(1920, 1080), 0) - 362) < 0.01, "[TODO60] 1920x1080 at width 640 is 360 (+border)");
        Check(Math.Abs(Calc(642, new Size(1440, 1080), 0) - 482) < 0.01, "[TODO60] 1440x1080 at width 640 is 480 (+border)");
        Check(Math.Abs(Calc(642, new Size(1080, 1080), 0) - 642) < 0.01, "[TODO60] 1080x1080 at width 640 is 640 (+border)");
        Check(Math.Abs(Calc(642, new Size(1080, 1920), 0) - (640 * 1920 / 1080.0 + 2)) < 0.01, "[TODO60] 1080x1920 without a cap is about 1137.8 (+border)");
        Check(Math.Abs(Calc(642, new Size(1080, 1920), 800) - 560) < 0.01, "[TODO60] tall video is capped at 70% of the available height");
        Check(Math.Abs(Calc(642, null, 0) - 362) < 0.01, "[TODO60] before metadata the default ratio is 16:9");
        Check(Calc(100, new Size(1920, 1080), 0) == 180, "[TODO60] a narrow area keeps the minimum video height");

        var opened = OpenPopup("VIDEO_QUIZ", dto => { dto.CompletionRatio = 0.8; dto.ShowFooter = true; dto.Width = 760; dto.Height = 860; });
        var view = (VideoQuizPopupView)opened.Options.Content!;
        var video = view.Video;
        var row = (RowDefinition)video.FindName("VideoRow");
        var root = (FrameworkElement)video.FindName("VideoLayoutRoot");
        var container = (FrameworkElement)video.FindName("VideoContainer");
        var title = (FrameworkElement)video.FindName("TitleTextBlock");
        var scroll = ((Grid)view.Content).Children.OfType<ScrollViewer>().Single();
        var update = typeof(VideoPopupView).GetMethod("UpdateNaturalVideoSize", Flags)!;
        void Natural(double w, double h) { update.Invoke(video, new object[] { w, h }); opened.Window.UpdateLayout(); }
        double Expected(Size? natural) => Calc(root.ActualWidth, natural, scroll.ActualHeight);
        opened.Window.UpdateLayout();
        Check(root.ActualWidth > 0 && row.Height.IsAbsolute && Math.Abs(row.Height.Value - Expected(null)) < 0.6,
            $"[TODO60] before metadata the video row uses 16:9 of the real width ({row.Height}, width {root.ActualWidth})");
        Check(Math.Abs(container.ActualHeight - row.Height.Value) < 0.6 && Grid.GetRow(title) == 0 && Grid.GetRow(container) == 1,
            "[TODO60] title is a separate row and does not take the playback height");

        Report(video, Snapshot(30));
        var before = video.LatestProgress;
        Natural(1440, 1080);
        Check(Math.Abs(row.Height.Value - Expected(new Size(1440, 1080))) < 0.6, $"[TODO60] 4:3 metadata resizes the video row ({row.Height})");
        Check(ReferenceEquals(before, video.LatestProgress) && !view.IsUnlocked && video.LatestProgress!.WatchedSeconds == 30,
            "[TODO60] a size update does not change the watched progress or unlock the quiz");
        Natural(1080, 1920);
        Check(Math.Abs(row.Height.Value - Expected(new Size(1080, 1920))) < 0.6 && row.Height.Value <= Math.Max(180, scroll.ActualHeight * 0.7) + 0.6,
            $"[TODO60] a tall video is capped by the available height ({row.Height}, viewport {scroll.ActualHeight})");
        double capped = row.Height.Value;
        Natural(0, 1080);
        Natural(double.NaN, 720);
        Check(Math.Abs(row.Height.Value - capped) < 0.01, "[TODO60] zero or invalid sizes keep the last valid size");

        // WebView2 메시지: 다른 문서(loadId 불일치)의 크기는 무시, 현재 문서의 resize만 반영한다.
        var apply = typeof(VideoPopupView).GetMethod("ApplyWebPlaybackState", Flags)!;
        string loadId = (string)typeof(VideoPopupView).GetField("_webLoadId", Flags)!.GetValue(video)!;
        void Web(string id, int w, int h)
        {
            using var json = System.Text.Json.JsonDocument.Parse($"{{\"type\":\"resize\",\"loadId\":\"{id}\",\"videoWidth\":{w},\"videoHeight\":{h}}}");
            apply.Invoke(video, new object[] { json.RootElement });
            opened.Window.UpdateLayout();
        }
        Web("stale", 1920, 1080);
        Check(Math.Abs(row.Height.Value - capped) < 0.01, "[TODO60] a late message from another document does not resize the video");
        Web(loadId, 1920, 1080);
        Check(Math.Abs(row.Height.Value - Expected(new Size(1920, 1080))) < 0.6 && ReferenceEquals(before, video.LatestProgress),
            $"[TODO60] the current document's resize message updates only the size ({row.Height})");

        // 창 너비가 바뀌면 실제 가용 너비로 다시 계산한다.
        double oldWidth = root.ActualWidth;
        opened.Window.Width -= 120;
        opened.Window.UpdateLayout();
        Check(root.ActualWidth < oldWidth && Math.Abs(row.Height.Value - Expected(new Size(1920, 1080))) < 0.6,
            $"[TODO60] a narrower window recalculates the height from the real width ({row.Height}, width {root.ActualWidth})");
        Report(video, Snapshot(80));
        Check(view.IsUnlocked, "[TODO60] the completion ratio still unlocks the quiz");
        ShutdownClose(opened.Window);

        var single = OpenPopup("VIDEO", dto => dto.ShowFooter = true);
        var singleRow = (RowDefinition)single.Video!.FindName("VideoRow");
        update.Invoke(single.Video, new object[] { 1080.0, 1920.0 });
        single.Window.UpdateLayout();
        Check(singleRow.Height.IsStar, "[TODO60] a single VIDEO keeps the star video row");
        ShutdownClose(single.Window);
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

        // 안내의 보조 닫기 문장은 창의 실제 표시 조건(HasAuxClose)을 따른다: Overlay 꺼진 QUIZ는 표시, 정상 재생 중 VIDEO+QUIZ는 미표시.
        var hasAux = typeof(PopupWindow).GetProperty("HasAuxClose", Flags)!;
        var notifyFailed = typeof(PopupWindow).GetMethod("NotifyQuizFailed", Flags)!;
        var quiz = OpenPopup("QUIZ", d => d.ShowFooter = true, overlay: false);
        notifyFailed.Invoke(quiz.Window, null);
        var videoQuiz = OpenPopup("VIDEO_QUIZ", d => { d.ShowFooter = true; }, overlay: false);
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

        // [TODO57] VIDEO도 화면 출구가 없으면 Overlay 예외로 키보드 닫기를 허용한다(시청 기준으로 다시 막지 않는다).
        var video = OpenPopup("VIDEO", dto => { dto.ShowFooter = false; dto.CompletionRatio = 0.8; }, overlay: true);
        Check(!AltF4Handled(video.Window), "[TODO57] Overlay on VIDEO without a visible exit: Alt+F4 is not swallowed");
        SendMessage(Hwnd(video.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(video.Closed(), "[TODO57] Overlay on VIDEO without a visible exit closes by keyboard before watching");

        // [TODO57] Overlay 켜짐 + 푸터 닫기 표시 VIDEO: 시청 전·후 모두 Alt+F4·WM_CLOSE를 막고 화면 버튼은 시청 기준을 따른다.
        var guarded = OpenPopup("VIDEO", dto => { dto.ShowFooter = true; dto.ShowFooterButton = true; dto.ShowLater = false; dto.CompletionRatio = 0.8; }, overlay: true);
        Check(AltF4Handled(guarded.Window), "[TODO57] Overlay on VIDEO with a footer: Alt+F4 is swallowed before watching");
        SendMessage(Hwnd(guarded.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(!guarded.Closed(), "[TODO57] Overlay on VIDEO with a footer: WM_CLOSE is cancelled before watching");
        Report(guarded.Video!, Snapshot(80));
        Check(AltF4Handled(guarded.Window), "[TODO57] Overlay on VIDEO with a footer: Alt+F4 stays swallowed after watching");
        Click(guarded.Window, guarded.Find<Button>("FooterCloseButton"));
        Check(guarded.Closed(), "[TODO57] Overlay on VIDEO with a footer: the footer close works after watching");

        // [TODO57] Overlay 꺼짐 VIDEO: 시청 전에도 Alt+F4·WM_CLOSE가 닫는다(화면 닫기 버튼은 계속 비활성).
        var loose = OpenPopup("VIDEO", dto => { dto.ShowFooter = true; dto.ShowFooterButton = true; dto.CompletionRatio = 0.8; }, overlay: false);
        Check(!loose.Find<Button>("FooterCloseButton").IsEnabled && !AltF4Handled(loose.Window),
            "[TODO57] Overlay off VIDEO before watching: close button disabled but Alt+F4 is not swallowed");
        SendMessage(Hwnd(loose.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(loose.Closed(), "[TODO57] Overlay off VIDEO before watching closes by WM_CLOSE");

        // QUIZ Overlay 켜짐: 제출 버튼이 보이므로 키보드 닫기 차단(통과해야 닫힘).
        var quiz = OpenPopup("QUIZ", null, overlay: true);
        SendMessage(Hwnd(quiz.Window), WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
        Check(!quiz.Closed(), "[설계 44] Overlay on QUIZ blocks keyboard close (submit is visible)");
        ShutdownClose(quiz.Window);

        // VIDEO+QUIZ 잠금 + 푸터 없음 + 재생 실패: 제출에 도달할 수 없으므로 키보드 닫기를 허용한다.
        var stuck = OpenPopup("VIDEO_QUIZ", dto => { dto.ShowFooter = false; dto.CompletionRatio = 0.8; }, overlay: true);
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
            foreach ((string type, bool overlay) in new[] { ("VIDEO", false), ("VIDEO_QUIZ", false), ("VIDEO", true), ("VIDEO_QUIZ", true) })
            {
                var manager = new Popup.Managers.PopupManager(owner);
                var dto = DemoPopups(type).Single();
                dto.CompletionRatio = 0.8;
                dto.ShowFooter = true;
                dto.ShowLater = false;
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
                if (!overlay)
                {
                    // [TODO57] Overlay 꺼짐: 시청 전 외부 닫기가 허용되고 기존 결과 생성기의 시청 기록으로 남는다(LATER로 바꾸지 않음).
                    Check(saved.Count == 1 && saved[0].ResultType == Popup.Dtos.WpfResultType.VideoWatched && saved[0].Video?.WatchedSeconds == 30,
                        $"[TODO57] {type} overlay off: external close before watching saves VIDEO_WATCHED with watched seconds ({saved.Count})");
                    Check(!manager.HasOpenPopups, $"[TODO57] {type} overlay off: external close cleans up the window");
                    continue;
                }
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
     * SURVEY·QUIZ 디자인 V2: 흰 본문(여백·푸터 포함), 문항 카드 없이 간격·구분선(마지막 문항 제외), 선택지 흰색 + 연한 테두리·라운드 6,
     * 기본 글자 #222222(TODO56-10·11).
     * [TODO56] 라디오·체크박스 표시기 없음. 선택 전에는 체크 없음(자리만 예약), 선택 = 체크 + #171717 2px 링(크기 불변),
     * 선택해도 굵기·글자색 불변, 단일/복수는 선택 방식 안내로 구분.
     */
    private static void CheckSurveyColors()
    {
        static string Hex(System.Windows.Media.Brush? brush) => ((System.Windows.Media.SolidColorBrush)brush!).Color.ToString();
        static IEnumerable<DependencyObject> Visuals(DependencyObject root)
        {
            for (int i = 0; i < System.Windows.Media.VisualTreeHelper.GetChildrenCount(root); i++)
            {
                DependencyObject child = System.Windows.Media.VisualTreeHelper.GetChild(root, i);
                yield return child;
                foreach (DependencyObject nested in Visuals(child)) yield return nested;
            }
        }
        foreach (string type in new[] { "SURVEY", "QUIZ", "SURVEY_PLAIN" })
        {
            var opened = OpenPopup(type);
            opened.Window.UpdateLayout();
            var view = (SurveyPopupView)opened.Options.Content!;
            Check(Hex(opened.Find<Border>("PopupBodyBorder").Background) == "#FFFFFFFF" && Hex(((Grid)view.Content).Background) == "#FFFFFFFF",
                $"[56-10] {type} body and content background is white");
            var cards = Visuals(view).OfType<Border>().Where(b => b.Style == view.FindResource("SurveyQuestionCardStyle")).ToList();
            Check(cards.All(c => Hex(c.Background) == "#00FFFFFF" && c.CornerRadius.TopLeft == 0 && c.Padding.Left == 0)
                  && cards.Take(cards.Count - 1).All(c => c.BorderThickness == new Thickness(0, 0, 0, 1) && Hex(c.BorderBrush) == "#FFE5E5E5")
                  && cards[^1].BorderThickness == new Thickness(0),
                $"[56-10] {type} questions have no card surface and a separator only between questions ({cards.Count})");
            var choices = Visuals(view).OfType<System.Windows.Controls.Primitives.ToggleButton>()
                .GroupBy(c => (c is RadioButton, c.Parent is StackPanel)).Select(g => g.First()).ToList();
            Check(choices.Count == 4, $"[56] {type} sample has single/multiple x vertical/horizontal choices ({choices.Count})");
            foreach (var choice in choices)
            {
                choice.ApplyTemplate();
                var cardBorder = (Border)choice.Template.FindName("Card", choice);
                var ring = (Border)choice.Template.FindName("SelectionRing", choice);
                bool chip = choice.Parent is WrapPanel;
                var mark = (System.Windows.Shapes.Path?)choice.Template.FindName("CheckMark", choice);
                string kind = $"{(choice is RadioButton ? "single" : "multiple")} {(choice.Parent is StackPanel ? "vertical" : "horizontal")}";
                Check(cardBorder.CornerRadius.TopLeft == 6 && ring.CornerRadius.TopLeft == 6, $"[56-11] {type} {kind} choice corner radius is 6");
                Check(Hex(cardBorder.Background) == "#FFFFFFFF" && Hex(cardBorder.BorderBrush) == "#FFE5E5E5" && Hex(choice.Foreground) == "#FF222222",
                    $"[survey colors] {type} {kind} choice is white with a light border and #222222 text");
                Check((chip ? mark == null : mark!.Visibility == Visibility.Hidden) && ring.Visibility == Visibility.Hidden
                      && choice.Template.FindName("IndicatorFrame", choice) == null,
                    $"[56-2] {type} {kind} shows no radio/checkbox indicator and no check before selection");
                if (chip)
                {
                    var presenter = Visuals(choice).OfType<ContentPresenter>().First();
                    double left = presenter.TranslatePoint(new Point(0, 0), cardBorder).X;
                    double right = cardBorder.ActualWidth - left - presenter.ActualWidth;
                    Check(Math.Abs(left - right) < 1, $"[56-2] {type} {kind} chip has equal left/right padding ({left:0.#}/{right:0.#})");
                }
                choice.UpdateLayout();
                Size before = choice.RenderSize;
                choice.IsChecked = true;
                choice.UpdateLayout();
                Check((chip || (mark!.Visibility == Visibility.Visible && Hex(mark.Stroke) == "#FF171717")) && ring.Visibility == Visibility.Visible
                      && Hex(ring.BorderBrush) == "#FF171717" && ring.BorderThickness.Left == 2 && Hex(cardBorder.Background) == "#FFFFFFFF",
                    $"[56-3] {type} selected {kind} shows the #171717 ring{(chip ? "" : " and check")}");
                Check(choice.FontWeight == FontWeights.Normal && Hex(choice.Foreground) == "#FF222222" && choice.RenderSize == before,
                    $"[56-4] {type} selecting {kind} keeps weight, color and size ({before} -> {choice.RenderSize})");
                choice.IsEnabled = false;
                Check(ring.Visibility == Visibility.Visible && (chip || mark!.Visibility == Visibility.Visible),
                    $"[56-3] {type} disabled {kind} still shows its selection");
                choice.IsEnabled = true;
            }
            // [TODO56-5·12] 선택 방식 안내는 제목 끝(필수 표시 뒤)에 12 크기 보조색 Run으로 붙는다. 주관식은 없음.
            var hintRuns = Visuals(view).OfType<TextBlock>().SelectMany(t => t.Inlines.OfType<System.Windows.Documents.Run>()
                .Where(r => r.Text.Trim() is "하나 선택" or "여러 개 선택 가능").Select(r => (Block: t, Run: r))).ToList();
            int choiceQuestions = opened.Options.Content is SurveyPopupView sv ? cards.Count(c => Visuals(c).OfType<System.Windows.Controls.Primitives.ToggleButton>().Any()) : 0;
            Check(hintRuns.Count == choiceQuestions && hintRuns.Any(h => h.Run.Text.Trim() == "하나 선택") && hintRuns.Any(h => h.Run.Text.Trim() == "여러 개 선택 가능")
                  && hintRuns.All(h => h.Run.FontSize == 12 && h.Run.FontWeight == FontWeights.Normal && Hex(h.Run.Foreground) == "#FF737373"
                                       && h.Block.Inlines.LastInline == h.Run),
                $"[56-12] {type} the single/multiple hint follows each choice title as a small muted run ({hintRuns.Count}/{choiceQuestions})");
            ShutdownClose(opened.Window);
        }

        // 문항 디자인 버전: 기본은 최신(V2). V1로 바꾸면 이후 만드는 설문 화면이 지난 무채색 디자인으로 돌아간다.
        Check(SurveyDesign.Current == "V2" && SurveyDesign.Latest == "V2", "[survey design] default design version is the latest (V2)");
        Check(SurveyDesign.Normalize("v1") == "V1" && SurveyDesign.Normalize("V9") == null && SurveyDesign.Normalize(null) == null,
            "[survey design] version setting is case-insensitive and unknown values are rejected");
        SurveyDesign.Current = "V1";
        try
        {
            var v1 = OpenPopup("SURVEY");
            v1.Window.UpdateLayout();
            var v1View = (SurveyPopupView)v1.Options.Content!;
            Check(Hex(v1.Find<Border>("PopupBodyBorder").Background) == "#FFFFFFFF"
                  && Hex(Visuals(v1View).OfType<Border>().First(b => b.Style == v1View.FindResource("SurveyQuestionCardStyle")).Background) == "#FFF8F8F8",
                "[survey design] V1 restores the white body and #F8F8F8 question cards");
            var row = Visuals(v1View).OfType<System.Windows.Controls.Primitives.ToggleButton>().First(c => c.Parent is StackPanel);
            var chip = Visuals(v1View).OfType<System.Windows.Controls.Primitives.ToggleButton>().First(c => c.Parent is WrapPanel);
            row.ApplyTemplate(); chip.ApplyTemplate();
            row.IsChecked = true; row.UpdateLayout();
            Check(Hex(((Border)row.Template.FindName("Card", row)).BorderBrush) == "#FFAFAFAF" && Hex(((Border)row.Template.FindName("Card", row)).Background) == "#FFECECEC"
                  && chip.Template.FindName("CheckMark", chip) == null && chip.Template.FindName("IndicatorFrame", chip) == null,
                "[survey design] V1 selected row is gray (#ECECEC/#AFAFAF) and chips have no check mark");
            Check(!Visuals(v1View).OfType<TextBlock>().SelectMany(t => t.Inlines.OfType<System.Windows.Documents.Run>())
                    .Any(r => r.Text.Trim() is "하나 선택" or "여러 개 선택 가능"),
                "[survey design] V1 does not show the TODO56 choice hints");
            ShutdownClose(v1.Window);
        }
        finally { SurveyDesign.Current = SurveyDesign.Latest; }
    }

    /*
     * 소유자 창이 닫히면 Win32가 소유 창을 함께 파괴해 팝업의 Closing 없이 Closed만 온다.
     * 이 경로에서도 Closing에서 읽던 영상 시청량·다시 보지 않기 체크가 결과에 실려야 한다.
     */
    private static void CheckOwnerCloseSavesResult()
    {
        foreach (string type in new[] { "VIDEO", "TEXT" })
        {
            var owner = NewOwner();
            var manager = new Popup.Managers.PopupManager(owner);
            var dto = DemoPopups(type).Single();
            dto.ShowFooter = true;
            dto.ShowDoNotShowAgain = type == "TEXT";
            var options = PopupFactory.Create(dto);
            options.UseBackgroundOverlay = false;
            var saved = new List<Popup.Dtos.WpfResultItemDto>();
            options.EnqueueResult = saved.Add;
            bool closing = false;
            manager.Show(options);
            var window = OpenWindows(manager).Single();
            window.Closing += (_, _) => closing = true;
            Check(window.Owner == owner, $"[owner close] {type} popup is owned by the owner window");
            if (options.Content is VideoPopupView video)
            {
                SetPlaybackFailed(video, false);
                Report(video, Snapshot(30, 30));
            }
            else
                ((CheckBox)window.FindName("DoNotShowAgainCheckBox")).IsChecked = true;
            owner.Close();
            Check(!manager.HasOpenPopups && saved.Count == 1, $"[owner close] {type} popup closes with its owner and saves one result (closing raised: {closing})");
            if (type == "VIDEO")
                Check(saved[0].ResultType == Popup.Dtos.WpfResultType.VideoWatched && saved[0].Video?.WatchedSeconds == 30,
                    $"[owner close] VIDEO keeps the watched seconds ({saved[0].ResultType}, {saved[0].Video?.WatchedSeconds})");
            else
                Check(saved[0].ResultType == Popup.Dtos.WpfResultType.Hidden && saved[0].HideDays > 0,
                    $"[owner close] TEXT keeps the do-not-show-again choice ({saved[0].ResultType})");
        }
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
