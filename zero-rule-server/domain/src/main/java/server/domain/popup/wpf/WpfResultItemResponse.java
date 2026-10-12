package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;

/**
 * 결과 항목 1건의 처리 결과. 요청 항목을 echo하고 유형별 결과 값을 선택적으로 채운다(null은 응답에서 생략).
 *
 * <p>[추가 이유 — 기준 3] 기존 hide/responses/video-progress/events 응답 4종을 한 형태로 합쳤다.
 * {@code status}가 REJECTED면 {@code code}/{@code message}로 사유를 알린다.</p>
 *
 * <p>[설계 33] QUIZ 점수·통과 여부는 WPF가 판정해 요청(score/passed)으로 보내고 서버는 저장만 하므로,
 * 응답에서 같은 의미의 totalScore/passed를 다시 내려주지 않는다. 응답은 처리·저장 상태에 집중한다.</p>
 *
 * <p>[설계 34-05] 숨김 만료 시각(hiddenUntil)과 영상 시청·요구 비율(watchedRatio/requiredRatio)도 응답에서 뺐다.
 * 숨김 만료·영상 시청 기록·완료 계산은 서버 내부에서 그대로 저장·처리한다.</p>
 */
// [기준 3] 값 없는 필드는 생략한다. 전역 ObjectMapper 설정(BasicConfig NON_NULL)과 무관하게 WPF 계약을 고정한다.
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WpfResultItemResponse(
        String resultId,
        String popupId,
        WpfResultType resultType,
        Status status,
        String code,
        String message,
        String popupStatus,
        Boolean completed,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = WpfJson.DATE_TIME) OffsetDateTime completedAt,
        Long responseId
) {
    /** ACCEPTED: 처리 완료 / DUPLICATE: 같은 resultId를 이미 처리함(재처리 없음) / REJECTED: 업무 검증 실패 */
    public enum Status { ACCEPTED, DUPLICATE, REJECTED }

    public static WpfResultItemResponse duplicate(WpfResultCommand item) {
        return new WpfResultItemResponse(item.resultId(), item.popupId(), item.resultType(), Status.DUPLICATE,
                null, null, null, null, null, null);
    }

    public static WpfResultItemResponse rejected(WpfResultCommand item, String code, String message) {
        return new WpfResultItemResponse(item.resultId(), item.popupId(), item.resultType(), Status.REJECTED,
                code, message, null, null, null, null);
    }

    /** ACCEPTED 응답 조립용 빌더. 유형별로 필요한 값만 채운다. */
    public static Builder accepted(WpfResultCommand item) {
        return new Builder(item);
    }

    public static final class Builder {
        private final WpfResultCommand item;
        private String popupStatus;
        private Boolean completed;
        private OffsetDateTime completedAt;
        private Long responseId;

        private Builder(WpfResultCommand item) {
            this.item = item;
        }

        public Builder status(WpfUserPopupStatus status) {
            if (status != null) {
                this.popupStatus = status.popupStatus();
                this.completed = status.completed();
                this.completedAt = status.completedAt();
            }
            return this;
        }

        public Builder response(Long responseId) {
            this.responseId = responseId;
            return this;
        }

        public WpfResultItemResponse build() {
            return new WpfResultItemResponse(item.resultId(), item.popupId(), item.resultType(), Status.ACCEPTED,
                    null, null, popupStatus, completed, completedAt, responseId);
        }
    }
}
