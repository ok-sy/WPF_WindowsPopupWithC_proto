package server.domain.popup;

import java.time.OffsetDateTime;

/** 팝업 표시 또는 닫기 이벤트 저장 결과다. */
public record PopupEventResponseDto(
        String userId,
        String popupId,
        String eventType,
        OffsetDateTime recordedAt
) {
}
