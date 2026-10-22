package server.web.api.popup.sample.relay;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * POL-14-03 : 서버 인계 예제
 * POL-15-02 : 인증·버전
 * ■ 중계 샘플 한정 오류 응답
 * - in : PopupRelayController에서 던진 예외
 * - out: 기존 WPF 오류 계약 {@code {code, message, timestamp}} · 426은 백엔드 본문 그대로
 * - 서버 WpfApiExceptionHandler와 같은 코드 체계를 쓴다.
 *
 * <table>
 *   <tr><th>상황</th><th>HTTP</th><th>code</th></tr>
 *   <tr><td>요청 본문 오류</td><td>400</td><td>WPF_BAD_REQUEST</td></tr>
 *   <tr><td>백엔드 400·401·403</td><td>같은 상태</td><td>백엔드 본문의 WPF 코드(없으면 상태별 기본 코드)</td></tr>
 *   <tr><td>백엔드 426(클라이언트 버전 미지원)</td><td>426</td><td>백엔드 본문 그대로(CLIENT_VERSION_NOT_SUPPORTED·버전 값, 클라이언트 최소 버전 거절 계약)</td></tr>
 *   <tr><td>백엔드 그 밖의 4xx·5xx, 연결 실패, timeout, JSON 오류, 계약 불일치</td><td>500</td><td>WPF_INTERNAL(메시지 비노출)</td></tr>
 * </table>
 *
 * <p>통신 실패 종류는 로그와 샘플 진단 헤더 {@code X-Sample-Upstream-Error}(CONNECT·TIMEOUT·HTTP_4XX·HTTP_5XX·INVALID_JSON·INVALID_RESPONSE)로만 구분한다.
 * WPF 클라이언트는 이 헤더를 읽지 않으며 기존 계약 상태·코드만 사용한다. [교체 지점] 운영 연계 시 이 헤더 유지 여부를 정한다.</p>
 */
@RestControllerAdvice(assignableTypes = PopupRelayController.class)
@ConditionalOnProperty(prefix = "popup.sample.relay", name = "enabled", havingValue = "true")
public class RelayExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(RelayExceptionHandler.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX");
    static final String UPSTREAM_ERROR_HEADER = "X-Sample-Upstream-Error";
    private static final Map<Integer, String> PASS_THROUGH = Map.of(400, "WPF_BAD_REQUEST", 401, "WPF_UNAUTHORIZED", 403, "WPF_USER_INACTIVE");
    private static final Set<String> WPF_CODES = Set.of("WPF_BAD_REQUEST", "WPF_UNAUTHORIZED", "WPF_USER_INACTIVE");

    private final ObjectMapper objectMapper;

    public RelayExceptionHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** 백엔드 실패를 위 표대로 426 원문·400/401/403 전달·500 WPF_INTERNAL로 변환한다. */
    @ExceptionHandler(BackendCallException.class)
    public ResponseEntity<Map<String, Object>> backend(BackendCallException ex) {
        log.warn("relay failed kind={} status={} reason={}", ex.kind(), ex.status(), ex.getMessage());
        JsonNode upgrade = ex.status() == 426 ? readJson(ex.body()) : null;
        if (upgrade != null && upgrade.isObject()) {
            // WPF는 426 본문의 버전 값으로 업데이트 안내를 띄우므로 형태를 바꾸지 않는다.
            return ResponseEntity.status(426).header(UPSTREAM_ERROR_HEADER, ex.kind().name()).body(objectMapper.convertValue(upgrade, new TypeReference<Map<String, Object>>() { }));
        }
        if (ex.kind() == BackendCallException.Kind.HTTP_4XX && PASS_THROUGH.containsKey(ex.status())) {
            String code = PASS_THROUGH.get(ex.status());
            String message = "백엔드 요청이 거절되었습니다.";
            JsonNode body = readJson(ex.body());
            if (body != null && WPF_CODES.contains(body.path("code").asText())) {
                code = body.get("code").asText();
                message = body.path("message").asText(message);
            }
            return error(HttpStatus.valueOf(ex.status()), code, message, ex.kind());
        }
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "WPF_INTERNAL", "서버 처리 중 오류가 발생했습니다.", ex.kind());
    }

    /** 요청 본문 오류 → 400 WPF_BAD_REQUEST. */
    @ExceptionHandler({HttpMessageNotReadableException.class, IllegalArgumentException.class})
    public ResponseEntity<Map<String, Object>> badRequest(Exception ex) {
        String message = ex instanceof HttpMessageNotReadableException ? "요청 본문을 해석할 수 없습니다." : ex.getMessage();
        return error(HttpStatus.BAD_REQUEST, "WPF_BAD_REQUEST", message, null);
    }

    private JsonNode readJson(String body) {
        if (body == null || body.isBlank()) return null;
        try {
            return objectMapper.readTree(body);
        } catch (Exception ignored) {
            return null;
        }
    }

    private static ResponseEntity<Map<String, Object>> error(HttpStatus status, String code, String message, BackendCallException.Kind kind) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("code", code);
        body.put("message", message);
        body.put("timestamp", OffsetDateTime.now(KST).format(TIMESTAMP));
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(status);
        if (kind != null) builder.header(UPSTREAM_ERROR_HEADER, kind.name());
        return builder.body(body);
    }
}
