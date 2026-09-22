package server.web.api.popup.wpf.version;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import server.base.props.WpfClientVersionProps;
import server.domain.popup.wpf.WpfClientVersionErrorResponse;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Optional;

/**
 * WPF 전용 API({@code /p/api/wpf/**})의 클라이언트 버전 검증 인터셉터.
 *
 * <p>[추가 이유 — 설계 13 §5·§7·§9·§10] 컨트롤러 비즈니스 처리 전에 요청 헤더 {@code X-Client-Version}을
 * 서버 최소 지원 버전({@link WpfClientVersionProps})과 숫자 비교해, 미달이면 {@code 426 Upgrade Required}와
 * {@link WpfClientVersionErrorResponse} JSON으로 차단한다. 각 컨트롤러에 반복 구현하지 않도록 공통 계층에 두었고,
 * 로그인 API(최초 접점)부터 목록·결과 API까지 모든 WPF 요청에 요청마다 적용되어 실행 중 서버 기준이 바뀌어도
 * 다음 요청에서 즉시 검증된다.</p>
 *
 * <p>[기존 구조와의 관계] 공통 {@code WebMvcConfig}는 수정하지 않는다. 이 인터셉터는 {@link WpfClientVersionWebConfig}
 * (web 패키지의 별도 WebMvcConfigurer)가 {@code /p/api/wpf/**}에만 등록한다. 기존 인증·사용자 식별
 * (WpfUserResolver)과는 독립이며, 401 처리보다 먼저 응답하므로 WPF는 426을 401 재로그인 경로에 넣지 않는다.</p>
 *
 * <p>[정책]</p>
 * <ul>
 *   <li>{@code minimum-supported-version}이 비어 있으면 검증하지 않는다(모두 통과).</li>
 *   <li>헤더 없음/해석 불가: {@code require-header=true}(기본)면 426(T5 — 구 클라이언트가 우회 못 함), false면 통과.</li>
 *   <li>{@code client >= minimum}이면 통과(최신이 아니어도 허용). 미만이면 426.</li>
 * </ul>
 */
@Component
public class WpfClientVersionInterceptor implements HandlerInterceptor {

    public static final String HEADER = "X-Client-Version";

    private static final Logger log = LoggerFactory.getLogger(WpfClientVersionInterceptor.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final WpfClientVersionProps props;
    private final ObjectMapper objectMapper;

    public WpfClientVersionInterceptor(WpfClientVersionProps props, ObjectMapper objectMapper) {
        this.props = props;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                             @NonNull Object handler) throws IOException {
        if (!props.isEnabled()) {
            return true;
        }
        Optional<ClientSemver> minimum = ClientSemver.parse(props.getMinimumSupportedVersion());
        if (minimum.isEmpty()) {
            // 설정 오타 등으로 최소 버전을 해석할 수 없으면 차단하지 않고 경고만 남긴다(서비스 전체 차단 방지).
            log.warn("[WPF] custom.wpf-client.minimum-supported-version 값을 해석할 수 없어 버전 검증을 건너뜁니다: '{}'",
                    props.getMinimumSupportedVersion());
            return true;
        }

        String header = request.getHeader(HEADER);
        Optional<ClientSemver> client = ClientSemver.parse(header);
        if (client.isEmpty()) {
            if (!props.isRequireHeader()) {
                return true;
            }
            reject(request, response, header == null ? "" : header.trim(),
                    "WPF 클라이언트 버전 정보가 없거나 올바르지 않습니다. 최신 버전으로 업데이트해 주세요.");
            return false;
        }
        if (client.get().isAtLeast(minimum.get())) {
            return true;
        }
        reject(request, response, client.get().toString(), "WPF 클라이언트 업데이트가 필요합니다.");
        return false;
    }

    private void reject(HttpServletRequest request, HttpServletResponse response, String clientVersion, String message)
            throws IOException {
        log.warn("[WPF] 클라이언트 버전 차단 426 {} {} clientVersion='{}' minimum='{}' latest='{}' remote={}",
                request.getMethod(), request.getRequestURI(), clientVersion,
                props.getMinimumSupportedVersion(), props.getLatestVersion(), request.getRemoteAddr());
        WpfClientVersionErrorResponse body = new WpfClientVersionErrorResponse(
                WpfClientVersionErrorResponse.CODE, message,
                clientVersion.isEmpty() ? null : clientVersion,
                props.getMinimumSupportedVersion(),
                props.getLatestVersion() == null || props.getLatestVersion().isBlank() ? null : props.getLatestVersion(),
                OffsetDateTime.now(KST));
        response.setStatus(426);   // HttpStatus.UPGRADE_REQUIRED — 상수 대신 숫자로 두어 프레임워크 버전 의존을 줄인다
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write(objectMapper.writeValueAsString(body));
        response.getWriter().flush();
    }
}
