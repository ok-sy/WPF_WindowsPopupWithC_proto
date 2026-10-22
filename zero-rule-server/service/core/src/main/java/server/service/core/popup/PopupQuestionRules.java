package server.service.core.popup;

import server.domain.popup.PopupQuestionDto;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

/**
 * POL-06-02 : 선택·제출
 * ■ 설문·퀴즈 문항 공통 규칙
 * - in : 문항 목록(PopupQuestionDto)·퀴즈 여부·통과 점수
 * - out: 검증 통과 또는 IllegalArgumentException · 기본 배점 채운 문항 · 주관식 정답 일치 여부
 * - 관리자 저장 검증과 서버 채점이 같은 문항 규칙(유형·배치·배점·정답·통과 점수 범위)을 쓰도록 모은다.
 */
final class PopupQuestionRules {
    private PopupQuestionRules() {}

    /** 주관식 답을 정답과 비교한다(앞뒤 공백 제거, EXACT 완전 일치·CONTAINS 포함, 그 밖의 모드는 불일치). */
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

    /** 퀴즈 기본 배점. 배점을 비우면 1점으로 저장해 총점이 문항 수와 같아진다. */
    static final BigDecimal DEFAULT_QUESTION_SCORE = BigDecimal.ONE;

    /** QUIZ에서 배점이 없는(null) 문항을 기본 1점으로 채운다. 설문이거나 이미 값이 있으면 그대로 둔다(잘못된 값은 validate가 거부). */
    static List<PopupQuestionDto> withDefaultScores(List<PopupQuestionDto> questions, boolean quiz) {
        if (!quiz || questions == null || questions.stream().noneMatch(q -> q != null && q.questionScore() == null)) return questions;
        return questions.stream().map(q -> q != null && q.questionScore() == null ? q.withQuestionScore(DEFAULT_QUESTION_SCORE) : q).toList();
    }

    /**
     * POL-06-02 : 선택·제출
     * ■ 문항 저장 검증
     * - in : questions(List&lt;PopupQuestionDto&gt;) 문항 · quiz(boolean) 퀴즈 여부 · passingScore(Double) 통과 점수
     * - out: 없음 · 예외: IllegalArgumentException(규칙 위반 메시지)
     * - 문항 수·제목/설명 길이·유형·선택지 배치·배점(양수, 소수 둘째 자리)·주관식 정답/비교 방식·객관식 선택지 2개 이상과
     *   정답 지정(단일 선택은 1개)·통과 점수(0~총점)를 검사한다.
     */
    static void validate(List<PopupQuestionDto> questions, boolean quiz, Double passingScore) {
        if (questions == null || questions.isEmpty()) fail("문항을 한 개 이상 추가해 주세요.");
        BigDecimal total = BigDecimal.ZERO;
        for (PopupQuestionDto q : questions) {
            if (q == null || q.title() == null || q.title().isBlank() || q.title().length() > 1000)
                fail("문항 제목은 1~1000자여야 합니다.");
            if (q.description() != null && q.description().length() > 2000) fail("문항 설명은 2000자 이하여야 합니다.");
            if (q.questionType() == null || !Set.of("TEXT", "SINGLE_CHOICE", "MULTIPLE_CHOICE").contains(q.questionType()))
                fail("지원하지 않는 문항 유형입니다.");
            if (q.optionLayout() == null || !Set.of("VERTICAL", "HORIZONTAL").contains(q.optionLayout()))
                fail("선택지 배치는 VERTICAL 또는 HORIZONTAL이어야 합니다.");
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
