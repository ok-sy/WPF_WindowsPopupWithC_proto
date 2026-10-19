using Popup.Models;
using Popup.Services;
using System;
using System.Windows;
using System.Windows.Controls;

namespace Popup.Views.Contents
{
    /// <summary>영상 누적 시청 기준에 도달하면 퀴즈 입력과 공통 푸터를 활성화한다.</summary>
    public sealed class VideoQuizPopupView : UserControl, IBodyFontSizeAware
    {
        public VideoPopupView Video { get; }
        public SurveyPopupView Quiz { get; }
        public bool IsUnlocked { get; private set; }
        public event EventHandler? Unlocked;
        private readonly double _requiredRatio;

        /// <summary>[TODO59] 잠금 중 사유 문구. 푸터(PopupWindow)와 푸터 숨김 시 본문 제출 영역이 같은 문구를 쓴다.</summary>
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
            // [TODO59] 영상과 퀴즈 사이의 시스템 안내(_notice)와 전용 행을 없앴다. 시청 %·기준 사유는 푸터
            // (또는 푸터 숨김 시 본문 제출 영역, SetLockedReason)에만 표시해 같은 안내가 두 번 나오지 않게 한다.
            var grid = new Grid();
            grid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(300) });
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            Grid.SetRow(Quiz, 1);
            grid.Children.Add(Video);
            grid.Children.Add(Quiz);
            var host = new Grid();
            host.RowDefinitions.Add(new RowDefinition { Height = new GridLength(1, GridUnitType.Star) });
            host.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            host.Children.Add(new ScrollViewer { Content = grid, VerticalScrollBarVisibility = ScrollBarVisibility.Auto,
                HorizontalScrollBarVisibility = ScrollBarVisibility.Disabled,
                Style = (Style)Quiz.FindResource("SurveyScrollViewerStyle") });
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

        public void ApplyBodyFontSize(double fontSize)
        {
            Video.ApplyBodyFontSize(fontSize);
            Quiz.ApplyBodyFontSize(fontSize);
        }
    }
}
