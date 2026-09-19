package server.domain.popup;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/** popup.popup_notice와 popup.popup_content를 조합한 내부 조회 모델이다. */
public record PopupEntity(
        String popupId,
        String popupType,
        String title,
        OffsetDateTime displayStartAt,
        OffsetDateTime displayEndAt,
        String displayMode,
        String sizeMode,
        BigDecimal popupWidth,
        BigDecimal popupHeight,
        BigDecimal widthRatio,
        BigDecimal heightRatio,
        BigDecimal minimumWidth,
        BigDecimal minimumHeight,
        BigDecimal maximumWidth,
        BigDecimal maximumHeight,
        String showHeaderYn,
        String showCloseButtonYn,
        String showFooterYn,
        String showDontShowYn,
        String contentJson,
        int displayOrder,
        String useYn,
        Long questionTemplateId,
        String periodMode,
        Integer repeatInterval,
        String repeatDayOfWeek,
        Integer repeatDayOfMonth,
        Integer hideDays,
        BigDecimal completionRatio,
        BigDecimal passingScore,
        String allowCloseBeforeCompleteYn
) {
}
