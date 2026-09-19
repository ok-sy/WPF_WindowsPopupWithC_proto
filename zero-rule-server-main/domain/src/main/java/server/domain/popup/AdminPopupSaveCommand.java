package server.domain.popup;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

/**
 * 관리자 저장 요청을 popup_notice와 popup_content 컬럼에 맞게 정리한 내부 모델이다.
 * 웹 요청 DTO를 DB 계층에 직접 전달하지 않도록 서비스에서 이 형태로 변환한다.
 */
public record AdminPopupSaveCommand(
        String popupId,
        Long questionTemplateId,
        String popupType,
        String title,
        OffsetDateTime displayStartAt,
        OffsetDateTime displayEndAt,
        String displayMode,
        int displayOrder,
        String periodMode,
        Integer repeatInterval,
        String repeatDayOfWeek,
        Integer repeatDayOfMonth,
        String activeYn,
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
        String showDoNotShowAgainYn,
        Integer hideDays,
        BigDecimal completionRatio,
        BigDecimal passingScore,
        String allowCloseBeforeCompleteYn,
        String contentTitle,
        String description,
        String contentBody,
        String mediaUrl,
        String linkUrl,
        String contentOptionsJson,
        String auditUser
) {
}
