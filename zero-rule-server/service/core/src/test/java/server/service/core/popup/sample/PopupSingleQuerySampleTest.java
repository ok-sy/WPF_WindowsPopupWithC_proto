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

/** [TODO65] SQL 결과(가짜 매퍼) → 공통 매핑 → CLOB JSON 파싱 → 기본값 → 응답 조립. DB 없이 실행한다. */
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

    @Test
    void emptyResultKeepsPopupNull() {
        ObjectNode response = service(null).nextPopup("E1001", null, null);
        assertEquals(1200, response.get("pollingIntervalSeconds").intValue());
        assertTrue(response.has("popup") && response.get("popup").isNull());
        assertTrue(issued.isEmpty(), "결과 없음이면 전달 건을 발급하지 않는다");
    }

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
        assertFalse(popup.has("headerFontSize"));
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

    @Test
    void surveyUsesQuestionPortAndAlwaysSubmit() throws Exception {
        ArrayNode questions = (ArrayNode) json.readTree("[{\"questionId\":1,\"title\":\"만족?\",\"questionType\":\"SINGLE_CHOICE\",\"options\":[]}]");
        JsonNode popup = service(row("40", "{\"surveyTitle\":\"설문\"}"), (r, type) -> questions).nextPopup("E1001", null, null).get("popup");
        assertEquals("SURVEY", popup.get("popupType").asText());
        assertEquals("SUBMIT", popup.get("footerAction").asText());
        assertFalse(popup.has("footerLinkUrl"));
        assertEquals(1, popup.get("questions").size());
    }

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
