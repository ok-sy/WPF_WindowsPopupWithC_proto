package server.service.core.popup;

import org.junit.jupiter.api.Test;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupOptionDto;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

/**
 * POL-06-02 : 선택·제출
 * ■ PopupQuestionRules 문항 규칙·주관식 정답 비교 테스트
 */
class PopupQuestionRulesTest {
    private PopupQuestionDto text(String answer, String mode, String score) {
        return new PopupQuestionDto(1L, "보안 단축키", null, "TEXT", true, true,
                score == null ? null : new BigDecimal(score), 1, List.of(), answer, mode, "VERTICAL");
    }

    /** POL-06-01 : 문항·서식 — DTO가 null 배치를 VERTICAL로 바꾸지 않으므로 저장 검증이 거부해야 한다(삭제된 RATING_5 유형도 거부). */
    @Test void nullOptionLayoutAndRemovedRating5AreRejected() {
        var options = List.of(new PopupOptionDto(1L, "1", "A", 1, null), new PopupOptionDto(2L, "2", "B", 2, null));
        var noLayout = new PopupQuestionDto(1L, "문항", null, "SINGLE_CHOICE", true, false, null, 1,
                options, null, null, null);
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(noLayout), false, null));
        var rating5 = new PopupQuestionDto(1L, "문항", null, "RATING5", true, false, null, 1,
                options, null, null, "HORIZONTAL");
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(rating5), false, null));
    }

    /** EXACT 비교는 앞뒤 공백만 제거하고 내부 공백은 그대로 비교한다. */
    @Test void exactMatchTrimsOnlyOuterWhitespace() {
        assertTrue(PopupQuestionRules.matchesText("  Windows + L  ", "Windows + L", "EXACT"));
        assertFalse(PopupQuestionRules.matchesText("Windows + L 누르기", "Windows + L", "EXACT"));
        assertFalse(PopupQuestionRules.matchesText("windows + L", "Windows + L", "EXACT"));
        assertFalse(PopupQuestionRules.matchesText("Windows+L", "Windows + L", "EXACT"));
    }

    /** CONTAINS는 제출 답 안에 정답 문자열이 있어야 하며 모드가 없으면 불일치다. */
    @Test void containsRequiresExpectedTextWithinSubmittedAnswer() {
        assertTrue(PopupQuestionRules.matchesText("Windows + L 키를 누릅니다", "Windows + L", "CONTAINS"));
        assertFalse(PopupQuestionRules.matchesText("Windows", "Windows + L", "CONTAINS"));
        assertFalse(PopupQuestionRules.matchesText("응답", " ", "CONTAINS"));
        assertFalse(PopupQuestionRules.matchesText(null, "정답", "EXACT"));
        assertFalse(PopupQuestionRules.matchesText("정답", "정답", null));
    }

    /** 설문 문항은 배점·정답이 없어도 통과한다. */
    @Test void surveyNeedsNoScoreOrCorrectAnswer() {
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(text(null, null, null)), false, null));
    }

    /** 퀴즈는 총점·통과 점수 범위와 주관식 정답·비교 방식을 검사한다. */
    @Test void quizValidatesTotalAndTextAnswer() {
        var questions = List.of(text("정답", "EXACT", "10.25"), text("키워드", "CONTAINS", "9.75"));
        assertDoesNotThrow(() -> PopupQuestionRules.validate(questions, true, 20.0));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(questions, true, 20.01));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(questions, true, null));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(text("", "EXACT", "10")), true, 0.0));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(text("정답", "OTHER", "10")), true, 0.0));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(text("정답", "EXACT", "0.001")), true, 0.0));
    }

    /** 단일 선택 퀴즈 문항은 정답 선택지가 정확히 한 개여야 한다. */
    @Test void singleChoiceMustHaveExactlyOneCorrectOption() {
        var options = List.of(new PopupOptionDto(1L, "1", "A", 1, true), new PopupOptionDto(2L, "2", "B", 2, true));
        var single = new PopupQuestionDto(1L, "문항", null, "SINGLE_CHOICE", true, true, BigDecimal.TEN, 1, options, null, null, "VERTICAL");
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(single), true, 10.0));
        var multiple = new PopupQuestionDto(1L, "문항", null, "MULTIPLE_CHOICE", true, true, BigDecimal.TEN, 1, options, null, null, "VERTICAL");
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(multiple), true, 10.0));
    }

    /** 배점을 비운 QUIZ 문항은 기본 1점이 되어 총점 = 문항 수로 맞출 수 있다. 설문·입력한 배점은 그대로다. */
    @Test void quizMissingScoreDefaultsToOnePointSoTotalEqualsQuestionCount() {
        var questions = List.of(text("a", "EXACT", null), text("b", "EXACT", null), text("c", "EXACT", "2.5"));
        var quiz = PopupQuestionRules.withDefaultScores(questions, true);
        assertEquals(List.of(new BigDecimal("1"), new BigDecimal("1"), new BigDecimal("2.5")), quiz.stream().map(PopupQuestionDto::questionScore).toList());
        assertDoesNotThrow(() -> PopupQuestionRules.validate(quiz, true, 4.5));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(quiz, true, 4.6), "total is 4.5");
        var allDefault = PopupQuestionRules.withDefaultScores(List.of(text("a", "EXACT", null), text("b", "EXACT", null)), true);
        assertDoesNotThrow(() -> PopupQuestionRules.validate(allDefault, true, 2.0), "total = question count");
        assertSame(questions, PopupQuestionRules.withDefaultScores(questions, false), "survey keeps questions as is");
        assertNull(PopupQuestionRules.withDefaultScores(questions, false).get(0).questionScore());
    }

    // ---------- POL-06-02 : 선택·제출 — SURVEY 복수 선택 최소·최대 선택 수 ----------

    private PopupQuestionDto multiple(String type, int optionCount, Integer min, Integer max, boolean correctFirst) {
        var options = java.util.stream.IntStream.rangeClosed(1, optionCount)
                .mapToObj(n -> new PopupOptionDto((long) n, String.valueOf(n), "선택지 " + n, n, correctFirst && n == 1 ? Boolean.TRUE : null))
                .toList();
        return new PopupQuestionDto(1L, "문항", null, type, true, false, null, 1, options, null, null, "VERTICAL", null, null, min, max);
    }

    /** null(제한 없음)·1~선택지 수·최소 ≤ 최대는 저장된다. */
    @Test void surveySelectionLimitsWithinRangeAreAccepted() {
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(multiple("MULTIPLE_CHOICE", 4, null, null, false)), false, null));
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(multiple("MULTIPLE_CHOICE", 4, 2, 3, false)), false, null));
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(multiple("MULTIPLE_CHOICE", 4, 2, null, false)), false, null));
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(multiple("MULTIPLE_CHOICE", 4, null, 4, false)), false, null));
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(multiple("MULTIPLE_CHOICE", 4, 3, 3, false)), false, null));
    }

    /** 0·선택지 수 초과·최소 > 최대는 거부한다. */
    @Test void surveySelectionLimitsOutOfRangeAreRejected() {
        for (Integer[] limits : new Integer[][] {{0, null}, {null, 0}, {5, null}, {null, 5}, {3, 2}}) {
            var question = multiple("MULTIPLE_CHOICE", 4, limits[0], limits[1], false);
            assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(question), false, null),
                    () -> java.util.Arrays.toString(limits));
        }
    }

    /** QUIZ(정답 수가 한도)·단일 선택·주관식에는 지정할 수 없다. */
    @Test void selectionLimitsOnlyForSurveyMultipleChoice() {
        assertThrows(IllegalArgumentException.class,
                () -> PopupQuestionRules.validate(List.of(multiple("MULTIPLE_CHOICE", 4, 1, 2, true).withQuestionScore(BigDecimal.ONE)), true, 0.0));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(multiple("SINGLE_CHOICE", 4, null, 1, false)), false, null));
        var textWithLimit = new PopupQuestionDto(1L, "문항", null, "TEXT", true, false, null, 1, List.of(), null, null, "VERTICAL", null, null, 1, null);
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(textWithLimit), false, null));
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(multiple("MULTIPLE_CHOICE", 4, null, null, true).withQuestionScore(BigDecimal.ONE)), true, 0.0));
    }

    /** WPF 응답(SURVEY 정답 제거 경로)도 선택 수를 그대로 전달하고, null이면 JSON 키를 생략한다. */
    @Test void selectionLimitsSurviveAnswerKeyRemovalAndNullIsOmitted() throws Exception {
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        var stripped = server.domain.popup.wpf.WpfPopupItem.withoutAnswerKey(List.of(multiple("MULTIPLE_CHOICE", 4, 2, 3, false))).get(0);
        assertEquals(2, stripped.minSelections());
        assertEquals(3, stripped.maxSelections());
        var json = mapper.readTree(mapper.writeValueAsString(multiple("MULTIPLE_CHOICE", 4, null, 3, false)));
        assertFalse(json.has("minSelections"));
        assertEquals(3, json.get("maxSelections").intValue());
    }
}
