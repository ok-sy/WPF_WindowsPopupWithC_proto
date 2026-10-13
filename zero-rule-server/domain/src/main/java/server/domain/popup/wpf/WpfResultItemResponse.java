package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * 결과 항목 1건의 처리 결과. 요청 항목(resultId·popupId·resultType)을 echo하고 처리 상태를 알린다(null은 응답에서 생략).
 *
 * <p>[추가 이유 — 기준 3] 기존 hide/responses/video-progress/events 응답 4종을 한 형태로 합쳤다.
 * {@code status}가 REJECTED·오류면 {@code code}/{@code message}로 사유를 알린다.</p>
 *
 * <p>[설계 33·34] 응답은 "그 항목의 처리가 종결됐는지"만 알린다. WPF가 쓰지 않는 값은 모두 뺐다.
 * totalScore/passed(설계 33), hiddenUntil·watchedRatio·requiredRatio(34-05),
 * popupStatus·completed·completedAt·responseId(34-03 — WPF 미사용·로그 미사용). 완료·숨김·시청·응답 저장은 서버 내부에서
 * 그대로 처리하며 결과는 다음 조회에 반영된다. [설계 35] 서비스 내부 처리 결과이며 HTTP 응답은 {@link WpfResultResponse}(resultId·status·nextStatus·code·message)로 옮겨 보낸다.</p>
 */
// [기준 3] 값 없는 필드는 생략한다. 전역 ObjectMapper 설정(BasicConfig NON_NULL)과 무관하게 WPF 계약을 고정한다.
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WpfResultItemResponse(
        String resultId,
        String popupId,
        WpfResultType resultType,
        Status status,
        String code,
        String message
) {
    /**
     * 항목 처리 상태. [설계 34-19] WPF는 ACCEPTED·DUPLICATE·REJECTED(종결)만 큐에서 지우고 나머지는 보관·재전송한다.
     * <ul>
     *   <li>ACCEPTED: 처리 완료</li>
     *   <li>DUPLICATE: 같은 resultId를 이미 처리함(재처리 없음)</li>
     *   <li>REJECTED: 수정 없이 재전송해도 실패하는 업무 검증 오류(영구)</li>
     *   <li>RETRYABLE_ERROR: DB 연결 장애·데드락·타임아웃 등 확인된 일시 장애. 항목은 롤백됨</li>
     *   <li>INTERNAL_ERROR: 원인 미확정 내부 오류. 항목은 롤백됨. WPF는 보관하고 제한적으로 재시도</li>
     * </ul>
     */
    public enum Status { ACCEPTED, DUPLICATE, REJECTED, RETRYABLE_ERROR, INTERNAL_ERROR }

    public static WpfResultItemResponse accepted(WpfResultCommand item) {
        return new WpfResultItemResponse(item.resultId(), item.popupId(), item.resultType(), Status.ACCEPTED, null, null);
    }

    public static WpfResultItemResponse duplicate(WpfResultCommand item) {
        return new WpfResultItemResponse(item.resultId(), item.popupId(), item.resultType(), Status.DUPLICATE, null, null);
    }

    public static WpfResultItemResponse rejected(WpfResultCommand item, String code, String message) {
        return new WpfResultItemResponse(item.resultId(), item.popupId(), item.resultType(), Status.REJECTED, code, message);
    }

    /** [설계 34-19] 일시 장애·미확정 오류. 업무 데이터와 영수증은 롤백된 상태이며 같은 resultId로 다시 받을 수 있다. */
    public static WpfResultItemResponse failed(WpfResultCommand item, Status status, String code, String message) {
        if (status != Status.RETRYABLE_ERROR && status != Status.INTERNAL_ERROR) {
            throw new IllegalArgumentException("failed()는 RETRYABLE_ERROR / INTERNAL_ERROR 전용입니다: " + status);
        }
        return new WpfResultItemResponse(item.resultId(), item.popupId(), item.resultType(), status, code, message);
    }
}
