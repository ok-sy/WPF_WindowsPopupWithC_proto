package server.web.api.popup.wpf.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import server.web.api.popup.wpf.DevHeaderWpfUserResolver;
import server.web.api.popup.wpf.SecurityContextWpfUserResolver;
import server.web.api.popup.wpf.WpfUnauthorizedException;
import server.web.api.popup.wpf.WpfUserResolver;

/**
 * 프로토타입 사용자 식별기: {@code Authorization: Bearer {token}}을 {@link WpfPrototypeTokenStore}에서 찾아
 * 토큰에 연결된 logonId(사번)를 돌려준다.
 *
 * <p>[추가 이유 — 설계 10 §6.3] WPF API({@code GET /p/api/wpf/popups}, {@code POST /p/api/wpf/popups/results})가
 * 프로토타입 토큰을 검사해야 만료 후 401과 재로그인 흐름을 검증할 수 있다. 검사 순서:</p>
 * <ol>
 *   <li>{@code Authorization} 헤더가 {@code Bearer } 로 시작하는가</li>
 *   <li>토큰이 서버 메모리 저장소에 있는가</li>
 *   <li>{@code expiresAt > now} 인가</li>
 * </ol>
 * <p>하나라도 실패하면 {@link WpfUnauthorizedException} → WpfApiExceptionHandler가 401 {@code WPF_UNAUTHORIZED}.
 * WPF는 이 401을 받아 SSO·로그인 API로 새 토큰을 받은 뒤 같은 요청을 1회 재전송한다.</p>
 *
 * <p>[기존 구조와의 관계] {@link WpfUserResolver} 인터페이스와 컨트롤러는 그대로다. 프로토타입이 켜지면
 * {@link DevHeaderWpfUserResolver}(X-Dev-User-Id)나 {@link SecurityContextWpfUserResolver}가 함께 등록돼 있어도
 * {@code @Primary}인 이 구현이 컨트롤러에 주입된다 → 프로토타입 모드에서는 개발용 헤더만으로는 통과할 수 없다.
 * 프로토타입을 끄면({@code enabled=false}, 운영 기본) 이 빈은 등록되지 않고 기존 선택 규칙으로 돌아간다.</p>
 */
@Component
@Primary
@ConditionalOnProperty(name = "custom.wpf-auth-prototype.enabled", havingValue = "true")
public class PrototypeTokenWpfUserResolver implements WpfUserResolver {

    public static final String BEARER_PREFIX = "Bearer ";

    private static final Logger log = LoggerFactory.getLogger(PrototypeTokenWpfUserResolver.class);

    private final WpfPrototypeTokenStore tokenStore;

    public PrototypeTokenWpfUserResolver(WpfPrototypeTokenStore tokenStore) {
        this.tokenStore = tokenStore;
        log.warn("[WPF] 프로토타입 토큰 사용자 식별기가 활성화되었습니다(X-Dev-User-Id 헤더는 무시됩니다).");
    }

    @Override
    public String resolveEmployeeNo(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            log.info("[WPF] 401: Authorization Bearer 헤더 없음 uri={}", request.getRequestURI());
            throw new WpfUnauthorizedException("Authorization: Bearer 토큰이 필요합니다.");
        }
        String token = header.substring(BEARER_PREFIX.length()).trim();
        return tokenStore.find(token)
                .map(WpfPrototypeTokenStore.Entry::logonId)
                .orElseThrow(() -> {
                    log.info("[WPF] 401: 토큰 없음 또는 만료 uri={}", request.getRequestURI());
                    return new WpfUnauthorizedException("토큰이 유효하지 않거나 만료되었습니다. 다시 로그인하십시오.");
                });
    }
}
