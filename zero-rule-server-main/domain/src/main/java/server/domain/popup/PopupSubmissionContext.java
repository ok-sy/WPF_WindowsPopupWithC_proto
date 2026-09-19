package server.domain.popup;

import java.math.BigDecimal;

/** 설문 제출 검증과 채점에 필요한 팝업 설정이다. */
public record PopupSubmissionContext(
        String popupId,
        String popupType,
        Long questionTemplateId,
        BigDecimal passingScore
) {
}
