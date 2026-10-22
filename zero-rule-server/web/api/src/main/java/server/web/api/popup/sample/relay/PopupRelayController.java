package server.web.api.popup.sample.relay;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * POL-14-03 : 서버 인계 예제
 * ■ WPF 단건 조회와 같은 모양의 조회 중계 API
 * - in : 요청 헤더 · 본문 {@code {}}(사용자는 인증 헤더로 정해진다)
 * - out: ObjectNode {@code {pollingIntervalSeconds, popup}}
 * - 기본 비활성({@code popup.sample.relay.enabled=true}일 때만 등록). 조회만 중계하며 결과 저장 API는 두지 않는다.
 *
 * <p>설정 {@code popup.sample.relay.forward-headers}에 있는 헤더만 백엔드로 넘긴다(기본 Authorization, X-Client-Version).
 * 경로는 기존 WPF API({@code /p/api/wpf/popups})와 겹치지 않게 {@code /p/api/sample/relay}를 쓴다(/p/** 공개 규칙).</p>
 */
@RestController
@ConditionalOnProperty(prefix = "popup.sample.relay", name = "enabled", havingValue = "true")
public class PopupRelayController {

    private final PopupRelayService service;
    private final RelayBackendProperties properties;

    public PopupRelayController(PopupRelayService service, RelayBackendProperties properties) {
        this.service = service;
        this.properties = properties;
    }

    /**
     * POL-14-03 : 서버 인계 예제
     * ■ 조회 중계 (POST /p/api/sample/relay/wpf/popups)
     * - in : headers(Map) 요청 헤더 전체 · body(JsonNode) 비었거나 JSON 객체
     * - out: ObjectNode 백엔드 조회 응답 · 예외: IllegalArgumentException(400), BackendCallException
     * - forward-headers에 있는 헤더만 이름 대소문자 무시로 골라 백엔드로 넘긴다.
     */
    @PostMapping(path = "/p/api/sample/relay/wpf/popups", produces = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode nextPopup(@RequestHeader Map<String, String> headers, @RequestBody(required = false) JsonNode body) {
        if (body != null && !body.isObject()) throw new IllegalArgumentException("요청 본문은 JSON 객체여야 합니다.");
        Map<String, String> forwarded = new LinkedHashMap<>();
        for (String name : properties.forwardHeaders()) {
            headers.entrySet().stream()
                    .filter(entry -> entry.getKey().equalsIgnoreCase(name))
                    .findFirst()
                    .ifPresent(entry -> forwarded.put(name, entry.getValue()));
        }
        return service.nextPopup(forwarded);
    }
}
