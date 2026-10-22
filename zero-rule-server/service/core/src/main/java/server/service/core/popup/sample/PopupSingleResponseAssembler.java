package server.service.core.popup.sample;

import server.domain.popup.sample.PopupContentRow;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * [TODO65] 조회 행 + 파싱한 content → 기존 WPF 단건 조회 응답 {@code {pollingIntervalSeconds, popup}}.
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
 *   <tr><td>header/body/footerFontSize</td><td>content</td><td>생략(WPF 기본 크기)</td></tr>
 *   <tr><td>displayMode·sizeMode·widthRatio·heightRatio·minimum*·maximum*·showHeader·showFooter·showFooterButton·showDoNotShowAgain</td>
 *       <td>(컬럼 없음, 고정)</td><td>SEQUENTIAL·FIXED·0.7·0.75·300·300·1200·900·true·true·true·false</td></tr>
 * </table>
 *
 * <h3>중복 값 우선순위</h3>
 * <p>제목·창 크기·나중에 보기·푸터 동작/URL은 <b>컬럼이 기준 원본</b>이다. content JSON에 같은 키가 있으면 응답에서 제거한다.
 * 창 공통 옵션(Overlay·위치·폰트)은 기존 설계 31과 같이 content에 저장된 값을 최상위로 옮기고 content에서는 뺀다.
 * IMAGE·VIDEO 파일은 파일 컬럼이 있으면 그 URL이 content.imageUrl/videoUrl보다 우선한다.</p>
 */
public class PopupSingleResponseAssembler {

    private static final Logger log = LoggerFactory.getLogger(PopupSingleResponseAssembler.class);
    static final double DEFAULT_WIDTH = 900;
    static final double DEFAULT_HEIGHT = 620;
    static final double MIN_WINDOW_SIZE = 300;
    private static final Set<String> COLUMN_OWNED_KEYS = Set.of("title", "width", "height", "showLater", "footerAction", "footerLinkUrl");
    private static final List<String> FONT_KEYS = List.of("headerFontSize", "bodyFontSize", "footerFontSize");
    private static final Set<String> POSITIONS = Set.of("CENTER", "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER_RIGHT",
            "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT");

    private final ObjectMapper objectMapper;
    private final PopupPorts.FileUrlResolver fileUrlResolver;

    public PopupSingleResponseAssembler(ObjectMapper objectMapper, PopupPorts.FileUrlResolver fileUrlResolver) {
        this.objectMapper = objectMapper;
        this.fileUrlResolver = fileUrlResolver;
    }

    /** 조회 결과 없음: 기존 계약대로 popup 키를 null로 유지한다. */
    public ObjectNode empty(int pollingIntervalSeconds) {
        ObjectNode response = objectMapper.createObjectNode();
        response.put("pollingIntervalSeconds", pollingIntervalSeconds);
        response.putNull("popup");
        return response;
    }

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
        applyFile(content, row, type);
        popup.set("questions", questions == null ? objectMapper.createArrayNode() : questions);
        validateRequiredContent(type, content, popup.get("questions"), id);
        popup.set("content", content);

        ObjectNode response = objectMapper.createObjectNode();
        response.put("pollingIntervalSeconds", pollingIntervalSeconds);
        response.set("popup", popup);
        return response;
    }

    private static void putSize(ObjectNode popup, String key, BigDecimal value, String type, double fallback, String id) {
        if (value == null) {
            // IMAGE는 축을 생략하면 원본 크기 기준(TODO58)이라 기본값을 채우지 않는다.
            if (!"IMAGE".equals(type)) popup.put(key, fallback);
            return;
        }
        if (value.signum() <= 0) throw new PopupSampleException(PopupSampleException.Reason.INVALID_COLUMN, id, key + "는 0보다 커야 합니다: " + value);
        popup.put(key, value.doubleValue());
    }

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

    private static boolean isAbsoluteHttp(String url) {
        if (url == null || url.isBlank()) return false;
        try {
            URI uri = URI.create(url.trim());
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) && uri.getHost() != null;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    /** 설계 31: content의 창 공통 옵션을 최상위로 옮긴다. 값이 없을 때만 기본값, 잘못된 값은 기본값 대신 오류. */
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
            if (size == null || size.isNull()) continue;
            if (!size.isNumber() || size.doubleValue() < 10 || size.doubleValue() > 40) invalid(id, key + "는 10~40 숫자여야 합니다.");
            popup.put(key, size.doubleValue());
        }
    }

    private void applyFile(ObjectNode content, PopupContentRow row, String type) {
        String key = "IMAGE".equals(type) ? "imageUrl" : "VIDEO".equals(type) ? "videoUrl" : null;
        if (key == null) return;
        String url = fileUrlResolver.resolve(row.getFilePath(), row.getFileName());
        if (url != null) content.put(key, url);
    }

    private static void validateRequiredContent(String type, ObjectNode content, JsonNode questions, String id) {
        boolean ok = switch (type) {
            case "TEXT" -> content.path("plainText").isTextual() || (content.path("textBlocks").isArray() && !content.path("textBlocks").isEmpty());
            case "IMAGE" -> !content.path("imageUrl").asText("").isBlank();
            case "VIDEO" -> !content.path("videoUrl").asText("").isBlank();
            case "SURVEY", "QUIZ" -> questions.isArray() && !questions.isEmpty();
            default -> false;
        };
        if (!ok) {
            throw new PopupSampleException(PopupSampleException.Reason.MISSING_REQUIRED_CONTENT, id, type + " 필수 콘텐츠가 없습니다.");
        }
    }

    private static void invalid(String id, String message) {
        throw new PopupSampleException(PopupSampleException.Reason.INVALID_CONTENT_JSON, id, message);
    }
}
