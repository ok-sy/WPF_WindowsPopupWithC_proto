package server.web.api.payload.popup;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import server.domain.popup.PopupSubmitAnswer;

import java.time.OffsetDateTime;
import java.util.List;

/** WPF가 설문 답안을 제출할 때 보내는 요청이다. */
public record PopupSubmitRequest(
        @NotBlank String clientRequestId,
        @NotBlank String userId,
        OffsetDateTime responseStartedAt,
        @NotNull @Size(min = 1) List<@Valid PopupSubmitAnswerRequest> answers
) {
    /** 문항별 입력값을 서비스 계층의 공통 답안 모델로 변환한다. */
    public List<PopupSubmitAnswer> toAnswers() {
        return answers.stream().map(PopupSubmitAnswerRequest::toAnswer).toList();
    }

    /** 문항 하나의 선택지 또는 서술형 답안이다. */
    public record PopupSubmitAnswerRequest(
            @NotNull Long questionId,
            String textAnswer,
            List<Long> optionIds
    ) {
        public PopupSubmitAnswer toAnswer() {
            return new PopupSubmitAnswer(questionId, textAnswer, optionIds);
        }
    }
}
