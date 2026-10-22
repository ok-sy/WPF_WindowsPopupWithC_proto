package server.service.core.popup.sample;



import java.util.Map;

/**
 * [TODO65] 공통 코드 → WPF ENUM 변환.
 *
 * <p><b>아래 코드값은 예시다(확정 코드표 미수령).</b> [교체 지점] 실제 공통 코드표(POPU_CNTN_TP_CD·FTR_BTN_TP_CD)로 바꾼다.
 * 모르는 코드는 기본값으로 바꾸지 않고 {@link PopupSampleException}(UNKNOWN_CODE)으로 처리한다.</p>
 */
public final class PopupCodeTable {

    /** POPU_CNTN_TP_CD 예시 → popupType(TEXT / IMAGE / VIDEO / SURVEY / QUIZ). */
    static final Map<String, String> CONTENT_TYPE = Map.of(
            "10", "TEXT",
            "20", "IMAGE",
            "30", "VIDEO",
            "40", "SURVEY",
            "50", "QUIZ");

    /** FTR_BTN_TP_CD 예시 → footerAction(CLOSE / LINK_AND_CLOSE / SUBMIT). */
    static final Map<String, String> FOOTER_BUTTON = Map.of(
            "01", "CLOSE",
            "02", "LINK_AND_CLOSE",
            "03", "SUBMIT");

    private PopupCodeTable() {
    }

    public static String popupType(String code, String contentId) {
        String type = code == null ? null : CONTENT_TYPE.get(code.trim());
        if (type == null) throw new PopupSampleException(PopupSampleException.Reason.UNKNOWN_CODE, contentId, "알 수 없는 콘텐츠 유형 코드: " + code);
        return type;
    }

    /** null이면 null(호출자가 유형별 기본값 적용). 값이 있는데 모르는 코드면 오류. */
    public static String footerAction(String code, String contentId) {
        if (code == null || code.isBlank()) return null;
        String action = FOOTER_BUTTON.get(code.trim());
        if (action == null) throw new PopupSampleException(PopupSampleException.Reason.UNKNOWN_CODE, contentId, "알 수 없는 푸터 버튼 코드: " + code);
        return action;
    }

    /** Y/N → boolean. null이면 null(기본값 적용), 그 밖의 값은 오류. */
    public static Boolean yn(String value, String column, String contentId) {
        if (value == null || value.isBlank()) return null;
        return switch (value.trim().toUpperCase()) {
            case "Y" -> Boolean.TRUE;
            case "N" -> Boolean.FALSE;
            default -> throw new PopupSampleException(PopupSampleException.Reason.INVALID_COLUMN, contentId, column + "는 Y/N이어야 합니다: " + value);
        };
    }
}
