package server.domain.popup;

import java.math.BigDecimal;
import java.util.List;

/**
 * POL-06-01 : 문항·서식
 * ■ 설문·퀴즈 문항
 * - in : 문항 ID·제목·설명·유형·필수/채점 여부·배점·순서·선택지·정답 정보·선택지 배치·서식 Blocks
 * - out: 문항(record). 정답 정보·서식은 null이면 JSON에서 생략
 * - WPF가 설문·퀴즈 화면을 구성할 때 사용하는 문항이다.
 */
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
        String optionLayout,
        // POL-06-01 : 문항·서식 — 문항 제목·설명 서식(textBlocks 스키마 문단 배열). 없으면 null로 JSON에서 생략하고 title·description만 쓴다.
        @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
        List<Object> titleBlocks,
        @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
        List<Object> descriptionBlocks
) {
    /**
     * POL-06-01 : 문항·서식
     * 선택지 목록을 불변 사본으로 만든다(null이면 빈 목록). optionLayout은 보정하지 않는다. DB 컬럼은 NOT NULL DEFAULT이고
     * (05 스크립트), 관리자 저장에서 null은 PopupQuestionRules.validate가 거부한다.
     */
    public PopupQuestionDto {
        options = options == null ? List.of() : List.copyOf(options);
    }

    /** POL-06-01 : 문항·서식 — 서식 도입 전 생성자. 서식 없는 문항(titleBlocks·descriptionBlocks = null)을 만든다. */
    public PopupQuestionDto(Long questionId, String title, String description, String questionType,
            boolean isRequired, boolean isScored, BigDecimal questionScore, int sortOrder,
            List<PopupOptionDto> options, String correctAnswer, String answerMatchMode, String optionLayout) {
        this(questionId, title, description, questionType, isRequired, isScored, questionScore, sortOrder,
                options, correctAnswer, answerMatchMode, optionLayout, null, null);
    }

    /** 배점만 바꾼 사본(QUIZ 기본 배점 1점 적용용). */
    public PopupQuestionDto withQuestionScore(BigDecimal newQuestionScore) {
        return new PopupQuestionDto(questionId, title, description, questionType, isRequired, isScored, newQuestionScore,
                sortOrder, options, correctAnswer, answerMatchMode, optionLayout, titleBlocks, descriptionBlocks);
    }
}
