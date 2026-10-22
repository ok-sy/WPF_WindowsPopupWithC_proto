package server.service.core.popup;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import server.domain.popup.PopupEntity;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * POL-13-01 : 콘텐츠와 관리 상태
 * POL-03-01 : 저장·표시 경계
 * ■ 팝업 content 조립기
 * - in : PopupEntity(정규 컬럼 + CONTENT_OPTIONS JSON)
 * - out: 유형별 content Map(순서 보존·가변)
 * - 팝업 유형별 content JSON(Map)을 DB 컬럼에서 조립한다.
 *
 * <p>[역할] POPUP_CONTENT의 정규 컬럼(제목·설명·본문·미디어URL)과 확장 옵션 JSON(CONTENT_OPTIONS)을
 * 합쳐 WPF·관리자 웹이 소비하는 {@code content} 객체를 만든다.</p>
 *
 * <p>POL-13-01 : 콘텐츠와 관리 상태 — PostgreSQL 매퍼는 SQL 안에서 JSONB_BUILD_OBJECT로 조립했다. Oracle은 JSON 함수 지원 범위가
 * 버전별로 달라 Java에서 조립한다.</p>
 *
 * <p>[조립 규칙] POL-13-01 : 콘텐츠와 관리 상태</p>
 * <pre>
 *   1) CONTENT_OPTIONS의 키를 먼저 넣는다. 단, 정규 컬럼 사본과 서버 파생 키({@link #STORED_COPY_KEYS})는 버린다.
 *   2) 유형별 정규 컬럼 값을 넣는다 — 컬럼이 기준 값이며 옵션 JSON의 같은 키를 덮어쓴다.
 *      TEXT   : plainText(=CONTENT_BODY). 통합 전 행의 CONTENT_TITLE·DESCRIPTION은 textBlocks 앞 문단으로 합친다.
 *      IMAGE  : imageTitle, imageUrl(=MEDIA_URL), description
 *      VIDEO  : videoTitle, videoUrl(=MEDIA_URL), description
 *      SURVEY / QUIZ : surveyTitle, description
 * </pre>
 * 예전에는 옵션 JSON이 마지막에 병합되어, 저장 때 함께 들어간 오래된 사본이 컬럼 값을 가렸다.
 * 완료 비율·통과 점수는 응답 최상위 필드로만 제공하고 content에 중복하지 않는다.
 * POL-02-02 : 종료 제어 — 폐기된 완료 전 닫기 허용 키(allowCloseBeforeCompletion)는 저장·응답 어디에도 싣지 않는다.
 * 문항은 응답 최상위 {@code questions}로만 제공한다. null 값도 키로 포함한다(응답 직렬화 시 NON_NULL로 생략).
 * 스프링 빈이 아니라 PopupService가 자신의 ObjectMapper로 직접 생성한다(기존 생성자 시그니처와 테스트 유지).
 */
public class PopupContentAssembler {

    /**
     * POL-13-01 : 콘텐츠와 관리 상태
     * CONTENT_OPTIONS에 두지 않는 키. 정규 컬럼에 저장되는 값과, 다른 컬럼·테이블에서 파생되어
     * 예전 응답 content에 중복으로 실리던 값이다. 저장 시 제거하고({@link #withoutStoredCopies}), 조회 시에도 무시한다.
     * 폐기된 키도 여기에 두어 요청에 남아 있어도 저장하지 않고, 예전 행의 사본도 응답에 싣지 않는다.
     */
    static final List<String> STORED_COPY_KEYS = List.of(
            // 정규 컬럼(POPUP_CONTENT)
            "contentTitle", "imageTitle", "videoTitle", "surveyTitle",
            "description", "plainText", "imageUrl", "videoUrl",
            // 서버 파생 값(POPUP_NOTICE 컬럼·문항 테이블)
            "completionRatio", "allowCloseBeforeCompletion", "passingScore",
            "validateRequiredQuestions", "questions",
            // 폐기 키: IMAGE 클릭 링크(LINK_URL 컬럼 삭제). 모든 모드에서 제공하지 않는다.
            "linkUrl");

    private final ObjectMapper objectMapper;

    /** ■ 생성 - in : objectMapper(ObjectMapper) CONTENT_OPTIONS 파싱용 - out: 조립기 인스턴스 */
    public PopupContentAssembler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * POL-13-01 : 콘텐츠와 관리 상태
     * ■ content 조립
     * - in : popup(PopupEntity) 콘텐츠 컬럼·CONTENT_OPTIONS를 가진 팝업 행
     * - out: Map&lt;String, Object&gt; 유형별 content · 예외: IllegalStateException(CONTENT_OPTIONS 해석 실패)
     * - 엔티티의 콘텐츠 컬럼으로 content Map을 만든다. 결과는 순서가 보존되는 가변 Map이다.
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
                // POL-03-01 : 저장·표시 경계 — 제목·설명은 본문(textBlocks)으로 통합. 통합 전 행의 컬럼 값은 본문 앞 문단으로 합친다.
                content.put("plainText", popup.contentBody());
                PopupRichText.mergeLegacyHeader(content, popup.contentTitle(), popup.description());
            }
            case "IMAGE" -> {
                // Read old storage into the new contract; new requests must use only new fields.
                String mode = String.valueOf(content.getOrDefault("imageSizeMode", "ADAPTIVE")).trim().toUpperCase(java.util.Locale.ROOT);
                if ("FILL".equals(mode)) mode = "ADAPTIVE";
                content.put("imageSizeMode", mode);
                if (!"ORIGINAL".equals(mode)) {
                    if (!content.containsKey("width")) content.put("width", "FIT_TO_IMAGE".equals(mode)
                        ? positiveLegacy(content.get("imageWidth")) : popup.popupWidth());
                    if (!content.containsKey("height")) content.put("height", "FIT_TO_IMAGE".equals(mode)
                        ? positiveLegacy(content.get("imageHeight")) : popup.popupHeight());
                    if ("FIT_TO_IMAGE".equals(mode)) content.putIfAbsent("keepAspectRatio", true);
                } else {
                    content.remove("width");
                    content.remove("height");
                }
                List.of("imageWidth", "imageHeight", "descriptionPosition", "imageAreaRatio").forEach(content::remove);
                if (!"FIT_TO_IMAGE".equals(mode)) content.remove("keepAspectRatio");
                content.put("imageTitle", popup.contentTitle());
                content.put("imageUrl", popup.mediaUrl());
                content.put("description", popup.description());
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

    private static Object positiveLegacy(Object value) {
        if (value instanceof Number n && Double.isFinite(n.doubleValue()) && n.doubleValue() > 0) return value;
        return null;
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
