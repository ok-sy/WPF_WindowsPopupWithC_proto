package server.domain.popup;

import java.math.BigDecimal;

/** 설문·퀴즈 문항 조회 모델이다. */
public record PopupQuestionEntity(
        Long questionId,
        Long questionTemplateId,
        String questionType,
        String questionTitle,
        String questionDescription,
        String requiredYn,
        String scoredYn,
        BigDecimal questionScore,
        Integer sortOrder,
        String correctAnswer,
        String answerMatchMode
) {
}
