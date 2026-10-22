package server.web.api.popup.sample.relay;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * [TODO70] 테이블 없이 백엔드 HTTP API를 호출해 WPF 단건 조회 응답을 전달하는 샘플. 기본 비활성.
 *
 * <p>흐름: 클라이언트 → {@link PopupRelayController} → {@link PopupRelayService} → {@link BackendPopupClient}(HTTP)
 * → {@link BackendResponseMapper}(파싱·필요한 매핑) → 클라이언트. 이 패키지의 클래스는 DataSource·MyBatis를 쓰지 않는다.
 * 기존 서버에 넣어 실행하면 서버 자체의 DB 설정은 그대로 필요하고, DB 없이 단독 확인할 때는
 * 테스트 소스의 {@code PopupRelaySampleDevServer}(최소 부트 구성 + mock 백엔드)를 쓴다.</p>
 *
 * <p>인수인계 문서: docs/interfaces/SERVER_SAMPLE_BACKEND_RELAY_API.md — 클래스별 선언 이유(5-1), 옵션 추가/삭제 예시(5-2),
 * 실제 연동 시 바뀌는 부분(5-3). 코드 안 표식: [교체 지점].</p>
 *
 * <pre>
 * popup:
 *   sample:
 *     relay:
 *       enabled: true
 *       base-url: ${POPUP_SAMPLE_RELAY_BASE_URL:http://127.0.0.1:18090}   # [교체 지점] 실제 개발/검증계 백엔드
 *       path: /api/wpf/popups                                            # [교체 지점] 실제 경로
 *       connect-timeout: 3s
 *       read-timeout: 5s
 *       api-key-header: X-Api-Key                                        # 필요할 때만. 비우면 보내지 않음
 *       api-key: ${POPUP_SAMPLE_RELAY_API_KEY:}                          # 비밀값은 환경 변수로 주입
 *       forward-headers: [Authorization, X-Client-Version]
 *       response-shape: WPF                                              # WPF | ENVELOPE
 * </pre>
 */
@Configuration
@ConditionalOnProperty(prefix = "popup.sample.relay", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(RelayBackendProperties.class)
public class RelaySampleConfig {
}
