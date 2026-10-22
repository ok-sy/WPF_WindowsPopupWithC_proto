package server.web.api.popup.sample.relay;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * [TODO70] 연계 백엔드 설정({@code popup.sample.relay.*}, 기본 비활성 {@code enabled=false}).
 *
 * <p>실제 URL·경로·인증 헤더는 확정 전이라 예시값이다. 비밀값({@code apiKey})은 소스에 고정하지 않고
 * 환경 변수 {@code RELAY_BACKEND_API_KEY} 등으로 주입한다.</p>
 *
 * @param baseUrl        백엔드 기준 URL. 예: {@code http://127.0.0.1:18090}(mock). [교체 지점] 실제 개발/검증계 주소
 * @param path           조회 경로. 예: {@code /api/wpf/popups}. [교체 지점] 실제 경로(쿼리 포함 가능)
 * @param connectTimeout 연결 timeout
 * @param readTimeout    응답 timeout
 * @param apiKeyHeader   서비스 간 인증 헤더 이름. 비우면 보내지 않는다
 * @param apiKey         서비스 간 인증 값. 로그에 남기지 않는다
 * @param forwardHeaders 클라이언트 요청에서 백엔드로 그대로 넘길 헤더(기본 Authorization, X-Client-Version)
 * @param responseShape  백엔드 응답 구조. {@code WPF}=WPF 조회 계약과 같음(변환 없음), {@code ENVELOPE}={@code {resultCode, data}} 예시
 */
@ConfigurationProperties("popup.sample.relay")
public record RelayBackendProperties(
        String baseUrl,
        String path,
        Duration connectTimeout,
        Duration readTimeout,
        String apiKeyHeader,
        String apiKey,
        List<String> forwardHeaders,
        ResponseShape responseShape
) {
    public enum ResponseShape { WPF, ENVELOPE }

    public RelayBackendProperties {
        if (baseUrl == null || baseUrl.isBlank()) throw new IllegalArgumentException("popup.sample.relay.base-url은 필수입니다.");
        if (path == null || path.isBlank()) path = "/api/wpf/popups";
        if (connectTimeout == null) connectTimeout = Duration.ofSeconds(3);
        if (readTimeout == null) readTimeout = Duration.ofSeconds(5);
        if (forwardHeaders == null) forwardHeaders = List.of("Authorization", "X-Client-Version");
        if (responseShape == null) responseShape = ResponseShape.WPF;
    }
}
