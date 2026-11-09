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
     * POL-11-01 : 노출 판단 소유
     * POL-09-02 : 조회 응답
     * ■ 팝업 표시 관리
     * - in : owner(Window) 소유자 창(MainWindow/DemoWindow)
     * - out: 팝업 창 1건 표시 · 닫힐 때 결과 항목 생성·로컬 큐 저장·백그라운드 전송 요청
     * - 팝업 창 1건과 공통 배경 Overlay를 관리한다.
     *   서버 조회 응답이 1건이고 MainWindow·DemoWindow 모두 표시 중에는 다음 팝업을 요청하지 않으므로
     *   표시 우선순위(DisplayOrder) 정렬·그룹 큐·동시 표시(SIMULTANEOUS) 경로 없이 1건 표시 경로만 둔다.
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
            // Overlay를 소유자 창 아래 두어 앱 창 목록에 잡히지 않게 하고, 배경 클릭 시 팝업을 다시 맨 앞으로.
            _backgroundOverlayManager.Owner = owner;
            _backgroundOverlayManager.BackgroundClicked += (sender, eventArgs) => BringPopupsToFront();
        }

        /*
         * POL-11-01 : 노출 판단 소유
         * ■ 팝업 표시
         * - in : popupOptions(PopupOptions) 표시할 팝업 1건
         * - out: 없음 · 예외: ArgumentNullException(null), InvalidOperationException(이미 표시 중), 창 생성·표시 예외는 Overlay를 닫고 그대로 올린다
         * - 단건 진입점이다(목록·별칭 진입점은 두지 않는다). Overlay 설정 → PopupWindow 생성·위치 적용 → 표시.
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
             * POL-02-02 : 종료 제어
             * Overlay를 먼저 띄운 뒤 팝업 생성·표시가 예외로 끝나면 Overlay가 남아
             * 모든 모니터의 클릭을 계속 삼킨다. 실패하면 Overlay를 닫고 열린 창 목록에서 빼낸 뒤 예외를 그대로 올린다.
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
            // 팝업은 Overlay 사용 여부와 무관하게 항상 최상위다. 배경·다른 앱을 눌러도 뒤로 가지 않는다.
            popupWindow.Topmost = true;
            popupWindow.Deactivated += (sender, eventArgs) => popupWindow.Topmost = true;
            _openWindows.Add(popupWindow);
            popupWindow.Closed += (sender, eventArgs) => _openWindows.Remove(popupWindow);
            AttachResultCollection(popupWindow, popupOptions);
            return popupWindow;
        }

        /*
         * POL-09-01 : 3 API 순서
         * POL-10-03 : 완료·숨김·연기
         * POL-12-02 : 현행 임시 복구
         * 표시 중 서버를 호출하지 않는다(표시·닫기·영상 진행·설문 제출을 각각 보내는 콜백은 두지 않는다).
         * 창 하나의 생명주기 동안 PopupResultBuilder에 사실만 기록하고, 닫힐 때 결과 항목 1개를 만든다.
         *
         * 모든 결과(CLOSED/HIDDEN/VIDEO_WATCHED/SUBMITTED)는 서버 응답을 기다리지 않는다.
         *   결과 항목 생성 → EnqueueResult(메모리 결과 큐 적재) → 창 닫기 → FlushResultsInBackground(백그라운드 전송)
         * 일반 결과(CLOSED/HIDDEN/VIDEO_WATCHED)도 제출과 같은 순서로, 창이 실제로 닫히기 전(Closing, 취소되지 않은 경우)
         *   큐에 먼저 넣는다. 큐는 메모리 전용이라 프로세스가 끝나면 미전송 결과는 사라진다(2026-10-28 결정).
         * 설문·퀴즈 제출도 SurveyPopupView가 필수 응답 검증·로컬 채점을 끝낸 뒤 같은 경로를 탄다.
         * 제출 직후 서버 응답(통과 여부·거절)을 기다려 안내하지 않는다.
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
                        // 결과 적재·결과 생성에서 예외가 난 경우. 창을 유지해 사용자가 다시 시도할 수 있게 한다.
                        PopupAlert.Show(popupWindow,
                            "응답을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.\n\n" + exception.Message,
                            "저장하지 못했어요", "다시 시도");
                    }
                    finally { isSubmitting = false; }
                };
            }

            bool closingRaised = false;
            popupWindow.Closing += (sender, eventArgs) => closingRaised = true;
            if (videoPopupView != null)
            {
                // POL-05-02 : 완료·화면 이탈 — 닫히기 직전 누적 시청량을 한 번만 읽는다(주기 저장 없음).
                // 시청 완료 판정(closable 여부)과 버튼 활성화는 PopupWindow가 로컬 HasReachedCompletion으로 한다.
                popupWindow.Closing += (sender, eventArgs) =>
                    builder.SetVideoProgress(videoPopupView.GetFinalProgress());
            }

            // 영상 시청량 기록(위 Closing 핸들러) 뒤에 실행된다. PopupWindow.OnClosing이 취소를 먼저 결정하고
            // "다시 보지 않기" 선택을 기록한 뒤 Closing 이벤트를 올린다.
            // POL-10-03 : 완료·숨김·연기 — 나중에 보기로 닫으면 LATER 항목을 만든다.
            // POL-02-02 : 종료 제어 — 앱 종료 중에는 PopupWindow가 닫기를 취소하지 않지만, 취소가 남아 있어도 WPF는 종료 시 창을 닫으므로
            // 취소 여부와 관계없이 결과를 저장한다(VIDEO 미완료·VIDEO+QUIZ 잠금 결과도 남긴다).
            popupWindow.Closing += (sender, eventArgs) =>
            {
                if (builder.IsFinalized) return;   // 제출 항목을 이미 큐에 넣음
                if (eventArgs.Cancel && !PopupWindow.IsApplicationExiting()) return;   // 사용자 닫기 취소
                WpfResultItemDto item = builder.BuildOnClose(DateTimeOffset.Now, popupOptions.LaterRequested, popupOptions.DoNotShowAgainChecked);
                if (!TryEnqueueBeforeClose(popupWindow, popupOptions, item))
                {
                    eventArgs.Cancel = true;   // POL-12-01 : 종결과 보관 — 큐에 넣지 못하면 닫지 않는다. 다시 닫으면 같은 resultId로 재시도한다.
                    return;
                }
                builder.MarkFinalized();
            };
            /*
             * POL-02-02 : 종료 제어
             * 취소된 Closing 뒤에도 창이 실제로 닫힌 경우(App 종료 플래그 없이 Application.Shutdown,
             * 소유자 창 종료 등 WPF가 취소를 무시하는 경로)를 Closed에서 한 번 더 확인해 결과를 남긴다.
             * 영상 시청량은 위 Closing 핸들러가 이미 기록했다. 창이 닫힌 뒤라 저장 실패는 RetainResultForExit로 넘긴다.
             * 소유자 창이 닫히면 Win32가 소유 창을 함께 파괴해 Closing 없이 Closed만 온다. 이때는 Closing에서 하던
             * 영상 시청량·"다시 보지 않기" 기록을 여기서 한다(없으면 VIDEO_WATCHED·HIDDEN이 CLOSED로 바뀐다).
             */
            popupWindow.Closed += (sender, eventArgs) =>
            {
                if (builder.IsFinalized) return;
                if (!closingRaised)
                {
                    popupWindow.RecordDoNotShowAgainChoice();
                    if (videoPopupView != null) builder.SetVideoProgress(videoPopupView.GetFinalProgress());
                }
                WpfResultItemDto item = builder.BuildOnClose(DateTimeOffset.Now, popupOptions.LaterRequested, popupOptions.DoNotShowAgainChecked);
                builder.MarkFinalized();
                try
                {
                    popupOptions.EnqueueResult?.Invoke(item);
                }
                catch (Exception exception)
                {
                    Debug.WriteLine($"팝업 결과 큐 적재 실패(닫힌 뒤) (PopupId: {item.PopupId}, Type: {item.ResultType}): {exception.Message}");
                    popupOptions.RetainResultForExit?.Invoke(item);
                }
            };
            popupWindow.Closed += (sender, eventArgs) => popupOptions.FlushResultsInBackground?.Invoke();
        }

        /*
         * POL-06-02 : 선택·제출
         * POL-06-03 : 표현·수명
         * POL-02-02 : 종료 제어
         * 설문·퀴즈 제출: WPF가 이미 판정한 결과를 로컬 큐에 저장한 뒤 창을 닫는다.
         *  1. 합격이 필요한 QUIZ(조회 requiresPassing=true, 필드가 없으면 기존 passingScore 판정상 커트라인형·만점형, PU001 §7)가
         *     미통과(passed=false)면 유형별 실패 안내(QuizResultNotice: 커트라인형 기준·정답 N/M개, 만점형 전부 정답 요구)를
         *     보여 주고 **창을 유지**한다. 결과는 만들지도 저장하지도 않는다. "다시 풀기" 후 통과할 때까지 반복한다.
         *     안내에 틀린 문항 번호를 함께 보여 준다(결과 계약 score·passed는 그대로).
         *     QUIZ의 푸터 버튼은 '제출'이라 닫기 버튼이 없다. Background Overlay가 꺼져 있으면 미달 1회 뒤 보조 '닫기'가 보이고,
         *     켜져 있으면 통과해야 닫힌다(Alt+F4도 막힘). 제출 없이 나가면 CLOSED 항목만 전송되어 다음 조회 때 다시 노출된다.
         *  2. 통과, 참여형(채점 합불 무관) 또는 SURVEY면 결과 항목(answers + score/passed) 생성 → EnqueueResult(메모리 결과 큐 적재).
         *     참여형 기준 미달은 실제 score와 passed=false 그대로 적재한다. 이 시점부터 결과는 유실되지 않는다.
         *  3. QUIZ 유형별 완료 안내(서버 응답 없음, PU001 Q3): 커트라인형 "통과하여 … 종료" + N/M개, 만점형 "모두 맞추셨습니다",
         *     참여형(requiresPassing=false, 또는 필드 없이 passingScore 0) "완료하여 … 종료" + N/M개(기준 미달 포함). 확인을 누르면 닫힌다. SURVEY는 "설문조사가 완료되었습니다." 안내 후 확인을 누르면 닫힌다.
         *  4. 창 닫기 → 백그라운드 전송(FlushResultsInBackground)
         * EnqueueResult가 없으면(훅 미연결) 저장 없이 닫는다.
         */
        /// <summary>SURVEY 제출 완료 안내 문구(관리자 웹 미리보기 SURVEY_COMPLETED_MESSAGE와 같음).</summary>
        internal const string SurveyCompletedMessage = "설문조사가 완료되었습니다.";

        private static void SubmitSurveyResult(
            PopupWindow popupWindow, PopupOptions popupOptions, PopupResultBuilder builder, SurveySubmission submission)
        {
            bool isQuiz = string.Equals(popupOptions.PopupType, "QUIZ", StringComparison.OrdinalIgnoreCase);

            // 합격이 필요한 퀴즈(requiresPassing ?? 기존 판정 != 참여형)에서 미통과일 때만 막는다. 참여형 미달은 아래로 내려가 제출한다.
            if (isQuiz && submission.Passed == false && QuizResultNotice.RequiresPassing(submission))
            {
                popupWindow.NotifyQuizFailed();
                QuizResultNotice.Notice failed = QuizResultNotice.Build(submission, popupOptions.Title, popupWindow.HasAuxClose);
                PopupAlert.Show(popupWindow, failed.Message, failed.Title, failed.ButtonText, showHeading: false);
                return;   // 창 유지, 제출 없음
            }

            WpfResultItemDto item = builder.BuildSubmitted(submission, DateTimeOffset.Now);
            popupOptions.EnqueueResult?.Invoke(item);
            builder.MarkFinalized();

            if (isQuiz && submission.Score is double)
            {
                QuizResultNotice.Notice done = QuizResultNotice.Build(submission, popupOptions.Title, auxCloseVisible: false);
                PopupAlert.Show(popupWindow, done.Message, done.Title, done.ButtonText, showHeading: false);
            }
            else if (!isQuiz)
            {
                // POL-06-02 : 선택·제출 — SURVEY 제출 완료 안내(퀴즈 결과 창과 같은 형식: 제목 없이 본문·확인). 결과는 이미 큐에 적재됨.
                PopupAlert.Show(popupWindow, SurveyCompletedMessage, "설문조사 완료", "확인", showHeading: false);
            }

            popupWindow.CloseByApp();   // 앱이 시작한 닫기(외부 닫기 제한 대상 아님). Closed 핸들러가 백그라운드 전송을 시작한다
        }

        /*
         * Overlay(배경)를 클릭하면 Overlay는 활성화되지 않지만, 안전하게 열려 있는 팝업을 모두
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
        /// POL-12-01 : 종결과 보관 — 닫힘 항목을 창이 닫히기 전에 메모리 결과 큐에 넣는다. 성공하면 true.
        /// 적재에서 예외가 나면(메모리 전용이라 디스크 오류는 없음) 안내 후 false를 돌려 호출자가 닫기를 취소하게 한다.
        /// 항목은 큐에 남기지 않으며 창이 상태를 유지하다 다음 닫기 때 결과를 다시 만들어 넣는다.
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
                Debug.WriteLine($"팝업 결과 큐 적재 실패 (PopupId: {item.PopupId}, Type: {item.ResultType}): {exception.Message}");
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
