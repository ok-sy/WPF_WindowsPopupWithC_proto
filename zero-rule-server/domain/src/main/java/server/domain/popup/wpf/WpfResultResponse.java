package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * [POL-09-03; 근거 설계 35] POST /p/api/wpf/popups/results 응답. 결과 1건의 처리 상태와 후속 후보 유무를 돌려준다(팝업 콘텐츠는 없음).
 *
 * <ul>
 *   <li>{@code status}: 저장 처리 상태(ACCEPTED·DUPLICATE·REJECTED·RETRYABLE_ERROR·INTERNAL_ERROR, 기존 RESULT 계약).</li>
 *   <li>{@code nextStatus}: ACCEPTED·DUPLICATE일 때만. 저장 후 현재 노출 조건에 맞는 후보가 있으면 AVAILABLE, 없으면 EMPTY.
 *       저장은 성공했으나 후보 확인이 실패하면 EMPTY로 바꾸지 않고 생략하며 code=WPF_NEXT_STATUS_UNKNOWN을 함께 보낸다.</li>
 *   <li>{@code code}/{@code message}: 거절·실패 또는 후보 확인 실패일 때만.</li>
 * </ul>
 * 이전 일괄 응답(results[])은 단건 순차 처리로 바꾸며 삭제했다.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WpfResultResponse(
        String resultId,
        WpfResultItemResponse.Status status,
        NextStatus nextStatus,
        String code,
        String message
) {
    public enum NextStatus { AVAILABLE, EMPTY }

    /** 처리 결과를 그대로 옮긴다. 후속 후보 상태는 호출자가 저장 성공(ACCEPTED·DUPLICATE)일 때만 넣는다. */
    public static WpfResultResponse of(WpfResultItemResponse item, NextStatus nextStatus) {
        return new WpfResultResponse(item.resultId(), item.status(), nextStatus, item.code(), item.message());
    }

    public boolean saved() {
        return status == WpfResultItemResponse.Status.ACCEPTED || status == WpfResultItemResponse.Status.DUPLICATE;
    }
}