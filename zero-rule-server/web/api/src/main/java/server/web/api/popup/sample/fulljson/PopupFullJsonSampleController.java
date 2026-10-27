package server.web.api.popup.sample.fulljson;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import jakarta.servlet.http.HttpServletRequest;
import server.service.core.popup.sample.fulljson.PopupFullJsonSampleService;
import server.web.api.popup.wpf.WpfUserResolver;

/**
 * POL-14-03 : 서버 인계 예제
 * POL-13-03 : 적용·샘플 구분
 * ■ DTIY3117 전체 JSON 단건 조회 샘플 API
 * - in : 기본 비활성({@code popup.sample.full-json.enabled=true}일 때만 등록)
 * - out: 기존 WPF 단건 조회와 같은 응답 {@code {pollingIntervalSeconds, popup}}
 * - 기존 WPF 조회·3111 샘플({@code /p/api/sample/wpf/popups/single})과 겹치지 않는 별도 경로
 *   {@code POST /p/api/sample/wpf/popups/full-json/single?popupId=...}를 쓴다.
 *   사용자는 기존 {@link WpfUserResolver}(인증 정보/개발 헤더)로 정하고 본문 값을 쓰지 않는다.
 * - {@code popupId}는 첫 샘플의 조회 조건이다. 사용자별 후보 선정은 [담당 구현]이다.
 */
@RestController
@ConditionalOnProperty(prefix = "popup.sample.full-json", name = "enabled", havingValue = "true")
public class PopupFullJsonSampleController {

    private final PopupFullJsonSampleService service;
    private final WpfUserResolver userResolver;

    public PopupFullJsonSampleController(PopupFullJsonSampleService service, WpfUserResolver userResolver) {
        this.service = service;
        this.userResolver = userResolver;
    }

    /**
     * POL-14-03 : 서버 인계 예제
     * ■ 3117 샘플 단건 조회 (POST /p/api/sample/wpf/popups/full-json/single)
     * - in : request(HttpServletRequest) 사용자 식별용 · body(JsonNode) 비었거나 {} · popupId(String) 조회할 POPU_ID
     * - out: ObjectNode {@code {pollingIntervalSeconds, popup}} (없으면 popup:null)
     *        · 예외: IllegalArgumentException(400), WpfUnauthorizedException(401), PopupSampleException(500)
     */
    @PostMapping(path = "/p/api/sample/wpf/popups/full-json/single", produces = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode nextPopup(HttpServletRequest request,
                                @RequestBody(required = false) JsonNode body,
                                @RequestParam(name = "popupId", required = false) String popupId) {
        if (body != null && !body.isObject()) throw new IllegalArgumentException("요청 본문은 JSON 객체여야 합니다.");
        String userId = userResolver.resolveEmployeeNo(request);
        return service.nextPopup(userId, popupId);
    }
}
