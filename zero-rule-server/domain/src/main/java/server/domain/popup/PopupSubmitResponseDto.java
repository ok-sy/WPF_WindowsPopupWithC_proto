package server.domain.popup;

import java.time.OffsetDateTime;

/** 설문 저장 및 서버 채점 결과다. */
public record PopupSubmitResponseDto(
        Long responseId,
        String clientRequestId,
        String userId,
        String popupId,
        String responseStatus,
        double totalScore,
        boolean passed,
        OffsetDateTime submittedAt
) {
}
