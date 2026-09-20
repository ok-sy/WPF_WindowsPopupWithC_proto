package server.web.api.popup.wpf;

import jakarta.servlet.http.HttpServletRequest;

/**
 * 현재 요청의 인증된 사용자 사번(POPUP.APP_USER.EMPLOYEE_NO)을 돌려주는 어댑터.
 *
 * <p>[추가 이유 — 기준 6] 서버 토큰 인증(웹·WPF 통합 토큰)은 다른 팀이 개발한다. WPF API(WpfPopupController)가
 * 그 구현 세부(Authentication 타입, principal 필드명)에 의존하지 않도록 "사번 읽기"만 인터페이스로 분리한다.
 * 통합 토큰 필터가 완성되면 {@link SecurityContextWpfUserResolver}의 매핑만 맞추면 되고, 그 전까지 개발
 * 프로파일에서는 {@link DevHeaderWpfUserResolver}가 요청 헤더로 사번을 지정한다.
 * 요청 본문·쿼리의 userId는 어떤 구현에서도 사용하지 않는다.</p>
 *
 * <p>구현체는 설정 {@code custom.wpf-popup.dev-user-header}로 하나만 활성화된다.</p>
 */
public interface WpfUserResolver {

    /**
     * @return 사번. 비어 있지 않다.
     * @throws WpfUnauthorizedException 인증 정보에서 사번을 얻을 수 없을 때 (→ 401 WPF_UNAUTHORIZED)
     */
    String resolveEmployeeNo(HttpServletRequest request);
}
