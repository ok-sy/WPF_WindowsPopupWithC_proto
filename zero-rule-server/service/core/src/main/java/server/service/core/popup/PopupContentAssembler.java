package server.service.core.popup;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import server.domain.popup.PopupEntity;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 팝업 유형별 content JSON(Map)을 DB 컬럼에서 조립한다.
 *
 * <p>[역할] POPUP_CONTENT의 정규 컬럼(제목·설명·본문·미디어URL·링크URL)과 확장 옵션 JSON(CONTENT_OPTIONS)을
 * 합쳐 WPF·관리자 웹이 소비하는 {@code content} 객체를 만든다.</p>
 *
 * <p>[추가 이유 — 기준 5] PostgreSQL 매퍼 {@code selectAvailablePopups}/{@code selectAdminPopupById}는
 * {@code CASE popup_type WHEN 'TEXT' THEN JSONB_BUILD_OBJECT(...) ... END || COALESCE(content_options, '{}')}
 * 로 SQL 안에서 조립했다. Oracle은 JSON 함수(JSON_OBJECT/JSON_MERGEPATCH)가 버전별로 지원 범위가 달라
 * SQL 조립을 버리고 Java에서 같은 규칙으로 조립한다. 규칙은 원본 SQL과 1:1로 맞춘다.</p>
 *
 * <p>[조립 규칙 — 원본 SQL 대조]</p>
 * <pre>
 *   TEXT   : contentTitle, description, plainText(=CONTENT_BODY)
 *   IMAGE  : imageTitle, imageUrl(=MEDIA_URL), description, linkUrl
 *   VIDEO  : videoTitle, videoUrl(=MEDIA_URL), description, completionRatio, allowCloseBeforeCompletion
 *   SURVEY : surveyTitle, description, passingScore, validateRequiredQuestions=true
 *   QUIZ   : surveyTitle, description, passingScore, validateRequiredQuestions=true
 *   기타   : {}
 *   → 위 기본 객체 위에 CONTENT_OPTIONS JSON의 키를 덮어쓴다 (PostgreSQL {@code ||} 병합과 동일: 뒤쪽이 우선).
 * </pre>
 * 원본처럼 null 값도 키로 포함한다(응답 직렬화 시 NON_NULL 설정으로 생략됨).
 * SURVEY/QUIZ의 {@code questions}는 여기서 넣지 않고 PopupService.toResponseDto가 문항 목록을 채운다.
 * 스프링 빈이 아니라 PopupService가 자신의 ObjectMapper로 직접 생성한다(기존 생성자 시그니처와 테스트 유지).
 */
public class PopupContentAssembler {

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
        Map<String, Object> content = new LinkedHashMap<>();
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
                content.put("completionRatio", toDouble(popup.completionRatio()));
                content.put("allowCloseBeforeCompletion",
                        "Y".equalsIgnoreCase(popup.allowCloseBeforeCompleteYn()));
            }
            case "SURVEY", "QUIZ" -> {
                content.put("surveyTitle", popup.contentTitle());
                content.put("description", popup.description());
                content.put("passingScore", toDouble(popup.passingScore()));
                content.put("validateRequiredQuestions", Boolean.TRUE);
            }
            default -> { /* 알 수 없는 유형은 확장 옵션만 전달 */ }
        }
        content.putAll(parseOptions(popup.popupId(), popup.contentOptionsJson()));
        return content;
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

    private static Double toDouble(BigDecimal value) {
        return value == null ? null : value.doubleValue();
    }
}
