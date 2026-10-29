package server.service.core.popup.sample.fulljson;

import java.net.URI;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * POL-01-02 : 기본값의 적용
 * POL-14-03 : 서버 인계 예제
 * ■ 등록·수정 공통 popup JSON 검증 + 기본값 생성
 * - in : popup JSON(문자열 또는 JsonNode) · popupId(DB 키, 없으면 null)
 * - out: {@link PopupJsonValidationResult} — 정규화 popup 또는 구조화 오류 + 기본값 적용 이력. 예외를 던지지 않는다.
 * - 흐름: 객체 확인 → envelope 거절 → 서버 소유 키 제거 → popupId 대조 → content/questions 분리 → content 안 창·푸터 옵션 이동
 *   → 계약 외 키 제거 → 명시값 타입·ENUM·범위 → 필수 콘텐츠 → 누락/null 기본값 → 푸터·유형별 조건 → 문항 → 응답과 같은 키 순서로 조립.
 *
 * <p>등록·수정 서비스는 DB 쓰기 직전에 이 클래스를 호출하고 {@link PopupJsonValidationResult#valid()}일 때만 {@code normalized()}를 저장한다.
 * 규칙·기본값은 {@link PopupFullJsonDefaults}(규칙 표 + popup-full-json-defaults.yml)를 그대로 쓴다. 규칙을 따로 복제하지 않는다.</p>
 *
 * <h3>처리 기준</h3>
 * <table>
 *   <tr><th>입력</th><th>처리</th></tr>
 *   <tr><td>명시값 타입·ENUM·범위 오류(예: {@code videoEnabled:"videoEnabled"}, {@code "true"})</td><td>오류. 자동 변환·기본값 대체 없음</td></tr>
 *   <tr><td>누락·null</td><td>기본값 적용(이력 기록). 명시한 false·0·빈 문자열은 유지. 기본값이 null인 키(글자 크기·hideDays)는 null 유지</td></tr>
 *   <tr><td>deliveryId·pollingIntervalSeconds</td><td>서버 소유라 제거(경고). 저장 JSON에 영속화하지 않는다</td></tr>
 *   <tr><td>popupId</td><td>DB 키와 다르면 오류, 없으면 DB 키로 채움</td></tr>
 *   <tr><td>응답 envelope({@code {popup:{...}}})</td><td>오류. 저장 JSON은 popup 본체다</td></tr>
 *   <tr><td>SURVEY 정답 키</td><td>관리자 원본 왕복을 위해 저장 시 유지. WPF 응답에서 빼는 것은 조회 책임</td></tr>
 * </table>
 *
 * <p>같은 입력을 두 번 정규화하면 결과가 같고 두 번째에는 변경 이력이 없다(멱등). 기존 3111 조립기 기본값과는 별개이며
 * 3111 저장 형식이 정해지면 같은 결과 형식으로 확장한다. WPF Demo JSON Validator(C#)는 진단용으로 이 클래스와 코드를 공유하지 않는다.</p>
 */
public class PopupJsonValidator {

    /** 규칙·기본값을 바꾸면 올린다. 저장 이력·오류 응답에 함께 남길 수 있다. */
    public static final String POLICY_VERSION = "3117-REG-2026-10-29";

    private static final Set<String> SERVER_OWNED_KEYS = Set.of("deliveryId", "pollingIntervalSeconds");
    /** content 안에 들어올 수 있는 최상위 창·푸터 옵션(조회 샘플과 같은 호환 규칙). */
    private static final List<String> PROMOTABLE_KEYS = List.of("useBackgroundOverlay", "backgroundOverlayOpacity", "popupPosition",
            "headerFontSize", "bodyFontSize", "footerFontSize", "footerAction", "footerLinkUrl");
    private static final Set<String> QUESTION_TYPES = Set.of("SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT");
    private static final int ACTUAL_MAX = 200;

    private final ObjectMapper objectMapper;
    private final PopupFullJsonDefaults defaults;

    /** ■ 생성 - in : ObjectMapper·기동 시 읽은 3117 기본값 - out: 상태 없는 검증기(스레드 안전) */
    public PopupJsonValidator(ObjectMapper objectMapper, PopupFullJsonDefaults defaults) {
        this.objectMapper = objectMapper;
        this.defaults = defaults;
    }

    /**
     * ■ 문자열 검증
     * - in : json(String) 관리자 화면·API가 보낸 popup JSON · popupId(String, null 허용)
     * - out: 검증 결과(구문 오류도 INVALID_JSON 오류로 돌려준다)
     */
    public PopupJsonValidationResult validate(String json, String popupId) {
        if (json == null || json.isBlank()) {
            return failed(new PopupJsonIssue("$", "INVALID_JSON", "popup JSON 객체", "(empty)", "JSON이 비었습니다."));
        }
        try {
            return validate(objectMapper.readTree(json), popupId);
        } catch (JsonProcessingException ex) {
            return failed(new PopupJsonIssue("$", "INVALID_JSON", "popup JSON 객체", "(syntax error)",
                    "JSON 구문 오류(line " + ex.getLocation().getLineNr() + ", column " + ex.getLocation().getColumnNr() + ")"));
        }
    }

    /**
     * ■ JsonNode 검증
     * - in : input(JsonNode) 원본(변경하지 않음) · popupId(String, null 허용)
     * - out: 검증 결과
     */
    public PopupJsonValidationResult validate(JsonNode input, String popupId) {
        List<PopupJsonIssue> errors = new ArrayList<>();
        List<PopupJsonChange> changes = new ArrayList<>();
        if (input == null || !input.isObject()) {
            return failed(new PopupJsonIssue("$", "NOT_OBJECT", "object", actual(input), "최상위는 popup JSON 객체여야 합니다."));
        }
        ObjectNode work = ((ObjectNode) input).deepCopy();
        if (work.has("popup")) {
            return failed(new PopupJsonIssue("$.popup", "ENVELOPE_NOT_ALLOWED", "popup 본체", "{popup:...}",
                    "저장 JSON은 조회 응답 envelope가 아니라 popup 객체 본체입니다."));
        }
        for (String key : SERVER_OWNED_KEYS) {
            JsonNode removed = work.remove(key);
            if (removed != null) changes.add(new PopupJsonChange("$." + key, actual(removed), PopupJsonChange.REMOVED, "SERVER_OWNED_REMOVED"));
        }
        applyPopupId(work, popupId, errors, changes);

        ObjectNode content = takeContent(work, errors);
        ArrayNode questions = takeQuestions(work, errors);
        promoteFromContent(work, content, changes);
        dropUnknownKeys(work, changes);

        checkRules(work, PopupFullJsonDefaults.POPUP_RULES, "$", errors);
        checkRules(work, PopupFullJsonDefaults.POPUP_VALUE_RULES, "$", errors);
        String type = popupType(work, errors);
        if (type == null) return new PopupJsonValidationResult(POLICY_VERSION, null, errors, changes);

        checkRules(content, PopupFullJsonDefaults.CONTENT_RULES.get(type), "$.content", errors);
        boolean video = "VIDEO".equals(type) || ("QUIZ".equals(type) && content.path("videoEnabled").asBoolean(false));
        if (video && "QUIZ".equals(type)) checkRules(content, PopupFullJsonDefaults.CONTENT_RULES.get("VIDEO"), "$.content", errors);
        checkContentValues(type, video, content, errors);

        // 필수 콘텐츠는 기본값을 채우기 전 원본으로 본다(기본값이 누락을 가리지 않게).
        checkRequired(type, video, work, content, questions, errors);
        applyPopupDefaults(type, video, work, changes);
        applyFooter(type, work, errors, changes);
        checkSizeBounds(work, errors);
        fill(content, defaults.contentDefaults(type), "$.content", changes);
        if (video && "QUIZ".equals(type)) fill(content, defaults.contentDefaults("VIDEO"), "$.content", changes);
        ArrayNode cleanQuestions = checkQuestions(type, questions, errors, changes);

        ObjectNode popup = objectMapper.createObjectNode();
        for (String key : PopupFullJsonSampleService.OUTPUT_ORDER) {
            if (work.has(key)) popup.set(key, work.get(key));
        }
        popup.set("questions", cleanQuestions);
        popup.set("content", content);
        return new PopupJsonValidationResult(POLICY_VERSION, popup, errors, changes);
    }

    private PopupJsonValidationResult failed(PopupJsonIssue issue) {
        return new PopupJsonValidationResult(POLICY_VERSION, null, List.of(issue), List.of());
    }

    /** DB 키가 있으면 저장 JSON popupId와 대조하고 없으면 채운다. */
    private static void applyPopupId(ObjectNode work, String popupId, List<PopupJsonIssue> errors, List<PopupJsonChange> changes) {
        if (popupId == null) return;
        JsonNode stored = work.get("popupId");
        if (stored == null || stored.isNull()) {
            work.put("popupId", popupId);
            changes.add(new PopupJsonChange("$.popupId", stored == null ? PopupJsonChange.MISSING : "null", popupId, "POPUP_ID_SET"));
        } else if (!stored.isTextual() || !popupId.equals(stored.textValue())) {
            errors.add(new PopupJsonIssue("$.popupId", "ID_MISMATCH", popupId, actual(stored), "popupId가 등록 대상 POPU_ID와 다릅니다."));
        }
    }

    /** content를 떼어 낸다. 누락·null은 빈 객체(필수 검사에서 걸러진다), 객체가 아니면 오류. */
    private ObjectNode takeContent(ObjectNode work, List<PopupJsonIssue> errors) {
        JsonNode node = work.remove("content");
        if (node instanceof ObjectNode object) return object;
        if (node != null && !node.isNull()) errors.add(new PopupJsonIssue("$.content", "TYPE_MISMATCH", "object", actual(node), "content는 객체여야 합니다."));
        return objectMapper.createObjectNode();
    }

    /** questions를 떼어 낸다. 누락·null은 빈 배열, 배열이 아니면 오류. */
    private ArrayNode takeQuestions(ObjectNode work, List<PopupJsonIssue> errors) {
        JsonNode node = work.remove("questions");
        if (node instanceof ArrayNode array) return array;
        if (node != null && !node.isNull()) errors.add(new PopupJsonIssue("$.questions", "TYPE_MISMATCH", "array", actual(node), "questions는 배열이어야 합니다."));
        return objectMapper.createArrayNode();
    }

    /** content 안의 창·푸터 옵션을 최상위로 옮긴다(최상위 값이 있으면 최상위 우선). */
    private static void promoteFromContent(ObjectNode work, ObjectNode content, List<PopupJsonChange> changes) {
        for (String key : PROMOTABLE_KEYS) {
            JsonNode value = content.remove(key);
            if (value == null) continue;
            if (work.has(key)) {
                changes.add(new PopupJsonChange("$.content." + key, actual(value), PopupJsonChange.REMOVED, "MOVED_FROM_CONTENT"));
            } else {
                work.set(key, value);
                changes.add(new PopupJsonChange("$.content." + key, actual(value), "$." + key, "MOVED_FROM_CONTENT"));
            }
        }
    }

    /** 계약에 없는 최상위 키(관리용 등)를 뺀다. */
    private static void dropUnknownKeys(ObjectNode work, List<PopupJsonChange> changes) {
        List<String> unknown = new ArrayList<>();
        for (Iterator<String> it = work.fieldNames(); it.hasNext(); ) {
            String key = it.next();
            if (!PopupFullJsonDefaults.POPUP_RULES.containsKey(key) && !PopupFullJsonDefaults.POPUP_VALUE_RULES.containsKey(key)) unknown.add(key);
        }
        for (String key : unknown) {
            changes.add(new PopupJsonChange("$." + key, actual(work.remove(key)), PopupJsonChange.REMOVED, "UNKNOWN_FIELD_REMOVED"));
        }
    }

    /** 명시값(키가 있고 null 아님)만 규칙으로 검사해 오류를 모은다. */
    private static void checkRules(ObjectNode node, Map<String, PopupFullJsonDefaults.Rule> rules, String prefix, List<PopupJsonIssue> errors) {
        if (rules == null) return;
        rules.forEach((key, rule) -> {
            JsonNode value = node.get(key);
            if (value != null && !value.isNull() && !rule.accepts(value)) {
                errors.add(new PopupJsonIssue(prefix + "." + key, rule.issueCode(value), rule.describe(), actual(value),
                        key + " 값이 올바르지 않습니다."));
            }
        });
    }

    /** popupType 필수. 누락·잘못된 값이면 유형별 검사를 할 수 없어 null. */
    private static String popupType(ObjectNode work, List<PopupJsonIssue> errors) {
        JsonNode type = work.get("popupType");
        if (type == null || type.isNull()) {
            errors.add(new PopupJsonIssue("$.popupType", "MISSING_REQUIRED", "TEXT/IMAGE/VIDEO/SURVEY/QUIZ", PopupJsonChange.MISSING, "popupType이 필요합니다."));
            return null;
        }
        return PopupFullJsonDefaults.POPUP_VALUE_RULES.get("popupType").accepts(type) ? type.textValue() : null;
    }

    /** 기본값 규칙 표에 없는 content 본문 필드의 타입(문자열 URL·본문, 서식 배열). */
    private static void checkContentValues(String type, boolean video, ObjectNode content, List<PopupJsonIssue> errors) {
        if ("TEXT".equals(type)) {
            requireKind(content, "plainText", "$.content", JsonNode::isTextual, "string", errors);
            requireKind(content, "textBlocks", "$.content", JsonNode::isArray, "array", errors);
        }
        if ("IMAGE".equals(type)) requireKind(content, "imageUrl", "$.content", JsonNode::isTextual, "string", errors);
        if (video) requireKind(content, "videoUrl", "$.content", JsonNode::isTextual, "string", errors);
    }

    private static void requireKind(ObjectNode node, String key, String prefix, java.util.function.Predicate<JsonNode> check, String expected,
                                    List<PopupJsonIssue> errors) {
        JsonNode value = node.get(key);
        if (value != null && !value.isNull() && !check.test(value)) {
            errors.add(new PopupJsonIssue(prefix + "." + key, "TYPE_MISMATCH", expected, actual(value), key + " 값의 타입이 올바르지 않습니다."));
        }
    }

    /** 유형별 필수 콘텐츠와 IMAGE ORIGINAL 크기. */
    private static void checkRequired(String type, boolean video, ObjectNode work, ObjectNode content, ArrayNode questions, List<PopupJsonIssue> errors) {
        switch (type) {
            case "TEXT" -> {
                boolean text = !content.path("plainText").asText("").isBlank();
                boolean blocks = content.path("textBlocks").isArray() && !content.path("textBlocks").isEmpty();
                if (!text && !blocks) errors.add(missing("$.content.plainText", "plainText 또는 textBlocks 본문이 필요합니다."));
            }
            case "IMAGE" -> {
                if (content.path("imageUrl").asText("").isBlank()) errors.add(missing("$.content.imageUrl", "이미지 URL이 필요합니다."));
                if ("ORIGINAL".equals(content.path("imageSizeMode").asText())) {
                    for (String key : List.of("width", "height")) {
                        if (!work.hasNonNull(key)) errors.add(missing("$." + key, "IMAGE ORIGINAL은 width/height가 필요합니다."));
                    }
                }
            }
            case "SURVEY", "QUIZ" -> {
                if (questions.isEmpty()) errors.add(missing("$.questions", type + "는 문항이 1개 이상 필요합니다."));
            }
            default -> { }
        }
        if (video && content.path("videoUrl").asText("").isBlank()) errors.add(missing("$.content.videoUrl", "동영상 URL이 필요합니다."));
    }

    /** popup 최상위 기본값과 유형별 조건(IMAGE 크기 미지정·영상 완료 비율·QUIZ 통과 점수). footerAction은 {@link #applyFooter}. */
    private void applyPopupDefaults(String type, boolean video, ObjectNode work, List<PopupJsonChange> changes) {
        ObjectNode base = defaults.popupDefaults();
        if ("IMAGE".equals(type)) {
            // 크기 미지정 = 원본 기준. 900×620을 채우지 않고 null 키도 남기지 않는다.
            for (String key : List.of("width", "height")) {
                if (work.has(key) && work.get(key).isNull()) {
                    work.remove(key);
                    changes.add(new PopupJsonChange("$." + key, "null", PopupJsonChange.REMOVED, "NOT_APPLICABLE_REMOVED"));
                }
                base.remove(key);
            }
        }
        base.remove("footerAction");
        fill(work, base, "$", changes);
        if (!work.hasNonNull("title")) setDefault(work, "title", work.textNode(""), "$", changes);
        if (video) {
            if (!work.hasNonNull("completionRatio")) setDefault(work, "completionRatio", work.numberNode(1.0), "$", changes);
        } else {
            removeNotApplicable(work, "completionRatio", changes);
        }
        if (!"QUIZ".equals(type)) removeNotApplicable(work, "passingScore", changes);
    }

    /** POL-02-03 : 푸터 역할 — SURVEY·QUIZ는 SUBMIT만, 그 밖은 CLOSE·LINK_AND_CLOSE(절대 http/https URL 필수). */
    private void applyFooter(String type, ObjectNode work, List<PopupJsonIssue> errors, List<PopupJsonChange> changes) {
        boolean questionType = "SURVEY".equals(type) || "QUIZ".equals(type);
        JsonNode explicit = work.get("footerAction");
        if (explicit != null && !explicit.isNull() && !explicit.isTextual()) return; // 타입 오류는 규칙 검사에서 이미 기록
        if (explicit == null || explicit.isNull()) {
            setDefault(work, "footerAction", work.textNode(questionType ? "SUBMIT" : defaults.popupDefaults().get("footerAction").textValue()), "$", changes);
        }
        String action = work.get("footerAction").textValue();
        if (questionType && !"SUBMIT".equals(action)) {
            errors.add(new PopupJsonIssue("$.footerAction", "RULE_VIOLATION", "SUBMIT", action, type + "의 footerAction은 SUBMIT이어야 합니다."));
        }
        if (!questionType && "SUBMIT".equals(action)) {
            errors.add(new PopupJsonIssue("$.footerAction", "RULE_VIOLATION", "CLOSE/LINK_AND_CLOSE", action, "SUBMIT은 SURVEY·QUIZ만 사용할 수 있습니다."));
        }
        if ("LINK_AND_CLOSE".equals(action)) {
            String url = work.path("footerLinkUrl").isTextual() ? work.get("footerLinkUrl").textValue() : null;
            if (!isAbsoluteHttp(url)) {
                errors.add(new PopupJsonIssue("$.footerLinkUrl", url == null ? "MISSING_REQUIRED" : "RULE_VIOLATION", "절대 http/https URL",
                        actual(work.get("footerLinkUrl")), "LINK_AND_CLOSE에는 절대 http/https footerLinkUrl이 필요합니다."));
            } else if (!url.equals(url.trim())) {
                work.put("footerLinkUrl", url.trim());
                changes.add(new PopupJsonChange("$.footerLinkUrl", url, url.trim(), "VALUE_TRIMMED"));
            }
        } else {
            removeNotApplicable(work, "footerLinkUrl", changes);
        }
    }

    /** 최소 크기는 최대 크기보다 클 수 없다(기본값 적용 후 실제 값 기준). */
    private static void checkSizeBounds(ObjectNode work, List<PopupJsonIssue> errors) {
        for (String axis : List.of("Width", "Height")) {
            JsonNode min = work.get("minimum" + axis);
            JsonNode max = work.get("maximum" + axis);
            if (min != null && max != null && min.isNumber() && max.isNumber() && min.doubleValue() > max.doubleValue()) {
                errors.add(new PopupJsonIssue("$.minimum" + axis, "RULE_VIOLATION", "<= maximum" + axis + "(" + max + ")", min.toString(),
                        "minimum" + axis + "은 maximum" + axis + "보다 클 수 없습니다."));
            }
        }
    }

    /** 문항 형식·boolean/숫자 타입 검사. SURVEY 정답 키는 원본 왕복을 위해 유지한다. 문항 없는 유형은 빈 배열. */
    private ArrayNode checkQuestions(String type, ArrayNode questions, List<PopupJsonIssue> errors, List<PopupJsonChange> changes) {
        if (!"SURVEY".equals(type) && !"QUIZ".equals(type)) {
            if (!questions.isEmpty()) changes.add(new PopupJsonChange("$.questions", actual(questions), "[]", "NOT_APPLICABLE_REMOVED"));
            return objectMapper.createArrayNode();
        }
        for (int i = 0; i < questions.size(); i++) {
            String path = "$.questions[" + i + "]";
            if (!(questions.get(i) instanceof ObjectNode question)) {
                errors.add(new PopupJsonIssue(path, "TYPE_MISMATCH", "object", actual(questions.get(i)), "문항은 객체여야 합니다."));
                continue;
            }
            JsonNode questionType = question.get("questionType");
            if (questionType == null || questionType.isNull()) {
                errors.add(missing(path + ".questionType", "questionType이 필요합니다."));
            } else if (!questionType.isTextual() || !QUESTION_TYPES.contains(questionType.textValue())) {
                errors.add(new PopupJsonIssue(path + ".questionType", questionType.isTextual() ? "INVALID_ENUM" : "TYPE_MISMATCH",
                        "SINGLE_CHOICE/MULTIPLE_CHOICE/TEXT", actual(questionType), "questionType 값이 올바르지 않습니다."));
            }
            requireKind(question, "isRequired", path, JsonNode::isBoolean, "boolean", errors);
            requireKind(question, "isScored", path, JsonNode::isBoolean, "boolean", errors);
            requireKind(question, "questionScore", path, JsonNode::isNumber, "number", errors);
            JsonNode options = question.get("options");
            if (options != null && !options.isNull() && !options.isArray()) {
                errors.add(new PopupJsonIssue(path + ".options", "TYPE_MISMATCH", "array", actual(options), "options는 배열이어야 합니다."));
                continue;
            }
            // 유형 자체가 잘못된 문항은 선택지 필수 여부를 판단하지 않는다(오류 1건만).
            boolean choice = questionType != null && questionType.isTextual() && QUESTION_TYPES.contains(questionType.textValue())
                    && !"TEXT".equals(questionType.textValue());
            if (choice && (options == null || options.isNull() || options.isEmpty())) {
                errors.add(missing(path + ".options", "선택형 문항은 선택지가 1개 이상 필요합니다."));
            }
            checkSelectionLimits(type, question, options, path, errors);
            if (options != null && options.isArray()) {
                for (int j = 0; j < options.size(); j++) {
                    String optionPath = path + ".options[" + j + "]";
                    if (!(options.get(j) instanceof ObjectNode option)) {
                        errors.add(new PopupJsonIssue(optionPath, "TYPE_MISMATCH", "object", actual(options.get(j)), "선택지는 객체여야 합니다."));
                        continue;
                    }
                    requireKind(option, "isCorrect", optionPath, JsonNode::isBoolean, "boolean", errors);
                }
            }
        }
        return questions;
    }

    /**
     * POL-06-02 : 선택·제출 — SURVEY 복수 선택 최소·최대 선택 수(관리자 저장 규칙 PopupQuestionRules와 같음).
     * null·누락 = 제한 없음. 정수 1~선택지 수, 최소 ≤ 최대. QUIZ(정답 수가 한도)·단일 선택·주관식에는 지정할 수 없다.
     */
    private static void checkSelectionLimits(String type, ObjectNode question, JsonNode options, String path, List<PopupJsonIssue> errors) {
        JsonNode min = question.get("minSelections");
        JsonNode max = question.get("maxSelections");
        boolean hasMin = min != null && !min.isNull();
        boolean hasMax = max != null && !max.isNull();
        if (!hasMin && !hasMax) return;
        int before = errors.size();
        requireKind(question, "minSelections", path, JsonNode::isIntegralNumber, "integer", errors);
        requireKind(question, "maxSelections", path, JsonNode::isIntegralNumber, "integer", errors);
        if (errors.size() > before) return;
        if (!"SURVEY".equals(type) || !"MULTIPLE_CHOICE".equals(question.path("questionType").asText())) {
            errors.add(new PopupJsonIssue(path + (hasMin ? ".minSelections" : ".maxSelections"), "RULE_VIOLATION", "SURVEY MULTIPLE_CHOICE",
                    type + "/" + question.path("questionType").asText(), "최소·최대 선택 수는 설문의 복수 선택 문항에서만 지정할 수 있습니다."));
            return;
        }
        int count = options != null && options.isArray() ? options.size() : 0;
        for (String key : List.of("minSelections", "maxSelections")) {
            JsonNode value = question.get(key);
            if (value != null && !value.isNull() && (value.intValue() < 1 || value.intValue() > count)) {
                errors.add(new PopupJsonIssue(path + "." + key, "OUT_OF_RANGE", "integer [1~" + count + "]", value.toString(),
                        key + "는 1~선택지 수 사이여야 합니다."));
            }
        }
        if (hasMin && hasMax && min.intValue() > max.intValue()) {
            errors.add(new PopupJsonIssue(path + ".minSelections", "RULE_VIOLATION", "<= maxSelections(" + max + ")", min.toString(),
                    "최소 선택 수는 최대 선택 수보다 클 수 없습니다."));
        }
    }

    /** 키가 없으면 기본값, null이면 기본값이 null이 아닐 때만 채운다(명시한 false·0·빈 문자열 유지, 재실행 시 이력 없음). */
    private static void fill(ObjectNode target, ObjectNode values, String prefix, List<PopupJsonChange> changes) {
        values.fields().forEachRemaining(entry -> {
            JsonNode current = target.get(entry.getKey());
            if (current == null || (current.isNull() && !entry.getValue().isNull())) {
                setDefault(target, entry.getKey(), entry.getValue().deepCopy(), prefix, changes);
            }
        });
    }

    private static void setDefault(ObjectNode target, String key, JsonNode value, String prefix, List<PopupJsonChange> changes) {
        JsonNode before = target.get(key);
        target.set(key, value);
        changes.add(new PopupJsonChange(prefix + "." + key, before == null ? PopupJsonChange.MISSING : "null", value.toString(), "DEFAULT_APPLIED"));
    }

    /** 유형에 쓰지 않는 키를 뺀다. 명시값이 있었을 때만 이력을 남긴다. */
    private static void removeNotApplicable(ObjectNode work, String key, List<PopupJsonChange> changes) {
        JsonNode removed = work.remove(key);
        if (removed != null && !removed.isNull()) {
            changes.add(new PopupJsonChange("$." + key, actual(removed), PopupJsonChange.REMOVED, "NOT_APPLICABLE_REMOVED"));
        }
    }

    private static PopupJsonIssue missing(String path, String message) {
        return new PopupJsonIssue(path, "MISSING_REQUIRED", "값", PopupJsonChange.MISSING, message);
    }

    /** 오류·이력용 입력값 표현(최대 200자). */
    private static String actual(JsonNode node) {
        if (node == null) return PopupJsonChange.MISSING;
        String text = node.toString();
        return text.length() <= ACTUAL_MAX ? text : text.substring(0, ACTUAL_MAX) + "...";
    }

    private static boolean isAbsoluteHttp(String url) {
        if (url == null || url.isBlank()) return false;
        try {
            URI uri = URI.create(url.trim());
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) && uri.getHost() != null;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
