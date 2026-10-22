package server.web.api.popup.sample.relay;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * POL-14-03 : 서버 인계 예제
 * POL-09-02 : 조회 응답
 * ■ 백엔드 응답 본문 → WPF 단건 조회 응답 매퍼
 * - in : 백엔드 응답 본문 문자열 · responseShape(WPF | ENVELOPE)
 * - out: ObjectNode {@code {pollingIntervalSeconds, popup}} · 실패는 BackendCallException(INVALID_JSON·INVALID_RESPONSE)
 *
 * <p>본문은 {@link ObjectMapper#readTree}로 한 번만 파싱해 {@link JsonNode}로 다룬다. content·questions 같은 중첩 객체,
 * boolean false·숫자 0·null 값을 그대로 보존하며 객체를 문자열로 다시 감싸는 이중 직렬화를 하지 않는다.</p>
 *
 * <ul>
 *   <li>{@code WPF}: 백엔드가 WPF 조회 계약과 같은 구조를 주는 경우. 검증만 하고 구조를 바꾸지 않는다.</li>
 *   <li>{@code ENVELOPE}: {@code {resultCode, data: {pollingIntervalSeconds, popup}}} 형태 예시. 차이는 {@link #unwrapEnvelope}에만 둔다.
 *       [교체 지점] 실제 백엔드 envelope가 확정되면 이 함수만 바꾼다.</li>
 * </ul>
 *
 * <p>popup 안의 deliveryId·popupId 등 백엔드가 준 식별자는 바꾸거나 새로 만들지 않는다.
 * 전달 건 생성·대상/일정/완료/숨김·결과 중복 처리는 백엔드 책임이며 이 샘플에 복제하지 않는다.</p>
 */
@Component
@ConditionalOnProperty(prefix = "popup.sample.relay", name = "enabled", havingValue = "true")
public class BackendResponseMapper {

    private final ObjectMapper objectMapper;
    private final RelayBackendProperties properties;

    public BackendResponseMapper(ObjectMapper objectMapper, RelayBackendProperties properties) {
        this.objectMapper = objectMapper;
        this.properties = properties;
    }

    /**
     * POL-14-03 : 서버 인계 예제
     * ■ 백엔드 응답을 WPF 조회 응답으로 변환
     * - in : body(String) 백엔드 2xx 응답 본문
     * - out: ObjectNode 검증된 조회 응답 · 예외: BackendCallException(INVALID_JSON·INVALID_RESPONSE)
     * - 한 번 파싱해 ENVELOPE면 data를 꺼내고 조회 계약을 검사한다. 구조는 바꾸지 않는다.
     */
    public ObjectNode toWpfResponse(String body) {
        JsonNode root;
        try {
            root = objectMapper.readTree(body == null ? "" : body);
        } catch (JsonProcessingException ex) {
            throw new BackendCallException(BackendCallException.Kind.INVALID_JSON, 200, null, "백엔드 응답이 JSON이 아닙니다.", ex);
        }
        if (root == null || root.isMissingNode()) {
            throw new BackendCallException(BackendCallException.Kind.INVALID_JSON, 200, null, "백엔드 응답 본문이 비었습니다.", null);
        }
        JsonNode response = properties.responseShape() == RelayBackendProperties.ResponseShape.ENVELOPE ? unwrapEnvelope(root) : root;
        return validate(response);
    }

    /** 예시 envelope {@code {resultCode:"0000", data:{...}}}의 data를 꺼낸다. */
    JsonNode unwrapEnvelope(JsonNode root) {
        if (!root.isObject() || !root.path("data").isObject()) {
            throw invalid("envelope에 data 객체가 없습니다.");
        }
        return root.get("data");
    }

    /** 조회 계약: pollingIntervalSeconds(양의 정수) 필수, popup 키 필수(객체 또는 null = 표시할 팝업 없음). */
    private ObjectNode validate(JsonNode response) {
        if (!response.isObject()) throw invalid("응답이 JSON 객체가 아닙니다.");
        JsonNode polling = response.get("pollingIntervalSeconds");
        if (polling == null || !polling.canConvertToInt() || !polling.isIntegralNumber() || polling.intValue() <= 0) {
            throw invalid("pollingIntervalSeconds가 양의 정수가 아닙니다.");
        }
        if (!response.has("popup")) throw invalid("popup 키가 없습니다(없음은 popup:null).");
        JsonNode popup = response.get("popup");
        if (!popup.isNull() && !popup.isObject()) throw invalid("popup이 객체 또는 null이 아닙니다.");
        if (popup.isObject() && (!popup.path("popupId").isTextual() || !popup.path("popupType").isTextual())) {
            throw invalid("popup.popupId·popupType이 없습니다.");
        }
        return (ObjectNode) response;
    }

    private static BackendCallException invalid(String message) {
        return new BackendCallException(BackendCallException.Kind.INVALID_RESPONSE, 200, null, message, null);
    }
}
