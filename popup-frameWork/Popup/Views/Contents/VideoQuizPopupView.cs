using Popup.Models;
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
        private readonly TextBlock _notice;

        public VideoQuizPopupView(VideoPopupView video, SurveyPopupView quiz, double requiredRatio)
        {
            Video = video;
            Quiz = quiz;
            _requiredRatio = double.IsFinite(requiredRatio) ? Math.Clamp(requiredRatio, 0, 1) : 1;
            Quiz.IsEnabled = false;
            Quiz.UseParentScrolling();
            _notice = new TextBlock
            {
                Text = $"영상을 {_requiredRatio * 100:0.##}% 이상 시청하면 퀴즈와 하단 버튼이 활성화됩니다.",
                TextWrapping = TextWrapping.Wrap,
                Margin = new Thickness(16, 8, 16, 8)
            };
            var grid = new Grid();
            grid.RowDefinitions.Add(new RowDefinition { Height = new GridLength(300) });
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            grid.RowDefinitions.Add(new RowDefinition { Height = GridLength.Auto });
            Grid.SetRow(_notice, 1);
            Grid.SetRow(Quiz, 2);
            grid.Children.Add(Video);
            grid.Children.Add(_notice);
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
        }

        private void UpdateProgress(VideoProgressSnapshot progress)
        {
            if (progress.DurationSeconds > 0
                && (double)(decimal.Floor(progress.WatchedSeconds / progress.DurationSeconds * 10000) / 10000) >= _requiredRatio)
                Unlock();
        }

        private void Unlock()
        {
            if (IsUnlocked) return;
            IsUnlocked = true;
            Quiz.IsEnabled = true;
            _notice.Text = "시청 기준을 충족했습니다. 퀴즈에 응답해 주세요.";
            Unlocked?.Invoke(this, EventArgs.Empty);
        }

        public void ApplyBodyFontSize(double fontSize)
        {
            Video.ApplyBodyFontSize(fontSize);
            Quiz.ApplyBodyFontSize(fontSize);
            _notice.FontSize = fontSize;
        }
    }
}
