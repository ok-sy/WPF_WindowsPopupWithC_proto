package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;

/**
 * WPF 클라이언트 버전 미지원(426 Upgrade Required) 응답 본문.
 *
 * <p>[추가 이유 — 설계 13 §7] 기존 {@link WpfErrorResponse}{@code {code, message, timestamp}}에 WPF가 안내 문구에
 * 쓸 세 버전 값을 더한 형태다. 기존 오류 DTO는 바꾸지 않고 별도 레코드로 둔다.</p>
 * <pre>
 * { "code": "CLIENT_VERSION_NOT_SUPPORTED", "message": "...", "clientVersion": "1.2.9",
 *   "minimumSupportedVersion": "1.3.0", "latestVersion": "1.4.2", "timestamp": "..." }
 * </pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WpfClientVersionErrorResponse(
        String code,
        String message,
        String clientVersion,
        String minimumSupportedVersion,
        String latestVersion,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = WpfJson.DATE_TIME) OffsetDateTime timestamp
) {
    public static final String CODE = "CLIENT_VERSION_NOT_SUPPORTED";
}
