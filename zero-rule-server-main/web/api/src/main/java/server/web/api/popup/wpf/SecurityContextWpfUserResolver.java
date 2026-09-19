package server.web.api.popup.wpf;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * 기본 사용자 식별기: 통합 토큰 필터(타 팀)가 SecurityContext에 넣은 Authentication에서 사번을 읽는다.
 *
 * <p>[추가 이유 — 기준 6] 운영에서 쓰이는 구현이다. 통합 토큰이 어떤 principal을 넣을지 아직 확정되지 않아
 * 아래 순서로 넓게 시도한다. 규격이 확정되면 이 클래스의 매핑만 고친다(컨트롤러·서비스 영향 없음).</p>
 * <ol>
 *   <li>principal이 {@link UserDetails}(기존 CustomUserDetails 포함)면 {@code getUsername()} — 로그인 ID를 사번으로 쓰는 경우</li>
 *   <li>그 외에는 {@code Authentication.getName()}</li>
 * </ol>
 * <p>인증 객체가 없거나 익명이면 {@link WpfUnauthorizedException}.</p>
 *
 * <p>활성 조건: {@code custom.wpf-popup.dev-user-header}가 false이거나 없을 때(운영 기본).</p>
 */
@Component
@ConditionalOnProperty(name = "custom.wpf-popup.dev-user-header", havingValue = "false", matchIfMissing = true)
public class SecurityContextWpfUserResolver implements WpfUserResolver {

    @Override
    public String resolveEmployeeNo(HttpServletRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(String.valueOf(authentication.getPrincipal()))) {
            throw new WpfUnauthorizedException("인증된 사용자 정보가 없습니다.");
        }
        Object principal = authentication.getPrincipal();
        String employeeNo = principal instanceof UserDetails details
                ? details.getUsername()
                : authentication.getName();
        if (employeeNo == null || employeeNo.isBlank()) {
            throw new WpfUnauthorizedException("인증 정보에 사용자 식별자가 없습니다.");
        }
        return employeeNo.trim();
    }
}
