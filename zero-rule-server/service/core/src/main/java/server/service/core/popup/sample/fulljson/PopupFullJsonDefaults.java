package server.service.core.popup.sample.fulljson;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.yaml.snakeyaml.Yaml;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import server.service.core.popup.sample.PopupSampleException;

/**
 * POL-01-02 : 기본값의 적용
 * POL-14-03 : 서버 인계 예제
 * ■ DTIY3117 전체 JSON 조회 전용 기본값 + 필드 규칙
 * - in : 기본값 YAML(popup-full-json-defaults.yml)
 * - out: 불변 기본값 객체(요청마다 복사본 제공) · 예외: IllegalStateException(기동 시 설정 오류)
 * - 기동 시 한 번 읽고 키·타입·ENUM·범위를 검증한다. 같은 필드 규칙({@link #POPUP_RULES}·{@link #CONTENT_RULES})으로
 *   서비스가 DB 저장 JSON의 명시값도 검증한다(설정과 저장값이 같은 규칙을 따른다).
 *
 * <p>공유 원본은 외부에 내주지 않는다. {@link #popupDefaults()}·{@link #contentDefaults(String)}는 매번 깊은 복사본을 돌려준다.
 * 기존 DTIY3111 조립기({@code PopupSingleResponseAssembler})의 기본값과는 별개다.</p>
 *
 * <p>[옵션 추가·삭제] 기본값을 둘 옵션을 늘리려면 ① 아래 규칙 표에 키를 추가하고 ② YAML에 값을 넣는다. 둘 중 하나만 바꾸면 기동이 실패한다.</p>
 */
public final class PopupFullJsonDefaults {

    /** 값 종류. */
    enum Kind { BOOL, NUMBER, INTEGER, ENUM, STRING }

    /**
     * 필드 규칙. nullable = null을 유효한 값(예: null = WPF 기본 크기)으로 쓸 수 있는지.
     * 저장 JSON의 null은 nullable과 무관하게 "누락"으로 보고 기본값을 채운다(기본값이 null이면 null 유지).
     */
    record Rule(Kind kind, double min, double max, boolean minExclusive, Set<String> values, boolean nullable) {

        /**
         * ■ 값 검증
         * - in : value(JsonNode) null 아님 · key·id(로그·메시지용)
         * - out: 없음 · 예외: PopupSampleException(INVALID_CONTENT_JSON)
         */
        void check(String key, JsonNode value, String id) {
            boolean ok = switch (kind) {
                case BOOL -> value.isBoolean();
                case STRING -> value.isTextual();
                case ENUM -> value.isTextual() && values.contains(value.textValue());
                case INTEGER -> value.isIntegralNumber() && inRange(value.doubleValue());
                case NUMBER -> value.isNumber() && inRange(value.doubleValue());
            };
            if (!ok) throw invalid(id, key + " 값이 올바르지 않습니다(" + describe() + "): " + value);
        }

        private boolean inRange(double v) {
            return (minExclusive ? v > min : v >= min) && v <= max;
        }

        private String describe() {
            return switch (kind) {
                case BOOL -> "boolean";
                case STRING -> "string";
                case ENUM -> String.join("/", values);
                case INTEGER, NUMBER -> kind.name().toLowerCase() + (minExclusive ? " (" : " [") + trim(min) + "~" + trim(max) + "]";
            };
        }

        private static String trim(double v) {
            return v == Math.rint(v) && Math.abs(v) < 1e15 ? String.valueOf((long) v) : String.valueOf(v);
        }
    }

    private static Rule bool() { return new Rule(Kind.BOOL, 0, 0, false, Set.of(), false); }

    private static Rule text() { return new Rule(Kind.STRING, 0, 0, false, Set.of(), false); }

    private static Rule oneOf(String... values) { return new Rule(Kind.ENUM, 0, 0, false, Set.of(values), false); }

    private static Rule number(double min, double max, boolean minExclusive) { return new Rule(Kind.NUMBER, min, max, minExclusive, Set.of(), false); }

    private static Rule positive() { return number(0, Double.MAX_VALUE, true); }

    private static Rule nullable(Rule rule) {
        return new Rule(rule.kind(), rule.min(), rule.max(), rule.minExclusive(), rule.values(), true);
    }

    static final Set<String> POSITIONS = Set.of("CENTER", "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER_RIGHT",
            "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT");

    /** popup 최상위 중 기본값을 두는 키(YAML popup 절과 1:1). 순서는 응답 키 순서와 무관하다. */
    static final Map<String, Rule> POPUP_RULES = ordered(
            "displayMode", oneOf("SEQUENTIAL", "SIMULTANEOUS"),
            "sizeMode", oneOf("FIXED", "RATIO", "FULLSCREEN"),
            "width", positive(),
            "height", positive(),
            "widthRatio", number(0, 1, true),
            "heightRatio", number(0, 1, true),
            "minimumWidth", positive(),
            "minimumHeight", positive(),
            "maximumWidth", positive(),
            "maximumHeight", positive(),
            "showHeader", bool(),
            "showFooter", bool(),
            "showFooterButton", bool(),
            "footerAction", oneOf("CLOSE", "LINK_AND_CLOSE", "SUBMIT"),
            "showLater", bool(),
            "showDoNotShowAgain", bool(),
            "useBackgroundOverlay", bool(),
            "backgroundOverlayOpacity", number(0, 1, false),
            "popupPosition", new Rule(Kind.ENUM, 0, 0, false, POSITIONS, false),
            "headerFontSize", nullable(number(10, 40, false)),
            "bodyFontSize", nullable(number(10, 40, false)),
            "footerFontSize", nullable(number(10, 40, false)),
            "hideDays", nullable(new Rule(Kind.INTEGER, 1, 3650, false, Set.of(), false)));

    /** popup 최상위 중 기본값 없이 검증만 하는 키. */
    static final Map<String, Rule> POPUP_VALUE_RULES = ordered(
            "popupType", oneOf("TEXT", "IMAGE", "VIDEO", "SURVEY", "QUIZ"),
            "popupId", text(),
            "title", text(),
            "footerLinkUrl", text(),
            "completionRatio", nullable(number(0, 1, false)),
            "passingScore", nullable(number(0, Double.MAX_VALUE, false)));

    /** 유형별 content 옵션 규칙(YAML content 절과 1:1). SURVEY는 기본값 옵션이 없다. */
    static final Map<String, Map<String, Rule>> CONTENT_RULES = Map.of(
            "TEXT", ordered("showPlainText", bool(), "showHighlight", bool(), "showBottomDescription", bool()),
            "IMAGE", ordered("showDescription", bool(), "imageSizeMode", oneOf("ADAPTIVE", "FIT_TO_IMAGE", "ORIGINAL"), "keepAspectRatio", bool()),
            "VIDEO", ordered("showDescription", bool(), "showControls", bool(), "allowFullScreen", bool(),
                    "allowPlaybackRateChange", bool(), "allowSeek", bool(), "autoPlay", bool(), "isLoop", bool(),
                    "defaultVolume", number(0, 1, false)),
            "SURVEY", Map.of(),
            "QUIZ", ordered("videoEnabled", bool()));

    private final int pollingIntervalSeconds;
    private final ObjectNode popup;
    private final Map<String, ObjectNode> content;

    private PopupFullJsonDefaults(int pollingIntervalSeconds, ObjectNode popup, Map<String, ObjectNode> content) {
        this.pollingIntervalSeconds = pollingIntervalSeconds;
        this.popup = popup;
        this.content = content;
    }

    /**
     * ■ 기본값 YAML 읽기(기동 시 1회)
     * - in : in(InputStream) YAML · objectMapper · source(String) 오류 메시지용 위치
     * - out: 검증을 마친 기본값 · 예외: IllegalStateException(읽기 실패·모르는 키·빠진 키·타입/ENUM/범위 오류)
     */
    public static PopupFullJsonDefaults load(InputStream in, ObjectMapper objectMapper, String source) {
        Object yaml;
        try (in) {
            yaml = new Yaml().load(in);
        } catch (IOException | RuntimeException ex) {
            throw new IllegalStateException("3117 기본값 설정을 읽을 수 없습니다: " + source, ex);
        }
        JsonNode root = objectMapper.valueToTree(yaml);
        try {
            ObjectNode rootObject = section(root, "(root)", source);
            exactKeys(rootObject, Set.of("response", "popup", "content"), "(root)", source);

            ObjectNode response = section(rootObject.get("response"), "response", source);
            exactKeys(response, Set.of("pollingIntervalSeconds"), "response", source);
            JsonNode polling = response.get("pollingIntervalSeconds");
            if (polling == null || !polling.isIntegralNumber() || polling.intValue() <= 0) {
                throw new IllegalStateException(source + " response.pollingIntervalSeconds는 양의 정수여야 합니다: " + polling);
            }

            ObjectNode popup = section(rootObject.get("popup"), "popup", source);
            checkSection(popup, POPUP_RULES, "popup", source);
            if (!"CLOSE".equals(popup.get("footerAction").textValue())) {
                throw new IllegalStateException(source + " popup.footerAction 기본값은 CLOSE만 허용합니다(LINK_AND_CLOSE는 URL이 필요, SUBMIT은 SURVEY·QUIZ 규칙).");
            }
            if (popup.get("minimumWidth").doubleValue() > popup.get("maximumWidth").doubleValue()
                    || popup.get("minimumHeight").doubleValue() > popup.get("maximumHeight").doubleValue()) {
                throw new IllegalStateException(source + " popup.minimum*은 maximum*보다 클 수 없습니다.");
            }

            ObjectNode contentRoot = section(rootObject.get("content"), "content", source);
            exactKeys(contentRoot, CONTENT_RULES.keySet(), "content", source);
            Map<String, ObjectNode> content = new LinkedHashMap<>();
            for (Map.Entry<String, Map<String, Rule>> type : CONTENT_RULES.entrySet()) {
                ObjectNode section = section(contentRoot.get(type.getKey()), "content." + type.getKey(), source);
                checkSection(section, type.getValue(), "content." + type.getKey(), source);
                content.put(type.getKey(), section);
            }
            return new PopupFullJsonDefaults(polling.intValue(), popup, Map.copyOf(content));
        } catch (PopupSampleException ex) {
            throw new IllegalStateException(source + " " + ex.getMessage(), ex);
        }
    }

    /** ■ 응답 최상위 폴링 주기(초). */
    public int pollingIntervalSeconds() { return pollingIntervalSeconds; }

    /** ■ popup 최상위 기본값 복사본(호출자가 바꿔도 원본 불변). */
    public ObjectNode popupDefaults() { return popup.deepCopy(); }

    /** ■ 유형별 content 기본값 복사본(모르는 유형은 빈 객체). */
    public ObjectNode contentDefaults(String popupType) {
        ObjectNode section = content.get(popupType);
        return section == null ? popup.objectNode() : section.deepCopy();
    }

    /** 섹션이 객체인지 확인한다(YAML의 빈 값은 객체로 보지 않는다). */
    private static ObjectNode section(JsonNode node, String name, String source) {
        if (node == null || !node.isObject()) throw new IllegalStateException(source + " " + name + "은 객체여야 합니다: " + node);
        return (ObjectNode) node;
    }

    /** 섹션의 키 집합이 규칙과 정확히 같은지(오타·빠진 키 감지) 확인한다. */
    private static void exactKeys(ObjectNode node, Set<String> expected, String name, String source) {
        for (Iterator<String> it = node.fieldNames(); it.hasNext(); ) {
            String key = it.next();
            if (!expected.contains(key)) throw new IllegalStateException(source + " " + name + "에 모르는 키가 있습니다: " + key);
        }
        for (String key : expected) {
            if (!node.has(key)) throw new IllegalStateException(source + " " + name + "에 " + key + " 키가 없습니다.");
        }
    }

    /** 섹션 키·값을 규칙으로 검증한다. null은 nullable 규칙만 허용한다. */
    private static void checkSection(ObjectNode node, Map<String, Rule> rules, String name, String source) {
        exactKeys(node, rules.keySet(), name, source);
        rules.forEach((key, rule) -> {
            JsonNode value = node.get(key);
            if (value.isNull()) {
                if (!rule.nullable()) throw new IllegalStateException(source + " " + name + "." + key + "는 null일 수 없습니다.");
                return;
            }
            rule.check(name + "." + key, value, source);
        });
    }

    static PopupSampleException invalid(String id, String message) {
        return new PopupSampleException(PopupSampleException.Reason.INVALID_CONTENT_JSON, id, message);
    }

    /** 키 순서를 유지하는 규칙 표. */
    private static Map<String, Rule> ordered(Object... pairs) {
        Map<String, Rule> map = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) map.put((String) pairs[i], (Rule) pairs[i + 1]);
        return Collections.unmodifiableMap(map);
    }
}
