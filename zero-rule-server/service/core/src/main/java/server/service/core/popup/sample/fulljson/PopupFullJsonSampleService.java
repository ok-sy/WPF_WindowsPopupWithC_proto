package server.service.core.popup.sample.fulljson;

import java.net.URI;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import server.domain.popup.sample.fulljson.PopupBulletinRow;
import server.repo.core.mapper.popup.sample.fulljson.PopupFullJsonSampleMapper;
import server.service.core.popup.sample.PopupSampleException;

/**
 * POL-13-03 : 적용·샘플 구분
 * POL-14-03 : 서버 인계 예제
 * POL-01-02 : 기본값의 적용
 * ■ DTIY3117 전체 JSON 단건 조회 샘플 서비스
 * - in : 사번 · 팝업 ID(POPU_ID)
 * - out: WPF 단건 조회 응답 ObjectNode {@code {pollingIntervalSeconds, popup}} · 예외: PopupSampleException(저장 데이터 오류),
 *        IllegalArgumentException(popupId 누락)
 * - 흐름: POPU_ID 조회 → POPU_BLTN_CN(CLOB) JSON 파싱 → 식별자 정리 → 명시값 검증 → 필수 콘텐츠 검증 → 누락/null 기본값 보완
 *   → 문항 정답 키 정리 → 기존 WPF 응답 필드 순서로 조립.
 *
 * <p>저장 JSON은 popup 객체 본체다({@code {popupType, title, ..., content, questions}}). 응답 envelope({@code pollingIntervalSeconds})는
 * 저장하지 않는다. 보정은 파싱한 작업용 객체에만 하며 DB 원본을 다시 저장하지 않는다.
 * 기존 DTIY3111 샘플({@code PopupSingleQuerySampleService}·{@code PopupSingleResponseAssembler})은 쓰지도 바꾸지도 않는다.</p>
 *
 * <h3>저장값 처리 기준</h3>
 * <table>
 *   <tr><th>항목</th><th>처리</th></tr>
 *   <tr><td>popupId</td><td>DB POPU_ID가 기준. 저장 JSON 값이 다르면 거절(INVALID_CONTENT_JSON), 없으면 DB 값으로 채움</td></tr>
 *   <tr><td>deliveryId · pollingIntervalSeconds</td><td>서버 소유 값이라 저장 JSON 값을 제거하고 서버가 설정</td></tr>
 *   <tr><td>모르는 최상위 키</td><td>관리용 필드가 WPF로 새지 않도록 제거(로그)</td></tr>
 *   <tr><td>창·푸터 옵션이 content 안에 있을 때</td><td>최상위에 없으면 최상위로 옮기고, content에서는 항상 뺀다(기존 관리자 저장 형태 호환)</td></tr>
 *   <tr><td>명시값 타입·ENUM·범위 오류</td><td>기본값으로 바꾸지 않고 거절</td></tr>
 *   <tr><td>누락·null</td><td>{@link PopupFullJsonDefaults} 값으로 보완. 명시한 false·0은 유지</td></tr>
 *   <tr><td>SURVEY 문항</td><td>정답 키(correctAnswer·answerMatchMode·options[].isCorrect) 제거. QUIZ는 기존 채점 계약대로 유지</td></tr>
 * </table>
 *
 * <p>[담당 구현] 사용자별 후보 선정·게시 상태·기간, 전달 건 생성/재사용(현재 테스트 UUID), 결과 저장은 이 샘플 범위가 아니다.</p>
 */
public class PopupFullJsonSampleService {

    private static final Logger log = LoggerFactory.getLogger(PopupFullJsonSampleService.class);

    /** 서버가 응답 시 설정하는 값. 저장 JSON에 있어도 신뢰하지 않는다. */
    private static final Set<String> SERVER_OWNED_KEYS = Set.of("deliveryId", "pollingIntervalSeconds");
    /** content 안에 저장돼 있을 수 있는 최상위 창·푸터 옵션(기존 관리자 저장 형태). */
    private static final List<String> PROMOTABLE_KEYS = List.of("useBackgroundOverlay", "backgroundOverlayOpacity", "popupPosition",
            "headerFontSize", "bodyFontSize", "footerFontSize", "footerAction", "footerLinkUrl");
    /** 응답 popup 키 순서(서버 WpfPopupItem과 같음). deliveryId는 조립 뒤 맨 앞에, questions·content는 마지막에 붙인다. */
    private static final List<String> OUTPUT_ORDER = List.of("popupId", "popupType", "title", "displayMode", "sizeMode",
            "width", "height", "widthRatio", "heightRatio", "minimumWidth", "minimumHeight", "maximumWidth", "maximumHeight",
            "showHeader", "showFooterButton", "showFooter", "footerAction", "footerLinkUrl", "useBackgroundOverlay",
            "backgroundOverlayOpacity", "popupPosition", "headerFontSize", "bodyFontSize", "footerFontSize", "showDoNotShowAgain",
            "showLater", "hideDays", "completionRatio", "passingScore");
    private static final Set<String> QUESTION_TYPES = Set.of("SINGLE_CHOICE", "MULTIPLE_CHOICE", "TEXT");

    private final PopupFullJsonSampleMapper mapper;
    private final ObjectMapper objectMapper;
    private final PopupFullJsonDefaults defaults;

    /** ■ 생성 - in : 매퍼·ObjectMapper·기동 시 읽은 기본값 - out: 샘플 서비스 인스턴스 */
    public PopupFullJsonSampleService(PopupFullJsonSampleMapper mapper, ObjectMapper objectMapper, PopupFullJsonDefaults defaults) {
        this.mapper = mapper;
        this.objectMapper = objectMapper;
        this.defaults = defaults;
    }

    /**
     * POL-09-02 : 조회 응답
     * ■ 팝업 1건 조회(샘플)
     * - in : userId(String) 인증된 사번(현재 후보 선정에 미사용, [담당 구현] 대상자 조건 위치) · popupId(String) 조회할 POPU_ID
     * - out: ObjectNode {pollingIntervalSeconds, popup}(없으면 popup null) · 예외: IllegalArgumentException(400)·PopupSampleException(500)
     * - 응답 조립이 끝난 뒤에만 테스트 deliveryId(UUID)를 넣는다. 영속 전달 이력·재사용은 구현하지 않았다.
     */
    public ObjectNode nextPopup(String userId, String popupId) {
        if (popupId == null || popupId.isBlank()) throw new IllegalArgumentException("popupId가 필요합니다.");
        PopupBulletinRow row = mapper.selectByPopupId(popupId.trim());
        ObjectNode response = objectMapper.createObjectNode();
        response.put("pollingIntervalSeconds", defaults.pollingIntervalSeconds());
        if (row == null) {
            response.putNull("popup");
            return response;
        }
        try {
            ObjectNode built = buildPopup(row);
            ObjectNode popup = objectMapper.createObjectNode();
            // [교체 지점] 실제 서버는 전달 건 생성/재사용 결과를 넣는다. deliveryId를 popupId에서 파생하지 않는다.
            popup.put("deliveryId", UUID.randomUUID().toString());
            popup.setAll(built);
            response.set("popup", popup);
            return response;
        } catch (PopupSampleException ex) {
            log.error("3117 전체 JSON 조회 샘플 데이터 오류 popupId={} reason={} message={}", ex.contentId(), ex.reason(), ex.getMessage());
            throw ex;
        }
    }

    /** 저장 JSON 1건을 WPF popup 객체로 만든다(deliveryId 제외). */
    private ObjectNode buildPopup(PopupBulletinRow row) {
        String id = row.getPopupId();
        ObjectNode work = parse(row.getPopupJson(), id);
        applyIdentity(work, id);

        JsonNode contentNode = work.remove("content");
        if (contentNode != null && !contentNode.isNull() && !contentNode.isObject()) throw invalid(id, "content는 JSON 객체여야 합니다.");
        ObjectNode content = contentNode == null || contentNode.isNull() ? objectMapper.createObjectNode() : (ObjectNode) contentNode;
        JsonNode questionsNode = work.remove("questions");
        if (questionsNode != null && !questionsNode.isNull() && !questionsNode.isArray()) throw invalid(id, "questions는 배열이어야 합니다.");
        ArrayNode questions = questionsNode == null || questionsNode.isNull() ? objectMapper.createArrayNode() : (ArrayNode) questionsNode;

        promoteFromContent(work, content, id);
        dropUnknownKeys(work, id);
        checkExplicitValues(work, PopupFullJsonDefaults.POPUP_RULES, id);
        checkExplicitValues(work, PopupFullJsonDefaults.POPUP_VALUE_RULES, id);
        JsonNode typeNode = work.get("popupType");
        if (typeNode == null || typeNode.isNull()) {
            throw new PopupSampleException(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT, id, "popupType이 없습니다.");
        }
        String type = typeNode.textValue();

        checkExplicitValues(content, PopupFullJsonDefaults.CONTENT_RULES.get(type), id);
        boolean video = "VIDEO".equals(type) || ("QUIZ".equals(type) && content.path("videoEnabled").asBoolean(false));
        if (video && "QUIZ".equals(type)) checkExplicitValues(content, PopupFullJsonDefaults.CONTENT_RULES.get("VIDEO"), id);

        // 필수 콘텐츠는 기본값을 채우기 전 원본으로 확인한다(기본값이 누락을 가리지 않게).
        validateRequired(type, video, work, content, questions, id);
        applyPopupDefaults(type, video, work, id);
        fill(content, defaults.contentDefaults(type));
        if (video && "QUIZ".equals(type)) fill(content, defaults.contentDefaults("VIDEO"));
        ArrayNode cleanQuestions = cleanQuestions(type, questions, id);

        ObjectNode popup = objectMapper.createObjectNode();
        for (String key : OUTPUT_ORDER) {
            if (work.has(key)) popup.set(key, work.get(key));
        }
        popup.set("questions", cleanQuestions);
        popup.set("content", content);
        return popup;
    }

    /** POPU_BLTN_CN 문자열 → ObjectNode. 빈 값·구문 오류·객체 아닌 루트(null·배열·문자열)는 거절한다. */
    private ObjectNode parse(String json, String id) {
        if (json == null || json.isBlank()) {
            throw new PopupSampleException(PopupSampleException.Reason.INVALID_CONTENT_JSON, id, "POPU_BLTN_CN이 비었습니다.");
        }
        JsonNode node;
        try {
            node = objectMapper.readTree(json);
        } catch (JsonProcessingException ex) {
            throw new PopupSampleException(PopupSampleException.Reason.INVALID_CONTENT_JSON, id,
                    "POPU_BLTN_CN JSON 구문 오류(line " + ex.getLocation().getLineNr() + ")", ex);
        }
        if (node == null || !node.isObject()) {
            throw new PopupSampleException(PopupSampleException.Reason.CONTENT_NOT_OBJECT, id,
                    "POPU_BLTN_CN은 popup JSON 객체여야 합니다: " + (node == null ? "empty" : node.getNodeType()));
        }
        return (ObjectNode) node;
    }

    /** DB POPU_ID를 기준으로 popupId를 정하고 서버 소유 값을 뺀다. */
    private static void applyIdentity(ObjectNode work, String id) {
        JsonNode stored = work.get("popupId");
        if (stored != null && !stored.isNull() && !(stored.isTextual() && id.equals(stored.textValue()))) {
            throw invalid(id, "저장 JSON의 popupId가 POPU_ID와 다릅니다: " + stored);
        }
        work.put("popupId", id);
        for (String key : SERVER_OWNED_KEYS) {
            if (work.remove(key) != null) log.info("3117 저장 JSON의 서버 소유 키 제거 popupId={} key={}", id, key);
        }
    }

    /** content 안의 창·푸터 옵션을 최상위로 옮긴다(최상위 값이 있으면 최상위 우선). content에서는 항상 뺀다. */
    private static void promoteFromContent(ObjectNode work, ObjectNode content, String id) {
        for (String key : PROMOTABLE_KEYS) {
            JsonNode value = content.remove(key);
            if (value == null) continue;
            if (work.has(key)) log.info("3117 content 중복 키 제거 popupId={} key={} (최상위 우선)", id, key);
            else work.set(key, value);
        }
    }

    /** WPF 계약에 없는 최상위 키(관리용 등)를 뺀다. */
    private static void dropUnknownKeys(ObjectNode work, String id) {
        List<String> unknown = new ArrayList<>();
        for (Iterator<String> it = work.fieldNames(); it.hasNext(); ) {
            String key = it.next();
            if (!PopupFullJsonDefaults.POPUP_RULES.containsKey(key) && !PopupFullJsonDefaults.POPUP_VALUE_RULES.containsKey(key)) unknown.add(key);
        }
        if (unknown.isEmpty()) return;
        work.remove(unknown);
        log.info("3117 저장 JSON의 계약 외 최상위 키 제거 popupId={} keys={}", id, unknown);
    }

    /** 명시값(키가 있고 null 아님)만 규칙으로 검증한다. 잘못된 값은 기본값으로 바꾸지 않고 거절한다. */
    private static void checkExplicitValues(ObjectNode node, Map<String, PopupFullJsonDefaults.Rule> rules, String id) {
        if (rules == null) return;
        rules.forEach((key, rule) -> {
            JsonNode value = node.get(key);
            if (value != null && !value.isNull()) rule.check(key, value, id);
        });
    }

    /** 유형별 필수 콘텐츠(본문·이미지 URL·영상 URL·문항)와 IMAGE ORIGINAL 크기를 확인한다. */
    private static void validateRequired(String type, boolean video, ObjectNode work, ObjectNode content, ArrayNode questions, String id) {
        boolean ok = switch (type) {
            case "TEXT" -> !content.path("plainText").asText("").isBlank()
                    || (content.path("textBlocks").isArray() && !content.path("textBlocks").isEmpty());
            case "IMAGE" -> !content.path("imageUrl").asText("").isBlank();
            case "VIDEO" -> !content.path("videoUrl").asText("").isBlank();
            case "SURVEY" -> !questions.isEmpty();
            case "QUIZ" -> !questions.isEmpty() && (!video || !content.path("videoUrl").asText("").isBlank());
            default -> false;
        };
        if (!ok) {
            throw new PopupSampleException(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT, id,
                    type + (video && "QUIZ".equals(type) ? "(영상)" : "") + " 필수 콘텐츠가 없습니다.");
        }
        if ("IMAGE".equals(type) && "ORIGINAL".equals(content.path("imageSizeMode").asText())
                && (!work.hasNonNull("width") || !work.hasNonNull("height"))) {
            throw new PopupSampleException(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT, id, "IMAGE ORIGINAL은 width/height가 필요합니다.");
        }
    }

    /** popup 최상위 기본값과 유형별 조건부 규칙(IMAGE 크기·SURVEY/QUIZ SUBMIT·영상 완료 비율·QUIZ 통과 점수)을 적용한다. */
    private void applyPopupDefaults(String type, boolean video, ObjectNode work, String id) {
        ObjectNode base = defaults.popupDefaults();
        if ("IMAGE".equals(type)) {
            // 크기 미지정 = 원본 기준. 900×620을 채우지 않고 null 키도 싣지 않는다.
            for (String key : List.of("width", "height")) {
                if (work.has(key) && work.get(key).isNull()) work.remove(key);
                base.remove(key);
            }
        }
        base.remove("footerAction");
        fill(work, base);
        if (!work.hasNonNull("title")) work.put("title", "");
        applyFooter(type, work, id);
        if (video) {
            if (!work.hasNonNull("completionRatio")) work.put("completionRatio", 1.0);
        } else {
            work.putNull("completionRatio");
        }
        if ("QUIZ".equals(type)) {
            if (!work.has("passingScore")) work.putNull("passingScore");
        } else {
            work.remove("passingScore");
        }
    }

    /** POL-02-03 : 푸터 역할 — SURVEY·QUIZ는 SUBMIT만, 그 밖은 CLOSE·LINK_AND_CLOSE(절대 http/https URL 필수). */
    private void applyFooter(String type, ObjectNode work, String id) {
        boolean questionType = "SURVEY".equals(type) || "QUIZ".equals(type);
        String action = work.hasNonNull("footerAction") ? work.get("footerAction").textValue()
                : questionType ? "SUBMIT" : defaults.popupDefaults().get("footerAction").textValue();
        if (questionType && !"SUBMIT".equals(action)) throw invalid(id, type + "의 footerAction은 SUBMIT이어야 합니다: " + action);
        if (!questionType && "SUBMIT".equals(action)) throw invalid(id, "SUBMIT은 SURVEY·QUIZ만 사용할 수 있습니다.");
        work.put("footerAction", action);
        if ("LINK_AND_CLOSE".equals(action)) {
            String url = work.path("footerLinkUrl").asText(null);
            if (!isAbsoluteHttp(url)) throw invalid(id, "LINK_AND_CLOSE에는 절대 http/https footerLinkUrl이 필요합니다.");
            work.put("footerLinkUrl", url.trim());
        } else {
            work.remove("footerLinkUrl");
        }
    }

    /** 문항 형식 확인 + SURVEY 정답 키 제거. 문항 유형이 아니면 빈 배열. */
    private ArrayNode cleanQuestions(String type, ArrayNode questions, String id) {
        ArrayNode result = objectMapper.createArrayNode();
        boolean survey = "SURVEY".equals(type);
        if (!survey && !"QUIZ".equals(type)) {
            if (!questions.isEmpty()) log.info("3117 문항 없는 유형의 questions 제거 popupId={} type={}", id, type);
            return result;
        }
        for (JsonNode node : questions) {
            if (!(node instanceof ObjectNode source)) throw invalid(id, "questions[] 항목은 객체여야 합니다.");
            ObjectNode question = source.deepCopy();
            String questionType = question.path("questionType").asText(null);
            if (!QUESTION_TYPES.contains(questionType)) throw invalid(id, "questionType 값이 올바르지 않습니다: " + question.get("questionType"));
            JsonNode options = question.get("options");
            if (options != null && !options.isNull() && !options.isArray()) throw invalid(id, "options는 배열이어야 합니다.");
            if (!"TEXT".equals(questionType) && (options == null || !options.isArray() || options.isEmpty())) {
                throw invalid(id, questionType + " 문항에는 options가 필요합니다.");
            }
            if (options != null && options.isArray()) {
                for (JsonNode option : options) {
                    if (!(option instanceof ObjectNode optionObject)) throw invalid(id, "options[] 항목은 객체여야 합니다.");
                    if (survey) optionObject.remove("isCorrect");
                }
            }
            if (survey) question.remove(List.of("correctAnswer", "answerMatchMode"));
            result.add(question);
        }
        return result;
    }

    /** 키가 없거나 null일 때만 기본값을 넣는다(명시한 false·0·빈 문자열은 유지). 중첩 값은 복사해 넣는다. */
    private static void fill(ObjectNode target, ObjectNode defaults) {
        defaults.fields().forEachRemaining(entry -> {
            if (!target.hasNonNull(entry.getKey())) target.set(entry.getKey(), entry.getValue().deepCopy());
        });
    }

    /** 절대 http/https URL인지 확인한다. */
    private static boolean isAbsoluteHttp(String url) {
        if (url == null || url.isBlank()) return false;
        try {
            URI uri = URI.create(url.trim());
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) && uri.getHost() != null;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private static PopupSampleException invalid(String id, String message) {
        return PopupFullJsonDefaults.invalid(id, message);
    }
}
