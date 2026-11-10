package server.web.api.popup;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * POL-07-03 : 저장 경계
 * ■ 관리자 팝업 API 입력 오류 응답(400)
 * - in : PopupAdminController에서 던진 입력 검증 예외(IllegalArgumentException·@Valid 실패·본문 해석 실패)
 * - out: HTTP 400 + 기존 응답 형식(msgId·msgCn·msgClsf=ER·msgPrntCd·occrPrgNm·occrMethodNm·body=null)
 * - 예전에는 따로 매핑하지 않아 HTTP 500(로컬은 오류 추적 정보 포함)으로 나갔고, 관리자 웹은 사유 없이 일반 오류만 표시했다(2026-11-11 실화면 점검).
 *   msgCn에 서버 검증 문구(예: "선택지 내용은 UTF-8 300 Byte 이하여야 합니다. (현재 301 Byte)")를 그대로 담아 관리자 웹이 표시하게 한다.
 * - 이 컨트롤러에만 적용한다. 다른 화면·프레임워크 공통 오류 처리는 바꾸지 않는다. 그 밖의 예외(DB 오류 등)는 기존처럼 500이다.
 */
@RestControllerAdvice(assignableTypes = PopupAdminController.class)
public class PopupAdminExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(PopupAdminExceptionHandler.class);
    /** 기존 프레임워크 메시지 코드 '올바르지 않은 파라미터입니다'(AppMsg.ER_INVALID_PARAMS)와 같은 ID를 쓴다. 문구는 서버 검증 문구로 바꾼다. */
    static final String INVALID_PARAMS_MSG_ID = "FW00000003";

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> invalid(IllegalArgumentException ex) {
        return badRequest(ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .findFirst()
                .orElse("요청 형식이 올바르지 않습니다.");
        return badRequest(detail);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> unreadable(HttpMessageNotReadableException ex) {
        return badRequest("요청 본문을 해석할 수 없습니다.");
    }

    static ResponseEntity<Map<String, Object>> badRequest(String message) {
        String text = message == null || message.isBlank() ? "요청 값이 올바르지 않습니다." : message;
        log.info("관리자 팝업 API 입력 오류: {}", text);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("msgId", INVALID_PARAMS_MSG_ID);
        body.put("msgCn", text);
        body.put("msgClsf", "ER");
        body.put("msgPrntCd", "1");
        body.put("occrPrgNm", "");
        body.put("occrMethodNm", "");
        body.put("body", null);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}
