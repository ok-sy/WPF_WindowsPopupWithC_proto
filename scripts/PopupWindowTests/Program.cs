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
 * 실제 PopupFactory·PopupWindow 경로로 확인한다. 로컬 전용 Popup.BehaviorTests의 같은 검증을 옮겨
 * 다른 환경에서도 같은 명령으로 재현할 수 있게 둔다. 실제 창을 잠깐 띄운다.
 *   실행: dotnet run --project scripts/PopupWindowTests
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

    private static VideoProgressSnapshot Snapshot(decimal watched, decimal position = 100) => new()
    {
        DurationSeconds = 100, PositionSeconds = position, MaximumPositionSeconds = position, WatchedSeconds = watched
    };

    [STAThread]
    private static void Main()
    {
        CheckHideDaysLabel50();
        CheckVideoClose50();
        Console.WriteLine($"PASS: {_checks} popup window checks (design 50 A1·A10)");
    }

    /* [설계 50 A1] 체크박스 문구와 HIDDEN 결과의 hideDays가 같은 값(서버 값, 없으면 30)이다. */
    private static void CheckHideDaysLabel50()
    {
        foreach ((int? days, int expected) in new (int?, int)[] { (7, 7), (null, 30) })
        {
            var dto = DemoPopupDataService.CreatePopups("TEXT").Single();
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
            var dto = DemoPopupDataService.CreatePopups(type).Single();
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
}
