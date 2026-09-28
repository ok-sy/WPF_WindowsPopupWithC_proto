package server.domain.popup;
/**
 * Authenticated editor data only; never included in public popup responses.
 * [설계 18 L-3] 정답은 question.options[].isCorrect / correctAnswer로 전달한다(중복이던 correctValues 삭제).
 */
public record AdminPopupQuestion(PopupQuestionDto question) {
}
