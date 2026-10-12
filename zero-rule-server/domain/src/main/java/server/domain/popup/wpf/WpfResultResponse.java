package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * POST /p/api/wpf/popups/results 응답. 요청 항목 순서대로 항목별 결과를 돌려준다.
 * HTTP 200이어도 항목별 {@code status}를 확인해야 한다(영구 실패 REJECTED, 일시·미확정 실패 RETRYABLE_ERROR·INTERNAL_ERROR).
 * [설계 34-03] WPF가 쓰지 않는 ROOT receivedAt은 뺐다. 서버 수신 시각은 요청 로그(WPF_API_REQUEST_LOG)에 남는다.
 */
// [기준 3] 값 없는 필드는 생략한다. 전역 ObjectMapper 설정(BasicConfig NON_NULL)과 무관하게 WPF 계약을 고정한다.
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WpfResultResponse(
        List<WpfResultItemResponse> results
) {
    public WpfResultResponse {
        results = results == null ? List.of() : List.copyOf(results);
    }
}
