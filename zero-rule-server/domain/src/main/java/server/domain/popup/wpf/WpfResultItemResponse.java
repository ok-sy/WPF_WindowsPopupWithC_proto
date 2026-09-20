package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;

/**
 * 결과 항목 1건의 처리 결과. 요청 항목을 echo하고 유형별 결과 값을 선택적으로 채운다(null은 응답에서 생략).
 *
 * <p>[추가 이유 — 기준 3] 기존 hide/responses/video-progress/events 응답 4종을 한 형태로 합쳤다.
 * {@code status}가 REJECTED면 {@code code}/{@code message}로 사유를 알린다. SURVEY 제출은 채점하지 않으므로
 * {@code totalScore}/{@code passed}를 채우지 않는다.</p>
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
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = WpfJson.DATE_TIME) OffsetDateTime hiddenUntil,
        Long responseId,
        Double totalScore,
        Boolean passed,
        Double watchedRatio,
        Double requiredRatio
) {
    /** ACCEPTED: 처리 완료 / DUPLICATE: 같은 resultId를 이미 처리함(재처리 없음) / REJECTED: 업무 검증 실패 */
    public enum Status { ACCEPTED, DUPLICATE, REJECTED }

    public static WpfResultItemResponse duplicate(WpfResultCommand item) {
        return new WpfResultItemResponse(item.resultId(), item.popupId(), item.resultType(), Status.DUPLICATE,
                null, null, null, null, null, null, null, null, null, null, null);
    }

    public static WpfResultItemResponse rejected(WpfResultCommand item, String code, String message) {
        return new WpfResultItemResponse(item.resultId(), item.popupId(), item.resultType(), Status.REJECTED,
                code, message, null, null, null, null, null, null, null, null, null);
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
        private OffsetDateTime hiddenUntil;
        private Long responseId;
        private Double totalScore;
        private Boolean passed;
        private Double watchedRatio;
        private Double requiredRatio;

        private Builder(WpfResultCommand item) {
            this.item = item;
        }

        public Builder status(WpfUserPopupStatus status) {
            if (status != null) {
                this.popupStatus = status.popupStatus();
                this.completed = status.completed();
                this.completedAt = status.completedAt();
                this.hiddenUntil = status.hiddenUntilAt();
            }
            return this;
        }

        public Builder response(Long responseId) {
            this.responseId = responseId;
            return this;
        }

        public Builder score(Double totalScore, Boolean passed) {
            this.totalScore = totalScore;
            this.passed = passed;
            return this;
        }

        public Builder video(Double watchedRatio, Double requiredRatio) {
            this.watchedRatio = watchedRatio;
            this.requiredRatio = requiredRatio;
            return this;
        }

        public WpfResultItemResponse build() {
            return new WpfResultItemResponse(item.resultId(), item.popupId(), item.resultType(), Status.ACCEPTED,
                    null, null, popupStatus, completed, completedAt, hiddenUntil, responseId, totalScore, passed,
                    watchedRatio, requiredRatio);
        }
    }
}
