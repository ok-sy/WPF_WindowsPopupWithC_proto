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
     */

    /// <summary>결과 항목 유형. 서버 enum WpfResultType과 문자열이 같아야 한다.</summary>
    public static class WpfResultType
    {
        public const string Closed = "CLOSED";
        public const string Hidden = "HIDDEN";
        public const string Submitted = "SUBMITTED";
        public const string VideoWatched = "VIDEO_WATCHED";
    }

    /// <summary>결과 일괄 전송 요청 본문.</summary>
    public class WpfResultRequestDto
    {
        /// <summary>요청 단위 식별(로그용). 전송 시마다 새로 만든다.</summary>
        public string ClientRequestId { get; set; } = Guid.NewGuid().ToString("N");

        /// <summary>WPF 전송 시각. 재전송이라도 항목의 시각은 바뀌지 않는다.</summary>
        public DateTimeOffset SentAt { get; set; } = DateTimeOffset.Now;

        public List<WpfResultItemDto> Results { get; set; } = new();
    }

    /// <summary>결과 항목 1건. 팝업 창 하나가 닫힐 때 하나 만들어진다.</summary>
    public class WpfResultItemDto
    {
        /// <summary>항목 멱등 키. 창이 열릴 때 확정되어 재전송 시에도 같다.</summary>
        public string ResultId { get; set; } = Guid.NewGuid().ToString();

        public string PopupId { get; set; } = string.Empty;

        /// <summary><see cref="WpfResultType"/> 상수 중 하나.</summary>
        public string ResultType { get; set; } = WpfResultType.Closed;

        /// <summary>팝업이 처음 화면에 표시된 시각. 있으면 서버가 표시 횟수를 +1 한다.</summary>
        public DateTimeOffset? DisplayedAt { get; set; }

        /// <summary>팝업이 닫힌 시각. 없으면 서버 수신 시각.</summary>
        public DateTimeOffset? ClosedAt { get; set; }

        /// <summary>HIDDEN일 때 숨김 일수(1~3650).</summary>
        public int? HideDays { get; set; }

        /// <summary>SUBMITTED일 때 응답 시작 시각(선택).</summary>
        public DateTimeOffset? ResponseStartedAt { get; set; }

        /// <summary>SUBMITTED일 때 답안. 기존 제출 API의 answers와 같은 구조.</summary>
        public List<PopupSubmitAnswerRequestDto>? Answers { get; set; }

        /// <summary>
        /// [설계 12 §4·§6] QUIZ SUBMITTED일 때 WPF가 로컬 채점한 점수·통과 여부. SURVEY는 null.
        /// 서버는 이 값을 결과 저장에 참고하며(자기 채점값과 다르면 로그), 사용자 화면 판정은 이미 WPF에서 끝났다.
        /// </summary>
        public double? Score { get; set; }
        public bool? Passed { get; set; }

        /// <summary>VIDEO_WATCHED일 때 시청 누적값(초).</summary>
        public WpfVideoProgressDto? Video { get; set; }
    }

    /// <summary>영상 시청 누적값. 기존 VideoProgressRequestDto에서 userId를 뺀 형태.</summary>
    public class WpfVideoProgressDto
    {
        public decimal DurationSeconds { get; set; }
        public decimal PositionSeconds { get; set; }
        public decimal MaximumPositionSeconds { get; set; }
        public decimal WatchedSeconds { get; set; }
    }

    /// <summary>결과 일괄 전송 응답.</summary>
    public class WpfResultResponseDto
    {
        public DateTimeOffset? ReceivedAt { get; set; }
        public List<WpfResultItemResponseDto> Results { get; set; } = new();
    }

    /// <summary>
    /// 항목별 처리 결과. HTTP 200이어도 <see cref="Status"/>를 봐야 한다.
    /// ACCEPTED·DUPLICATE·REJECTED 모두 "처리 종결"이므로 큐에서 제거한다(재전송해도 결과가 같다).
    /// </summary>
    public class WpfResultItemResponseDto
    {
        public string ResultId { get; set; } = string.Empty;
        public string PopupId { get; set; } = string.Empty;
        public string ResultType { get; set; } = string.Empty;

        /// <summary>ACCEPTED / DUPLICATE / REJECTED</summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>REJECTED 사유 코드(WPF_NOT_ELIGIBLE, WPF_INVALID_ANSWER, ...).</summary>
        public string? Code { get; set; }
        public string? Message { get; set; }

        public string? PopupStatus { get; set; }
        public bool? Completed { get; set; }
        public DateTimeOffset? CompletedAt { get; set; }
        public DateTimeOffset? HiddenUntil { get; set; }
        public long? ResponseId { get; set; }

        /// <summary>QUIZ 제출에만 제공. SURVEY는 채점하지 않아 null.</summary>
        public double? TotalScore { get; set; }
        public bool? Passed { get; set; }

        public double? WatchedRatio { get; set; }
        public double? RequiredRatio { get; set; }

        public bool IsAccepted => string.Equals(Status, "ACCEPTED", StringComparison.OrdinalIgnoreCase);
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
