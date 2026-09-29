package server.service.core.popup;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import server.domain.popup.PopupEntity;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 팝업 유형별 content JSON(Map)을 DB 컬럼에서 조립한다.
 *
 * <p>[역할] POPUP_CONTENT의 정규 컬럼(제목·설명·본문·미디어URL·링크URL)과 확장 옵션 JSON(CONTENT_OPTIONS)을
 * 합쳐 WPF·관리자 웹이 소비하는 {@code content} 객체를 만든다.</p>
 *
 * <p>[추가 이유 — 기준 5] PostgreSQL 매퍼는 SQL 안에서 JSONB_BUILD_OBJECT로 조립했다. Oracle은 JSON 함수 지원 범위가
 * 버전별로 달라 Java에서 조립한다.</p>
 *
 * <p>[조립 규칙 — 설계 18 L-3]</p>
 * <pre>
 *   1) CONTENT_OPTIONS의 키를 먼저 넣는다. 단, 정규 컬럼 사본과 서버 파생 키({@link #STORED_COPY_KEYS})는 버린다.
 *   2) 유형별 정규 컬럼 값을 넣는다 — 컬럼이 기준 값이며 옵션 JSON의 같은 키를 덮어쓴다.
 *      TEXT   : contentTitle, description, plainText(=CONTENT_BODY)
 *      IMAGE  : imageTitle, imageUrl(=MEDIA_URL), description, linkUrl
 *      VIDEO  : videoTitle, videoUrl(=MEDIA_URL), description
 *      SURVEY / QUIZ : surveyTitle, description
 * </pre>
 * 예전에는 옵션 JSON이 마지막에 병합되어, 저장 때 함께 들어간 오래된 사본이 컬럼 값을 가렸다.
 * 완료 비율·닫기 허용·통과 점수는 응답 최상위 필드로만 제공하고 content에 중복하지 않는다.
 * 문항은 응답 최상위 {@code questions}로만 제공한다. null 값도 키로 포함한다(응답 직렬화 시 NON_NULL로 생략).
 * 스프링 빈이 아니라 PopupService가 자신의 ObjectMapper로 직접 생성한다(기존 생성자 시그니처와 테스트 유지).
 */
public class PopupContentAssembler {

    /**
     * [설계 18 L-3] CONTENT_OPTIONS에 두지 않는 키. 정규 컬럼에 저장되는 값과, 다른 컬럼·테이블에서 파생되어
     * 예전 응답 content에 중복으로 실리던 값이다. 저장 시 제거하고({@link #withoutStoredCopies}), 조회 시에도 무시한다.
     */
    static final List<String> STORED_COPY_KEYS = List.of(
            // 정규 컬럼(POPUP_CONTENT)
            "contentTitle", "imageTitle", "videoTitle", "surveyTitle",
            "description", "plainText", "imageUrl", "videoUrl", "linkUrl",
            // 서버 파생 값(POPUP_NOTICE 컬럼·문항 테이블)
            "completionRatio", "allowCloseBeforeCompletion", "passingScore",
            "validateRequiredQuestions", "questions");

    private final ObjectMapper objectMapper;

    public PopupContentAssembler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * 엔티티의 콘텐츠 컬럼으로 content Map을 만든다. 결과는 순서가 보존되는 가변 Map이다.
     *
     * @throws IllegalStateException CONTENT_OPTIONS가 JSON 객체로 해석되지 않을 때. 손상 데이터를 빈 값으로
     *                               숨기지 않고 팝업 ID와 함께 실패시켜 추적 가능하게 한다 (원본 parseContentJson 정책).
     */
    public Map<String, Object> assemble(PopupEntity popup) {
        Map<String, Object> content = withoutStoredCopies(
                parseOptions(popup.popupId(), popup.contentOptionsJson()));
        String type = popup.popupType() == null ? "" : popup.popupType().toUpperCase();
        switch (type) {
            case "TEXT" -> {
                content.put("contentTitle", popup.contentTitle());
                content.put("description", popup.description());
                content.put("plainText", popup.contentBody());
            }
            case "IMAGE" -> {
                content.put("imageTitle", popup.contentTitle());
                content.put("imageUrl", popup.mediaUrl());
                content.put("description", popup.description());
                content.put("linkUrl", popup.linkUrl());
            }
            case "VIDEO" -> {
                content.put("videoTitle", popup.contentTitle());
                content.put("videoUrl", popup.mediaUrl());
                content.put("description", popup.description());
            }
            case "SURVEY", "QUIZ" -> {
                content.put("surveyTitle", popup.contentTitle());
                content.put("description", popup.description());
                if ("QUIZ".equals(type) && Boolean.TRUE.equals(content.get("videoEnabled"))) {
                    content.put("videoUrl", popup.mediaUrl());
                    content.put("videoTitle", popup.contentTitle());
                }
            }
            default -> { /* 알 수 없는 유형은 확장 옵션만 전달 */ }
        }
        return content;
    }

    /** CONTENT_OPTIONS에 저장하거나 조회 결과에 합칠 확장 옵션만 남긴 새 Map을 만든다. */
    static Map<String, Object> withoutStoredCopies(Map<String, Object> content) {
        Map<String, Object> options = new LinkedHashMap<>(content == null ? Map.of() : content);
        STORED_COPY_KEYS.forEach(options::remove);
        return options;
    }

    private Map<String, Object> parseOptions(String popupId, String json) {
        if (json == null || json.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() { });
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "팝업 CONTENT_OPTIONS JSON 변환에 실패했습니다. popupId=" + popupId, exception);
        }
    }
}
