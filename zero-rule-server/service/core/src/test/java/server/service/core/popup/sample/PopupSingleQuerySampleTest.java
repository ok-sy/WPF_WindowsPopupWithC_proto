package server.service.core.popup.sample;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import server.domain.popup.sample.PopupContentRow;
import server.repo.core.mapper.popup.sample.PopupSingleQuerySampleMapper;

/**
 * POL-13-03 : 적용·샘플 구분
 * POL-14-03 : 서버 인계 예제
 * ■ 단건 조회 샘플 흐름 테스트
 * - SQL 결과(가짜 매퍼) → 공통 매핑 → CLOB JSON 파싱 → 기본값 → 응답 조립. DB 없이 실행한다.
 */
class PopupSingleQuerySampleTest {

    private final ObjectMapper json = new ObjectMapper();
    private final PopupPorts.FileUrlResolver files = new PopupPorts.FileUrlResolver("https://files.example.com/popup/");
    private final PopupSingleResponseAssembler assembler = new PopupSingleResponseAssembler(json, files);
    private final PopupContentJsonParser parser = new PopupContentJsonParser(json);
    private final List<String> issued = new ArrayList<>();
    private final PopupPorts.DeliveryPort delivery = new PopupPorts.DeliveryPort() {
        @Override public String issueDeliveryId(PopupContentRow row, String userId) {
            String id = "delivery-" + (issued.size() + 1);
            issued.add(id);
            return id;
        }
        @Override public int pollingIntervalSeconds() { return 1200; }
    };

    private static PopupContentRow row(String type, String content) {
        PopupContentRow row = new PopupContentRow();
        row.setContentId("C-001");
        row.setContentTypeCode(type);
        row.setHeaderTitle("점검 안내");
        row.setWidth(new BigDecimal("560"));
        row.setHeight(new BigDecimal("420.5"));
        row.setAfterConfirmYn("Y");
        row.setFooterButtonTypeCode("02");
        row.setFooterUrl("https://intranet.example.com/notice/1");
        row.setContentJson(content);
        return row;
    }

    private PopupSingleQuerySampleService service(PopupContentRow result, PopupPorts.QuestionPort questions) {
        PopupSingleQuerySampleMapper mapper = (userId, contentId, contentTypeCode) -> result;
        return new PopupSingleQuerySampleService(mapper, parser, assembler, delivery, questions);
    }

    private PopupSingleQuerySampleService service(PopupContentRow result) {
        return service(result, new PopupPorts.UnconnectedQuestionPort());
    }

    /** 후보가 없으면 popup=null을 유지하고 전달 건을 발급하지 않는다. */
    @Test
    void emptyResultKeepsPopupNull() {
        ObjectNode response = service(null).nextPopup("E1001", null, null);
        assertEquals(1200, response.get("pollingIntervalSeconds").intValue());
        assertTrue(response.has("popup") && response.get("popup").isNull());
        assertTrue(issued.isEmpty(), "결과 없음이면 전달 건을 발급하지 않는다");
    }

    /** TEXT 컬럼을 매핑하고 중첩 content와 명시적 false·0 값을 유지한다. */
    @Test
    void textMapsColumnsKeepsNestedContentAndExplicitFalseZero() {
        String content = """
                {"plainText":"점검 안내","showPlainText":false,
                 "textBlocks":[{"alignment":"LEFT","indent":0,"runs":[{"text":"점검","bold":true,"italic":false}]}],
                 "useBackgroundOverlay":false,"backgroundOverlayOpacity":0,"popupPosition":"top_right","bodyFontSize":18,
                 "title":"content 제목","width":9999,"footerAction":"CLOSE"}""";
        JsonNode popup = service(row("10", content)).nextPopup("E1001", null, null).get("popup");
        assertEquals("delivery-1", popup.get("deliveryId").asText(), "전달 건 ID는 포트가 발급(콘텐츠 ID에서 파생하지 않음)");
        assertEquals("C-001", popup.get("popupId").asText());
        assertEquals("TEXT", popup.get("popupType").asText());
        assertEquals("점검 안내", popup.get("title").asText(), "제목은 컬럼 기준");
        assertEquals(560, popup.get("width").doubleValue());
        assertEquals(420.5, popup.get("height").doubleValue());
        assertTrue(popup.get("showLater").booleanValue());
        assertEquals("LINK_AND_CLOSE", popup.get("footerAction").asText());
        assertEquals("https://intranet.example.com/notice/1", popup.get("footerLinkUrl").asText());
        assertFalse(popup.get("useBackgroundOverlay").booleanValue(), "명시적 false 유지");
        assertEquals(0, popup.get("backgroundOverlayOpacity").doubleValue(), "명시적 0 유지");
        assertEquals("TOP_RIGHT", popup.get("popupPosition").asText());
        assertEquals(18, popup.get("bodyFontSize").doubleValue());
        assertTrue(popup.has("headerFontSize") && popup.get("headerFontSize").isNull(), "미설정 폰트 키는 null로 포함");
        assertEquals(300, popup.get("minimumWidth").doubleValue());
        JsonNode body = popup.get("content");
        assertTrue(body.isObject(), "content는 문자열이 아니라 객체(이중 직렬화 없음)");
        assertFalse(body.get("showPlainText").booleanValue());
        assertFalse(body.at("/textBlocks/0/runs/0/italic").booleanValue());
        for (String key : List.of("title", "width", "footerAction", "useBackgroundOverlay", "popupPosition", "bodyFontSize")) {
            assertFalse(body.has(key), "최상위로 옮기거나 컬럼이 우선한 키는 content에서 뺀다: " + key);
        }
        assertTrue(popup.get("questions").isArray() && popup.get("questions").isEmpty());
    }

    /** POL-01-02 : 기본값의 적용 — 누락된 선택 값에는 계약 기본값을 채운다. */
    @Test
    void missingOptionalValuesGetContractDefaults() {
        PopupContentRow row = row("10", "{\"plainText\":\"x\"}");
        row.setHeaderTitle(null);
        row.setWidth(null);
        row.setHeight(null);
        row.setAfterConfirmYn(null);
        row.setFooterButtonTypeCode(null);
        JsonNode popup = service(row).nextPopup("E1001", null, null).get("popup");
        assertEquals("", popup.get("title").asText());
        assertEquals(900, popup.get("width").doubleValue());
        assertEquals(620, popup.get("height").doubleValue());
        assertFalse(popup.get("showLater").booleanValue());
        assertEquals("CLOSE", popup.get("footerAction").asText());
        assertFalse(popup.has("footerLinkUrl"));
        assertTrue(popup.get("useBackgroundOverlay").booleanValue());
        assertEquals(0.45, popup.get("backgroundOverlayOpacity").doubleValue());
        assertEquals("CENTER", popup.get("popupPosition").asText());
    }

    /** 샘플 응답은 계약상 가능한 옵션 키를 모두 싣는다(없던 키 = 계약 기본값, 명시값 유지). */
    @Test
    void sampleResponseCarriesEveryOptionKey() throws Exception {
        JsonNode text = service(row("10", "{\"plainText\":\"본문\",\"showHighlight\":true}")).nextPopup("E1001", null, null).get("popup");
        for (String key : List.of("headerFontSize", "bodyFontSize", "footerFontSize", "hideDays", "completionRatio")) {
            assertTrue(text.has(key) && text.get(key).isNull(), "최상위 선택 키 null로 포함: " + key);
        }
        assertFalse(text.has("passingScore"), "passingScore는 QUIZ만");
        JsonNode body = text.get("content");
        assertEquals(List.of("plainText", "showHighlight", "textBlocks", "showPlainText", "highlightText", "bottomDescription",
                "bottomDescriptionUrl", "showBottomDescription"), iterableToList(body.fieldNames()));
        assertTrue(body.get("showHighlight").booleanValue(), "명시값 유지");
        assertTrue(body.get("showPlainText").booleanValue() && !body.get("showBottomDescription").booleanValue() && body.get("textBlocks").isNull());

        JsonNode image = service(row("20", "{\"imageUrl\":\"https://x/a.png\",\"keepAspectRatio\":false}")).nextPopup("E1001", null, null).get("popup").get("content");
        assertEquals("ADAPTIVE", image.get("imageSizeMode").asText());
        assertFalse(image.get("keepAspectRatio").booleanValue(), "명시적 false 유지");
        assertTrue(image.get("showDescription").booleanValue() && image.has("imageTitle") && image.has("description"));

        JsonNode video = service(row("30", "{\"videoUrl\":\"https://x/v.mp4\",\"defaultVolume\":0}")).nextPopup("E1001", null, null).get("popup");
        assertEquals(1.0, video.get("completionRatio").doubleValue());
        for (String key : List.of("videoTitle", "description", "showDescription", "showControls", "allowFullScreen", "allowPlaybackRateChange",
                "allowSeek", "autoPlay", "isLoop")) {
            assertTrue(video.get("content").has(key), "VIDEO 옵션 포함: " + key);
        }
        assertEquals(0, video.at("/content/defaultVolume").doubleValue(), "명시적 0 유지");

        ArrayNode quizQuestions = (ArrayNode) json.readTree("[{\"questionId\":1,\"title\":\"Q\",\"questionType\":\"SINGLE_CHOICE\",\"isScored\":true,"
                + "\"options\":[{\"optionId\":1,\"text\":\"A\",\"isCorrect\":true},{\"optionId\":2,\"text\":\"B\"}]}]");
        JsonNode quiz = service(row("50", "{\"surveyTitle\":\"퀴즈\",\"videoEnabled\":true,\"videoUrl\":\"https://x/v.mp4\"}"), (r, t) -> quizQuestions)
                .nextPopup("E1001", null, null).get("popup");
        assertTrue(quiz.has("passingScore") && quiz.get("passingScore").isNull());
        assertEquals(1.0, quiz.get("completionRatio").doubleValue(), "영상+퀴즈 완료 비율 기본 1.0");
        assertTrue(quiz.at("/content/allowSeek").booleanValue() && quiz.at("/content/descriptionBlocks").isNull(), "영상+퀴즈는 VIDEO 옵션도 포함");
        JsonNode question = quiz.at("/questions/0");
        assertEquals(1, question.get("questionScore").intValue(), "채점 문항 배점 기본 1");
        assertEquals("VERTICAL", question.get("optionLayout").asText());
        assertTrue(question.has("correctAnswer") && question.has("answerMatchMode") && question.has("titleBlocks"));
        assertFalse(question.at("/options/1/isCorrect").booleanValue(), "선택지 isCorrect 기본 false");
        assertTrue(question.at("/options/0/isCorrect").booleanValue() && question.at("/options/0").has("value"));

        ArrayNode surveyQuestions = (ArrayNode) json.readTree("[{\"questionId\":1,\"title\":\"S\",\"questionType\":\"SINGLE_CHOICE\",\"correctAnswer\":\"x\","
                + "\"options\":[{\"optionId\":1,\"text\":\"A\",\"isCorrect\":true}]}]");
        JsonNode survey = service(row("40", "{\"surveyTitle\":\"설문\"}"), (r, t) -> surveyQuestions).nextPopup("E1001", null, null).get("popup");
        assertFalse(survey.at("/questions/0").has("correctAnswer") || survey.at("/questions/0/options/0").has("isCorrect"), "SURVEY는 정답 키 제거");
        assertFalse(survey.has("passingScore"));
        assertTrue(surveyQuestions.get(0).has("correctAnswer"), "포트가 준 원본 객체는 바꾸지 않는다");
    }

    private static List<String> iterableToList(java.util.Iterator<String> names) {
        List<String> list = new ArrayList<>();
        names.forEachRemaining(list::add);
        return list;
    }

    /** IMAGE는 파일 컬럼 URL을 우선하고 없는 크기 축은 생략한다. */
    @Test
    void imageUsesFileColumnsAndOmitsMissingSize() {
        PopupContentRow row = row("20", "{\"imageUrl\":\"https://old.example.com/a.png\",\"imageSizeMode\":\"FIT_TO_IMAGE\"}");
        row.setWidth(null);
        row.setFooterButtonTypeCode("01");
        row.setFilePath("notice/2026 10");
        row.setFileName("점검 안내.png");
        JsonNode popup = service(row).nextPopup("E1001", null, null).get("popup");
        assertEquals("https://files.example.com/popup/notice/2026%2010/%EC%A0%90%EA%B2%80%20%EC%95%88%EB%82%B4.png",
                popup.at("/content/imageUrl").asText(), "파일 컬럼 URL이 content 값보다 우선");
        assertFalse(popup.has("width"), "IMAGE 축 생략 = 원본 기준");
        assertEquals(420.5, popup.get("height").doubleValue());
    }

    /** SURVEY는 QuestionPort 문항을 싣고 footerAction은 항상 SUBMIT이다. */
    @Test
    void surveyUsesQuestionPortAndAlwaysSubmit() throws Exception {
        ArrayNode questions = (ArrayNode) json.readTree("[{\"questionId\":1,\"title\":\"만족?\",\"questionType\":\"SINGLE_CHOICE\",\"options\":[]}]");
        JsonNode popup = service(row("40", "{\"surveyTitle\":\"설문\"}"), (r, type) -> questions).nextPopup("E1001", null, null).get("popup");
        assertEquals("SURVEY", popup.get("popupType").asText());
        assertEquals("SUBMIT", popup.get("footerAction").asText());
        assertFalse(popup.has("footerLinkUrl"));
        assertEquals(1, popup.get("questions").size());
    }

    /** 잘못된 JSON·객체 아님·필수 콘텐츠 누락 등 데이터 오류는 정상 응답으로 돌려주지 않는다. */
    @Test
    void dataErrorsAreNotReturnedAsNormalResponses() {
        Object[][] cases = {
                {row("10", "{\"plainText\":"), PopupSampleException.Reason.INVALID_CONTENT_JSON},
                {row("10", "[1,2]"), PopupSampleException.Reason.CONTENT_NOT_OBJECT},
                {row("10", "\"text\""), PopupSampleException.Reason.CONTENT_NOT_OBJECT},
                {row("10", " "), PopupSampleException.Reason.INVALID_CONTENT_JSON},
                {row("10", "{\"showPlainText\":true}"), PopupSampleException.Reason.MISSING_REQUIRED_CONTENT},
                {row("30", "{\"videoTitle\":\"v\"}"), PopupSampleException.Reason.MISSING_REQUIRED_CONTENT},
                {row("99", "{\"plainText\":\"x\"}"), PopupSampleException.Reason.UNKNOWN_CODE},
                {row("40", "{\"surveyTitle\":\"s\"}"), PopupSampleException.Reason.QUESTIONS_NOT_CONNECTED},
                {row("10", "{\"plainText\":\"x\",\"backgroundOverlayOpacity\":1.5}"), PopupSampleException.Reason.INVALID_CONTENT_JSON},
        };
        for (Object[] c : cases) {
            PopupContentRow r = (PopupContentRow) c[0];
            PopupSampleException ex = assertThrows(PopupSampleException.class, () -> service(r).nextPopup("E1001", null, null), r.getContentJson());
            assertEquals(c[1], ex.reason(), r.getContentJson());
            assertEquals("C-001", ex.contentId());
        }
        PopupContentRow badYn = row("10", "{\"plainText\":\"x\"}");
        badYn.setAfterConfirmYn("1");
        assertEquals(PopupSampleException.Reason.INVALID_COLUMN,
                assertThrows(PopupSampleException.class, () -> service(badYn).nextPopup("E1001", null, null)).reason());
        PopupContentRow badLink = row("10", "{\"plainText\":\"x\"}");
        badLink.setFooterUrl("/relative");
        assertEquals(PopupSampleException.Reason.INVALID_COLUMN,
                assertThrows(PopupSampleException.class, () -> service(badLink).nextPopup("E1001", null, null)).reason());
        assertTrue(issued.isEmpty(), "데이터 오류 응답에는 전달 건을 발급하지 않는다");
    }
}
