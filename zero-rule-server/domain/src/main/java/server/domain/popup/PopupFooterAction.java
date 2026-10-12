package server.domain.popup;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * [설계 30] 공통 Footer 버튼 동작. PopupWindow 공통 영역의 동작이므로 WPF 응답에서는 {@code popups[]} 최상위
 * {@code footerAction}/{@code footerLinkUrl}로 내려준다. 관리자 API·DB는 기존처럼 content(CONTENT_OPTIONS)에 둔다.
 *
 * <ul>
 *   <li>{@link #CLOSE}: 버튼 '닫기'. 팝업 종료 처리 후 창을 닫는다. TEXT/IMAGE/VIDEO 기본값</li>
 *   <li>{@link #LINK_AND_CLOSE}: 버튼 '바로가기'. footerLinkUrl(절대 http/https)을 연 뒤 창을 닫는다. TEXT/IMAGE/VIDEO</li>
 *   <li>{@link #SUBMIT}: 버튼 '제출'. 응답 검증·채점 후 결과를 보내고 닫는다. SURVEY/QUIZ(동영상+퀴즈 포함) 고정</li>
 * </ul>
 *
 * <p>저장 정규형: SURVEY/QUIZ는 동작이 SUBMIT으로 고정이라 두 키를 저장하지 않는다. 그 밖의 유형은 LINK_AND_CLOSE일 때만
 * footerAction·footerLinkUrl을 저장하고 CLOSE(기본값)는 저장하지 않는다.</p>
 */
public final class PopupFooterAction {
    public static final String CLOSE = "CLOSE";
    public static final String LINK_AND_CLOSE = "LINK_AND_CLOSE";
    public static final String SUBMIT = "SUBMIT";
    public static final String ACTION_KEY = "footerAction";
    public static final String LINK_KEY = "footerLinkUrl";

    private static final Set<String> VALUES = Set.of(CLOSE, LINK_AND_CLOSE, SUBMIT);

    private PopupFooterAction() {
    }

    public static boolean isSubmitType(String popupType) {
        String type = popupType == null ? "" : popupType.trim().toUpperCase(Locale.ROOT);
        return "SURVEY".equals(type) || "QUIZ".equals(type);
    }

    /** 허용 값(CLOSE / LINK_AND_CLOSE / SUBMIT)인지. null은 생략으로 보고 허용한다. */
    public static boolean isKnown(Object action) {
        return action == null || (action instanceof String value && VALUES.contains(value));
    }

    /** 유형별 실제 동작. SURVEY/QUIZ는 SUBMIT, 그 밖에는 LINK_AND_CLOSE가 아니면 CLOSE. */
    public static String effective(String popupType, Object action) {
        if (isSubmitType(popupType)) return SUBMIT;
        return LINK_AND_CLOSE.equals(action) ? LINK_AND_CLOSE : CLOSE;
    }

    /** LINK_AND_CLOSE일 때만 링크를 돌려준다. 그 밖에는 null(응답에서 생략). */
    public static String effectiveLink(String popupType, Map<String, Object> content) {
        if (content == null || !LINK_AND_CLOSE.equals(effective(popupType, content.get(ACTION_KEY)))) return null;
        Object link = content.get(LINK_KEY);
        return link == null ? null : String.valueOf(link).trim();
    }

    /** content Map에 저장 정규형을 적용한다(원본 Map을 직접 바꾼다). */
    public static void normalizeStored(String popupType, Map<String, Object> content) {
        if (content == null) return;
        String link = effectiveLink(popupType, content);
        content.remove(ACTION_KEY);
        content.remove(LINK_KEY);
        if (link != null) {
            content.put(ACTION_KEY, LINK_AND_CLOSE);
            content.put(LINK_KEY, link);
        }
    }
}
