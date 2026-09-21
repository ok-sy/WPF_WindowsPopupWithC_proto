package server.web.api.popup.wpf;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import server.domain.popup.wpf.WpfErrorResponse;
import server.web.api.popup.wpf.auth.WpfAuthController;
import server.service.core.popup.wpf.WpfUserInactiveException;

import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * WPF 컨트롤러({@link WpfPopupController}, 프로토타입 로그인 {@link WpfAuthController}) 한정 예외 → {@code {code, message, timestamp}} JSON 변환.
 *
 * <p>[추가 이유 — 기준 3] 관리자 웹은 CLNewApiResponse/msgId 체계를 쓰고, 현재 팝업 API에는 통일된 오류 JSON이 없다.
 * WPF는 단순 코드 체계가 필요하며, 전역 예외 처리를 바꾸면 다른 업무 API 응답이 달라지므로
 * {@code assignableTypes}로 범위를 WPF 컨트롤러에 한정한 별도 어드바이스를 둔다.
 * 토큰 검증 실패(401)는 통합 토큰 필터(타 팀)가 컨트롤러 진입 전에 응답하므로 여기서는 다루지 않는다.
 * [설계 10] SSO·토큰 프로토타입에서는 {@code PrototypeTokenWpfUserResolver}가 토큰 없음·만료를 {@link WpfUnauthorizedException}으로
 * 던지므로 그 401도 이 어드바이스가 같은 JSON으로 응답한다. 로그인 API의 검증 실패(400)도 함께 다룬다.</p>
 *
 * <table>
 *   <tr><th>HTTP</th><th>code</th><th>상황</th></tr>
 *   <tr><td>400</td><td>WPF_BAD_REQUEST</td><td>Bean Validation 실패, JSON 구문·enum 오류, 서비스 IllegalArgumentException</td></tr>
 *   <tr><td>401</td><td>WPF_UNAUTHORIZED</td><td>WpfUserResolver가 사번을 얻지 못함</td></tr>
 *   <tr><td>403</td><td>WPF_USER_INACTIVE</td><td>APP_USER 없음 또는 ACTIVE_YN='N'</td></tr>
 *   <tr><td>500</td><td>WPF_INTERNAL</td><td>그 외 (메시지 비노출, 로그만)</td></tr>
 * </table>
 */
@RestControllerAdvice(assignableTypes = {WpfPopupController.class, WpfAuthController.class})
public class WpfApiExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(WpfApiExceptionHandler.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<WpfErrorResponse> validation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("요청 형식이 올바르지 않습니다.");
        return error(HttpStatus.BAD_REQUEST, "WPF_BAD_REQUEST", detail);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, IllegalArgumentException.class})
    public ResponseEntity<WpfErrorResponse> badRequest(Exception ex) {
        String message = ex instanceof HttpMessageNotReadableException
                ? "요청 본문을 해석할 수 없습니다." : ex.getMessage();
        return error(HttpStatus.BAD_REQUEST, "WPF_BAD_REQUEST", message);
    }

    @ExceptionHandler(WpfUnauthorizedException.class)
    public ResponseEntity<WpfErrorResponse> unauthorized(WpfUnauthorizedException ex) {
        return error(HttpStatus.UNAUTHORIZED, "WPF_UNAUTHORIZED", ex.getMessage());
    }

    @ExceptionHandler(WpfUserInactiveException.class)
    public ResponseEntity<WpfErrorResponse> userInactive(WpfUserInactiveException ex) {
        return error(HttpStatus.FORBIDDEN, "WPF_USER_INACTIVE", ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<WpfErrorResponse> internal(Exception ex) {
        log.error("WPF API 처리 중 오류", ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "WPF_INTERNAL", "서버 처리 중 오류가 발생했습니다.");
    }

    private static ResponseEntity<WpfErrorResponse> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status)
                .body(new WpfErrorResponse(code, message, OffsetDateTime.now(KST)));
    }
}
