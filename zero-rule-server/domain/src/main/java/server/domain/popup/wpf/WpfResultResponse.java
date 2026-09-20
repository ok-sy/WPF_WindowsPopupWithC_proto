package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * POST /p/api/wpf/popups/results 응답. 요청 항목 순서대로 항목별 결과를 돌려준다.
 * HTTP 200이어도 항목별 {@code status}를 확인해야 한다(항목 실패는 REJECTED로 표현).
 */
// [기준 3] 값 없는 필드는 생략한다. 전역 ObjectMapper 설정(BasicConfig NON_NULL)과 무관하게 WPF 계약을 고정한다.
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WpfResultResponse(
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = WpfJson.DATE_TIME) OffsetDateTime receivedAt,
        List<WpfResultItemResponse> results
) {
    public WpfResultResponse {
        results = results == null ? List.of() : List.copyOf(results);
    }
}
