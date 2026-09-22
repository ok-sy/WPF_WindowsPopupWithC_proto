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
        /* 현재 열려 있는 모든 팝업 창(순차·동시 공통). 배경 클릭 시 다시 맨 앞으로 올리는 데 쓴다. */
        private readonly HashSet<PopupWindow> _openWindows = new();
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
            // [시연 피드백] Overlay를 소유자 창 아래 두어 앱 창 목록에 잡히지 않게 하고, 배경 클릭 시 팝업을 다시 맨 앞으로.
            _backgroundOverlayManager.Owner = owner;
            _backgroundOverlayManager.BackgroundClicked += (sender, eventArgs) => BringPopupsToFront();
        }

        public void Enqueue(PopupOptions popupOptions) => ShowRange(new[] { popupOptions });
        public void Show(PopupOptions popupOptions) => ShowRange(new[] { popupOptions });
        public void EnqueueRange(IEnumerable<PopupOptions> popupOptionsList) => ShowRange(popupOptionsList);

        public void ShowRange(IEnumerable<PopupOptions> popupOptionsList)
        {
            /*
             * [실행 순서 6/6]
             * 화면 표시의 최종 진입점.
             *
             * PopupOptions 목록
             *   → DisplayOrder 정렬/그룹화
             *   → SIMULTANEOUS 또는 SEQUENTIAL 결정
             *   → PopupWindow 생성
             *   → Show()
             *
             * 창이 만들어질 때 AttachResultCollection()도 연결되어
             * 닫기/숨김/설문/영상 결과가 PopupResultBuilder → PopupResultQueue로 이어진다.
             */
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
            // [시연 피드백] 팝업은 Overlay 사용 여부와 무관하게 항상 최상위다. 배경·다른 앱을 눌러도 뒤로 가지 않는다.
            popupWindow.Topmost = true;
            popupWindow.Deactivated += (sender, eventArgs) => popupWindow.Topmost = true;
            _openWindows.Add(popupWindow);
            popupWindow.Closed += (sender, eventArgs) => _openWindows.Remove(popupWindow);
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
         * 이제 창 하나의 생명주기 동안 PopupResultBuilder에 사실만 기록하고, 닫힐 때 결과 항목 1개를 만든다.
         *
         * [설계 12 §1·§7·§9] 모든 결과(CLOSED/HIDDEN/VIDEO_WATCHED/SUBMITTED)는 서버 응답을 기다리지 않는다.
         *   결과 항목 생성 → EnqueueResultAsync(pending-results.json 저장) → 창 닫기 → FlushResultsInBackground(백그라운드 전송)
         * 설문·퀴즈 제출도 SurveyPopupView가 필수 응답 검증·로컬 채점을 끝낸 뒤 같은 경로를 탄다.
         * 기준 3 구현의 "제출 즉시 전송 후 서버 응답(통과 여부·거절) 안내"는 제거했다.
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
                surveyPopupView.SurveySubmitted += async (sender, submission) =>
                {
                    if (isSubmitting) return;
                    isSubmitting = true;
                    try
                    {
                        await SubmitSurveyResultAsync(popupWindow, popupOptions, builder, submission);
                    }
                    catch (Exception exception)
                    {
                        // 로컬 파일 저장 자체가 실패한 경우(디스크 오류 등). 창을 유지해 사용자가 다시 시도할 수 있게 한다.
                        MessageBox.Show(popupWindow,
                            "응답을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.\n\n" + exception.Message,
                            "응답 저장 오류", MessageBoxButton.OK, MessageBoxImage.Error);
                    }
                    finally { isSubmitting = false; }
                };
            }

            if (popupOptions.Content is VideoPopupView videoPopupView)
            {
                // 닫히기 직전 누적 시청량을 한 번만 읽는다(예전의 10초 주기 저장 대체).
                // 시청 완료 판정(closable 여부)은 PopupWindow.CloseButton_Click이 로컬 HasReachedCompletion으로 한다(설계 12 §5).
                popupWindow.Closing += (sender, eventArgs) =>
                    builder.SetVideoProgress(videoPopupView.GetFinalProgress());
            }

            popupWindow.Closed += async (sender, eventArgs) =>
            {
                if (builder.IsFinalized) return;                 // 제출 항목을 이미 큐에 넣음
                WpfResultItemDto item = builder.BuildClosed(DateTimeOffset.Now, popupOptions.DoNotShowAgainChecked);
                await EnqueueSafelyAsync(popupOptions, item);
                popupOptions.FlushResultsInBackground?.Invoke();
            };
        }

        /*
         * [설계 12 §2·§4] 설문·퀴즈 제출: WPF가 이미 판정한 결과를 로컬 큐에 저장한 뒤 창을 닫는다.
         *  1. QUIZ 미통과(passed=false)면 점수·통과 점수를 안내하고 **창을 유지**한다. 결과는 만들지도 저장하지도 않는다.
         *     사용자는 답안을 고쳐 "채점"을 다시 누를 수 있고, 통과 점수를 넘길 때까지 반복한다(2026-09-22 사용자 지시).
         *     닫기 버튼으로 나가면 SUBMITTED 없이 CLOSED 항목만 전송되어 다음 조회 때 다시 노출된다.
         *  2. 통과(또는 SURVEY)면 결과 항목(answers + score/passed) 생성 → EnqueueResultAsync(pending-results.json 저장, await).
         *     이 시점부터 결과는 유실되지 않는다.
         *  3. QUIZ 통과 안내(서버 응답 없음). SURVEY는 안내 없이 닫는다.
         *  4. 창 닫기 → 백그라운드 전송(FlushResultsInBackground)
         * EnqueueResultAsync가 없으면(훅 미연결) 저장 없이 닫는다.
         */
        private static async Task SubmitSurveyResultAsync(
            PopupWindow popupWindow, PopupOptions popupOptions, PopupResultBuilder builder, SurveySubmission submission)
        {
            bool isQuiz = string.Equals(popupOptions.PopupType, "QUIZ", StringComparison.OrdinalIgnoreCase);
            string passingText = submission.PassingScore is double passing && passing > 0
                ? $" (통과 점수 {passing:0.##}점)" : string.Empty;

            if (isQuiz && submission.Passed == false)
            {
                MessageBox.Show(popupWindow,
                    $"점수: {submission.Score ?? 0:0.##}점{passingText}\n\n통과 점수에 미달했습니다.\n답안을 확인한 뒤 다시 채점해 주세요.",
                    "채점 결과", MessageBoxButton.OK, MessageBoxImage.Warning);
                return;   // 창 유지, 제출 없음
            }

            WpfResultItemDto item = builder.BuildSubmitted(submission, DateTimeOffset.Now);
            if (popupOptions.EnqueueResultAsync != null)
            {
                await popupOptions.EnqueueResultAsync(item);
            }
            builder.MarkFinalized();

            if (isQuiz && submission.Score is double score)
            {
                MessageBox.Show(popupWindow,
                    $"점수: {score:0.##}점{passingText}\n\n평가를 통과했습니다.",
                    "채점 결과", MessageBoxButton.OK, MessageBoxImage.Information);
            }

            popupWindow.Close();
            popupOptions.FlushResultsInBackground?.Invoke();
        }


        /*
         * [시연 피드백] Overlay(배경)를 클릭하면 Overlay는 활성화되지 않지만, 안전하게 열려 있는 팝업을 모두
         * 다시 최상위로 올리고 마지막 창을 활성화한다. 사용자가 어떤 배경을 눌러도 팝업이 가려지지 않는다.
         */
        private void BringPopupsToFront()
        {
            PopupWindow? last = null;
            foreach (PopupWindow window in _openWindows)
            {
                if (!window.IsVisible) continue;
                window.Topmost = true;
                last = window;
            }
            last?.Activate();
        }

        /// <summary>닫힘 항목을 로컬 큐에 저장한다. 창은 이미 닫힌 뒤라 실패해도 안내할 창이 없으므로 로그만 남긴다.</summary>
        private static async Task EnqueueSafelyAsync(PopupOptions popupOptions, WpfResultItemDto item)
        {
            if (popupOptions.EnqueueResultAsync == null) return;
            try { await popupOptions.EnqueueResultAsync(item); }
            catch (Exception exception)
            {
                Debug.WriteLine($"팝업 결과 로컬 저장 실패 (PopupId: {item.PopupId}, Type: {item.ResultType}): {exception.Message}");
            }
        }
    }
}
