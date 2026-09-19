using Popup.Dtos;
using Popup.Models;
using Popup.Services;
using Popup.Views.Windows;
using System.Collections.Generic;
using System.Windows;
using System.Linq;
using Popup.Views.Contents;
using System;
using System.Diagnostics;
using System.Threading.Tasks;

namespace Popup.Managers
{
    /* 표시 우선순위(DisplayOrder) 단위로 팝업과 공통 배경 Overlay를 관리한다. */
    public class PopupManager
    {
        private readonly Queue<List<PopupOptions>> _popupGroupQueue = new();
        private readonly Queue<PopupOptions> _sequentialGroupQueue = new();
        private readonly HashSet<PopupWindow> _activeGroupWindows = new();
        private readonly Window _owner;
        private readonly BackgroundOverlayManager _backgroundOverlayManager = new();
        private readonly double _defaultBackgroundOverlayOpacity;
        private bool _isGroupActive;

        /// <summary>
        /// [기준 4] 팝업 그룹이 표시 중이거나 대기 중인지. MainWindow가 주기 조회를 건너뛰는 판단에 쓴다
        /// (열려 있는 팝업 위에 같은 팝업이 다시 뜨는 것을 막는다).
        /// </summary>
        public bool HasOpenPopups => _isGroupActive || _popupGroupQueue.Count > 0;

        public PopupManager(
            Window owner,
            bool useBackgroundOverlay = true,
            double backgroundOverlayOpacity = 0.45)
        {
            _owner = owner;
            _defaultBackgroundOverlayOpacity = Math.Clamp(backgroundOverlayOpacity, 0.0, 1.0);
        }

        public void Enqueue(PopupOptions popupOptions) => ShowRange(new[] { popupOptions });
        public void Show(PopupOptions popupOptions) => ShowRange(new[] { popupOptions });
        public void EnqueueRange(IEnumerable<PopupOptions> popupOptionsList) => ShowRange(popupOptionsList);

        public void ShowRange(IEnumerable<PopupOptions> popupOptionsList)
        {
            if (popupOptionsList == null) return;

            List<List<PopupOptions>> groups = popupOptionsList
                .Where(option => option != null)
                .OrderBy(option => option.DisplayOrder)
                .ThenBy(option => option.PopupId)
                .GroupBy(option => option.DisplayOrder)
                .Select(group => group.ToList())
                .ToList();

            if (groups.Count == 0) return;
            foreach (List<PopupOptions> group in groups) _popupGroupQueue.Enqueue(group);
            ShowNextGroup();
        }

        private void ShowNextGroup()
        {
            if (_isGroupActive || _popupGroupQueue.Count == 0) return;

            List<PopupOptions> group = _popupGroupQueue.Dequeue();
            if (group.Count == 0)
            {
                ShowNextGroup();
                return;
            }

            ConfigureBackgroundOverlay(group);
            _isGroupActive = true;

            bool showSimultaneously = group.All(option =>
                option.DisplayMode == PopupDisplayMode.Simultaneous);

            if (showSimultaneously)
            {
                ShowSimultaneousGroup(group);
                return;
            }

            foreach (PopupOptions popupOptions in group) _sequentialGroupQueue.Enqueue(popupOptions);
            ShowNextSequentialPopup();
        }

        private void ConfigureBackgroundOverlay(IReadOnlyList<PopupOptions> group)
        {
            List<PopupOptions> overlayOptions = group
                .Where(option => option.UseBackgroundOverlay)
                .ToList();

            if (overlayOptions.Count == 0)
            {
                _backgroundOverlayManager.Close();
                return;
            }

            /* 같은 표시 그룹에서는 Overlay를 한 세트만 띄우고 가장 높은 불투명도를 사용한다. */
            double opacity = overlayOptions
                .Select(option => Math.Clamp(option.BackgroundOverlayOpacity, 0.0, 1.0))
                .DefaultIfEmpty(_defaultBackgroundOverlayOpacity)
                .Max();

            _backgroundOverlayManager.Opacity = opacity;
            _backgroundOverlayManager.Show();
        }

        private void ShowSimultaneousGroup(IReadOnlyList<PopupOptions> group)
        {
            foreach (PopupOptions popupOptions in group)
            {
                PopupWindow popupWindow = CreatePopupWindow(popupOptions);
                _activeGroupWindows.Add(popupWindow);
                popupWindow.Closed += SimultaneousPopupWindow_Closed;
                PositionSimultaneousPopup(popupWindow, _activeGroupWindows.Count - 1);
                popupWindow.Show();
            }
        }

        private void SimultaneousPopupWindow_Closed(object? sender, EventArgs e)
        {
            if (sender is not PopupWindow popupWindow) return;
            popupWindow.Closed -= SimultaneousPopupWindow_Closed;
            _activeGroupWindows.Remove(popupWindow);
            if (_activeGroupWindows.Count > 0) return;
            CompleteCurrentGroup();
        }

        private void ShowNextSequentialPopup()
        {
            if (_sequentialGroupQueue.Count == 0)
            {
                CompleteCurrentGroup();
                return;
            }

            PopupOptions popupOptions = _sequentialGroupQueue.Dequeue();
            PopupWindow popupWindow = CreatePopupWindow(popupOptions);
            popupWindow.Closed += SequentialPopupWindow_Closed;
            PositionSequentialPopup(popupWindow, popupOptions);
            popupWindow.Show();
        }

        private void SequentialPopupWindow_Closed(object? sender, EventArgs e)
        {
            if (sender is PopupWindow popupWindow)
                popupWindow.Closed -= SequentialPopupWindow_Closed;
            ShowNextSequentialPopup();
        }

        private void CompleteCurrentGroup()
        {
            _isGroupActive = false;
            if (_popupGroupQueue.Count == 0)
            {
                _backgroundOverlayManager.Close();
                return;
            }
            ShowNextGroup();
        }

        private PopupWindow CreatePopupWindow(PopupOptions popupOptions)
        {
            PopupWindow popupWindow = new(popupOptions);
            if (_backgroundOverlayManager.IsVisible) popupWindow.Topmost = true;
            AttachResultCollection(popupWindow, popupOptions);
            return popupWindow;
        }

        private void PositionSequentialPopup(PopupWindow popupWindow, PopupOptions popupOptions)
        {
            if (_owner.IsVisible)
            {
                popupWindow.Owner = _owner;
                return;
            }
            if (popupOptions.SizeMode != PopupSizeMode.Fullscreen)
                popupWindow.WindowStartupLocation = WindowStartupLocation.CenterScreen;
        }

        private void PositionSimultaneousPopup(PopupWindow popupWindow, int openedPopupIndex)
        {
            popupWindow.WindowStartupLocation = WindowStartupLocation.Manual;
            if (_owner.IsVisible)
            {
                popupWindow.Owner = _owner;
                popupWindow.Left = _owner.Left + 50 + (openedPopupIndex * 30);
                popupWindow.Top = _owner.Top + 50 + (openedPopupIndex * 30);
                return;
            }

            popupWindow.Left = SystemParameters.WorkArea.Left
                + ((SystemParameters.WorkArea.Width - popupWindow.Width) / 2)
                + (openedPopupIndex * 30);
            popupWindow.Top = SystemParameters.WorkArea.Top
                + ((SystemParameters.WorkArea.Height - popupWindow.Height) / 2)
                + (openedPopupIndex * 30);
        }

        /*
         * [기준 3·4] 기존 AttachContentEvents/AttachLifecycleEvents는
         *   설문 제출 → SubmitSurveyAsync, 영상 진행 → SaveVideoProgressAsync(10초 주기),
         *   표시/닫기 → PopupDisplayedAsync/PopupClosedAsync
         * 네 종류의 콜백으로 서버를 각각 호출했다(팝업당 최소 2회, 영상은 다수).
         * 이제 창 하나의 생명주기 동안 PopupResultBuilder에 사실만 기록하고, 닫힐 때 결과 항목 1개를
         * ReportResultAsync(큐)로 넘긴다. 제출만 사용자가 결과를 즉시 알아야 하므로 ReportResultImmediateAsync로
         * 바로 보내고 서버 응답(통과 여부·거절)을 안내한다. 서버 호출은 팝업당 최대 1회다.
         */
        private void AttachResultCollection(PopupWindow popupWindow, PopupOptions popupOptions)
        {
            if (string.IsNullOrWhiteSpace(popupOptions.PopupId)) return;

            PopupResultBuilder builder = new(popupOptions.PopupId, popupOptions.HideDays);

            popupWindow.ContentRendered += (sender, eventArgs) =>
                builder.MarkDisplayed(DateTimeOffset.Now);

            if (popupOptions.Content is SurveyPopupView surveyPopupView)
            {
                bool isSubmitting = false;
                surveyPopupView.SurveySubmitted += async (sender, answers) =>
                {
                    if (isSubmitting) return;
                    isSubmitting = true;
                    try
                    {
                        await SubmitSurveyResultAsync(popupWindow, popupOptions, builder, answers);
                    }
                    catch (Exception exception)
                    {
                        // 전송 자체가 실패하면 큐에 보관되어 있으므로(SendImmediateAsync) 안내만 하고 창은 유지한다.
                        MessageBox.Show(
                            "응답을 서버에 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.\n\n" + exception.Message,
                            "응답 저장 오류", MessageBoxButton.OK, MessageBoxImage.Error);
                    }
                    finally { isSubmitting = false; }
                };
            }

            if (popupOptions.Content is VideoPopupView videoPopupView)
            {
                // 닫히기 직전 누적 시청량을 한 번만 읽는다(예전의 10초 주기 저장 대체).
                popupWindow.Closing += (sender, eventArgs) =>
                    builder.SetVideoProgress(videoPopupView.GetFinalProgress());
            }

            popupWindow.Closed += async (sender, eventArgs) =>
            {
                if (builder.IsFinalized) return;                 // 제출로 이미 전송됨
                WpfResultItemDto item = builder.BuildClosed(DateTimeOffset.Now, popupOptions.DoNotShowAgainChecked);
                await ReportSafelyAsync(popupOptions.ReportResultAsync, item);
            };
        }

        /*
         * 설문·퀴즈 제출: 즉시 전송 후 서버 응답으로 안내한다.
         *  - REJECTED           : 사유를 보여 주고 창을 유지한다(사용자가 다시 시도).
         *  - QUIZ 미통과(passed=false): 안내 후 창을 닫는다. 재노출 여부는 다음 조회 시 서버가 결정한다.
         *  - 그 외(ACCEPTED/DUPLICATE): 창을 닫는다. SURVEY는 채점 결과가 없다.
         * ReportResultImmediateAsync가 없으면(데모 모드) 전송 없이 닫는다.
         */
        private static async Task SubmitSurveyResultAsync(
            PopupWindow popupWindow, PopupOptions popupOptions, PopupResultBuilder builder, List<SurveyAnswer> answers)
        {
            WpfResultItemDto item = builder.BuildSubmitted(answers, DateTimeOffset.Now);
            if (popupOptions.ReportResultImmediateAsync == null)
            {
                builder.MarkFinalized();
                popupWindow.Close();
                return;
            }

            WpfResultItemResponseDto response = await popupOptions.ReportResultImmediateAsync(item);
            if (response.IsRejected)
            {
                MessageBox.Show(
                    "응답이 접수되지 않았습니다.\n\n" + (response.Message ?? response.Code ?? "알 수 없는 오류"),
                    "응답 거절", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;
            }

            builder.MarkFinalized();
            bool isQuiz = string.Equals(popupOptions.PopupType, "QUIZ", StringComparison.OrdinalIgnoreCase);
            if (isQuiz && response.Passed == false)
            {
                MessageBox.Show(
                    $"점수: {response.TotalScore ?? 0:0.##}점\n\n통과 점수에 미달했습니다.\n다음에 다시 응시할 수 있습니다.",
                    "채점 결과", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
            else if (isQuiz && response.Passed == true)
            {
                MessageBox.Show(
                    $"점수: {response.TotalScore ?? 0:0.##}점\n\n평가를 통과했습니다.",
                    "채점 결과", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            popupWindow.Close();
        }

        private static async Task ReportSafelyAsync(Func<WpfResultItemDto, Task>? report, WpfResultItemDto item)
        {
            if (report == null) return;
            try { await report(item); }
            catch (Exception exception)
            {
                Debug.WriteLine($"팝업 결과 보고 실패 (PopupId: {item.PopupId}, Type: {item.ResultType}): {exception.Message}");
            }
        }
    }
}
