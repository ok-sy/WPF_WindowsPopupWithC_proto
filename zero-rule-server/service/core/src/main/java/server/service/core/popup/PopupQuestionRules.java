package server.service.core.popup;

import server.domain.popup.PopupQuestionDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

final class PopupQuestionRules {
    private PopupQuestionRules() {}

    static boolean matchesText(String answer, String expected, String mode) {
        if (answer == null || answer.isBlank() || expected == null || expected.isBlank()) return false;
        String actual = answer.trim();
        String correct = expected.trim();
        return switch (mode == null ? "" : mode) {
            case "EXACT" -> actual.equals(correct);
            case "CONTAINS" -> actual.contains(correct);
            default -> false;
        };
    }

    static void validate(List<PopupQuestionDto> questions, boolean quiz, Double passingScore) {
        if (questions == null || questions.isEmpty()) fail("문항을 한 개 이상 추가해 주세요.");
        BigDecimal total = BigDecimal.ZERO;
        for (PopupQuestionDto q : questions) {
            if (q == null || q.title() == null || q.title().isBlank() || q.title().length() > 1000)
                fail("문항 제목은 1~1000자여야 합니다.");
            if (q.description() != null && q.description().length() > 2000) fail("문항 설명은 2000자 이하여야 합니다.");
            if (q.questionType() == null || !Set.of("TEXT", "SINGLE_CHOICE", "MULTIPLE_CHOICE").contains(q.questionType()))
                fail("지원하지 않는 문항 유형입니다.");
            if (quiz) {
                if (q.questionScore() == null || q.questionScore().signum() <= 0
                        || q.questionScore().compareTo(new BigDecimal("99999999.99")) > 0
                        || q.questionScore().stripTrailingZeros().scale() > 2)
                    fail("퀴즈 배점은 소수점 두 자리까지의 양수여야 합니다.");
                total = total.add(q.questionScore());
            }
            if ("TEXT".equals(q.questionType())) {
                if (!q.options().isEmpty()) fail("주관식 문항에는 선택지를 넣을 수 없습니다.");
                if (quiz && (q.correctAnswer() == null || q.correctAnswer().isBlank()
                        || q.answerMatchMode() == null || !Set.of("EXACT", "CONTAINS").contains(q.answerMatchMode())))
                    fail("주관식 정답과 비교 방식(포함 또는 정확히 일치)을 지정해 주세요.");
            } else {
                if (q.options().size() < 2) fail("객관식 선택지는 두 개 이상 필요합니다.");
                long correct = 0;
                for (var option : q.options()) {
                    if (option.text() == null || option.text().isBlank() || option.text().length() > 1000)
                        fail("선택지 내용은 1~1000자여야 합니다.");
                    if (Boolean.TRUE.equals(option.isCorrect())) correct++;
                }
                if (quiz && (correct == 0 || ("SINGLE_CHOICE".equals(q.questionType()) && correct != 1)))
                    fail("정답 선택지를 지정해 주세요. 단일 선택은 정답이 한 개여야 합니다.");
            }
        }
        if (quiz && (total.compareTo(new BigDecimal("99999999.99")) > 0
                || passingScore == null || !Double.isFinite(passingScore) || passingScore < 0
                || BigDecimal.valueOf(passingScore).compareTo(total) > 0
                || BigDecimal.valueOf(passingScore).stripTrailingZeros().scale() > 2))
            fail("통과 점수는 0~총점 사이이며 소수점 두 자리까지 입력할 수 있습니다.");
    }

    private static void fail(String message) { throw new IllegalArgumentException(message); }
}
