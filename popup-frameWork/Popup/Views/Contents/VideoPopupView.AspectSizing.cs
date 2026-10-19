using System;
using System.Windows;

namespace Popup.Views.Contents
{
    /*
     * [TODO60] 영상 결합(VIDEO+QUIZ) 화면의 재생 영역 높이를 원본 영상 비율과 실제 가용 너비로 정한다.
     *
     * 예전에는 VideoQuizPopupView가 영상 뷰 전체(제목·영상·설명) 행을 300 DIP로 고정해 제목·설명이 재생 공간을 차지했다.
     * 이제 제목·설명은 각자 Auto 행이고, 재생 행(VideoRow) 높이만 H = W × h / w로 계산한다(W = 재생 영역 실제 너비).
     * 컨트롤바는 영상 위에 겹쳐 표시되므로 높이에 더하지 않는다.
     *
     * - 비율 출처: WebView2 HTML video의 videoWidth/videoHeight(loadedmetadata·resize), MediaElement의 NaturalVideoWidth/Height.
     *   서버 API·파일 분석은 쓰지 않는다. 크기 갱신은 재생 상태·시청량 계산 경로와 분리한다.
     * - 메타데이터 전·읽기 실패·0 크기: 마지막 유효 크기, 없으면 16:9.
     * - 상한: 세로 영상이 퀴즈를 지나치게 밀지 않도록 부모 스크롤 가용 높이의 MaxHeightRatio로 제한하고, 영상은 기존처럼 비율 유지(contain)로 표시한다.
     * - 진동 방지: 높이 변경 → 스크롤바 표시/숨김 → 너비 변경이 같은 두 너비 사이를 오가면 마지막 높이를 유지한다.
     * - 전체화면 중에는 VideoContainer가 이 Grid 밖에 있으므로 행 높이를 바꾸지 않고, 복귀 후 다시 계산한다.
     * 단독 VIDEO는 EnableAspectSizing을 부르지 않으므로 기존 * 행 그대로다.
     */
    public partial class VideoPopupView
    {
        internal const double DefaultAspectRatio = 16.0 / 9.0;
        /* 상한·하한 초기값. 실화면 비교 후 TODO60 문서에 최종값을 기록한다. */
        internal const double MaxHeightRatio = 0.7;
        internal const double MinVideoHeight = 180;

        private bool _aspectSizing;
        private Func<double>? _availableHeight;
        private Size? _naturalVideoSize;
        private double _lastAspectWidth = double.NaN;
        private double _previousAspectWidth = double.NaN;

        /// <summary>[TODO60] 메타데이터로 확인한 원본 영상 표시 크기. 아직 모르면 null.</summary>
        internal Size? NaturalVideoSize => _naturalVideoSize;

        /// <summary>[TODO60] 원본 영상 크기가 처음 확인되거나 바뀌었을 때.</summary>
        public event EventHandler? NaturalVideoSizeChanged;

        /// <summary>[TODO60] 재생 행을 원본 비율 높이로 바꾼다. availableHeight는 상한 계산에 쓸 부모 스크롤 가용 높이.</summary>
        internal void EnableAspectSizing(Func<double> availableHeight)
        {
            _aspectSizing = true;
            _availableHeight = availableHeight;
            VideoLayoutRoot.SizeChanged += (_, args) => { if (args.WidthChanged) RefreshAspectHeight(); };
            RefreshAspectHeight();
        }

        /* WebView2·MediaElement가 읽은 크기. 양수·유한값만 받고 같은 크기는 다시 적용하지 않는다. */
        internal void UpdateNaturalVideoSize(double width, double height)
        {
            if (!double.IsFinite(width) || !double.IsFinite(height) || width <= 0 || height <= 0) return;
            var size = new Size(width, height);
            if (_naturalVideoSize == size) return;
            _naturalVideoSize = size;
            NaturalVideoSizeChanged?.Invoke(this, EventArgs.Empty);
            RefreshAspectHeight();
        }

        /// <summary>[TODO60] 너비·가용 높이·원본 크기가 바뀌면 재생 행 높이를 다시 계산한다.</summary>
        internal void RefreshAspectHeight()
        {
            if (!_aspectSizing || _fullScreenWindow != null) return;
            double width = VideoLayoutRoot.ActualWidth;
            if (!(width > 0)) return;
            // 같은 두 너비를 오가는(스크롤바 표시/숨김) 경우 높이를 다시 바꾸지 않는다.
            if (Math.Abs(width - _previousAspectWidth) < 0.5 && Math.Abs(width - _lastAspectWidth) >= 0.5
                && VideoRow.Height.IsAbsolute)
            {
                _previousAspectWidth = _lastAspectWidth;
                _lastAspectWidth = width;
                return;
            }
            if (Math.Abs(width - _lastAspectWidth) >= 0.5)
            {
                _previousAspectWidth = _lastAspectWidth;
                _lastAspectWidth = width;
            }
            double height = CalculateAspectHeight(width, VideoContainer.BorderThickness, _naturalVideoSize, _availableHeight?.Invoke() ?? 0);
            if (!VideoRow.Height.IsAbsolute || Math.Abs(VideoRow.Height.Value - height) >= 0.5)
                VideoRow.Height = new GridLength(height);
        }

        /* 재생 영역 높이 = 테두리 안쪽 너비 × h / w + 테두리. 상한(가용 높이 × MaxHeightRatio)과 하한(MinVideoHeight)을 적용한다. */
        internal static double CalculateAspectHeight(double width, Thickness border, Size? natural, double availableHeight)
        {
            double ratio = natural is Size size ? size.Width / size.Height : DefaultAspectRatio;
            double innerWidth = Math.Max(0, width - border.Left - border.Right);
            double height = innerWidth / ratio + border.Top + border.Bottom;
            if (availableHeight > 0) height = Math.Min(height, Math.Max(MinVideoHeight, availableHeight * MaxHeightRatio));
            return Math.Max(MinVideoHeight, Math.Round(height, 2));
        }
    }
}
