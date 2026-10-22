package server.service.core.popup.sample;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

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
        row.setHeight(new BigDecimal("420"));
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
        assertEquals(420.0, popup.get("height").doubleValue());
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
        row.setImageFilePath("notice/2026 10");
        row.setImageFileName("점검 안내.png");
        row.setVideoFilePath("ignored");
        row.setVideoFileName("ignored.mp4");
        JsonNode popup = service(row).nextPopup("E1001", null, null).get("popup");
        assertEquals("https://files.example.com/popup/notice/2026%2010/%EC%A0%90%EA%B2%80%20%EC%95%88%EB%82%B4.png",
                popup.at("/content/imageUrl").asText(), "파일 컬럼 URL이 content 값보다 우선");
        assertFalse(popup.has("width"), "IMAGE 축 생략 = 원본 기준");
        assertEquals(420.0, popup.get("height").doubleValue());
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
    /** 인계용 INSERT SQL(DTIY3111_sample_insert_oracle.sql) 6건이 유형별로 정상 응답으로 조립된다. 문항은 QuestionPort 대역으로 붙인다. */
    @Test
    void sampleInsertSqlRowsAssembleForEveryType() throws Exception {
        List<Map<String, String>> rows = parseInserts(readResource("/sample/single-query/DTIY3111_sample_insert_oracle.sql"));
        assertEquals(6, rows.size());
        ArrayNode questions = (ArrayNode) json.readTree("[{\"questionId\":1,\"title\":\"q\",\"questionType\":\"SINGLE_CHOICE\",\"isScored\":true,"
                + "\"options\":[{\"optionId\":11,\"text\":\"O\",\"isCorrect\":true}]}]");
        Map<String, String> expected = Map.of("SMP-TXT-01", "TEXT", "SMP-IMG-01", "IMAGE", "SMP-VDO-01", "VIDEO",
                "SMP-SVY-01", "SURVEY", "SMP-QIZ-01", "QUIZ", "SMP-VQZ-01", "QUIZ");
        for (Map<String, String> values : rows) {
            String id = values.get("POPU_CNTN_ID");
            assertTrue(values.get("CNTN_CN").getBytes(StandardCharsets.UTF_8).length <= 4000, id + " CLOB 리터럴 4000바이트 이하");
            JsonNode popup = service(toRow(values), (r, type) -> questions).nextPopup("E1001", id, null).get("popup");
            assertEquals(id, popup.get("popupId").asText());
            assertEquals(expected.get(id), popup.get("popupType").asText(), id);
        }
        JsonNode video = service(toRow(rows.get(2))).nextPopup("E1001", null, null).get("popup");
        assertEquals("https://files.example.com/popup/popup/sample/video/training.mp4", video.get("content").get("videoUrl").asText());
        JsonNode image = service(toRow(rows.get(1))).nextPopup("E1001", null, null).get("popup");
        assertEquals("https://files.example.com/popup/popup/sample/image/notice.png", image.get("content").get("imageUrl").asText());
        assertFalse(image.has("width"), "IMAGE 크기 NULL이면 생략");
        JsonNode text = service(toRow(rows.get(0))).nextPopup("E1001", null, null).get("popup");
        assertEquals("TOP_RIGHT", text.get("popupPosition").asText());
        assertEquals("시스템 점검 안내\n02:00~06:00", text.get("content").get("plainText").asText());
        JsonNode videoQuiz = service(toRow(rows.get(5)), (r, type) -> questions).nextPopup("E1001", null, null).get("popup");
        assertTrue(videoQuiz.get("content").get("videoEnabled").booleanValue());
        assertEquals("https://files.example.com/popup/popup/sample/video/training.mp4", videoQuiz.get("content").get("videoUrl").asText(),
                "영상+퀴즈도 영상 컬럼 URL이 content.videoUrl보다 우선");
        assertEquals(1.0, videoQuiz.get("completionRatio").doubleValue());
        assertEquals(PopupSampleException.Reason.QUESTIONS_NOT_CONNECTED,
                assertThrows(PopupSampleException.class, () -> service(toRow(rows.get(3))).nextPopup("E1001", null, null)).reason(),
                "문항 미연결 상태의 SURVEY는 오류가 정상");
    }

    /**
     * DTIY3111 사진 정의(docs/interfaces/DTIY3111_SCHEMA_OCR.md) 기준 범위 검증. 실제 DB 실행이 아니다.
     * 길이는 BYTE·AL32UTF8 가정(한글 3바이트)으로 본다 — CHAR 정의여도 이 기준을 통과하면 들어간다.
     */
    @Test
    void sampleInsertSqlMatchesPhotoSchema() throws Exception {
        String sql = readResource("/sample/single-query/DTIY3111_sample_insert_oracle.sql");
        Map<String, Integer> varcharBytes = Map.ofEntries(Map.entry("POPU_CNTN_ID", 10), Map.entry("POPU_CNTN_TP_CD", 2),
                Map.entry("POPU_CNTN_NM", 200), Map.entry("HDR_TITL", 200), Map.entry("AFTR_CNFM_OBJ_YN", 1),
                Map.entry("FTR_BTN_TP_CD", 2), Map.entry("FTR_URL", 200), Map.entry("APND_FILE_ID", 16),
                Map.entry("IMG_FILE_PATH_CN", 1000), Map.entry("IMG_FILE_NM", 200), Map.entry("VDO_FILE_PATH_CN", 2000),
                Map.entry("VDO_FILE_NM", 200), Map.entry("DEL_YN", 1), Map.entry("REG_USER_ID", 6), Map.entry("CHNG_USER_ID", 6));
        Set<String> photoColumns = new HashSet<>(varcharBytes.keySet());
        photoColumns.addAll(List.of("POPU_WDTH_SZ", "POPU_LNTH_SZ", "CNTN_CN", "REG_DTTM", "CHNG_DTTM"));
        assertEquals(20, photoColumns.size(), "사진 컬럼 20개");
        List<Map<String, String>> rows = parseInserts(sql);
        List<String> ids = new ArrayList<>();
        for (Map<String, String> row : rows) {
            String id = row.get("POPU_CNTN_ID");
            ids.add(id);
            assertTrue(photoColumns.containsAll(row.keySet()), id + " 사진에 없는 컬럼: " + row.keySet());
            assertFalse(row.containsKey("DEL_YN"), "삭제 코드 미확정 — DEL_YN은 넣지 않는다");
            assertEquals("SAMPLE", row.get("REG_USER_ID"), id + " 등록자(NULLABLE=N)");
            assertEquals("SYSDATE", row.get("REG_DTTM"), id + " 등록일시(NULLABLE=N)");
            for (Map.Entry<String, Integer> limit : varcharBytes.entrySet()) {
                String value = row.get(limit.getKey());
                if (value != null) {
                    assertTrue(value.getBytes(StandardCharsets.UTF_8).length <= limit.getValue(), id + " " + limit.getKey() + " 길이: " + value);
                }
            }
            for (String size : List.of("POPU_WDTH_SZ", "POPU_LNTH_SZ")) {
                String value = row.get(size);
                if (value != null) {
                    BigDecimal number = new BigDecimal(value);
                    assertTrue(number.scale() <= 0 && number.precision() <= 5, id + " " + size + " NUMBER(5) 정수: " + value);
                }
            }
        }
        assertEquals(6, new HashSet<>(ids).size(), "샘플 ID 중복 없음");
        int deleteAt = sql.indexOf("DELETE FROM DTIY3111");
        String delete = sql.substring(deleteAt, sql.indexOf(';', deleteAt));
        assertFalse(delete.contains("LIKE"), "DELETE는 샘플 ID만 지정");
        for (String id : ids) assertTrue(delete.contains("'" + id + "'"), "DELETE 대상: " + id);
    }

    /** 파일 URL은 유형별 컬럼으로 만들고(영상 없는 QUIZ 제외), 파일명이 없으면 content URL을 유지한다. */
    @Test
    void fileColumnsFollowTypeAndNeedFileName() throws Exception {
        ArrayNode questions = (ArrayNode) json.readTree("[{\"questionId\":1,\"title\":\"q\",\"questionType\":\"SINGLE_CHOICE\",\"options\":[]}]");
        PopupContentRow video = row("30", "{\"videoUrl\":\"https://old.example.com/v.mp4\"}");
        video.setImageFilePath("img");
        video.setImageFileName("a.png");
        video.setVideoFilePath("vdo");
        video.setVideoFileName("b.mp4");
        assertEquals("https://files.example.com/popup/vdo/b.mp4",
                service(video).nextPopup("E1001", null, null).get("popup").get("content").get("videoUrl").asText());

        PopupContentRow quiz = row("50", "{\"surveyTitle\":\"q\",\"videoEnabled\":false}");
        quiz.setVideoFilePath("vdo");
        quiz.setVideoFileName("b.mp4");
        assertEquals("", service(quiz, (r, type) -> questions).nextPopup("E1001", null, null).get("popup").get("content").path("videoUrl").asText(""),
                "영상 없는 QUIZ에는 영상 컬럼을 적용하지 않는다");

        PopupContentRow pathOnly = row("20", "{\"imageUrl\":\"https://old.example.com/a.png\"}");
        pathOnly.setImageFilePath("img/only");
        assertEquals("https://old.example.com/a.png",
                service(pathOnly).nextPopup("E1001", null, null).get("popup").get("content").get("imageUrl").asText(), "경로만 있으면 content URL 유지");

        PopupContentRow nameOnly = row("20", "{\"imageUrl\":\"https://old.example.com/a.png\"}");
        nameOnly.setImageFileName("a b.png");
        assertEquals("https://files.example.com/popup/a%20b.png",
                service(nameOnly).nextPopup("E1001", null, null).get("popup").get("content").get("imageUrl").asText(), "파일명만 있으면 기준 주소 아래");
    }

    private static String readResource(String path) throws IOException {
        try (InputStream in = PopupSingleQuerySampleTest.class.getResourceAsStream(path)) {
            assertTrue(in != null, path);
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    /** 샘플 SQL 형식(컬럼 목록 + 문자열 리터럴·NULL·숫자·식 이름·|| 연결)만 읽는 간이 파서. 블록 주석·줄 주석은 건너뛴다. */
    private static List<Map<String, String>> parseInserts(String sql) {
        String body = sql.replaceAll("(?s)/\\*.*?\\*/", "").replaceAll("(?m)^\\s*--.*$", "");
        List<Map<String, String>> rows = new ArrayList<>();
        int at = 0;
        while ((at = body.indexOf("INSERT INTO DTIY3111", at)) >= 0) {
            int open = body.indexOf('(', at), close = body.indexOf(')', open);
            String[] columns = body.substring(open + 1, close).replaceAll("\\s", "").split(",");
            int i = body.indexOf('(', body.indexOf("VALUES", close)) + 1;
            List<String> values = new ArrayList<>();
            StringBuilder current = null;
            boolean isNull = false;
            while (true) {
                char c = body.charAt(i);
                if (c == '\'') {
                    int k = i + 1;
                    StringBuilder literal = new StringBuilder();
                    while (true) {
                        if (body.charAt(k) == '\'') {
                            if (body.charAt(k + 1) == '\'') { literal.append('\''); k += 2; continue; }
                            break;
                        }
                        literal.append(body.charAt(k++));
                    }
                    current = current == null ? literal : current.append(literal);
                    i = k + 1;
                } else if (c == ',' || c == ')') {
                    values.add(isNull ? null : current == null ? null : current.toString());
                    current = null; isNull = false;
                    i++;
                    if (c == ')') break;
                } else if (Character.isLetter(c)) {
                    int k = i;
                    while (Character.isLetterOrDigit(body.charAt(k)) || body.charAt(k) == '_') k++;
                    String word = body.substring(i, k);
                    if ("NULL".equals(word)) isNull = true; else current = new StringBuilder(word);   // SYSDATE 등 식은 이름 그대로
                    i = k;
                } else if (Character.isDigit(c)) {
                    int k = i;
                    while (Character.isDigit(body.charAt(k)) || body.charAt(k) == '.') k++;
                    current = new StringBuilder(body.substring(i, k));
                    i = k;
                } else {
                    i++;   // 공백·줄바꿈·|| 연결 연산자
                }
            }
            assertEquals(columns.length, values.size(), "컬럼·값 개수");
            Map<String, String> row = new LinkedHashMap<>();
            for (int c = 0; c < columns.length; c++) row.put(columns[c], values.get(c));
            rows.add(row);
            at = i;
        }
        return rows;
    }

    private static PopupContentRow toRow(Map<String, String> v) {
        PopupContentRow row = new PopupContentRow();
        row.setContentId(v.get("POPU_CNTN_ID"));
        row.setContentTypeCode(v.get("POPU_CNTN_TP_CD"));
        row.setHeaderTitle(v.get("HDR_TITL"));
        row.setWidth(v.get("POPU_WDTH_SZ") == null ? null : new BigDecimal(v.get("POPU_WDTH_SZ")));
        row.setHeight(v.get("POPU_LNTH_SZ") == null ? null : new BigDecimal(v.get("POPU_LNTH_SZ")));
        row.setAfterConfirmYn(v.get("AFTR_CNFM_OBJ_YN"));
        row.setFooterButtonTypeCode(v.get("FTR_BTN_TP_CD"));
        row.setFooterUrl(v.get("FTR_URL"));
        row.setImageFilePath(v.get("IMG_FILE_PATH_CN"));
        row.setImageFileName(v.get("IMG_FILE_NM"));
        row.setVideoFilePath(v.get("VDO_FILE_PATH_CN"));
        row.setVideoFileName(v.get("VDO_FILE_NM"));
        row.setAttachFileId(v.get("APND_FILE_ID"));
        row.setContentJson(v.get("CNTN_CN"));
        return row;
    }
}
