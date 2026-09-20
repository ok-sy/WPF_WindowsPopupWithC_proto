package server.domain.popup;

import java.time.OffsetDateTime;

/** 사용자별 팝업 표시·숨김·완료 상태 조회 결과다. */
public record UserPopupStatusDto(
        String userId,
        String popupId,
        String popupStatus,
        OffsetDateTime firstDisplayedAt,
        OffsetDateTime lastDisplayedAt,
        int displayCount,
        OffsetDateTime closedAt,
        OffsetDateTime hiddenUntilAt,
        boolean completed,
        OffsetDateTime completedAt
) {
}
