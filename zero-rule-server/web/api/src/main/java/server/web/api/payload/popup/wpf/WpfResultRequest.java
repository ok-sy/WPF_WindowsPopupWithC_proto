package server.web.api.payload.popup.wpf;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import server.domain.popup.PopupSubmitAnswer;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultType;
import server.domain.popup.wpf.WpfVideoProgress;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

/**
 * POST /p/api/wpf/popups/results 요청 본문.
 *
 * <p>[추가 이유 — 기준 3·4·6] 기존 PopupHideRequest·PopupSubmitRequest·VideoProgressRequest·PopupEventRequest
 * 4개 요청을 결과 항목 배열 하나로 합쳤다. 사용자 ID 필드는 없다(인증 정보에서 얻음).
 * Bean Validation은 형식만 검사하고, 유형별 필수 블록(hideDays/answers/video)은 서비스가 항목 단위로 검사해
 * 한 항목의 형식 오류가 요청 전체를 400으로 만들지 않도록 한다.</p>
 *
 * @param clientRequestId 요청 단위 식별(로그용)
 * @param sentAt          WPF 전송 시각(선택, 재전송 시 원래 값)
 * @param results         결과 항목 1~50개
 */
// 알 수 없는 필드(예: 구 클라이언트가 보내는 userId)는 무시한다. 사용자 식별은 인증 정보만 사용한다(기준 6).
@JsonIgnoreProperties(ignoreUnknown = true)
public record WpfResultRequest(
        @NotBlank @Size(max = 100) String clientRequestId,
        OffsetDateTime sentAt,
        @NotNull @Size(min = 1, max = 50) List<@Valid Item> results
) {
    /** 항목을 서비스 계층 커맨드로 변환한다. */
    public List<WpfResultCommand> toCommands() {
        return results.stream().map(Item::toCommand).toList();
    }

    /**
     * 결과 항목 1건. resultType에 따라 hideDays / answers / video 중 하나를 사용한다.
     * displayedAt·closedAt은 모든 유형이 함께 보낼 수 있다(기존 DISPLAYED/CLOSED 이벤트 대체).
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Item(
            @NotBlank @Size(max = 64) String resultId,
            @NotBlank @Size(max = 50) String popupId,
            @NotNull WpfResultType resultType,
            OffsetDateTime displayedAt,
            OffsetDateTime closedAt,
            @Min(1) @Max(3650) Integer hideDays,
            OffsetDateTime responseStartedAt,
            List<@Valid Answer> answers,
            @Valid Video video
    ) {
        public WpfResultCommand toCommand() {
            return new WpfResultCommand(
                    resultId.trim(), popupId.trim(), resultType, displayedAt, closedAt, hideDays, responseStartedAt,
                    answers == null ? List.of() : answers.stream().map(Answer::toAnswer).toList(),
                    video == null ? null : video.toProgress());
        }
    }

    /** 문항 답안. 선택형은 optionIds, 서술형은 textAnswer (기존 PopupSubmitAnswerRequest와 동일). */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Answer(
            @NotNull Long questionId,
            String textAnswer,
            List<Long> optionIds
    ) {
        public PopupSubmitAnswer toAnswer() {
            return new PopupSubmitAnswer(questionId, textAnswer, optionIds);
        }
    }

    /** 영상 시청 누적값(초). 기존 VideoProgressRequest와 동일 제약. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Video(
            @NotNull @DecimalMin("0.001") BigDecimal durationSeconds,
            @NotNull @DecimalMin("0.0") BigDecimal positionSeconds,
            @NotNull @DecimalMin("0.0") BigDecimal maximumPositionSeconds,
            @NotNull @DecimalMin("0.0") BigDecimal watchedSeconds
    ) {
        public WpfVideoProgress toProgress() {
            return new WpfVideoProgress(durationSeconds, positionSeconds, maximumPositionSeconds, watchedSeconds);
        }
    }
}
