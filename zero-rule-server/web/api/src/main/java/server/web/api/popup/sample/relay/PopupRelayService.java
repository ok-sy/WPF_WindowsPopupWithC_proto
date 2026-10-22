package server.web.api.popup.sample.relay;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * [TODO70] 백엔드 호출(1회) → 응답 매핑. 실패를 빈 정상 응답(popup:null)으로 바꾸지 않는다.
 *
 * <p>이 응답은 WPF 클라이언트 조회 계약({@code POST /api/wpf/popups})이다. 관리자 웹의 팝업 편집 모델
 * ({@code AdminPopupDetail})과는 다른 모델이므로 프론트 샘플(TODO69) 데이터로 쓰지 않는다.</p>
 */
@Service
@ConditionalOnProperty(prefix = "popup.sample.relay", name = "enabled", havingValue = "true")
public class PopupRelayService {

    private final BackendPopupClient client;
    private final BackendResponseMapper mapper;

    public PopupRelayService(BackendPopupClient client, BackendResponseMapper mapper) {
        this.client = client;
        this.mapper = mapper;
    }

    public ObjectNode nextPopup(Map<String, String> forwardedHeaders) {
        return mapper.toWpfResponse(client.fetch(forwardedHeaders));
    }
}
