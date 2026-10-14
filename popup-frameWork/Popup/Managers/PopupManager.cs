using Popup.Dtos;
using Popup.Models;
using Popup.Services;
using Popup.Views.Windows;
using System.Collections.Generic;
using System.Windows;
using Popup.Views.Contents;
using System;
using System.Diagnostics;

namespace Popup.Managers
{
    /*
     * 팝업 창 1건과 공통 배경 Overlay를 관리한다.
     * [설계 35·50-B] 서버 조회 응답이 1건이고 MainWindow·DemoWindow 모두 표시 중에는 다음 팝업을 요청하지 않으므로
     * 표시 우선순위(DisplayOrder) 정렬·그룹 큐·동시 표시(SIMULTANEOUS) 경로를 삭제하고 1건 표시 경로만 둔다.
     */
    public class PopupManager
    {
        /* 현재 열려 있는 팝업 창. 배경 클릭 시 다시 맨 앞으로 올리는 데 쓴다(단건 표시라 최대 1개). */
        private readonly HashSet<PopupWindow> _openWindows = new();
        private readonly Window _owner;
        private readonly BackgroundOverlayManager _backgroundOverlayManager = new();

        /// <summary>
        /// 팝업 창이 열려 있는지. DemoWindow의 데모 재실행 제한에 사용한다.
        /// API 모드(MainWindow)는 자체 표시 상태(_popupShowing)로 표시 중 조회를 하지 않는다.
        /// </summary>
        public bool HasOpenPopups => _openWindows.Count > 0;

        public PopupManager(Window owner)
        {
            _owner = owner;
            // [시연 피드백] Overlay를 소유자 창 아래 두어 앱 창 목록에 잡히지 않게 하고, 배경 클릭 시 팝업을 다시 맨 앞으로.
            _backgroundOverlayManager.Owner = owner;
            _backgroundOverlayManager.BackgroundClicked += (sender, eventArgs) => BringPopupsToFront();
        }

        /*
         * [설계 18 L-0 — C-9 삭제] 호출부가 없던 단건·별칭 진입점 Enqueue/Show/EnqueueRange를 삭제했다.
         * [설계 50-B] 목록을 받던 ShowRange도 호출부가 모두 1건만 넘겨 단건 진입점 Show로 바꿨다.
         */
        public void Show(PopupOptions popupOptions)
        {
            /*
             * [실행 순서 6/6]
             * 화면 표시의 최종 진입점.
             *
             * PopupOptions 1건
             *   → 배경 Overlay 설정
             *   → PopupWindow 생성
             *   → Show()
             *
             * 창이 만들어질 때 AttachResultCollection()도 연결되어
             * 닫기/숨김/설문/영상 결과가 PopupResultBuilder → PopupResultQueue로 이어진다.
             */
            if (popupOptions == null) throw new ArgumentNullException(nameof(popupOptions));
            if (HasOpenPopups)
                throw new InvalidOperationException("이미 표시 중인 팝업이 있습니다. 표시 중에는 다음 팝업을 열지 않습니다.");

            ConfigureBackgroundOverlay(popupOptions);

            /*
             * [설계 44 결함 2] Overlay를 먼저 띄운 뒤 팝업 생성·표시가 예외로 끝나면 Overlay가 남아
             * 모든 모니터의 클릭을 계속 삼켰다. 실패하면 Overlay를 닫고 열린 창 목록에서 빼낸 뒤 예외를 그대로 올린다.
             */
            PopupWindow? popupWindow = null;
            try
            {
                popupWindow = CreatePopupWindow(popupOptions);
                popupWindow.Closed += PopupWindow_Closed;
                if (_owner.IsVisible) popupWindow.Owner = _owner;
                popupWindow.ApplyPosition();
                popupWindow.Show();
            }
            catch
            {
                if (popupWindow != null)
                {
                    popupWindow.Closed -= PopupWindow_Closed;
                    _openWindows.Remove(popupWindow);
                }
                _backgroundOverlayManager.Close();
                throw;
            }
        }

        private void ConfigureBackgroundOverlay(PopupOptions popupOptions)
        {
            if (!popupOptions.UseBackgroundOverlay)
            {
                _backgroundOverlayManager.Close();
                return;
            }

            _backgroundOverlayManager.Opacity = Math.Clamp(popupOptions.BackgroundOverlayOpacity, 0.0, 1.0);
            _backgroundOverlayManager.Show();
        }

        private void PopupWindow_Closed(object? sender, EventArgs e)
        {
            if (sender is PopupWindow popupWindow)
                popupWindow.Closed -= PopupWindow_Closed;
            _backgroundOverlayManager.Close();
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

        /*
         * [기준 3·4] 기존 AttachContentEvents/AttachLifecycleEvents는
         *   설문 제출 → SubmitSurveyAsync, 영상 진행 → SaveVideoProgressAsync(10초 주기),
         *   표시/닫기 → PopupDisplayedAsync/PopupClosedAsync
         * 네 종류의 콜백으로 서버를 각각 호출했다(팝업당 최소 2회, 영상은 다수).
         * 이제 창 하나의 생명주기 동안 PopupResultBuilder에 사실만 기록하고, 닫힐 때 결과 항목 1개를 만든다.
         *
         * [설계 12 §1·§7·§9] 모든 결과(CLOSED/HIDDEN/VIDEO_WATCHED/SUBMITTED)는 서버 응답을 기다리지 않는다.
         *   결과 항목 생성 → EnqueueResult(pending-results.json 저장) → 창 닫기 → FlushResultsInBackground(백그라운드 전송)
         * [설계 34-23] 일반 결과(CLOSED/HIDDEN/VIDEO_WATCHED)도 제출과 같은 순서로, 창이 실제로 닫히기 전(Closing, 취소되지 않은 경우)
         *   파일에 먼저 저장한다. 예전에는 Closed 이후 비동기로 저장해 저장 전에 프로세스가 끝나면 결과가 남지 않을 수 있었다.
         * 설문·퀴즈 제출도 SurveyPopupView가 필수 응답 검증·로컬 채점을 끝낸 뒤 같은 경로를 탄다.
         * 기준 3 구현의 "제출 즉시 전송 후 서버 응답(통과 여부·거절) 안내"는 제거했다.
         */
        private void AttachResultCollection(PopupWindow popupWindow, PopupOptions popupOptions)
        {
            if (string.IsNullOrWhiteSpace(popupOptions.PopupId)) return;

            PopupResultBuilder builder = new(popupOptions.PopupId, popupOptions.HideDays, popupOptions.DeliveryId);

            popupWindow.ContentRendered += (sender, eventArgs) =>
                builder.MarkDisplayed(DateTimeOffset.Now);

            SurveyPopupView? surveyPopupView = popupOptions.Content as SurveyPopupView
                ?? (popupOptions.Content as VideoQuizPopupView)?.Quiz;
            VideoPopupView? videoPopupView = popupOptions.Content as VideoPopupView
                ?? (popupOptions.Content as VideoQuizPopupView)?.Video;
            if (surveyPopupView != null)
            {
                bool isSubmitting = false;
                surveyPopupView.SurveySubmitted += (sender, submission) =>
                {
                    if (isSubmitting) return;
                    if (popupOptions.Content is VideoQuizPopupView combined && !combined.IsUnlocked) return;
                    isSubmitting = true;
                    try
                    {
                        if (videoPopupView != null) builder.SetVideoProgress(videoPopupView.GetFinalProgress());
                        SubmitSurveyResult(popupWindow, popupOptions, builder, submission);
                    }
                    catch (Exception exception)
                    {
                        // 로컬 파일 저장 자체가 실패한 경우(디스크 오류 등). 창을 유지해 사용자가 다시 시도할 수 있게 한다.
                        PopupAlert.Show(popupWindow,
                            "응답을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.\n\n" + exception.Message,
                            "저장하지 못했어요", "다시 시도");
                    }
                    finally { isSubmitting = false; }
                };
            }

            if (videoPopupView != null)
            {
                // 닫히기 직전 누적 시청량을 한 번만 읽는다(예전의 10초 주기 저장 대체).
                // 시청 완료 판정(closable 여부)은 PopupWindow가 로컬 HasReachedCompletion으로 한다(설계 12 §5, 버튼 표시는 설계 43).
                popupWindow.Closing += (sender, eventArgs) =>
                    builder.SetVideoProgress(videoPopupView.GetFinalProgress());
            }

            // 영상 시청량 기록(위 Closing 핸들러) 뒤에 실행된다. PopupWindow.OnClosing이 취소를 먼저 결정하고
            // "다시 보지 않기" 선택을 기록한 뒤 Closing 이벤트를 올린다.
            // [설계 44 결함 1] 앱 종료 중에는 PopupWindow가 닫기를 취소하지 않지만, 취소가 남아 있어도 WPF는 종료 시 창을 닫으므로
            // 취소 여부와 관계없이 결과를 저장한다(예전에는 취소를 보고 돌아가 VIDEO 미완료·VIDEO+QUIZ 잠금 결과가 사라졌다).
            popupWindow.Closing += (sender, eventArgs) =>
            {
                if (builder.IsFinalized) return;   // 제출 항목을 이미 큐에 넣음
                if (eventArgs.Cancel && !PopupWindow.IsApplicationExiting()) return;   // 사용자 닫기 취소
                WpfResultItemDto item = builder.BuildClosed(DateTimeOffset.Now, popupOptions.DoNotShowAgainChecked);
                if (!TryEnqueueBeforeClose(popupWindow, popupOptions, item))
                {
                    eventArgs.Cancel = true;   // [설계 34-23] 영속 저장 전에는 닫지 않는다. 다시 닫으면 같은 resultId로 재시도한다.
                    return;
                }
                builder.MarkFinalized();
            };
            /*
             * [설계 44 결함 1] 취소된 Closing 뒤에도 창이 실제로 닫힌 경우(App 종료 플래그 없이 Application.Shutdown,
             * 소유자 창 종료 등 WPF가 취소를 무시하는 경로)를 Closed에서 한 번 더 확인해 결과를 남긴다.
             * 영상 시청량은 위 Closing 핸들러가 이미 기록했다. 창이 닫힌 뒤라 저장 실패는 RetainResultForExit로 넘긴다.
             */
            popupWindow.Closed += (sender, eventArgs) =>
            {
                if (builder.IsFinalized) return;
                WpfResultItemDto item = builder.BuildClosed(DateTimeOffset.Now, popupOptions.DoNotShowAgainChecked);
                builder.MarkFinalized();
                try
                {
                    popupOptions.EnqueueResult?.Invoke(item);
                }
                catch (Exception exception)
                {
                    Debug.WriteLine($"팝업 결과 로컬 저장 실패(닫힌 뒤) (PopupId: {item.PopupId}, Type: {item.ResultType}): {exception.Message}");
                    popupOptions.RetainResultForExit?.Invoke(item);
                }
            };
            popupWindow.Closed += (sender, eventArgs) => popupOptions.FlushResultsInBackground?.Invoke();
        }

        /*
         * [설계 12 §2·§4] 설문·퀴즈 제출: WPF가 이미 판정한 결과를 로컬 큐에 저장한 뒤 창을 닫는다.
         *  1. QUIZ 미통과(passed=false)면 점수·통과 점수를 안내하고 **창을 유지**한다. 결과는 만들지도 저장하지도 않는다.
         *     사용자는 답안을 고쳐 "제출"을 다시 누를 수 있고, 통과 점수를 넘길 때까지 반복한다(2026-09-22 사용자 지시).
         *     [설계 43] 안내에 틀린 문항 번호를 함께 보여 준다(결과 계약 score·passed는 그대로).
         *     QUIZ의 푸터 버튼은 '제출'이라 닫기 버튼이 없다. Background Overlay가 꺼져 있으면 미달 1회 뒤 보조 '닫기'가 보이고,
         *     켜져 있으면 통과해야 닫힌다(Alt+F4도 막힘 — 설계 44). 제출 없이 나가면 CLOSED 항목만 전송되어 다음 조회 때 다시 노출된다.
         *  2. 통과(또는 SURVEY)면 결과 항목(answers + score/passed) 생성 → EnqueueResult(pending-results.json 저장).
         *     이 시점부터 결과는 유실되지 않는다.
         *  3. QUIZ 통과 안내(서버 응답 없음). SURVEY는 안내 없이 닫는다.
         *  4. 창 닫기 → 백그라운드 전송(FlushResultsInBackground)
         * EnqueueResult가 없으면(훅 미연결) 저장 없이 닫는다.
         */
        private static void SubmitSurveyResult(
            PopupWindow popupWindow, PopupOptions popupOptions, PopupResultBuilder builder, SurveySubmission submission)
        {
            bool isQuiz = string.Equals(popupOptions.PopupType, "QUIZ", StringComparison.OrdinalIgnoreCase);
            string passingText = submission.PassingScore is double passing && passing > 0
                ? $" (통과 점수 {passing:0.##}점)" : string.Empty;

            if (isQuiz && submission.Passed == false)
            {
                popupWindow.NotifyQuizFailed();
                PopupAlert.Show(popupWindow, BuildQuizFailedMessage(submission, popupWindow.HasAuxClose), "다시 도전해 주세요", "답안 수정");
                return;   // 창 유지, 제출 없음
            }

            WpfResultItemDto item = builder.BuildSubmitted(submission, DateTimeOffset.Now);
            popupOptions.EnqueueResult?.Invoke(item);
            builder.MarkFinalized();

            if (isQuiz && submission.Score is double score)
            {
                PopupAlert.Show(popupWindow,
                    $"점수: {score:0.##}점{passingText}\n\n평가를 통과했습니다.",
                    "평가를 통과했어요", "완료");
            }

            popupWindow.CloseByApp();   // 앱이 시작한 닫기(설계 44). Closed 핸들러가 백그라운드 전송을 시작한다
        }

        /*
         * [설계 43] QUIZ 미달 안내 문구. 점수·통과 점수에 틀린 채점 문항 번호(화면 번호)를 더한다.
         * 보조 닫기가 실제로 보이는 경우(PopupWindow.HasAuxClose)에는 제출 없이 닫을 수 있다는 안내를 붙인다.
         */
        internal static string BuildQuizFailedMessage(SurveySubmission submission, bool auxCloseVisible)
        {
            string passingText = submission.PassingScore is double passing && passing > 0
                ? $" (통과 점수 {passing:0.##}점)" : string.Empty;
            string incorrectText = submission.IncorrectQuestionNumbers.Count > 0
                ? $"\n틀린 문항: {string.Join(", ", submission.IncorrectQuestionNumbers)}번" : string.Empty;
            string closeText = auxCloseVisible
                ?"\n다시 제출하지 않으려면 하단 '닫기'로 닫을 수 있습니다." : string.Empty;
            return $"점수: {submission.Score ?? 0:0.##}점{passingText}{incorrectText}\n\n통과 점수에 미달했습니다.\n답안을 확인한 뒤 다시 제출해 주세요.{closeText}";
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

        /// <summary>
        /// [설계 34-23] 닫힘 항목을 창이 닫히기 전에 로컬 큐 파일에 저장한다. 성공하면 true.
        /// 디스크 저장에 실패하면 안내 후 false를 돌려 호출자가 닫기를 취소하게 한다. 항목은 큐에 남기지 않으며(전송되지 않음)
        /// 창이 상태를 유지하다 다음 닫기 때 결과를 다시 만들어 저장한다.
        /// 앱 종료 중에는 닫기를 막을 수 없으므로 RetainResultForExit로 메모리에 남기고 true를 돌려 닫는다(종료 후에는 남지 않을 수 있음).
        /// </summary>
        private static bool TryEnqueueBeforeClose(PopupWindow popupWindow, PopupOptions popupOptions, WpfResultItemDto item)
        {
            if (popupOptions.EnqueueResult == null) return true;
            try
            {
                popupOptions.EnqueueResult(item);
                return true;
            }
            catch (Exception exception)
            {
                Debug.WriteLine($"팝업 결과 로컬 저장 실패 (PopupId: {item.PopupId}, Type: {item.ResultType}): {exception.Message}");
                if (PopupWindow.IsApplicationExiting())
                {
                    popupOptions.RetainResultForExit?.Invoke(item);
                    return true;
                }
                PopupAlert.Show(popupWindow,
                    "결과를 저장하지 못해 창을 닫지 않았습니다. 잠시 후 다시 닫아 주세요.\n\n" + exception.Message,
                    "저장하지 못했어요", "확인");
                return false;
            }
        }
    }
}
