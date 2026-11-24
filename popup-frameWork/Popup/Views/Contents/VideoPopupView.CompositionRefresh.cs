using System;
using System.Windows;
using System.Windows.Threading;

namespace Popup.Views.Contents
{
    /*
     * POL-05-01 : 재생 경로
     * ■ WebView2 합성 화면 다시 그리기(VideoPopupView partial, 2026-11-25)
     * - in : VideoWebView(WebView2CompositionControl) 크기 변경
     * - out: 없음 · 크기가 자리 잡은 뒤 컨트롤 너비를 1 DIP 줄였다가 되돌려 합성 화면을 새 크기로 다시 받게 한다.
     * - 현상: 로드 중 재생 영역 크기가 바뀌면(VIDEO+QUIZ는 메타데이터 수신 후 비율 높이 345 → 261 등) 합성 컨트롤이 바뀌기 전 크기의
     *   프레임(플레이어 왼쪽 위에 약 1/4 크기)을 그대로 보여 주는 경우가 있다. 브라우저 안 video는 이미 플레이어 크기(예: 614×261)이고,
     *   영상이 멈춰 있어 새 프레임이 오지 않으므로 재생 전까지 그 작은 프레임이 남는다(비교 캡처 반복 실행에서 VIDEO+QUIZ 6회 중 최대 3회).
     *   문서 다시 그리기로는 회복되지 않고 컨트롤 크기를 바꾸면 회복되는 것을 확인했다.
     * - 크기 변경이 끝난 뒤 한 번만 하도록 마지막 변경에서 RefreshDelay 뒤에 실행한다. 되돌리는 중의 크기 변경은 다시 예약하지 않는다.
     *   재생 상태·시청량·영상 비율 계산과는 관계없다(컨트롤 크기만 잠깐 바뀐다).
     */
    public partial class VideoPopupView
    {
        internal static readonly TimeSpan CompositionRefreshDelay = TimeSpan.FromMilliseconds(250);
        private DispatcherTimer? _compositionRefreshTimer;
        private bool _refreshingComposition;

        /// <summary>테스트용: 합성 화면 다시 그리기를 실행한 횟수.</summary>
        internal int CompositionRefreshCount { get; private set; }

        private void HookCompositionRefresh()
        {
            VideoWebView.SizeChanged += (_, _) => ScheduleCompositionRefresh();
            Unloaded += (_, _) => _compositionRefreshTimer?.Stop();
        }

        /* 크기 변경마다 타이머를 다시 시작해 마지막 변경 뒤 한 번만 실행한다. */
        internal void ScheduleCompositionRefresh()
        {
            if (_refreshingComposition) return;
            if (_compositionRefreshTimer == null)
            {
                _compositionRefreshTimer = new DispatcherTimer(DispatcherPriority.Background, Dispatcher) { Interval = CompositionRefreshDelay };
                _compositionRefreshTimer.Tick += (_, _) => { _compositionRefreshTimer!.Stop(); RefreshCompositionSurface(); };
            }
            _compositionRefreshTimer.Stop();
            _compositionRefreshTimer.Start();
        }

        private void RefreshCompositionSurface()
        {
            double width = VideoWebView.ActualWidth;
            if (VideoWebView.Visibility != Visibility.Visible || !IsLoaded || !(width > 2)) return;
            _refreshingComposition = true;
            CompositionRefreshCount++;
            VideoWebView.Width = width - 1;
            VideoWebView.UpdateLayout();
            // 줄인 크기로 한 번 렌더링된 뒤 되돌리고, 되돌린 크기 변경까지 처리된 뒤 예약을 다시 받는다.
            Dispatcher.BeginInvoke(DispatcherPriority.Background, new Action(() =>
            {
                VideoWebView.Width = double.NaN;
                Dispatcher.BeginInvoke(DispatcherPriority.ContextIdle, new Action(() => _refreshingComposition = false));
            }));
        }
    }
}
