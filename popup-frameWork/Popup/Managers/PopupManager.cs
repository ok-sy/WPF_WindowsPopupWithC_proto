using Popup.Models;
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
            AttachContentEvents(popupWindow, popupOptions);
            AttachLifecycleEvents(popupWindow, popupOptions);
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

        private void AttachContentEvents(PopupWindow popupWindow, PopupOptions popupOptions)
        {
            if (popupOptions.Content is SurveyPopupView surveyPopupView)
            {
                bool isSubmitting = false;
                surveyPopupView.SurveySubmitted += async (sender, answers) =>
                {
                    if (isSubmitting) return;
                    isSubmitting = true;
                    try
                    {
                        if (popupOptions.SubmitSurveyAsync != null)
                            await popupOptions.SubmitSurveyAsync(popupOptions.PopupId, answers);
                        popupWindow.Close();
                    }
                    catch (Exception exception)
                    {
                        MessageBox.Show(
                            "설문 응답을 서버에 저장하지 못했습니다.\n\n" + exception.Message,
                            "설문 저장 오류", MessageBoxButton.OK, MessageBoxImage.Error);
                    }
                    finally { isSubmitting = false; }
                };
            }

            if (popupOptions.Content is VideoPopupView videoPopupView)
            {
                bool isSavingVideoProgress = false;
                videoPopupView.VideoProgressSaveRequested += async (sender, progress) =>
                {
                    if (isSavingVideoProgress || popupOptions.SaveVideoProgressAsync == null) return;
                    isSavingVideoProgress = true;
                    try
                    {
                        bool completed = await popupOptions.SaveVideoProgressAsync(
                            popupOptions.PopupId, progress);
                        if (completed) popupOptions.IsCompleted = true;
                    }
                    catch (Exception exception)
                    {
                        Debug.WriteLine($"영상 진행률 저장 실패 (PopupId: {popupOptions.PopupId}): {exception.Message}");
                    }
                    finally { isSavingVideoProgress = false; }
                };
            }
        }

        private static void AttachLifecycleEvents(PopupWindow popupWindow, PopupOptions popupOptions)
        {
            bool displayedEventRecorded = false;
            popupWindow.ContentRendered += async (sender, eventArgs) =>
            {
                if (displayedEventRecorded) return;
                displayedEventRecorded = true;
                await InvokeLifecycleCallbackSafelyAsync(
                    popupOptions.PopupDisplayedAsync, popupOptions.PopupId, "DISPLAYED");
            };

            popupWindow.Closed += async (sender, eventArgs) =>
            {
                await InvokeLifecycleCallbackSafelyAsync(
                    popupOptions.PopupClosedAsync, popupOptions.PopupId, "CLOSED");
            };
        }

        private static async Task InvokeLifecycleCallbackSafelyAsync(
            Func<string, Task>? lifecycleCallback, string popupId, string eventType)
        {
            if (lifecycleCallback == null || string.IsNullOrWhiteSpace(popupId)) return;
            try { await lifecycleCallback(popupId); }
            catch (Exception exception)
            {
                Debug.WriteLine($"팝업 {eventType} 이벤트 저장 실패 (PopupId: {popupId}): {exception.Message}");
            }
        }
    }
}
