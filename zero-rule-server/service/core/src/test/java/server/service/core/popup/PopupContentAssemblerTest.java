package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupEntity;

import java.math.BigDecimal;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * [Oracle 전환 — 기준 5] content 조립 규칙 확인. [설계 18 L-3] 정규 컬럼이 CONTENT_OPTIONS 사본보다 우선하고,
 * 완료 비율·통과 점수·문항 같은 파생 키는 content에 싣지 않는다.
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

    @Test void textUsesPlainTextAndColumnWinsOverStaleOptionCopy() {
        Map<String, Object> content = assembler.assemble(entity("TEXT", "안내", "설명", "본문", null, null,
                "{\"showPlainText\":true,\"description\":\"오래된 사본\",\"plainText\":\"오래된 본문\"}", null, null, "Y"));
        assertEquals("안내", content.get("contentTitle"));
        assertEquals("본문", content.get("plainText"), "[설계 18 L-3] 정규 컬럼이 옵션 JSON의 사본보다 우선");
        assertEquals("설명", content.get("description"), "[설계 18 L-3] 정규 컬럼이 옵션 JSON의 사본보다 우선");
        assertEquals(true, content.get("showPlainText"));
        assertFalse(content.containsKey("imageUrl"));
    }

    @Test void storedCopiesAndDerivedKeysAreIgnored() {
        Map<String, Object> content = assembler.assemble(entity("VIDEO", "영상", null, null, "http://x/v.mp4", null,
                "{\"completionRatio\":0.5,\"allowCloseBeforeCompletion\":true,\"passingScore\":1,"
                        + "\"validateRequiredQuestions\":true,\"questions\":[],\"linkUrl\":\"http://old\",\"autoPlay\":true}",
                new BigDecimal("0.9000"), null, "N"));
        for (String key : new String[]{"completionRatio", "allowCloseBeforeCompletion", "passingScore",
                "validateRequiredQuestions", "questions", "linkUrl"}) {
            assertFalse(content.containsKey(key), key + "는 content에 두지 않는다");
        }
        assertEquals(true, content.get("autoPlay"));
    }

    @Test void saveKeepsOnlyExtensionOptions() {
        Map<String, Object> options = PopupContentAssembler.withoutStoredCopies(Map.of(
                "contentTitle", "t", "description", "d", "plainText", "p", "linkUrl", "l",
                "completionRatio", 0.8, "questions", java.util.List.of(), "showHighlight", true));
        assertEquals(Map.of("showHighlight", true), options);
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
        assertFalse(video.containsKey("completionRatio"), "[설계 18 L-3] 완료 비율은 응답 최상위로만");
        assertFalse(video.containsKey("allowCloseBeforeCompletion"));
        assertEquals(true, video.get("autoPlay"));
    }

    @Test void surveyAndQuizShareSurveyTitleWithoutDerivedKeys() {
        for (String type : new String[]{"SURVEY", "QUIZ"}) {
            Map<String, Object> content = assembler.assemble(entity(type, "설문", "설명", null, null, null,
                    null, null, new BigDecimal("30.00"), "Y"));
            assertEquals("설문", content.get("surveyTitle"));
            assertFalse(content.containsKey("passingScore"), "[설계 18 L-3] 통과 점수는 응답 최상위로만");
            assertFalse(content.containsKey("validateRequiredQuestions"));
            assertFalse(content.containsKey("questions"), "문항은 응답 최상위 questions로만");
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
