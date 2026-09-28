package server.domain.popup;

import java.math.BigDecimal;
import java.util.List;

/** WPF가 설문·퀴즈 화면을 구성할 때 사용하는 문항이다. */
public record PopupQuestionDto(
        Long questionId,
        String title,
        String description,
        String questionType,
        boolean isRequired,
        boolean isScored,
        BigDecimal questionScore,
        int sortOrder,
        List<PopupOptionDto> options,
        @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
        String correctAnswer,
        @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
        String answerMatchMode,
        String optionLayout
) {
    public PopupQuestionDto(Long questionId, String title, String description, String questionType,
            boolean isRequired, boolean isScored, BigDecimal questionScore, int sortOrder,
            List<PopupOptionDto> options, String correctAnswer, String answerMatchMode) {
        this(questionId, title, description, questionType, isRequired, isScored, questionScore,
                sortOrder, options, correctAnswer, answerMatchMode, "VERTICAL");
    }

    public PopupQuestionDto {
        optionLayout = optionLayout == null ? "VERTICAL" : optionLayout;
        options = options == null ? List.of() : List.copyOf(options);
    }
}
