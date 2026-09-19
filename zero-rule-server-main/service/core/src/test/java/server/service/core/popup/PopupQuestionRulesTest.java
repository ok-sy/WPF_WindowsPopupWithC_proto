package server.service.core.popup;

import org.junit.jupiter.api.Test;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupOptionDto;
import java.math.BigDecimal;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class PopupQuestionRulesTest {
    private PopupQuestionDto text(String answer, String mode, String score) {
        return new PopupQuestionDto(1L, "보안 단축키", null, "TEXT", true, true,
                score == null ? null : new BigDecimal(score), 1, List.of(), answer, mode);
    }

    @Test void exactMatchTrimsOnlyOuterWhitespace() {
        assertTrue(PopupQuestionRules.matchesText("  Windows + L  ", "Windows + L", "EXACT"));
        assertFalse(PopupQuestionRules.matchesText("Windows + L 누르기", "Windows + L", "EXACT"));
        assertFalse(PopupQuestionRules.matchesText("windows + L", "Windows + L", "EXACT"));
        assertFalse(PopupQuestionRules.matchesText("Windows+L", "Windows + L", "EXACT"));
    }

    @Test void containsRequiresExpectedTextWithinSubmittedAnswer() {
        assertTrue(PopupQuestionRules.matchesText("Windows + L 키를 누릅니다", "Windows + L", "CONTAINS"));
        assertFalse(PopupQuestionRules.matchesText("Windows", "Windows + L", "CONTAINS"));
        assertFalse(PopupQuestionRules.matchesText("응답", " ", "CONTAINS"));
        assertFalse(PopupQuestionRules.matchesText(null, "정답", "EXACT"));
        assertFalse(PopupQuestionRules.matchesText("정답", "정답", null));
    }

    @Test void surveyNeedsNoScoreOrCorrectAnswer() {
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(text(null, null, null)), false, null));
    }

    @Test void quizValidatesTotalAndTextAnswer() {
        var questions = List.of(text("정답", "EXACT", "10.25"), text("키워드", "CONTAINS", "9.75"));
        assertDoesNotThrow(() -> PopupQuestionRules.validate(questions, true, 20.0));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(questions, true, 20.01));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(questions, true, null));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(text("", "EXACT", "10")), true, 0.0));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(text("정답", "OTHER", "10")), true, 0.0));
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(text("정답", "EXACT", "0.001")), true, 0.0));
    }

    @Test void singleChoiceMustHaveExactlyOneCorrectOption() {
        var options = List.of(new PopupOptionDto(1L, "1", "A", 1, true), new PopupOptionDto(2L, "2", "B", 2, true));
        var single = new PopupQuestionDto(1L, "문항", null, "SINGLE_CHOICE", true, true, BigDecimal.TEN, 1, options, null, null);
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(single), true, 10.0));
        var multiple = new PopupQuestionDto(1L, "문항", null, "MULTIPLE_CHOICE", true, true, BigDecimal.TEN, 1, options, null, null);
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(multiple), true, 10.0));
    }
}
