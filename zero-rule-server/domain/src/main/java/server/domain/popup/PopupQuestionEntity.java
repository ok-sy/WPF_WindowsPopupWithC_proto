package server.domain.popup;

import java.math.BigDecimal;

/**
 * POL-06-01 : 문항·서식
 * ■ 설문·퀴즈 문항 조회 모델
 * - in : POPUP_QUESTION 조회 컬럼(서식은 JSON 배열 문자열)
 * - out: 문항 1행(record)
 * - 설문·퀴즈 문항 조회 모델이다.
 */
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
        String answerMatchMode,
        String optionLayout,
        // POL-06-01 : 문항·서식 — 문항 제목·설명 서식 JSON 배열 문자열(CLOB). NULL = 서식 없음.
        String titleBlocksJson,
        String descriptionBlocksJson
) {
    /** POL-06-01 : 문항·서식 — 서식 컬럼 도입 전 생성자(테스트용). 서식 없음으로 만든다. */
    public PopupQuestionEntity(Long questionId, Long questionTemplateId, String questionType, String questionTitle,
            String questionDescription, String requiredYn, String scoredYn, BigDecimal questionScore, Integer sortOrder,
            String correctAnswer, String answerMatchMode, String optionLayout) {
        this(questionId, questionTemplateId, questionType, questionTitle, questionDescription, requiredYn, scoredYn,
                questionScore, sortOrder, correctAnswer, answerMatchMode, optionLayout, null, null);
    }
}
