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
 * [TODO65] 실테이블 연계 단건 조회 샘플 API. 기본 비활성({@code popup.sample.single-query.enabled=true}일 때만 등록).
 *
 * <p>{@code POST /p/api/sample/wpf/popups/single} 본문 {@code {}} → 기존 WPF 단건 조회와 같은 응답
 * {@code {pollingIntervalSeconds, popup}}. 사용자는 기존 {@link WpfUserResolver}(인증 정보/개발 헤더)로 정하고 본문 값을 쓰지 않는다.
 * {@code contentId}·{@code contentTypeCode} 쿼리는 확인용 [샘플 조건]이며 업무 후보 판단이 아니다.</p>
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
