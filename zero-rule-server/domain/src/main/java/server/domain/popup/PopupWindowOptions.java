package server.domain.popup;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * POL-01-01 : 공통 옵션의 위치
 * POL-01-02 : 기본값의 적용
 * ■ PopupWindow 공통 UI 옵션 읽기
 * - in : content(Map) 콘텐츠 옵션 · key(String) 폰트 크기 키
 * - out: Overlay 사용 여부·불투명도·위치·폰트 크기(기본값·보정 적용)
 * - PopupWindow 전체에 적용되는 공통 UI 옵션. 관리자 API·DB는 기존처럼 content(CONTENT_OPTIONS)에 저장하고,
 * WPF 응답에서는 {@code popup} 최상위 필드로 승격한다(content에서는 제거).
 *
 * <ul>
 *   <li>useBackgroundOverlay: 배경 Overlay 사용. 기본 true</li>
 *   <li>backgroundOverlayOpacity: Overlay 불투명도 0~1. 기본 0.45. 저장 시 범위 밖이면 거부하고, 응답 시 0~1로 보정</li>
 *   <li>popupPosition: 9개 위치. 없거나 미지원 값이면 CENTER</li>
 *   <li>headerFontSize / bodyFontSize / footerFontSize: 10~40(저장 검증). 없으면 null(XAML 기본 크기)</li>
 * </ul>
 */
public final class PopupWindowOptions {
    public static final String USE_OVERLAY_KEY = "useBackgroundOverlay";
    public static final String OVERLAY_OPACITY_KEY = "backgroundOverlayOpacity";
    public static final String POSITION_KEY = "popupPosition";
    public static final String HEADER_FONT_SIZE_KEY = "headerFontSize";
    public static final String BODY_FONT_SIZE_KEY = "bodyFontSize";
    public static final String FOOTER_FONT_SIZE_KEY = "footerFontSize";
    public static final List<String> KEYS = List.of(USE_OVERLAY_KEY, OVERLAY_OPACITY_KEY, POSITION_KEY,
            HEADER_FONT_SIZE_KEY, BODY_FONT_SIZE_KEY, FOOTER_FONT_SIZE_KEY);

    public static final boolean DEFAULT_USE_OVERLAY = true;
    public static final double DEFAULT_OVERLAY_OPACITY = 0.45;
    public static final String DEFAULT_POSITION = "CENTER";
    public static final Set<String> POSITIONS = Set.of("CENTER", "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT",
            "CENTER_LEFT", "CENTER_RIGHT", "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT");

    private PopupWindowOptions() {
    }

    /** Overlay 사용 여부. Boolean 값이 아니거나 없으면 기본 true. */
    public static boolean useBackgroundOverlay(Map<String, Object> content) {
        return content != null && content.get(USE_OVERLAY_KEY) instanceof Boolean value ? value : DEFAULT_USE_OVERLAY;
    }

    /** Overlay 불투명도. 숫자가 아니면 기본 0.45, 범위 밖이면 0~1로 보정한다. */
    public static double backgroundOverlayOpacity(Map<String, Object> content) {
        Double value = number(content == null ? null : content.get(OVERLAY_OPACITY_KEY));
        return value == null ? DEFAULT_OVERLAY_OPACITY : Math.max(0.0, Math.min(1.0, value));
    }

    /** 팝업 위치(대문자 정규화). 없거나 미지원 값이면 CENTER. */
    public static String popupPosition(Map<String, Object> content) {
        Object value = content == null ? null : content.get(POSITION_KEY);
        String position = value instanceof String text ? text.trim().toUpperCase(Locale.ROOT) : "";
        return POSITIONS.contains(position) ? position : DEFAULT_POSITION;
    }

    /** 폰트 크기(숫자 또는 숫자 문자열). 없거나 숫자가 아니면 null. 범위 보정은 WPF가 한다(저장 시 10~40 검증). */
    public static Double fontSize(Map<String, Object> content, String key) {
        return number(content == null ? null : content.get(key));
    }

    private static Double number(Object value) {
        double result;
        if (value instanceof Number number) {
            result = number.doubleValue();
        } else if (value instanceof String text && !text.isBlank()) {
            try {
                result = Double.parseDouble(text.trim());
            } catch (NumberFormatException e) {
                return null;
            }
        } else {
            return null;
        }
        return Double.isFinite(result) ? result : null;
    }
}
