package server.web.api.popup.sample.relay;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.http.HttpClient;
import java.net.http.HttpTimeoutException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;

/**
 * POL-14-03 : 서버 인계 예제
 * ■ 중계 샘플 백엔드 HTTP 호출기
 * - in : RelayBackendProperties(baseUrl·path·timeout·서비스 간 인증 헤더)
 * - out: 백엔드 2xx 응답 본문 문자열 · 실패는 BackendCallException
 * - 백엔드 HTTP 호출만 담당한다(파싱·매핑은 {@link BackendResponseMapper}).
 *
 * <p>Spring 6.1 {@link RestClient} + JDK HttpClient. 연결·응답 timeout은 설정값을 쓴다.
 * 조회가 전달 건 생성 같은 부작용을 가질 수 있으므로 <b>자동 재시도하지 않는다</b>.
 * 인증 헤더 값·응답 본문은 로그에 남기지 않는다(상태·소요 시간·분류만 기록).</p>
 */
@Component
@ConditionalOnProperty(prefix = "popup.sample.relay", name = "enabled", havingValue = "true")
public class BackendPopupClient {

    private static final Logger log = LoggerFactory.getLogger(BackendPopupClient.class);

    private final RelayBackendProperties properties;
    private final RestClient restClient;

    public BackendPopupClient(RelayBackendProperties properties, RestClient.Builder builder) {
        this.properties = properties;
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(properties.connectTimeout())
                .followRedirects(HttpClient.Redirect.NEVER)
                .build();
        JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        factory.setReadTimeout(properties.readTimeout());
        this.restClient = builder.baseUrl(properties.baseUrl()).requestFactory(factory).build();
    }

    /**
     * POL-14-03 : 서버 인계 예제
     * ■ 백엔드 조회 API 1회 호출
     * - in : forwarded(Map) 클라이언트에서 넘길 헤더(설정 {@code forward-headers}에 있는 것만)
     * - out: String 2xx 응답 본문 · 예외: BackendCallException(CONNECT·TIMEOUT·HTTP_4XX·HTTP_5XX·INVALID_RESPONSE)
     * - 본문 {}로 POST하고 재시도하지 않는다. 성공·실패 모두 상태·소요 시간·분류만 로그에 남긴다.
     */
    public String fetch(Map<String, String> forwarded) {
        long started = System.nanoTime();
        try {
            String body = restClient.post()
                    .uri(properties.path())
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .headers(headers -> {
                        forwarded.forEach(headers::set);
                        if (properties.apiKeyHeader() != null && !properties.apiKeyHeader().isBlank()
                                && properties.apiKey() != null && !properties.apiKey().isBlank()) {
                            headers.set(properties.apiKeyHeader(), properties.apiKey());
                        }
                    })
                    // [교체 지점] 백엔드 요청 본문. WPF 조회 계약은 빈 객체 {}이며 사용자는 인증 헤더로 정해진다.
                    .body("{}")
                    .exchange((request, response) -> {
                        int status = response.getStatusCode().value();
                        String text = new String(response.getBody().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                        if (status >= 500) throw new BackendCallException(BackendCallException.Kind.HTTP_5XX, status, text, "백엔드 5xx", null);
                        if (status >= 400) throw new BackendCallException(BackendCallException.Kind.HTTP_4XX, status, text, "백엔드 4xx", null);
                        if (status < 200 || status >= 300) {
                            throw new BackendCallException(BackendCallException.Kind.INVALID_RESPONSE, status, text, "예상하지 않은 HTTP 상태", null);
                        }
                        return text;
                    });
            log.info("backend call ok path={} elapsedMs={}", properties.path(), elapsed(started));
            return body;
        } catch (BackendCallException ex) {
            log.warn("backend call failed kind={} status={} elapsedMs={}", ex.kind(), ex.status(), elapsed(started));
            throw ex;
        } catch (ResourceAccessException ex) {
            BackendCallException.Kind kind = isTimeout(ex) ? BackendCallException.Kind.TIMEOUT : BackendCallException.Kind.CONNECT;
            log.warn("backend call failed kind={} elapsedMs={} cause={}", kind, elapsed(started), ex.getMostSpecificCause().getClass().getSimpleName());
            throw new BackendCallException(kind, 0, null, "백엔드 통신 실패", ex);
        }
    }

    /** 원인 사슬에서 응답 대기 timeout인지 판단한다(연결 timeout·연결 거부는 false). */
    private static boolean isTimeout(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause()) {
            // 연결 단계 timeout은 연결 실패로 분류한다(응답 대기 timeout과 구분).
            if (t instanceof java.net.http.HttpConnectTimeoutException) return false;
            if (t instanceof HttpTimeoutException || t instanceof SocketTimeoutException) return true;
            if (t instanceof ConnectException) return false;
        }
        return false;
    }

    private static long elapsed(long started) {
        return (System.nanoTime() - started) / 1_000_000;
    }
}
