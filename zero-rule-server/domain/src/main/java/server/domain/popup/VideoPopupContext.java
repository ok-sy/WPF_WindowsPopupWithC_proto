package server.domain.popup;

import java.math.BigDecimal;

/**
 * POL-05-02 : 완료·화면 이탈
 * ■ 영상 완료 판정 컨텍스트
 * - in : popupId·popupType(String) · completionRatio(BigDecimal) 완료 기준 비율
 * - out: 영상 완료 판정용 팝업 설정(record)
 * - 영상 완료 판정에 필요한 팝업 설정이다.
 */
public record VideoPopupContext(
        String popupId,
        String popupType,
        BigDecimal completionRatio
) {
}
