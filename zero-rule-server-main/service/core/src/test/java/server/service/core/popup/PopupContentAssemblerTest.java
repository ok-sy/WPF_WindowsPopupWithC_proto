package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupEntity;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * [Oracle 전환 — 기준 5] PostgreSQL 매퍼의 JSONB_BUILD_OBJECT || content_options 조립 규칙을
 * Java(PopupContentAssembler)가 그대로 재현하는지 확인한다. 기대값은 원본 SQL(CASE popup_type ...)에서 옮겼다.
 */
class PopupContentAssemblerTest {

    private final PopupContentAssembler assembler = new PopupContentAssembler(new ObjectMapper());

    private PopupEntity entity(String type, String title, String description, String body, String media,
                               String link, String options, BigDecimal completionRatio, BigDecimal passingScore,
                               String allowClose) {
        return new PopupEntity("P1", type, "제목", null, null, "SEQUENTIAL", "FIXED",
                null, null, null, null, null, null, null, null,
                "Y", "Y", "Y", "N",
                title, description, body, media, link, options,
                100, "Y", null, "FIXED", null, null, null, null,
                completionRatio, passingScore, allowClose);
    }

    @Test void textUsesPlainTextAndMergesOptions() {
        Map<String, Object> content = assembler.assemble(entity("TEXT", "안내", "설명", "본문", null, null,
                "{\"showPlainText\":true,\"description\":\"옵션이 우선\"}", null, null, "Y"));
        assertEquals("안내", content.get("contentTitle"));
        assertEquals("본문", content.get("plainText"));
        assertEquals("옵션이 우선", content.get("description"), "content_options 키가 정규 컬럼을 덮어써야 한다(|| 병합 규칙)");
        assertEquals(true, content.get("showPlainText"));
        assertFalse(content.containsKey("imageUrl"));
    }

    @Test void imageAndVideoMapMediaColumns() {
        Map<String, Object> image = assembler.assemble(entity("IMAGE", "이미지", null, null,
                "https://x/img.png", "https://x/link", null, null, null, "Y"));
        assertEquals("이미지", image.get("imageTitle"));
        assertEquals("https://x/img.png", image.get("imageUrl"));
        assertEquals("https://x/link", image.get("linkUrl"));
        assertTrue(image.containsKey("description"), "원본처럼 null 값도 키로 포함한다");

        Map<String, Object> video = assembler.assemble(entity("VIDEO", "영상", "설명", null,
                "http://x/v.mp4", null, "{\"autoPlay\":true}", new BigDecimal("0.9000"), null, "N"));
        assertEquals("http://x/v.mp4", video.get("videoUrl"));
        assertEquals(0.9, video.get("completionRatio"));
        assertEquals(false, video.get("allowCloseBeforeCompletion"));
        assertEquals(true, video.get("autoPlay"));
    }

    @Test void surveyAndQuizShareSurveyTitleAndPassingScore() {
        for (String type : new String[]{"SURVEY", "QUIZ"}) {
            Map<String, Object> content = assembler.assemble(entity(type, "설문", "설명", null, null, null,
                    null, null, new BigDecimal("30.00"), "Y"));
            assertEquals("설문", content.get("surveyTitle"));
            assertEquals(30.0, content.get("passingScore"));
            assertEquals(Boolean.TRUE, content.get("validateRequiredQuestions"));
            assertFalse(content.containsKey("questions"), "questions는 PopupService가 채운다");
        }
    }

    @Test void corruptedOptionsFailWithPopupId() {
        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                assembler.assemble(entity("TEXT", "a", null, null, null, null, "{not json", null, null, "Y")));
        assertTrue(ex.getMessage().contains("P1"));
    }

    @Test void unknownTypeReturnsOnlyOptions() {
        Map<String, Object> content = assembler.assemble(entity("OTHER", "a", "b", null, null, null,
                "{\"k\":1}", null, null, "Y"));
        assertEquals(Map.of("k", 1), content);
    }
}
