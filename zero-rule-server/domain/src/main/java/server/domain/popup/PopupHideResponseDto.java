package server.domain.popup;

import java.time.OffsetDateTime;

/** WPF에 반환하는 사용자별 팝업 숨김 처리 결과다. */
public record PopupHideResponseDto(
        String userId,
        String popupId,
        String hideType,
        OffsetDateTime hiddenUntil
) {
}
