package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupOptionDto;
import server.domain.popup.wpf.WpfPopupItem;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class PopupQuestionLayoutTest {
    private PopupQuestionDto question(long id, String layout) {
        return new PopupQuestionDto(id, "Question", null, "SINGLE_CHOICE", true, false,
                null, (int) id, List.of(new PopupOptionDto(1L, "1", "A", 1, true),
                new PopupOptionDto(2L, "2", "B", 2, false)), null, null, layout);
    }

    @Test void mixedLayoutsSurviveJsonAndAnswerKeyRemoval() throws Exception {
        var questions = List.of(question(1, "HORIZONTAL"), question(2, "VERTICAL"));
        var json = new ObjectMapper();
        var restored = List.of(json.readValue(json.writeValueAsString(questions), PopupQuestionDto[].class));
        assertEquals(questions, restored);
        var publicQuestions = WpfPopupItem.withoutAnswerKey(restored);
        assertEquals("HORIZONTAL", publicQuestions.get(0).optionLayout());
        assertEquals("VERTICAL", publicQuestions.get(1).optionLayout());
        assertNull(publicQuestions.get(0).options().get(0).isCorrect());
        assertDoesNotThrow(() -> PopupQuestionRules.validate(restored, false, null));
    }

    @Test void omittedLayoutDefaultsToVerticalAndUnknownLayoutIsRejected() throws Exception {
        var json = new ObjectMapper();
        var node = json.valueToTree(question(1, "HORIZONTAL"));
        ((com.fasterxml.jackson.databind.node.ObjectNode) node).remove("optionLayout");
        assertEquals("VERTICAL", json.treeToValue(node, PopupQuestionDto.class).optionLayout());
        assertEquals("VERTICAL", question(1, null).optionLayout());
        assertThrows(IllegalArgumentException.class,
                () -> PopupQuestionRules.validate(List.of(question(1, "OTHER")), false, null));
    }
}
