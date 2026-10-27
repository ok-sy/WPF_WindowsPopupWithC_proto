package server.web.api.popup.sample.fulljson;

import java.time.OffsetDateTime;
import java.time.ZoneId;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import server.domain.popup.wpf.WpfErrorResponse;
import server.service.core.popup.sample.PopupSampleException;
import server.web.api.popup.wpf.WpfUnauthorizedException;

/**
 * POL-14-03 : 서버 인계 예제
 * ■ 3117 전체 JSON 조회 샘플 컨트롤러 한정 오류 응답
 * - in : PopupFullJsonSampleController에서 던진 예외
 * - out: WpfErrorResponse {@code {code, message, timestamp}}
 * - 기존 WPF 오류 계약·코드를 재사용한다(3111 샘플 핸들러와 같은 표). 3111 샘플 핸들러는 그 컨트롤러에만 적용되고
 *   {@code popup.sample.single-query.enabled}에 묶여 있어 이 컨트롤러용으로 따로 둔다.
 *
 * <table>
 *   <tr><th>상황</th><th>HTTP</th><th>code</th></tr>
 *   <tr><td>요청 본문 오류·popupId 누락</td><td>400</td><td>WPF_BAD_REQUEST</td></tr>
 *   <tr><td>사번 없음</td><td>401</td><td>WPF_UNAUTHORIZED</td></tr>
 *   <tr><td>저장 데이터 오류(잘못된 JSON·객체 아님·필수 콘텐츠 누락·값 오류·popupId 불일치)</td><td>500</td><td>WPF_INTERNAL(메시지 비노출, 로그에 popupId·reason)</td></tr>
 * </table>
 * <p>조회 결과 없음은 오류가 아니라 200 {@code popup:null}이다.</p>
 */
@RestControllerAdvice(assignableTypes = PopupFullJsonSampleController.class)
@ConditionalOnProperty(prefix = "popup.sample.full-json", name = "enabled", havingValue = "true")
public class PopupFullJsonSampleExceptionHandler {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    @ExceptionHandler(PopupSampleException.class)
    public ResponseEntity<WpfErrorResponse> data(PopupSampleException ex) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "WPF_INTERNAL", "서버 처리 중 오류가 발생했습니다.");
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, IllegalArgumentException.class})
    public ResponseEntity<WpfErrorResponse> badRequest(Exception ex) {
        String message = ex instanceof HttpMessageNotReadableException ? "요청 본문을 해석할 수 없습니다." : ex.getMessage();
        return error(HttpStatus.BAD_REQUEST, "WPF_BAD_REQUEST", message);
    }

    @ExceptionHandler(WpfUnauthorizedException.class)
    public ResponseEntity<WpfErrorResponse> unauthorized(WpfUnauthorizedException ex) {
        return error(HttpStatus.UNAUTHORIZED, "WPF_UNAUTHORIZED", ex.getMessage());
    }

    private static ResponseEntity<WpfErrorResponse> error(HttpStatus status, String code, String message) {
        return ResponseEntity.status(status).body(new WpfErrorResponse(code, message, OffsetDateTime.now(KST)));
    }
}
