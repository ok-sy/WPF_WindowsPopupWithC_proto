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
    /**
     * [설계 18 L-0] optionLayout 도입 전 호출부 호환용 11인자 생성자는 삭제했다(테스트에서만 사용).
     * null optionLayout의 VERTICAL 보정은 원격 개발 DB에 05 스크립트가 적용될 때까지 유지한다(설계 18 S-16).
     */
    public PopupQuestionDto {
        optionLayout = optionLayout == null ? "VERTICAL" : optionLayout;
        options = options == null ? List.of() : List.copyOf(options);
    }
}
