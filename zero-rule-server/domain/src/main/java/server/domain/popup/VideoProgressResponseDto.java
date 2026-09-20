package server.domain.popup;

import java.time.OffsetDateTime;

/** 서버가 계산하고 저장한 영상 시청 진행률이다. */
public record VideoProgressResponseDto(
        String userId,
        String popupId,
        double watchedRatio,
        double requiredRatio,
        boolean completed,
        OffsetDateTime completedAt
) {
}
