using System;
using System.Collections.Generic;

namespace Popup.Dtos
{
    /*
     * POST /p/api/wpf/popups/results 요청·응답 DTO 모음이다.
     *
     * [추가 이유 — 기준 3·4] 기존 숨김(hide)·제출(responses)·영상 진행률(video-progress)·표시/닫기 이벤트(events)
     * 4개 API 호출을 "결과 항목" 하나로 합쳐 팝업이 닫힐 때 1회만 보낸다. 요청에는 userId가 없다(서버가 인증 정보로 식별, 기준 6).
     * 항목마다 resultId(GUID)가 멱등 키이며, 서버는 같은 resultId를 다시 받으면 DUPLICATE로 응답하고 재처리하지 않는다.
     *
     * [설계 18 L-0 — C-4] WPF Client API 계약 v3.0이 WPF API를 3개(로그인·목록·결과)로 통일하면서 구 동작별 API DTO를
     * 모아 두던 PopupInteractionDtos.cs(제출·영상 진행률·이벤트·상태 조회 요청/응답 7개 클래스)를 삭제했다.
     * 그중 결과 항목 answers에 계속 쓰이는 PopupSubmitAnswerRequestDto만 이 파일로 옮겼다.
     */

    /// <summary>
    /// 설문·퀴즈 문항 하나에 제출할 답안이다. <see cref="WpfResultItemDto.Answers"/>의 항목 형식.
    /// [설계 18 L-0 — C-4] 삭제된 PopupInteractionDtos.cs에서 이동(이름·필드 변경 없음, JSON 계약 그대로).
    /// </summary>
    public class PopupSubmitAnswerRequestDto
    {
        public long QuestionId { get; set; }
        public string? TextAnswer { get; set; }
        public List<long> OptionIds { get; set; } = new();
    }

    /// <summary>결과 항목 유형. 서버 enum WpfResultType과 문자열이 같아야 한다.</summary>
    public static class WpfResultType
    {
        public const string Closed = "CLOSED";
        public const string Hidden = "HIDDEN";
        public const string Submitted = "SUBMITTED";
        public const string VideoWatched = "VIDEO_WATCHED";
    }

    /* [설계 35] 일괄 전송 envelope(WpfResultRequestDto: clientRequestId·sentAt·results[])는 단건 순차 전송으로 바꾸며 삭제했다.
       결과 항목 1건(WpfResultItemDto)이 곧 POST /p/api/wpf/popups/results 요청 본문이다. */

    /// <summary>결과 1건 = 결과 수신 요청 본문. 팝업 창 하나가 닫힐 때 하나 만들어진다.</summary>
    public class WpfResultItemDto
    {
        /// <summary>항목 멱등 키. 창이 열릴 때 확정되어 재전송 시에도 같다.</summary>
        public string ResultId { get; set; } = Guid.NewGuid().ToString();

        /// <summary>[설계 35] 조회 응답 popup.deliveryId. 서버가 전달 건 소유·팝업 일치를 검증하고 결과 저장 시 종료한다.</summary>
        public string DeliveryId { get; set; } = string.Empty;

        public string PopupId { get; set; } = string.Empty;

        /// <summary><see cref="WpfResultType"/> 상수 중 하나.</summary>
        public string ResultType { get; set; } = WpfResultType.Closed;

        /// <summary>팝업이 처음 화면에 표시된 시각. 있으면 서버가 표시 횟수를 +1 한다.</summary>
        public DateTimeOffset? DisplayedAt { get; set; }

        /// <summary>팝업이 닫힌 시각. 없으면 서버 수신 시각.</summary>
        public DateTimeOffset? ClosedAt { get; set; }

        /// <summary>HIDDEN일 때 숨김 일수(1~3650).</summary>
        public int? HideDays { get; set; }

        /* [설계 32] 응답 시작 시각(ResponseStartedAt)은 DisplayedAt을 그대로 복사하던 중복 값이라 삭제했다.
           응답·처리 소요 시간은 ClosedAt - DisplayedAt으로 계산한다. */

        /// <summary>SUBMITTED일 때 답안(문항별 questionId·optionIds·textAnswer).</summary>
        public List<PopupSubmitAnswerRequestDto>? Answers { get; set; }

        /// <summary>
        /// [설계 12 §4·§6 / 설계 33] QUIZ SUBMITTED일 때 WPF가 로컬 채점한 점수·통과 여부(QUIZ 필수). SURVEY는 null.
        /// 서버는 이 값을 그대로 저장·완료 판정에 쓰고(자기 계산값과 다르면 로그), 응답으로 다시 내려주지 않는다.
        /// </summary>
        public double? Score { get; set; }
        public bool? Passed { get; set; }

        /// <summary>VIDEO_WATCHED일 때 시청 누적값(초).</summary>
        public WpfVideoProgressDto? Video { get; set; }
    }

    /// <summary>영상 시청 누적값(초). 사용자 ID는 담지 않는다(서버가 인증 정보로 식별).</summary>
    public class WpfVideoProgressDto
    {
        public decimal DurationSeconds { get; set; }
        public decimal PositionSeconds { get; set; }
        public decimal MaximumPositionSeconds { get; set; }
        public decimal WatchedSeconds { get; set; }
    }

    /// <summary>
    /// [설계 35] 결과 1건 처리 응답. HTTP 200이어도 <see cref="Status"/>를 봐야 한다.
    /// ACCEPTED·DUPLICATE·REJECTED는 "처리 종결"이므로 큐에서 제거하고, RETRYABLE_ERROR·INTERNAL_ERROR는 보관·재전송한다(설계 34).
    /// 저장 성공(ACCEPTED·DUPLICATE)이면 <see cref="NextStatus"/>가 후속 후보 유무(AVAILABLE/EMPTY)를 알린다.
    /// 이전 일괄 응답(results[])과 항목 응답의 popupId·resultType은 삭제했다.
    /// </summary>
    public class WpfResultResponseDto
    {
        public string ResultId { get; set; } = string.Empty;

        /// <summary>ACCEPTED / DUPLICATE / REJECTED / RETRYABLE_ERROR / INTERNAL_ERROR</summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>REJECTED 사유 코드(WPF_NOT_ELIGIBLE, WPF_INVALID_ANSWER, ...).</summary>
        public string? Code { get; set; }
        public string? Message { get; set; }

        /// <summary>[설계 35] AVAILABLE(즉시 다음 조회) / EMPTY(폴링 간격 대기). 저장 실패·후보 확인 실패면 null.</summary>
        public string? NextStatus { get; set; }

        /// <summary>서버가 결과를 저장했는지(ACCEPTED·DUPLICATE).</summary>
        public bool IsSaved => string.Equals(Status, "ACCEPTED", StringComparison.OrdinalIgnoreCase)
            || string.Equals(Status, "DUPLICATE", StringComparison.OrdinalIgnoreCase);

        /* [설계 34-03] PopupStatus·Completed·CompletedAt·ResponseId는 WPF가 쓰지 않아 삭제했다(완료 여부는 다음 조회에 반영). */

        /* [설계 33] TotalScore/Passed는 삭제했다. QUIZ 판정은 WPF가 끝내 요청(Score/Passed)으로 보내고 서버는 저장만 한다.
           [설계 34-05] HiddenUntil·WatchedRatio·RequiredRatio도 삭제했다. 숨김 만료·시청 비율은 서버가 내부에서 저장·계산한다. */

        /* [설계 18 L-0 — C-10 삭제] 호출부가 없던 IsAccepted는 삭제했다. 큐는 REJECTED만 구분해 로그를 남긴다. */
        public bool IsRejected => string.Equals(Status, "REJECTED", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>WPF API 오류 본문 {code, message, timestamp}.</summary>
    public class WpfErrorResponseDto
    {
        public string Code { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTimeOffset? Timestamp { get; set; }
    }
}
