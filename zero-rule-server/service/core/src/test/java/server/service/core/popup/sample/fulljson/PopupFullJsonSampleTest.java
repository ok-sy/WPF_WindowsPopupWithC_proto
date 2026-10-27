package server.service.core.popup.sample.fulljson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import server.domain.popup.sample.fulljson.PopupBulletinRow;
import server.service.core.popup.sample.PopupSampleException;

/**
 * POL-13-03 : 적용·샘플 구분
 * POL-16-02 : 재현 가능한 검증
 * ■ DTIY3117 전체 JSON 조회 샘플 테스트
 * - 가짜 매퍼 → CLOB JSON 파싱 → 식별자·명시값 검증 → 3117 기본값 → 응답 조립. DB 없이 실행한다.
 * - 기본값은 실제 배포 파일(classpath:popup/sample/popup-full-json-defaults.yml)을 읽는다.
 */
class PopupFullJsonSampleTest {

    private static final String DEFAULTS = "/popup/sample/popup-full-json-defaults.yml";
    private static final String SAMPLE_SQL = "/sample/full-json/DTIY3117_sample_insert_oracle.sql";
    private final ObjectMapper json = new ObjectMapper();
    private final PopupFullJsonDefaults defaults = loadDefaults();

    private PopupFullJsonDefaults loadDefaults() {
        return PopupFullJsonDefaults.load(PopupFullJsonSampleTest.class.getResourceAsStream(DEFAULTS), json, DEFAULTS);
    }

    private PopupFullJsonSampleService service(String id, String stored) {
        PopupBulletinRow row = new PopupBulletinRow();
        row.setPopupId(id);
        row.setPopupJson(stored);
        return new PopupFullJsonSampleService(popupId -> id.equals(popupId) ? row : null, json, defaults);
    }

    private ObjectNode popup(String stored) {
        return (ObjectNode) service("P-001", stored).nextPopup("E1001", "P-001").get("popup");
    }

    private PopupSampleException.Reason failure(String stored) {
        return assertThrows(PopupSampleException.class, () -> popup(stored)).reason();
    }

    // ---------- 조회 경계 ----------

    /** 결과 없음은 popup:null + 설정 폴링 주기. */
    @Test
    void emptyResultKeepsPopupNull() {
        ObjectNode response = service("P-001", "{}").nextPopup("E1001", "OTHER");
        assertEquals(1800, response.get("pollingIntervalSeconds").intValue());
        assertTrue(response.has("popup") && response.get("popup").isNull());
    }

    @Test
    void popupIdIsRequired() {
        assertThrows(IllegalArgumentException.class, () -> service("P-001", "{}").nextPopup("E1001", " "));
        assertThrows(IllegalArgumentException.class, () -> service("P-001", "{}").nextPopup("E1001", null));
    }

    /** 잘못된 JSON·null/배열/문자열 루트·빈 CLOB은 정상 빈 팝업으로 숨기지 않고 실패한다. */
    @Test
    void rejectsMalformedOrNonObjectJson() {
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure("{\"popupType\":"));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure("  "));
        assertEquals(PopupSampleException.Reason.CONTENT_NOT_OBJECT, failure("null"));
        assertEquals(PopupSampleException.Reason.CONTENT_NOT_OBJECT, failure("[]"));
        assertEquals(PopupSampleException.Reason.CONTENT_NOT_OBJECT, failure("\"TEXT\""));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure("{\"popupType\":\"TEXT\",\"content\":[]}"));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure(text("\"questions\":{}")));
    }

    // ---------- 식별자·서버 소유 값 ----------

    /** DB POPU_ID가 기준: 없으면 채우고 같으면 통과, 다르면 거절. deliveryId·pollingIntervalSeconds는 저장값을 버린다. */
    @Test
    void dbPopupIdWinsAndServerOwnedValuesAreReplaced() {
        ObjectNode response = service("P-001", text("\"popupId\":\"P-001\",\"deliveryId\":\"stale\",\"pollingIntervalSeconds\":5"))
                .nextPopup("E1001", "P-001");
        assertEquals(1800, response.get("pollingIntervalSeconds").intValue());
        ObjectNode popup = (ObjectNode) response.get("popup");
        assertEquals("P-001", popup.get("popupId").textValue());
        assertFalse("stale".equals(popup.get("deliveryId").textValue()));
        assertNotNull(UUID.fromString(popup.get("deliveryId").textValue()));
        assertFalse(popup.has("pollingIntervalSeconds"));

        assertEquals("P-001", popup(text("")).get("popupId").textValue());
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure(text("\"popupId\":\"P-999\"")));
    }

    /** 계약 외 최상위 키(관리용 필드)는 응답에 싣지 않는다. 응답 키 순서는 WpfPopupItem과 같다. */
    @Test
    void dropsUnknownKeysAndKeepsContractOrder() {
        ObjectNode popup = popup(text("\"regUserId\":\"A00001\",\"memo\":\"관리용\""));
        assertFalse(popup.has("regUserId") || popup.has("memo"));
        List<String> keys = new ArrayList<>();
        popup.fieldNames().forEachRemaining(keys::add);
        assertEquals(List.of("deliveryId", "popupId", "popupType", "title", "displayMode", "sizeMode", "width", "height", "widthRatio", "heightRatio",
                "minimumWidth", "minimumHeight", "maximumWidth", "maximumHeight", "showHeader", "showFooterButton", "showFooter",
                "footerAction", "useBackgroundOverlay", "backgroundOverlayOpacity", "popupPosition", "headerFontSize", "bodyFontSize",
                "footerFontSize", "showDoNotShowAgain", "showLater", "hideDays", "completionRatio", "questions", "content"), keys);
    }

    // ---------- 기본값 ----------

    /** 누락·null만 확정 기본값으로 채운다. */
    @Test
    void fillsConfirmedDefaultsForMissingOrNull() {
        ObjectNode popup = popup(text("\"showHeader\":null"));
        assertEquals("SEQUENTIAL", popup.get("displayMode").textValue());
        assertEquals("FIXED", popup.get("sizeMode").textValue());
        assertEquals(900, popup.get("width").intValue());
        assertEquals(620, popup.get("height").intValue());
        assertEquals(0.7, popup.get("widthRatio").doubleValue());
        assertEquals(0.75, popup.get("heightRatio").doubleValue());
        assertEquals(300, popup.get("minimumWidth").intValue());
        assertEquals(1200, popup.get("maximumWidth").intValue());
        assertEquals(900, popup.get("maximumHeight").intValue());
        assertTrue(popup.get("showHeader").booleanValue(), "null도 누락으로 보고 기본값");
        assertTrue(popup.get("showFooter").booleanValue() && popup.get("showFooterButton").booleanValue());
        assertEquals("CLOSE", popup.get("footerAction").textValue());
        assertFalse(popup.get("showLater").booleanValue() || popup.get("showDoNotShowAgain").booleanValue());
        assertTrue(popup.get("useBackgroundOverlay").booleanValue());
        assertEquals(0.45, popup.get("backgroundOverlayOpacity").doubleValue());
        assertEquals("CENTER", popup.get("popupPosition").textValue());
        for (String key : List.of("headerFontSize", "bodyFontSize", "footerFontSize", "hideDays", "completionRatio")) {
            assertTrue(popup.has(key) && popup.get(key).isNull(), key);
        }
        assertFalse(popup.has("passingScore"), "QUIZ 외 유형에는 passingScore 없음");
        assertEquals("", popup.get("title").textValue());
        JsonNode content = popup.get("content");
        assertTrue(content.get("showPlainText").booleanValue());
        assertFalse(content.get("showHighlight").booleanValue() || content.get("showBottomDescription").booleanValue());
    }

    /** 명시한 false·0은 유지하고, 잘못된 타입·범위는 기본값으로 바꾸지 않고 거절한다. */
    @Test
    void keepsExplicitFalseAndZeroButRejectsWrongTypes() {
        ObjectNode popup = popup(text("\"showHeader\":false,\"useBackgroundOverlay\":false,\"backgroundOverlayOpacity\":0"));
        assertFalse(popup.get("showHeader").booleanValue());
        assertFalse(popup.get("useBackgroundOverlay").booleanValue());
        assertEquals(0, popup.get("backgroundOverlayOpacity").doubleValue());

        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure(text("\"showHeader\":\"Y\"")));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure(text("\"width\":0")));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure(text("\"popupPosition\":\"MIDDLE\"")));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure(text("\"hideDays\":1.5")));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure(text("\"bodyFontSize\":9")));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure("{\"popupType\":\"NOTICE\",\"content\":{\"plainText\":\"본문\"}}"));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON,
                failure("{\"popupType\":\"TEXT\",\"content\":{\"plainText\":\"본문\",\"showPlainText\":\"true\"}}"));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON,
                failure("{\"popupType\":\"VIDEO\",\"content\":{\"videoUrl\":\"https://v.example.com/a.mp4\",\"defaultVolume\":1.5}}"));
    }

    /** 기존 관리자 저장 형태처럼 창·푸터 옵션이 content 안에 있으면 최상위로 옮긴다(최상위 값 우선). */
    @Test
    void promotesWindowOptionsFromContent() {
        ObjectNode popup = popup("{\"popupType\":\"TEXT\",\"popupPosition\":\"TOP_LEFT\",\"content\":{\"plainText\":\"본문\","
                + "\"useBackgroundOverlay\":false,\"popupPosition\":\"BOTTOM_RIGHT\",\"footerFontSize\":12}}");
        assertFalse(popup.get("useBackgroundOverlay").booleanValue());
        assertEquals("TOP_LEFT", popup.get("popupPosition").textValue());
        assertEquals(12, popup.get("footerFontSize").intValue());
        JsonNode content = popup.get("content");
        assertFalse(content.has("useBackgroundOverlay") || content.has("popupPosition") || content.has("footerFontSize"));
    }

    /** 요청마다 기본값 복사본을 쓰므로 응답을 바꿔도 설정 원본이 바뀌지 않는다. */
    @Test
    void sharedDefaultsStayUnchanged() {
        String before = defaults.popupDefaults().toString() + defaults.contentDefaults("VIDEO");
        ObjectNode first = popup("{\"popupType\":\"VIDEO\",\"content\":{\"videoUrl\":\"https://v.example.com/a.mp4\"}}");
        ((ObjectNode) first.get("content")).put("allowSeek", true);
        first.put("displayMode", "SIMULTANEOUS");
        defaults.popupDefaults().put("width", 1);
        assertEquals(before, defaults.popupDefaults().toString() + defaults.contentDefaults("VIDEO"));
        ObjectNode second = popup("{\"popupType\":\"VIDEO\",\"content\":{\"videoUrl\":\"https://v.example.com/a.mp4\"}}");
        assertFalse(second.get("content").get("allowSeek").booleanValue());
        assertEquals("SEQUENTIAL", second.get("displayMode").textValue());
    }

    // ---------- 유형별 조건부 규칙 ----------

    /** IMAGE는 크기 미지정이면 900×620을 채우지 않고 키도 싣지 않는다. ORIGINAL은 크기 필수. */
    @Test
    void imageSizeStaysUnspecified() {
        ObjectNode popup = popup("{\"popupType\":\"IMAGE\",\"width\":null,\"content\":{\"imageUrl\":\"https://f.example.com/a.png\"}}");
        assertFalse(popup.has("width") || popup.has("height"));
        assertFalse(popup.get("content").get("showDescription").booleanValue(), "3117 IMAGE showDescription 기본값 false");
        assertEquals("ADAPTIVE", popup.get("content").get("imageSizeMode").textValue());
        ObjectNode sized = popup("{\"popupType\":\"IMAGE\",\"width\":800,\"height\":600,\"content\":{\"imageUrl\":\"https://f.example.com/a.png\",\"showDescription\":true}}");
        assertEquals(800, sized.get("width").intValue());
        assertTrue(sized.get("content").get("showDescription").booleanValue(), "명시 true 유지");
        assertEquals(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT,
                failure("{\"popupType\":\"IMAGE\",\"width\":800,\"content\":{\"imageUrl\":\"https://f.example.com/a.png\",\"imageSizeMode\":\"ORIGINAL\"}}"));
    }

    /** 푸터: SURVEY·QUIZ는 SUBMIT만, 일반 유형은 SUBMIT 불가, LINK_AND_CLOSE는 절대 URL 필수. */
    @Test
    void footerRules() {
        assertEquals("SUBMIT", popup(survey("")).get("footerAction").textValue());
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure(survey("\"footerAction\":\"CLOSE\",")));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure(text("\"footerAction\":\"SUBMIT\"")));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON, failure(text("\"footerAction\":\"LINK_AND_CLOSE\",\"footerLinkUrl\":\"/notice\"")));
        assertFalse(popup(text("\"footerLinkUrl\":\"https://a.example.com\"")).has("footerLinkUrl"), "CLOSE면 링크를 싣지 않는다");
    }

    /** 영상 QUIZ는 VIDEO content 기본값·완료 비율 1.0을 상속하고 명시값은 유지한다. 영상 없는 QUIZ에는 VIDEO 필드를 넣지 않는다. */
    @Test
    void videoQuizInheritsVideoDefaults() {
        String questions = "\"questions\":[{\"questionType\":\"SINGLE_CHOICE\",\"options\":[{\"value\":\"A\",\"isCorrect\":true}]}]";
        ObjectNode videoQuiz = popup("{\"popupType\":\"QUIZ\",\"content\":{\"videoEnabled\":true,\"videoUrl\":\"https://v.example.com/a.mp4\","
                + "\"allowSeek\":true}," + questions + "}");
        JsonNode content = videoQuiz.get("content");
        assertTrue(content.get("allowSeek").booleanValue());
        assertFalse(content.get("allowPlaybackRateChange").booleanValue() || content.get("showDescription").booleanValue());
        assertEquals(1.0, videoQuiz.get("completionRatio").doubleValue());
        assertTrue(videoQuiz.has("passingScore") && videoQuiz.get("passingScore").isNull());

        ObjectNode quiz = popup("{\"popupType\":\"QUIZ\",\"content\":{}," + questions + "}");
        assertFalse(quiz.get("content").has("allowSeek") || quiz.get("content").has("defaultVolume"));
        assertFalse(quiz.get("content").get("videoEnabled").booleanValue());
        assertTrue(quiz.get("completionRatio").isNull());
        assertEquals(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT,
                failure("{\"popupType\":\"QUIZ\",\"content\":{\"videoEnabled\":true}," + questions + "}"));
    }

    /** 필수 콘텐츠·문항이 없으면 가상 데이터로 채우지 않고 거절한다. 문항 형식도 확인한다. */
    @Test
    void rejectsMissingRequiredContentAndBadQuestions() {
        assertEquals(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT, failure("{\"popupType\":\"TEXT\",\"content\":{\"plainText\":\" \"}}"));
        assertEquals(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT, failure("{\"popupType\":\"VIDEO\",\"content\":{}}"));
        assertEquals(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT, failure("{\"content\":{\"plainText\":\"본문\"}}"));
        assertEquals(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT, failure("{\"popupType\":\"SURVEY\",\"questions\":[]}"));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON,
                failure("{\"popupType\":\"SURVEY\",\"questions\":[{\"questionType\":\"RATING5\",\"options\":[]}]}"));
        assertEquals(PopupSampleException.Reason.INVALID_CONTENT_JSON,
                failure("{\"popupType\":\"SURVEY\",\"questions\":[{\"questionType\":\"SINGLE_CHOICE\",\"options\":[]}]}"));
        assertTrue(popup(text("\"questions\":[{\"questionType\":\"TEXT\"}]")).get("questions").isEmpty(), "TEXT 유형의 문항은 싣지 않는다");
    }

    // ---------- 인계 샘플 SQL ----------

    /** 인계용 INSERT(DTIY3117_sample_insert_oracle.sql) 6건이 유형별 규칙대로 응답으로 조립된다. */
    @Test
    void sampleInsertRowsAssemble() throws IOException {
        Map<String, String> rows = parseInserts(readResource(SAMPLE_SQL));
        assertEquals(List.of("S17-TXT-01", "S17-IMG-01", "S17-VDO-01", "S17-SVY-01", "S17-QIZ-01", "S17-VQZ-01"), List.copyOf(rows.keySet()));
        rows.keySet().forEach(id -> assertTrue(id.length() <= 10, "POPU_ID VARCHAR2(10): " + id));
        rows.values().forEach(sql -> assertTrue(sql.getBytes(StandardCharsets.UTF_8).length < 4000, "리터럴 4000바이트 이하"));
        Map<String, ObjectNode> popups = new LinkedHashMap<>();
        rows.forEach((id, stored) -> popups.put(id, (ObjectNode) service(id, stored).nextPopup("E1001", id).get("popup")));

        ObjectNode text = popups.get("S17-TXT-01");
        assertEquals("LINK_AND_CLOSE", text.get("footerAction").textValue());
        assertEquals("https://intranet.example.com/notice/1", text.get("footerLinkUrl").textValue());
        assertFalse(text.get("useBackgroundOverlay").booleanValue());
        assertEquals(16, text.get("bodyFontSize").intValue());
        assertTrue(text.get("content").get("textBlocks").isArray());
        assertEquals("시스템 점검 안내\n02:00~06:00", text.get("content").get("plainText").textValue());

        ObjectNode image = popups.get("S17-IMG-01");
        assertFalse(image.has("width") || image.has("height"));
        assertFalse(image.get("content").get("showDescription").booleanValue());

        ObjectNode video = popups.get("S17-VDO-01");
        assertEquals(0.9, video.get("completionRatio").doubleValue());
        assertEquals(0, video.get("content").get("defaultVolume").intValue(), "defaultVolume 0 유지");
        assertFalse(video.get("content").get("allowSeek").booleanValue() || video.get("content").get("allowPlaybackRateChange").booleanValue());

        ObjectNode survey = popups.get("S17-SVY-01");
        assertEquals("SUBMIT", survey.get("footerAction").textValue());
        assertTrue(survey.get("showLater").booleanValue());
        String surveyQuestions = survey.get("questions").toString();
        assertFalse(surveyQuestions.contains("isCorrect") || surveyQuestions.contains("correctAnswer") || surveyQuestions.contains("answerMatchMode"),
                "SURVEY는 정답 키를 싣지 않는다: " + surveyQuestions);

        ObjectNode quiz = popups.get("S17-QIZ-01");
        assertEquals(2, quiz.get("passingScore").intValue());
        assertTrue(quiz.get("questions").toString().contains("\"isCorrect\":true"));
        assertEquals("정보보호팀", quiz.get("questions").get(1).get("correctAnswer").textValue());

        ObjectNode videoQuiz = popups.get("S17-VQZ-01");
        assertEquals(1.0, videoQuiz.get("completionRatio").doubleValue());
        assertTrue(videoQuiz.get("content").get("allowSeek").booleanValue());
        assertFalse(videoQuiz.get("content").get("showDescription").booleanValue());

        String sql = readResource(SAMPLE_SQL);
        String delete = sql.substring(sql.indexOf("DELETE FROM DTIY3117"), sql.indexOf(';', sql.indexOf("DELETE FROM DTIY3117")));
        rows.keySet().forEach(id -> assertTrue(delete.contains("'" + id + "'"), "정리 DELETE는 샘플 ID만: " + id));
        assertTrue(delete.contains("WHERE POPU_ID IN"));
    }

    // ---------- 기본값 설정 파일 검증 ----------

    /** 설정 파일의 모르는 키·빠진 키·타입/범위 오류·footerAction 비허용 값은 기동 실패로 드러난다. */
    @Test
    void invalidDefaultsFailAtStartup() throws IOException {
        String base = readResource(DEFAULTS).replace("\r\n", "\n");
        PopupFullJsonDefaults.load(new ByteArrayInputStream(base.getBytes(StandardCharsets.UTF_8)), json, "base.yml");
        assertDefaultsFail(base.replace("  showLater: false", "  showLater: false\n  showLaterr: false"), "모르는 키");
        assertDefaultsFail(base.replace("  hideDays: null\n", ""), "빠진 키");
        assertDefaultsFail(base.replace("showHeader: true", "showHeader: \"Y\""), "타입");
        assertDefaultsFail(base.replace("backgroundOverlayOpacity: 0.45", "backgroundOverlayOpacity: 1.5"), "범위");
        assertDefaultsFail(base.replace("footerAction: CLOSE ", "footerAction: SUBMIT "), "footerAction");
        assertDefaultsFail(base.replace("showDescription: false\n    showControls", "showDescription: null\n    showControls"), "null 비허용");
        assertDefaultsFail(base.replace("pollingIntervalSeconds: 1800", "pollingIntervalSeconds: 0"), "폴링 주기");
        assertDefaultsFail(base.replace("minimumWidth: 300", "minimumWidth: 1300"), "최소 > 최대");
        assertDefaultsFail("- a\n- b\n", "루트 배열");
    }

    private void assertDefaultsFail(String yaml, String label) {
        InputStream in = new ByteArrayInputStream(yaml.getBytes(StandardCharsets.UTF_8));
        assertThrows(IllegalStateException.class, () -> PopupFullJsonDefaults.load(in, json, "test.yml"), label);
    }

    // ---------- 도우미 ----------

    private static String text(String extra) {
        return "{\"popupType\":\"TEXT\"," + (extra.isEmpty() ? "" : extra + ",") + "\"content\":{\"plainText\":\"본문\"}}";
    }

    private static String survey(String extra) {
        return "{\"popupType\":\"SURVEY\"," + extra
                + "\"questions\":[{\"questionType\":\"SINGLE_CHOICE\",\"options\":[{\"value\":\"1\",\"isCorrect\":true}]}]}";
    }

    private static String readResource(String path) throws IOException {
        try (InputStream in = PopupFullJsonSampleTest.class.getResourceAsStream(path)) {
            assertNotNull(in, path);
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    /** 샘플 SQL의 INSERT VALUES('ID', '...' || '...', 'SAMPLE', SYSDATE)만 읽는 간이 파서. 주석은 건너뛴다. */
    private static Map<String, String> parseInserts(String sql) {
        String body = sql.replaceAll("(?s)/\\*.*?\\*/", "").replaceAll("(?m)^\\s*--.*$", "");
        Map<String, String> rows = new LinkedHashMap<>();
        Matcher statement = Pattern.compile("(?s)INSERT INTO DTIY3117.*?VALUES\\s*\\((.*?)\\);").matcher(body);
        while (statement.find()) {
            List<String> values = new ArrayList<>();
            StringBuilder current = null;
            String rest = statement.group(1);
            int i = 0;
            while (i < rest.length()) {
                char c = rest.charAt(i);
                if (c == '\'') {
                    StringBuilder literal = new StringBuilder();
                    i++;
                    while (true) {
                        char d = rest.charAt(i);
                        if (d == '\'' && i + 1 < rest.length() && rest.charAt(i + 1) == '\'') { literal.append('\''); i += 2; continue; }
                        if (d == '\'') { i++; break; }
                        literal.append(d);
                        i++;
                    }
                    if (current == null) current = new StringBuilder();
                    current.append(literal);
                } else if (c == ',') {
                    values.add(current == null ? null : current.toString());
                    current = null;
                    i++;
                } else {
                    i++; // 공백·||·SYSDATE
                }
            }
            values.add(current == null ? null : current.toString());
            rows.put(values.get(0), values.get(1));
        }
        return rows;
    }
}
