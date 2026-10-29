package server.service.core.popup.sample.fulljson;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import server.repo.core.mapper.popup.sample.fulljson.PopupFullJsonRegisterSampleMapper;

/**
 * POL-01-02 : 기본값의 적용
 * POL-16-02 : 재현 가능한 검증
 * ■ 등록·수정 공통 JSON 검증·기본값 생성 테스트
 * - 유형별 정상·누락·null·타입 불일치·ENUM·범위·중첩 문항 검사, 멱등성, 등록 샘플의 "오류 시 쓰기 0건"을 DB 없이 확인한다.
 * - 기본값은 실제 배포 파일(classpath:popup/sample/popup-full-json-defaults.yml)을 읽는다.
 */
class PopupJsonValidatorTest {

    private static final String DEFAULTS = "/popup/sample/popup-full-json-defaults.yml";
    private final ObjectMapper json = new ObjectMapper();
    private final PopupJsonValidator validator = new PopupJsonValidator(json,
            PopupFullJsonDefaults.load(PopupJsonValidatorTest.class.getResourceAsStream(DEFAULTS), json, DEFAULTS));

    private static final Map<String, String> MINIMAL = Map.of(
            "TEXT", "{\"popupType\":\"TEXT\",\"content\":{\"plainText\":\"본문\"}}",
            "IMAGE", "{\"popupType\":\"IMAGE\",\"content\":{\"imageUrl\":\"https://f.example.com/a.png\"}}",
            "VIDEO", "{\"popupType\":\"VIDEO\",\"content\":{\"videoUrl\":\"https://f.example.com/a.mp4\"}}",
            "SURVEY", "{\"popupType\":\"SURVEY\",\"questions\":[{\"questionType\":\"TEXT\",\"title\":\"의견\"}]}",
            "QUIZ", "{\"popupType\":\"QUIZ\",\"questions\":[{\"questionType\":\"SINGLE_CHOICE\",\"options\":[{\"optionId\":1,\"isCorrect\":true}]}]}",
            "VIDEO_QUIZ", "{\"popupType\":\"QUIZ\",\"content\":{\"videoEnabled\":true,\"videoUrl\":\"https://f.example.com/a.mp4\"},"
                    + "\"questions\":[{\"questionType\":\"TEXT\"}]}");

    private PopupJsonValidationResult validate(String input) {
        return validator.validate(input, "P-001");
    }

    private ObjectNode normalized(String input) {
        PopupJsonValidationResult result = validate(input);
        assertTrue(result.valid(), () -> "오류 없어야 함: " + result.errors());
        return result.normalized();
    }

    private PopupJsonIssue onlyError(String input) {
        PopupJsonValidationResult result = validate(input);
        assertFalse(result.valid());
        assertNull(result.normalized(), "오류가 있으면 부분 보정 결과를 내주지 않는다");
        assertEquals(1, result.errors().size(), () -> "오류 1건이어야 함: " + result.errors());
        return result.errors().get(0);
    }

    // ---------- 유형별 정상·기본값 ----------

    @Test
    void minimalJsonPerTypeIsValidAndIdempotent() throws Exception {
        for (String type : List.of("TEXT", "IMAGE", "VIDEO", "SURVEY", "QUIZ", "VIDEO_QUIZ")) assertMinimalIdempotent(type);
    }

    private void assertMinimalIdempotent(String type) throws Exception {
        PopupJsonValidationResult first = validate(MINIMAL.get(type));
        assertTrue(first.valid(), () -> type + " " + first.errors());
        assertFalse(first.changes().isEmpty(), "누락 옵션에 기본값 이력이 남는다");
        assertEquals("P-001", first.normalized().get("popupId").textValue());
        assertEquals(PopupJsonValidator.POLICY_VERSION, first.policyVersion());

        // 정규화 결과를 다시 넣으면 같은 결과이고 이력이 없다(멱등).
        PopupJsonValidationResult second = validate(json.writeValueAsString(first.normalized()));
        assertTrue(second.valid());
        assertEquals(first.normalized(), second.normalized());
        assertTrue(second.changes().isEmpty(), () -> type + " 재실행 이력: " + second.changes());
    }

    /** 확정 등록 기본값: IMAGE·VIDEO showDescription=false, VIDEO allowSeek·allowPlaybackRateChange=false(영상 QUIZ도 상속). */
    @Test
    void registrationDefaultsFollow3117Policy() {
        assertFalse(normalized(MINIMAL.get("IMAGE")).at("/content/showDescription").booleanValue());
        for (String type : List.of("VIDEO", "VIDEO_QUIZ")) {
            JsonNode content = normalized(MINIMAL.get(type)).get("content");
            assertFalse(content.get("showDescription").booleanValue(), type);
            assertFalse(content.get("allowSeek").booleanValue(), type);
            assertFalse(content.get("allowPlaybackRateChange").booleanValue(), type);
            assertEquals(0.7, content.get("defaultVolume").doubleValue(), type);
        }
        ObjectNode text = normalized(MINIMAL.get("TEXT"));
        assertEquals(900, text.get("width").intValue());
        assertEquals("CLOSE", text.get("footerAction").textValue());
        assertEquals("", text.get("title").textValue());
        assertTrue(text.has("headerFontSize") && text.get("headerFontSize").isNull(), "기본값 null 키는 null 유지");
        assertEquals("SUBMIT", normalized(MINIMAL.get("SURVEY")).get("footerAction").textValue());
        assertEquals(1.0, normalized(MINIMAL.get("VIDEO")).get("completionRatio").doubleValue());
    }

    /** 명시한 false·0은 유지하고 null만 기본값으로 채운다. */
    @Test
    void explicitFalseAndZeroArePreservedNullIsFilled() {
        ObjectNode popup = normalized("{\"popupType\":\"TEXT\",\"showHeader\":false,\"backgroundOverlayOpacity\":0,"
                + "\"showFooter\":null,\"content\":{\"plainText\":\"본문\",\"showPlainText\":false}}");
        assertFalse(popup.get("showHeader").booleanValue());
        assertEquals(0, popup.get("backgroundOverlayOpacity").doubleValue());
        assertTrue(popup.get("showFooter").booleanValue());
        assertFalse(popup.at("/content/showPlainText").booleanValue());
    }

    /** IMAGE 크기 미지정은 900×620을 채우지 않는다. ORIGINAL은 width/height 필수. */
    @Test
    void imageSizeRules() {
        ObjectNode image = normalized("{\"popupType\":\"IMAGE\",\"width\":null,\"content\":{\"imageUrl\":\"https://f.example.com/a.png\"}}");
        assertFalse(image.has("width") || image.has("height"));
        PopupJsonValidationResult original = validate("{\"popupType\":\"IMAGE\",\"width\":800,"
                + "\"content\":{\"imageUrl\":\"https://f.example.com/a.png\",\"imageSizeMode\":\"ORIGINAL\"}}");
        assertEquals(List.of("$.height:MISSING_REQUIRED"), codes(original));
    }

    // ---------- 타입·ENUM·범위 ----------

    /** 재현: videoEnabled="videoEnabled"는 등록 오류, true/false는 정상. 문자열을 boolean으로 바꾸지 않는다. */
    @Test
    void stringBooleanIsRejectedNotConverted() {
        PopupJsonIssue issue = onlyError("{\"popupType\":\"QUIZ\",\"content\":{\"videoEnabled\":\"videoEnabled\"},\"questions\":[{\"questionType\":\"TEXT\"}]}");
        assertEquals("$.content.videoEnabled", issue.path());
        assertEquals("TYPE_MISMATCH", issue.code());
        assertEquals("boolean", issue.expected());
        assertEquals("\"videoEnabled\"", issue.actual());
        assertTrue(validate("{\"popupType\":\"QUIZ\",\"content\":{\"videoEnabled\":false},\"questions\":[{\"questionType\":\"TEXT\"}]}").valid());
        assertEquals("TYPE_MISMATCH", onlyError("{\"popupType\":\"TEXT\",\"showHeader\":\"true\",\"content\":{\"plainText\":\"a\"}}").code());
    }

    @Test
    void enumAndRangeErrorsHaveDistinctCodes() {
        assertEquals("INVALID_ENUM", onlyError("{\"popupType\":\"TEXT\",\"sizeMode\":\"AUTO\",\"content\":{\"plainText\":\"a\"}}").code());
        assertEquals("OUT_OF_RANGE", onlyError("{\"popupType\":\"TEXT\",\"widthRatio\":1.5,\"content\":{\"plainText\":\"a\"}}").code());
        assertEquals("OUT_OF_RANGE", onlyError("{\"popupType\":\"TEXT\",\"hideDays\":0,\"content\":{\"plainText\":\"a\"}}").code());
        assertEquals("TYPE_MISMATCH", onlyError("{\"popupType\":\"TEXT\",\"hideDays\":1.5,\"content\":{\"plainText\":\"a\"}}").code());
        assertEquals("TYPE_MISMATCH", onlyError("{\"popupType\":\"TEXT\",\"content\":{\"plainText\":7}}").code());
        assertEquals("RULE_VIOLATION", onlyError("{\"popupType\":\"TEXT\",\"minimumWidth\":1300,\"content\":{\"plainText\":\"a\"}}").code());
    }

    /** 오류는 처음 하나에서 멈추지 않고 필드별로 모은다. */
    @Test
    void collectsAllErrors() {
        PopupJsonValidationResult result = validate("{\"popupType\":\"VIDEO\",\"showHeader\":\"Y\",\"sizeMode\":\"BIG\","
                + "\"content\":{\"allowSeek\":1}}");
        assertEquals(List.of("$.sizeMode:INVALID_ENUM", "$.showHeader:TYPE_MISMATCH", "$.content.allowSeek:TYPE_MISMATCH",
                "$.content.videoUrl:MISSING_REQUIRED"), codes(result));
    }

    // ---------- 구조·식별자 ----------

    @Test
    void structuralErrors() {
        assertEquals("INVALID_JSON", onlyError("{\"popupType\":").code());
        assertEquals("INVALID_JSON", onlyError(" ").code());
        assertEquals("NOT_OBJECT", onlyError("[]").code());
        assertEquals("ENVELOPE_NOT_ALLOWED", onlyError("{\"pollingIntervalSeconds\":1800,\"popup\":{\"popupType\":\"TEXT\"}}").code());
        PopupJsonIssue noType = onlyError("{\"content\":{\"plainText\":\"a\"}}");
        assertEquals("$.popupType:MISSING_REQUIRED", noType.path() + ":" + noType.code());
        assertEquals("INVALID_ENUM", onlyError("{\"popupType\":\"VIDEO_QUIZ\"}").code(), "영상 QUIZ는 QUIZ + videoEnabled");
        assertEquals(List.of("$.content:TYPE_MISMATCH", "$.content.plainText:MISSING_REQUIRED"),
                codes(validate("{\"popupType\":\"TEXT\",\"content\":[]}")));
    }

    /** deliveryId·pollingIntervalSeconds는 저장하지 않고, popupId는 DB 키와 대조한다. 계약 외 키는 제거한다. */
    @Test
    void serverOwnedAndIdentityHandling() {
        PopupJsonValidationResult result = validate("{\"popupType\":\"TEXT\",\"deliveryId\":\"x\",\"pollingIntervalSeconds\":5,"
                + "\"adminMemo\":\"내부\",\"content\":{\"plainText\":\"a\",\"popupPosition\":\"TOP_LEFT\"}}");
        ObjectNode popup = result.normalized();
        assertFalse(popup.has("deliveryId") || popup.has("pollingIntervalSeconds") || popup.has("adminMemo"));
        assertEquals("TOP_LEFT", popup.get("popupPosition").textValue(), "content 안 창 옵션은 최상위로 이동");
        assertFalse(popup.get("content").has("popupPosition"));
        List<String> reasons = result.changes().stream().map(PopupJsonChange::reason).toList();
        assertTrue(reasons.containsAll(List.of("SERVER_OWNED_REMOVED", "UNKNOWN_FIELD_REMOVED", "MOVED_FROM_CONTENT", "POPUP_ID_SET")));
        assertEquals("ID_MISMATCH", onlyError("{\"popupId\":\"P-999\",\"popupType\":\"TEXT\",\"content\":{\"plainText\":\"a\"}}").code());
    }

    /** 원본 입력 객체를 바꾸지 않는다. */
    @Test
    void inputIsNotMutated() throws Exception {
        JsonNode input = json.readTree("{\"popupType\":\"TEXT\",\"deliveryId\":\"x\",\"content\":{\"plainText\":\"a\"}}");
        JsonNode copy = input.deepCopy();
        validator.validate(input, "P-001");
        assertEquals(copy, input);
    }

    // ---------- 푸터·문항 ----------

    @Test
    void footerRules() {
        assertEquals("RULE_VIOLATION", onlyError("{\"popupType\":\"SURVEY\",\"footerAction\":\"CLOSE\",\"questions\":[{\"questionType\":\"TEXT\"}]}").code());
        assertEquals("RULE_VIOLATION", onlyError("{\"popupType\":\"TEXT\",\"footerAction\":\"SUBMIT\",\"content\":{\"plainText\":\"a\"}}").code());
        assertEquals("MISSING_REQUIRED", onlyError("{\"popupType\":\"TEXT\",\"footerAction\":\"LINK_AND_CLOSE\",\"content\":{\"plainText\":\"a\"}}").code());
        assertEquals("RULE_VIOLATION", onlyError("{\"popupType\":\"TEXT\",\"footerAction\":\"LINK_AND_CLOSE\",\"footerLinkUrl\":\"/notice\",\"content\":{\"plainText\":\"a\"}}").code());
        ObjectNode link = normalized("{\"popupType\":\"TEXT\",\"footerAction\":\"LINK_AND_CLOSE\",\"footerLinkUrl\":\" https://a.example.com/n \",\"content\":{\"plainText\":\"a\"}}");
        assertEquals("https://a.example.com/n", link.get("footerLinkUrl").textValue());
        assertFalse(normalized("{\"popupType\":\"TEXT\",\"footerLinkUrl\":\"https://a.example.com\",\"content\":{\"plainText\":\"a\"}}").has("footerLinkUrl"),
                "CLOSE에는 링크를 저장하지 않는다");
    }

    /** SURVEY 정답 키는 관리자 원본 왕복을 위해 저장 시 유지한다(WPF 응답에서 빼는 것은 조회 책임). */
    @Test
    void surveyAnswersAreKeptInStoredJson() {
        ObjectNode survey = normalized("{\"popupType\":\"SURVEY\",\"questions\":[{\"questionType\":\"SINGLE_CHOICE\",\"correctAnswer\":\"1\","
                + "\"options\":[{\"optionId\":1,\"isCorrect\":true}]}]}");
        assertEquals("1", survey.at("/questions/0/correctAnswer").textValue());
        assertTrue(survey.at("/questions/0/options/0/isCorrect").booleanValue());
    }

    @Test
    void nestedQuestionErrors() {
        PopupJsonValidationResult result = validate("{\"popupType\":\"QUIZ\",\"questions\":[{\"questionType\":\"RADIO\"},"
                + "{\"questionType\":\"MULTIPLE_CHOICE\",\"isRequired\":\"Y\",\"options\":[{\"isCorrect\":\"true\"},3]},"
                + "{\"questionType\":\"SINGLE_CHOICE\"}]}");
        assertEquals(List.of("$.questions[0].questionType:INVALID_ENUM", "$.questions[1].isRequired:TYPE_MISMATCH",
                "$.questions[1].options[0].isCorrect:TYPE_MISMATCH", "$.questions[1].options[1]:TYPE_MISMATCH",
                "$.questions[2].options:MISSING_REQUIRED"), codes(result));
        assertEquals("MISSING_REQUIRED", onlyError("{\"popupType\":\"SURVEY\",\"questions\":[]}").code());
    }

    /** SURVEY 복수 선택 최소·최대 선택 수: 범위 안은 저장, 범위 밖·QUIZ·단일 선택·정수 아님은 오류. */
    @Test
    void surveySelectionLimits() {
        String options = "\"options\":[{\"optionId\":1},{\"optionId\":2},{\"optionId\":3}]";
        assertTrue(validate("{\"popupType\":\"SURVEY\",\"questions\":[{\"questionType\":\"MULTIPLE_CHOICE\",\"minSelections\":1,\"maxSelections\":3," + options + "}]}").valid());
        assertTrue(validate("{\"popupType\":\"SURVEY\",\"questions\":[{\"questionType\":\"MULTIPLE_CHOICE\",\"maxSelections\":null," + options + "}]}").valid());
        assertEquals("OUT_OF_RANGE", onlyError("{\"popupType\":\"SURVEY\",\"questions\":[{\"questionType\":\"MULTIPLE_CHOICE\",\"maxSelections\":4," + options + "}]}").code());
        assertEquals("RULE_VIOLATION", onlyError("{\"popupType\":\"SURVEY\",\"questions\":[{\"questionType\":\"MULTIPLE_CHOICE\",\"minSelections\":3,\"maxSelections\":2," + options + "}]}").code());
        assertEquals("TYPE_MISMATCH", onlyError("{\"popupType\":\"SURVEY\",\"questions\":[{\"questionType\":\"MULTIPLE_CHOICE\",\"minSelections\":\"2\"," + options + "}]}").code());
        assertEquals("RULE_VIOLATION", onlyError("{\"popupType\":\"SURVEY\",\"questions\":[{\"questionType\":\"SINGLE_CHOICE\",\"maxSelections\":1," + options + "}]}").code());
        assertEquals("RULE_VIOLATION", onlyError("{\"popupType\":\"QUIZ\",\"questions\":[{\"questionType\":\"MULTIPLE_CHOICE\",\"maxSelections\":2," + options + "}]}").code());
    }

    @Test
    void questionsAreDroppedForNonQuestionTypes() {
        assertTrue(normalized("{\"popupType\":\"TEXT\",\"content\":{\"plainText\":\"a\"},\"questions\":[{\"questionType\":\"TEXT\"}]}")
                .get("questions").isEmpty());
    }

    // ---------- 등록 샘플: 오류 시 쓰기 0건 ----------

    @Test
    void registerWritesOnlyWhenValid() throws Exception {
        FakeMapper mapper = new FakeMapper(1);
        PopupFullJsonRegisterSampleService service = new PopupFullJsonRegisterSampleService(mapper, validator, json);

        PopupJsonValidationResult bad = service.register("P-001", "{\"popupType\":\"QUIZ\",\"content\":{\"videoEnabled\":\"videoEnabled\"}}", "E10001");
        assertFalse(bad.valid());
        assertTrue(mapper.calls.isEmpty(), "ERROR면 DB 호출 0건");

        PopupJsonValidationResult ok = service.register(" P-001 ", MINIMAL.get("VIDEO"), "E10001");
        assertTrue(ok.valid());
        assertEquals(1, mapper.calls.size());
        assertEquals("insert:P-001:E10001", mapper.calls.get(0));
        assertEquals(ok.normalized(), json.readTree(mapper.lastJson), "정규화 결과를 그대로 저장");
        assertFalse(json.readTree(mapper.lastJson).has("deliveryId"));
    }

    @Test
    void updateRequiresExistingRowAndKeys() {
        PopupFullJsonRegisterSampleService missing = new PopupFullJsonRegisterSampleService(new FakeMapper(0), validator, json);
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> missing.update("P-001", MINIMAL.get("TEXT"), "E10001"));
        FakeMapper mapper = new FakeMapper(1);
        PopupFullJsonRegisterSampleService service = new PopupFullJsonRegisterSampleService(mapper, validator, json);
        assertTrue(service.update("P-001", MINIMAL.get("TEXT"), "E10001").valid());
        assertEquals("update:P-001:E10001", mapper.calls.get(0));
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> service.register(" ", MINIMAL.get("TEXT"), "E10001"));
        org.junit.jupiter.api.Assertions.assertThrows(IllegalArgumentException.class, () -> service.register("P-001", MINIMAL.get("TEXT"), null));
    }

    private static List<String> codes(PopupJsonValidationResult result) {
        return result.errors().stream().map(e -> e.path() + ":" + e.code()).toList();
    }

    /** 호출 기록용 가짜 등록 매퍼. rows = UPDATE·INSERT 반영 행 수. */
    private static final class FakeMapper implements PopupFullJsonRegisterSampleMapper {
        private final int rows;
        final List<String> calls = new ArrayList<>();
        String lastJson;

        FakeMapper(int rows) { this.rows = rows; }

        @Override public int insertBulletin(String popupId, String popupJson, String userId) { return record("insert", popupId, popupJson, userId); }

        @Override public int updateBulletin(String popupId, String popupJson, String userId) { return record("update", popupId, popupJson, userId); }

        private int record(String kind, String popupId, String popupJson, String userId) {
            calls.add(kind + ":" + popupId + ":" + userId);
            lastJson = popupJson;
            return rows;
        }
    }
}
