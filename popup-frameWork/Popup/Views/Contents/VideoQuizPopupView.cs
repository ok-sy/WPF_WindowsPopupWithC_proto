using Popup.Models;
using Popup.Services;
using System;
using System.Windows;
using System.Windows.Controls;

namespace Popup.Views.Contents
{
    /*
     * POL-05-02 : 완료·화면 이탈
     * POL-05-03 : 결합 화면
     * POL-06-03 : 표현·수명
     * ■ VIDEO+QUIZ 결합 콘텐츠 뷰
     * - in : video(VideoPopupView) · quiz(SurveyPopupView) · requiredRatio(double) 완료 기준 비율(비유한이면 1, 0~1로 보정)
     * - out: IsUnlocked · Unlocked 이벤트 · 화면: 영상 + 퀴즈(부모 세로 스크롤 공유) + 고정 제출 영역
     * - 영상 누적 시청 기준에 도달하면 퀴즈 입력과 공통 푸터를 활성화한다. 기준 전에는 퀴즈를 잠그고 잠금 사유를 표시한다.
     *   시청 완료는 퀴즈 잠금 해제일 뿐 퀴즈 완료가 아니며, 제출 조건은 SurveyPopupView가 그대로 적용한다.
     */
    public sealed class VideoQuizPopupView : UserControl, IBodyFontSizeAware
    {
        public VideoPopupView Video { get; }
        public SurveyPopupView Quiz { get; }
        public bool IsUnlocked { get; private set; }
        public event EventHandler? Unlocked;
        private readonly double _requiredRatio;

        /// <summary>POL-05-03 : 결합 화면 — 잠금 중 사유 문구. 푸터(PopupWindow)와 푸터 숨김 시 본문 제출 영역이 같은 문구를 쓴다.</summary>
        internal string LockedReason => Video.HasPlaybackFailed
            ? "영상을 재생할 수 없어 퀴즈를 진행할 수 없습니다."
            : $"영상 {VideoPopupView.DisplayWatchedPercent(Video.LatestProgress)}% 시청 · "
              + $"기준 {_requiredRatio * 100:0.##}% 이상 시청하면 퀴즈와 제출이 활성화됩니다";

        public VideoQuizPopupView(VideoPopupView video, SurveyPopupView quiz, double requiredRatio)
        {
            Video = video;
            Quiz = quiz;
            _requiredRatio = double.IsFinite(requiredRatio) ? Math.Clamp(requiredRatio, 0, 1) : 1;
            Quiz.IsEnabled = false;
            Quiz.UseParentScrolling();
            Quiz.CollapseHeaderShownAbove(video.ShownTitle, video.ShownDescription);
            // POL-05-03 : 결합 화면 — 영상과 퀴즈 사이의 시스템 안내 행은 두지 않는다. 시청 %·기준 사유는 푸터
            // (또는 푸터 숨김 시 본문 제출 영역, SetLockedReason)에만 표시해 같은 안내가 두 번 나오지 않게 한다.
            // POL-05-03 : 결합 화면 — 영상 행은 Auto다. 제목·설명은 영상 뷰 안의 Auto 행, 재생 화면은 원본 비율 높이(VideoPopupView.EnableAspectSizing)로
            // 예전 고정 300 DIP(제목·설명 포함) 행을 대체한다. 영상과 퀴즈는 부모 세로 스크롤을 공유한다.
            var grid = new Grid();
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            Grid.SetRow(Quiz, 1);
            grid.Children.Add(Video);
            grid.Children.Add(Quiz);
            var host = new Grid();
            host.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            host.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            var scroll = new ScrollViewer { Content = grid, VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
                Style = (Style)Quiz.FindResource("SurveyScrollViewerStyle") };
            host.Children.Add(scroll);
            Video.EnableAspectSizing(() => scroll.ActualHeight);
            scroll.SizeChanged += (_, args) => { if (args.HeightChanged) Video.RefreshAspectHeight(); };
            // Keep submission fixed even when the popup's common footer is disabled.
            var submission = Quiz.DetachSubmissionArea();
            Grid.SetRow(submission, 1);
            host.Children.Add(submission);
            Content = host;
            Video.ProgressUpdated += (_, progress) => UpdateProgress(progress);
            Video.PlaybackFailed += (_, _) => { if (!IsUnlocked) Quiz.SetLockedReason(LockedReason); };
            Quiz.SetLockedReason(LockedReason);
        }

        private void UpdateProgress(VideoProgressSnapshot progress)
        {
            if (VideoCompletion.IsReached(progress.WatchedSeconds, progress.DurationSeconds, _requiredRatio))
                Unlock();
            else if (!IsUnlocked)
                Quiz.SetLockedReason(LockedReason);
        }

        private void Unlock()
        {
            if (IsUnlocked) return;
            IsUnlocked = true;
            Quiz.SetLockedReason(null);
            Quiz.IsEnabled = true;
            Unlocked?.Invoke(this, EventArgs.Empty);
        }

        /* POL-01-01 : 공통 옵션의 위치 — 본문 폰트 크기를 영상 뷰와 퀴즈 뷰에 함께 적용한다. */
        public void ApplyBodyFontSize(double fontSize)
        {
            Video.ApplyBodyFontSize(fontSize);
            Quiz.ApplyBodyFontSize(fontSize);
        }
    }
}
