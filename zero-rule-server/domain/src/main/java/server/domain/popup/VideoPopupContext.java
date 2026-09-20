package server.domain.popup;

import java.math.BigDecimal;

/** 영상 완료 판정에 필요한 팝업 설정이다. */
public record VideoPopupContext(
        String popupId,
        String popupType,
        BigDecimal completionRatio
) {
}
