package server.web.api.popup.wpf;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 개발·연동 테스트용 사용자 식별기: 요청 헤더 {@code X-Dev-User-Id}의 값을 사번으로 신뢰한다.
 *
 * <p>[추가 이유 — 기준 6] 통합 토큰 필터(타 팀)가 준비되기 전에도 WPF 조회·결과 API를 개발·검증할 수 있어야 한다.
 * 이 구현은 인증을 전혀 하지 않으므로 {@code custom.wpf-popup.dev-user-header=true}인 개발 프로파일에서만
 * 빈으로 등록되고, 운영 프로파일에서는 반드시 false로 둔다(README·설계 04 문서).</p>
 */
@Component
@ConditionalOnProperty(name = "custom.wpf-popup.dev-user-header", havingValue = "true")
public class DevHeaderWpfUserResolver implements WpfUserResolver {

    public static final String HEADER = "X-Dev-User-Id";

    private static final Logger log = LoggerFactory.getLogger(DevHeaderWpfUserResolver.class);

    public DevHeaderWpfUserResolver() {
        log.warn("[WPF] 개발용 사용자 식별기(X-Dev-User-Id 헤더)가 활성화되었습니다. 운영 환경에서는 사용하지 마십시오.");
    }

    @Override
    public String resolveEmployeeNo(HttpServletRequest request) {
        String value = request.getHeader(HEADER);
        if (value == null || value.isBlank()) {
            throw new WpfUnauthorizedException("개발 모드: " + HEADER + " 헤더가 필요합니다.");
        }
        return value.trim();
    }
}
