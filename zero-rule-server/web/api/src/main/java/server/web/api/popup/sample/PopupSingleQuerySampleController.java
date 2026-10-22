package server.web.api.popup.sample;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import jakarta.servlet.http.HttpServletRequest;
import server.service.core.popup.sample.PopupSingleQuerySampleService;
import server.web.api.popup.wpf.WpfUserResolver;

/**
 * POL-14-03 : 서버 인계 예제
 * POL-13-03 : 적용·샘플 구분
 * ■ 실테이블 연계 단건 조회 샘플 API (DB 조회·조립 샘플)
 * - in : 기본 비활성({@code popup.sample.single-query.enabled=true}일 때만 등록)
 * - out: 기존 WPF 단건 조회와 같은 응답 {@code {pollingIntervalSeconds, popup}}
 * - 기존 WPF 조회와 겹치지 않는 별도 경로 {@code POST /p/api/sample/wpf/popups/single}을 쓴다.
 *   사용자는 기존 {@link WpfUserResolver}(인증 정보/개발 헤더)로 정하고 본문 값을 쓰지 않는다.
 * - {@code contentId}·{@code contentTypeCode} 쿼리는 확인용 [샘플 조건]이며 업무 후보 판단이 아니다.
 */
@RestController
@ConditionalOnProperty(prefix = "popup.sample.single-query", name = "enabled", havingValue = "true")
public class PopupSingleQuerySampleController {

    private final PopupSingleQuerySampleService service;
    private final WpfUserResolver userResolver;

    public PopupSingleQuerySampleController(PopupSingleQuerySampleService service, WpfUserResolver userResolver) {
        this.service = service;
        this.userResolver = userResolver;
    }

    /**
     * POL-14-03 : 서버 인계 예제
     * ■ 샘플 단건 조회 (POST /p/api/sample/wpf/popups/single)
     * - in : request(HttpServletRequest) 사용자 식별용 · body(JsonNode) 비었거나 {} · contentId/contentTypeCode(String) 확인용 샘플 조건
     * - out: ObjectNode {@code {pollingIntervalSeconds, popup}} (없으면 popup:null) · 예외: IllegalArgumentException(400), WpfUnauthorizedException(401)
     * - 본문이 JSON 객체가 아니면 400, 사번을 얻은 뒤 서비스의 샘플 조회 결과를 그대로 돌려준다.
     */
    @PostMapping(path = "/p/api/sample/wpf/popups/single", produces = MediaType.APPLICATION_JSON_VALUE)
    public ObjectNode nextPopup(HttpServletRequest request,
                                @RequestBody(required = false) JsonNode body,
                                @RequestParam(name = "contentId", required = false) String contentId,
                                @RequestParam(name = "contentTypeCode", required = false) String contentTypeCode) {
        if (body != null && !body.isObject()) throw new IllegalArgumentException("요청 본문은 JSON 객체여야 합니다.");
        String userId = userResolver.resolveEmployeeNo(request);
        return service.nextPopup(userId, contentId, contentTypeCode);
    }
}
