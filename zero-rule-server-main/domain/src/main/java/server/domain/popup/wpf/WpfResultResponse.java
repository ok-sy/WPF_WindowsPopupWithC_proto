package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * POST /p/api/wpf/popups/results 응답. 요청 항목 순서대로 항목별 결과를 돌려준다.
 * HTTP 200이어도 항목별 {@code status}를 확인해야 한다(항목 실패는 REJECTED로 표현).
 */
public record WpfResultResponse(
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = WpfJson.DATE_TIME) OffsetDateTime receivedAt,
        List<WpfResultItemResponse> results
) {
    public WpfResultResponse {
        results = results == null ? List.of() : List.copyOf(results);
    }
}
