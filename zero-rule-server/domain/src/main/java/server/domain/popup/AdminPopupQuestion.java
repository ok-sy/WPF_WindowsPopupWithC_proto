package server.domain.popup;
/**
 * POL-06-02 : 선택·제출
 * ■ 관리자 편집용 문항 래퍼
 * - in : question(PopupQuestionDto) 정답 정보를 포함한 문항
 * - out: 관리자 상세 응답의 문항 항목(record)
 * - Authenticated editor data only; never included in public popup responses.
 * - 정답은 question.options[].isCorrect / correctAnswer로 전달한다(중복이던 correctValues 삭제).
 */
public record AdminPopupQuestion(PopupQuestionDto question) {
}
