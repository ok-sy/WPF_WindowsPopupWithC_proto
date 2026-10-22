package server.service.core.popup.sample;

import server.domain.popup.sample.PopupContentRow;

import java.math.BigDecimal;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * POL-13-01 : 콘텐츠와 관리 상태
 * POL-01-01 : 공통 옵션의 위치
 * POL-01-02 : 기본값의 적용
 * ■ 샘플 단건 응답 조립기
 * - in : 조회 행(PopupContentRow)·파싱한 content·문항 배열·전달 건 ID·폴링 주기
 * - out: WPF 단건 조회 응답 ObjectNode · 예외: PopupSampleException(계약 위반)
 * - 조회 행 + 파싱한 content → 기존 WPF 단건 조회 응답 {@code {pollingIntervalSeconds, popup}}.
 *
 * <p>흐름: 공통 헤더/옵션(컬럼) 매핑 → content 창 옵션 승격 → 선택값 기본값 → 유형별 필수 콘텐츠 검증.
 * "popupHeader"는 역할 이름일 뿐이며 별도 JSON 필드를 만들지 않는다. 출력 필드명·위치는 서버 WpfPopupItem과 같다.</p>
 *
 * <h3>기본값(누락·null일 때만 적용, 명시적 false·0·빈 문자열은 유지)</h3>
 * <table>
 *   <tr><th>필드</th><th>원본</th><th>기본값</th></tr>
 *   <tr><td>title</td><td>HDR_TITL</td><td>""</td></tr>
 *   <tr><td>width / height</td><td>POPU_WDTH_SZ / POPU_LNTH_SZ</td><td>900 / 620(IMAGE는 생략 = 원본 기준)</td></tr>
 *   <tr><td>showLater</td><td>AFTR_CNFM_OBJ_YN</td><td>false</td></tr>
 *   <tr><td>footerAction</td><td>FTR_BTN_TP_CD</td><td>CLOSE(SURVEY·QUIZ는 항상 SUBMIT)</td></tr>
 *   <tr><td>footerLinkUrl</td><td>FTR_URL</td><td>LINK_AND_CLOSE일 때만, 절대 http/https 필수</td></tr>
 *   <tr><td>useBackgroundOverlay / backgroundOverlayOpacity / popupPosition</td><td>content</td><td>true / 0.45 / CENTER</td></tr>
 *   <tr><td>header/body/footerFontSize</td><td>content</td><td>null(키는 항상 포함, null = WPF XAML 기본 크기)</td></tr>
 *   <tr><td>hideDays / completionRatio / passingScore</td><td>(컬럼 없음)</td><td>null / VIDEO·영상+퀴즈 1.0, 그 밖 null / QUIZ만 키 포함 null</td></tr>
 *   <tr><td>content 유형별 옵션</td><td>CNTN_CN</td><td>{@link #CONTENT_DEFAULTS} 표(명세 §8·WPF 콘텐츠 DTO 기본값과 같음)</td></tr>
 *   <tr><td>questions[]·options[] 선택 필드</td><td>QuestionPort</td><td>applyQuestionDefaults</td></tr>
 *   <tr><td>displayMode·sizeMode·widthRatio·heightRatio·minimum*·maximum*·showHeader·showFooter·showFooterButton·showDoNotShowAgain</td>
 *       <td>(컬럼 없음, 고정)</td><td>SEQUENTIAL·FIXED·0.7·0.75·300·300·1200·900·true·true·true·false</td></tr>
 * </table>
 *
 * <h3>중복 값 우선순위</h3>
 * <p>제목·창 크기·나중에 보기·푸터 동작/URL은 <b>컬럼이 기준 원본</b>이다. content JSON에 같은 키가 있으면 응답에서 제거한다.
 * 창 공통 옵션(Overlay·위치·폰트)은 서버 WPF 응답(POL-01-01 : 공통 옵션의 위치)과 같이 content에 저장된 값을 최상위로 옮기고 content에서는 뺀다.
 * 파일 URL은 IMAGE는 이미지 컬럼, VIDEO와 영상+퀴즈(QUIZ + videoEnabled=true)는 영상 컬럼으로 만들고, 만들어지면 content.imageUrl/videoUrl보다
 * 우선한다. 파일명이 없으면 content의 URL을 유지한다. 영상 없는 QUIZ에는 영상 컬럼을 적용하지 않는다.</p>
 *
 * <h3>샘플 응답은 가능한 옵션 키를 모두 싣는다</h3>
 * <p>인계 받는 개발자가 응답 하나로 쓸 수 있는 옵션 전체를 볼 수 있도록 유형별 content 옵션·선택 필드를 빠짐없이 채운다.
 * 값이 없던 키는 계약 기본값으로 채우므로 WPF 표시 결과는 키를 생략했을 때와 같다. 예외: {@code footerLinkUrl}은 계약상
 * LINK_AND_CLOSE일 때만 보내고, SURVEY는 정답 키(isCorrect·correctAnswer·answerMatchMode)를 싣지 않는다.
 * 필수 콘텐츠 검증은 기본값을 채우기 <b>전</b> 원본 값으로 한다(빈 기본값이 필수 누락을 가리지 않게).</p>
 */
public class PopupSingleResponseAssembler {

    private static final Logger log = LoggerFactory.getLogger(PopupSingleResponseAssembler.class);
    static final double DEFAULT_WIDTH = 900;
    static final double DEFAULT_HEIGHT = 620;
    static final double MIN_WINDOW_SIZE = 300;
    private static final Set<String> COLUMN_OWNED_KEYS = Set.of("title", "width", "height", "showLater", "footerAction", "footerLinkUrl");
    private static final List<String> FONT_KEYS = List.of("headerFontSize", "bodyFontSize", "footerFontSize");
    /**
     * [옵션] 유형별 content 옵션 기본값(키가 없거나 null일 때만 채움). 옵션을 추가·삭제하면 이 표와 명세 §8·WPF DTO를 함께 맞춘다.
     * Blocks 키(textBlocks·surveyTitleBlocks·descriptionBlocks)는 null = 서식 없음(일반 문자열 표시)이다.
     */
    static final Map<String, Map<String, Object>> CONTENT_DEFAULTS = Map.of(
            "TEXT", ordered("plainText", "", "textBlocks", null, "showPlainText", true, "highlightText", "", "showHighlight", false,
                    "bottomDescription", "", "bottomDescriptionUrl", "", "showBottomDescription", false),
            "IMAGE", ordered("imageTitle", "", "imageUrl", "", "description", "", "showDescription", true, "imageSizeMode", "ADAPTIVE",
                    "keepAspectRatio", true),
            "VIDEO", videoDefaults(),
            "SURVEY", ordered("surveyTitle", "", "surveyTitleBlocks", null, "description", "", "descriptionBlocks", null),
            "QUIZ", ordered("surveyTitle", "", "surveyTitleBlocks", null, "description", "", "descriptionBlocks", null, "videoEnabled", false));
    private static final Set<String> POSITIONS = Set.of("CENTER", "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER_RIGHT",
            "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT");

    private final ObjectMapper objectMapper;
    private final PopupPorts.FileUrlResolver fileUrlResolver;

    /** ■ 생성 - in : objectMapper(ObjectMapper) · fileUrlResolver(FileUrlResolver) - out: 조립기 인스턴스 */
    public PopupSingleResponseAssembler(ObjectMapper objectMapper, PopupPorts.FileUrlResolver fileUrlResolver) {
        this.objectMapper = objectMapper;
        this.fileUrlResolver = fileUrlResolver;
    }

    /**
     * POL-09-02 : 조회 응답
     * ■ 빈 응답 생성
     * - in : pollingIntervalSeconds(int) 폴링 주기
     * - out: ObjectNode {pollingIntervalSeconds, popup: null}
     * - 조회 결과 없음: 기존 계약대로 popup 키를 null로 유지한다.
     */
    public ObjectNode empty(int pollingIntervalSeconds) {
        ObjectNode response = objectMapper.createObjectNode();
        response.put("pollingIntervalSeconds", pollingIntervalSeconds);
        response.putNull("popup");
        return response;
    }

    /**
     * POL-01-01 : 공통 옵션의 위치
     * ■ 단건 응답 조립
     * - in : row(PopupContentRow) 조회 행 · parsedContent(ObjectNode) 파싱한 content · questions(ArrayNode) 문항
     *        · deliveryId(String) 전달 건 ID · pollingIntervalSeconds(int) 폴링 주기
     * - out: ObjectNode {pollingIntervalSeconds, popup} · 예외: PopupSampleException(코드·컬럼·필수 콘텐츠 오류)
     * - 컬럼 기준 키를 content에서 빼고 공통 헤더/옵션 매핑 → 창 옵션 승격 → 필수 콘텐츠 검증 → 기본값 순서로 조립한다.
     */
    public ObjectNode assemble(PopupContentRow row, ObjectNode parsedContent, ArrayNode questions, String deliveryId, int pollingIntervalSeconds) {
        String id = row.getContentId();
        String type = PopupCodeTable.popupType(row.getContentTypeCode(), id);
        ObjectNode content = parsedContent.deepCopy();
        for (String key : COLUMN_OWNED_KEYS) {
            if (content.remove(key) != null) log.info("content 중복 키 제거 contentId={} key={} (컬럼 기준)", id, key);
        }

        ObjectNode popup = objectMapper.createObjectNode();
        popup.put("deliveryId", deliveryId);
        popup.put("popupId", id);
        popup.put("popupType", type);
        popup.put("title", row.getHeaderTitle() == null ? "" : row.getHeaderTitle());
        popup.put("displayMode", "SEQUENTIAL");
        popup.put("sizeMode", "FIXED");
        putSize(popup, "width", row.getWidth(), type, DEFAULT_WIDTH, id);
        putSize(popup, "height", row.getHeight(), type, DEFAULT_HEIGHT, id);
        popup.put("widthRatio", 0.7);
        popup.put("heightRatio", 0.75);
        popup.put("minimumWidth", MIN_WINDOW_SIZE);
        popup.put("minimumHeight", MIN_WINDOW_SIZE);
        popup.put("maximumWidth", 1200);
        popup.put("maximumHeight", 900);
        popup.put("showHeader", true);
        popup.put("showFooterButton", true);
        popup.put("showFooter", true);
        putFooter(popup, row, type);
        promoteWindowOptions(popup, content, id);
        popup.put("showDoNotShowAgain", false);
        Boolean showLater = PopupCodeTable.yn(row.getAfterConfirmYn(), "AFTR_CNFM_OBJ_YN", id);
        popup.put("showLater", showLater != null && showLater);
        boolean video = "VIDEO".equals(type) || ("QUIZ".equals(type) && content.path("videoEnabled").asBoolean(false));
        // [교체 지점] 숨김 일수·완료 비율·통과 점수는 DTIY3111에 컬럼이 없어 계약 기본값을 싣는다. 컬럼이 확정되면 row 값으로 바꾼다.
        popup.putNull("hideDays");
        if (video) popup.put("completionRatio", 1.0); else popup.putNull("completionRatio");
        if ("QUIZ".equals(type)) popup.putNull("passingScore");
        applyFile(content, row, type);
        ArrayNode questionList = questions == null ? objectMapper.createArrayNode() : questions.deepCopy();
        validateRequiredContent(type, content, questionList, id);
        applyContentDefaults(type, video, content);
        applyQuestionDefaults(type, questionList);
        popup.set("questions", questionList);
        popup.set("content", content);

        ObjectNode response = objectMapper.createObjectNode();
        response.put("pollingIntervalSeconds", pollingIntervalSeconds);
        response.set("popup", popup);
        return response;
    }

    /** POL-04-01 : 공통 크기 입력 — 창 크기 한 축을 싣는다(양수만 허용). */
    private static void putSize(ObjectNode popup, String key, BigDecimal value, String type, double fallback, String id) {
        if (value == null) {
            // POL-04-01 : 공통 크기 입력 — IMAGE는 축을 생략하면 원본 크기 기준이라 기본값을 채우지 않는다.
            if (!"IMAGE".equals(type)) popup.put(key, fallback);
            return;
        }
        if (value.signum() <= 0) throw new PopupSampleException(PopupSampleException.Reason.INVALID_COLUMN, id, key + "는 0보다 커야 합니다: " + value);
        popup.put(key, value.doubleValue());
    }

    /** POL-02-03 : 푸터 역할 — 푸터 동작·바로가기 URL을 싣는다(SURVEY·QUIZ는 SUBMIT 고정). */
    private static void putFooter(ObjectNode popup, PopupContentRow row, String type) {
        String id = row.getContentId();
        boolean questionType = "SURVEY".equals(type) || "QUIZ".equals(type);
        String action = PopupCodeTable.footerAction(row.getFooterButtonTypeCode(), id);
        if (questionType) {
            // 기존 계약: SURVEY·QUIZ는 저장 값과 무관하게 SUBMIT.
            popup.put("footerAction", "SUBMIT");
            return;
        }
        if (action == null) action = "CLOSE";
        if ("SUBMIT".equals(action)) {
            throw new PopupSampleException(PopupSampleException.Reason.INVALID_COLUMN, id, "SUBMIT은 SURVEY·QUIZ만 사용할 수 있습니다.");
        }
        popup.put("footerAction", action);
        if ("LINK_AND_CLOSE".equals(action)) {
            String url = row.getFooterUrl();
            if (!isAbsoluteHttp(url)) {
                throw new PopupSampleException(PopupSampleException.Reason.INVALID_COLUMN, id, "LINK_AND_CLOSE에는 절대 http/https FTR_URL이 필요합니다.");
            }
            popup.put("footerLinkUrl", url.trim());
        }
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

    /** POL-01-01 : 공통 옵션의 위치 — content의 창 공통 옵션을 최상위로 옮긴다. 값이 없을 때만 기본값, 잘못된 값은 기본값 대신 오류. */
    private static void promoteWindowOptions(ObjectNode popup, ObjectNode content, String id) {
        JsonNode overlay = content.remove("useBackgroundOverlay");
        if (overlay != null && !overlay.isNull() && !overlay.isBoolean()) invalid(id, "useBackgroundOverlay는 boolean이어야 합니다.");
        popup.put("useBackgroundOverlay", overlay == null || overlay.isNull() || overlay.booleanValue());

        JsonNode opacity = content.remove("backgroundOverlayOpacity");
        if (opacity != null && !opacity.isNull() && (!opacity.isNumber() || opacity.doubleValue() < 0 || opacity.doubleValue() > 1)) {
            invalid(id, "backgroundOverlayOpacity는 0~1 숫자여야 합니다.");
        }
        popup.put("backgroundOverlayOpacity", opacity == null || opacity.isNull() ? 0.45 : opacity.doubleValue());

        JsonNode position = content.remove("popupPosition");
        String value = position == null || position.isNull() ? "CENTER" : position.asText().trim().toUpperCase();
        if (!POSITIONS.contains(value)) invalid(id, "popupPosition 값이 올바르지 않습니다: " + value);
        popup.put("popupPosition", value);

        for (String key : FONT_KEYS) {
            JsonNode size = content.remove(key);
            if (size == null || size.isNull()) {
                popup.putNull(key); // 키는 싣고 null = WPF 기본 크기
                continue;
            }
            if (!size.isNumber() || size.doubleValue() < 10 || size.doubleValue() > 40) invalid(id, key + "는 10~40 숫자여야 합니다.");
            popup.put(key, size.doubleValue());
        }
    }

    /** 유형별 파일 컬럼(IMAGE → 이미지, VIDEO·영상+퀴즈 → 영상)으로 URL을 만들면 content.imageUrl/videoUrl을 덮는다. */
    private void applyFile(ObjectNode content, PopupContentRow row, String type) {
        String url;
        String key;
        if ("IMAGE".equals(type)) {
            key = "imageUrl";
            url = fileUrlResolver.resolve(row.getImageFilePath(), row.getImageFileName());
        } else if ("VIDEO".equals(type) || ("QUIZ".equals(type) && content.path("videoEnabled").asBoolean(false))) {
            key = "videoUrl";
            url = fileUrlResolver.resolve(row.getVideoFilePath(), row.getVideoFileName());
        } else {
            return;
        }
        if (url != null) content.put(key, url);
    }

    /** 유형별 필수 콘텐츠(본문·이미지 URL·영상 URL·문항)가 없으면 거부한다. */
    private static void validateRequiredContent(String type, ObjectNode content, JsonNode questions, String id) {
        boolean ok = switch (type) {
            case "TEXT" -> !content.path("plainText").asText("").isBlank() || (content.path("textBlocks").isArray() && !content.path("textBlocks").isEmpty());
            case "IMAGE" -> !content.path("imageUrl").asText("").isBlank();
            case "VIDEO" -> !content.path("videoUrl").asText("").isBlank();
            case "SURVEY", "QUIZ" -> questions.isArray() && !questions.isEmpty();
            default -> false;
        };
        if (!ok) {
            throw new PopupSampleException(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT, id, type + " 필수 콘텐츠가 없습니다.");
        }
    }

    /** 유형별 content 기본값. 영상+퀴즈(QUIZ + videoEnabled)는 VIDEO 재생 옵션도 채운다. */
    private static void applyContentDefaults(String type, boolean video, ObjectNode content) {
        fill(content, CONTENT_DEFAULTS.getOrDefault(type, Map.of()));
        if (video && "QUIZ".equals(type)) fill(content, videoDefaults());
    }

    /**
     * [옵션] 문항·선택지 선택 필드 기본값(명세 §9). SURVEY는 정답 키를 제거한다(기존 WpfPopupItem.withoutAnswerKey와 같은 규칙).
     * QUIZ 채점 문항의 배점이 없으면 1점(관리자 저장 기본값과 같음).
     */
    private static void applyQuestionDefaults(String type, ArrayNode questions) {
        boolean quiz = "QUIZ".equals(type);
        for (JsonNode node : questions) {
            if (!(node instanceof ObjectNode question)) continue;
            fill(question, ordered("description", "", "titleBlocks", null, "descriptionBlocks", null, "optionLayout", "VERTICAL",
                    "isRequired", false, "isScored", false));
            if (!question.has("options") || question.get("options").isNull()) question.set("options", question.arrayNode());
            if (quiz) {
                boolean scored = question.path("isScored").asBoolean(false);
                if (!question.has("questionScore") || question.get("questionScore").isNull()) {
                    if (scored) question.put("questionScore", 1); else question.putNull("questionScore");
                }
                boolean text = "TEXT".equals(question.path("questionType").asText());
                fill(question, ordered("correctAnswer", null, "answerMatchMode", text ? "EXACT" : null));
            } else {
                question.remove(List.of("correctAnswer", "answerMatchMode"));
                fill(question, ordered("questionScore", null));
            }
            for (JsonNode optionNode : question.get("options")) {
                if (!(optionNode instanceof ObjectNode option)) continue;
                fill(option, ordered("value", "", "textBlocks", null));
                if (quiz) fill(option, ordered("isCorrect", false)); else option.remove("isCorrect");
            }
        }
    }

    /** VIDEO 재생 옵션 기본값 표. */
    private static Map<String, Object> videoDefaults() {
        return ordered("videoTitle", "", "videoUrl", "", "description", "", "showDescription", true, "showControls", true,
                "allowFullScreen", true, "allowPlaybackRateChange", true, "allowSeek", true, "autoPlay", false, "isLoop", false,
                "defaultVolume", 0.7);
    }

    /** 키 순서를 유지하는 기본값 표(null 값 허용). */
    private static Map<String, Object> ordered(Object... pairs) {
        Map<String, Object> map = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) map.put((String) pairs[i], pairs[i + 1]);
        return map;
    }

    /** 키가 없거나 null일 때만 기본값을 넣는다(명시적 false·0·빈 문자열은 유지). 기본값이 null이면 키만 null로 싣는다. */
    private static void fill(ObjectNode target, Map<String, Object> defaults) {
        defaults.forEach((key, value) -> {
            if (target.hasNonNull(key)) return;
            if (value == null) target.putNull(key);
            else if (value instanceof Boolean b) target.put(key, b);
            else if (value instanceof Integer n) target.put(key, n);
            else if (value instanceof Double d) target.put(key, d);
            else target.put(key, value.toString());
        });
    }

    /** content 값 오류로 거부한다. */
    private static void invalid(String id, String message) {
        throw new PopupSampleException(PopupSampleException.Reason.INVALID_CONTENT_JSON, id, message);
    }
}
