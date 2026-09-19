package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.OffsetDateTime;

/**
 * WPF API 오류 본문 {@code {code, message, timestamp}}.
 *
 * <p>[추가 이유 — 기준 3] 관리자 웹은 CLNewApiResponse/msgId 체계를 쓰지만 WPF는 단순 코드 체계가 필요하다.
 * 전역 예외 처리를 바꾸지 않고 WPF 컨트롤러 한정 어드바이스(WpfApiExceptionHandler)가 이 형태로 응답한다.</p>
 */
public record WpfErrorResponse(
        String code,
        String message,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = WpfJson.DATE_TIME) OffsetDateTime timestamp
) {
}
