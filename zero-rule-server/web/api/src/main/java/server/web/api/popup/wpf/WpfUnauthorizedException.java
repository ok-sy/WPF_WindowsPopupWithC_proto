package server.web.api.popup.wpf;

/**
 * POL-15-02 : 인증·버전
 * ■ 사용자 사번 확인 실패 예외
 * - in : message(String) 실패 사유
 * - out: WpfApiExceptionHandler가 401 {@code WPF_UNAUTHORIZED}로 변환
 *
 * <p>통합 토큰 필터(타 팀)가 아직 적용되지 않았거나 매핑이 어긋나 SecurityContext에
 * 사용자가 없을 때, 그리고 개발용 헤더 모드에서 헤더가 빠졌을 때 발생한다. 토큰 자체의 검증 실패 401은
 * 통합 토큰 필터가 컨트롤러 진입 전에 응답하므로 이 예외와 구분된다.</p>
 */
public class WpfUnauthorizedException extends RuntimeException {

    public WpfUnauthorizedException(String message) {
        super(message);
    }
}
