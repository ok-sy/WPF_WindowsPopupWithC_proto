using System;
using System.Collections.Generic;

namespace Popup.Dtos
{
    /// <summary>설문 문항 하나에 제출할 답안이다.</summary>
    public class PopupSubmitAnswerRequestDto
    {
        public long QuestionId { get; set; }
        public string? TextAnswer { get; set; }
        public List<long> OptionIds { get; set; } = new();
    }

    /// <summary>설문 제출 API의 요청 본문이다.</summary>
    public class PopupSubmitRequestDto
    {
        public string ClientRequestId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public DateTimeOffset? ResponseStartedAt { get; set; }
        public List<PopupSubmitAnswerRequestDto> Answers { get; set; } = new();
    }

    /// <summary>서버 저장과 채점이 끝난 설문 제출 결과다.</summary>
    public class PopupSubmitResponseDto
    {
        public long ResponseId { get; set; }
        public string ClientRequestId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string PopupId { get; set; } = string.Empty;
        public string ResponseStatus { get; set; } = string.Empty;
        public double TotalScore { get; set; }
        public bool Passed { get; set; }
        public DateTimeOffset SubmittedAt { get; set; }
    }

    /// <summary>영상 플레이어의 현재 재생 및 누적 시청 상태다.</summary>
    public class VideoProgressRequestDto
    {
        public string UserId { get; set; } = string.Empty;
        public decimal DurationSeconds { get; set; }
        public decimal PositionSeconds { get; set; }
        public decimal MaximumPositionSeconds { get; set; }
        public decimal WatchedSeconds { get; set; }
    }

    /// <summary>서버가 계산한 영상 완료율과 완료 여부다.</summary>
    public class VideoProgressResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string PopupId { get; set; } = string.Empty;
        public double WatchedRatio { get; set; }
        public double RequiredRatio { get; set; }
        public bool Completed { get; set; }
        public DateTimeOffset? CompletedAt { get; set; }
    }

    /// <summary>팝업 표시 또는 닫기 이벤트 요청이다.</summary>
    public class PopupEventRequestDto
    {
        public string UserId { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
    }

    /// <summary>팝업 표시 또는 닫기 이벤트 저장 결과다.</summary>
    public class PopupEventResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string PopupId { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public DateTimeOffset RecordedAt { get; set; }
    }

    /// <summary>서버에 저장된 사용자별 팝업 생명주기 상태다.</summary>
    public class UserPopupStatusDto
    {
        public string UserId { get; set; } = string.Empty;
        public string PopupId { get; set; } = string.Empty;
        public string PopupStatus { get; set; } = string.Empty;
        public DateTimeOffset? FirstDisplayedAt { get; set; }
        public DateTimeOffset? LastDisplayedAt { get; set; }
        public int DisplayCount { get; set; }
        public DateTimeOffset? ClosedAt { get; set; }
        public DateTimeOffset? HiddenUntilAt { get; set; }
        public bool Completed { get; set; }
        public DateTimeOffset? CompletedAt { get; set; }
    }
}
