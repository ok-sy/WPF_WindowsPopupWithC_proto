package server.domain.popup;

import java.math.BigDecimal;

/**
 * POL-06-02 : 선택·제출
 * ■ 설문·퀴즈 제출 검증 컨텍스트
 * - in : popupId·popupType(String) · questionTemplateId(Long) · passingScore(BigDecimal)
 * - out: 제출 검증·채점용 팝업 설정(record)
 * - 설문 제출 검증과 채점에 필요한 팝업 설정이다.
 */
public record PopupSubmissionContext(
        String popupId,
        String popupType,
        Long questionTemplateId,
        BigDecimal passingScore
) {
}
