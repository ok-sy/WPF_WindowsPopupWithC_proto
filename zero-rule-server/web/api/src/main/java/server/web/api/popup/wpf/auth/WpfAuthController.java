package server.web.api.popup.wpf.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import server.domain.popup.wpf.WpfLoginResponse;
import server.web.api.payload.popup.wpf.WpfLoginRequest;

/**
 * WPF SSO·토큰 프로토타입 로그인 API.
 * <pre>
 *   POST /p/api/wpf/auth/login   { logonId, classCode, linkYn }  →  { accessToken, tokenType, expiresAt }
 * </pre>
 *
 * <p>[추가 이유 — 설계 10 §6] WPF가 Windows 통합 인증으로 사내 SSO에서 얻은 사용자 정보를 보내면 짧은 유효기간
 * (기본 10분)의 opaque 토큰을 발급한다. 목적은 <b>통신 형태와 {@code 401 → 재로그인 → 원 요청 재전송} 동작 검증</b>이며
 * 사용자 진위는 검증하지 않는다(프로토타입에서는 SSO가 돌려준 값을 신뢰). 운영 인증은 타 팀 통합 토큰이 담당하고,
 * 그때 WPF 쪽 {@code IAuthHeaderProvider} 계약은 그대로 유지된다(설계 10 §7).</p>
 *
 * <p>[기존 구조와의 관계] {@code /p/**}는 공개 경로라 SecurityConfig·DefaultPublicUrls 수정 없이 도달한다.
 * {@code custom.wpf-auth-prototype.enabled=true}일 때만 등록되며(운영 기본 false), 오류 응답은
 * {@code WpfApiExceptionHandler}가 다른 WPF API와 같은 {@code {code, message, timestamp}} 형태로 만든다.
 * 인증 이력은 DB에 남기지 않는다(설계 10 §2 제외 항목).</p>
 */
@Tag(name = "Popup WPF")
@RestController
@RequestMapping("/p/api/wpf/auth")
@ConditionalOnProperty(name = "custom.wpf-auth-prototype.enabled", havingValue = "true")
public class WpfAuthController {

    private static final Logger log = LoggerFactory.getLogger(WpfAuthController.class);

    private final WpfPrototypeTokenStore tokenStore;

    public WpfAuthController(WpfPrototypeTokenStore tokenStore) {
        this.tokenStore = tokenStore;
    }

    /**
     * 필수 값(logonId·classCode)만 검사하고 토큰을 발급한다. 실패는 Bean Validation → 400 WPF_BAD_REQUEST.
     * 같은 사용자가 다시 로그인해도 이전 토큰을 즉시 폐기하지 않는다(만료로 정리) — 동시 401 재시도 중인
     * 다른 요청이 새 토큰을 받기 전까지 실패하지 않도록.
     */
    @Operation(summary = "WPF 프로토타입 로그인 — SSO 사용자 정보로 단기 opaque 토큰 발급 (진위 검증 없음)")
    @PostMapping("/login")
    public WpfLoginResponse login(@Valid @RequestBody WpfLoginRequest body, HttpServletRequest request) {
        WpfPrototypeTokenStore.Entry entry = tokenStore.issue(body.logonId().trim(), body.classCode().trim());
        log.info("[WPF] 프로토타입 로그인 logonId={} linkYn={} remote={}", entry.logonId(), body.linkYn(), request.getRemoteAddr());
        return new WpfLoginResponse(entry.token(), "Bearer", entry.expiresAt());
    }
}
