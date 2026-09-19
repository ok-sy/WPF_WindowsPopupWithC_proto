package server.domain.popup;
import java.util.List;
/** Authenticated editor data only; never included in public popup responses. */
public record AdminPopupQuestion(PopupQuestionDto question, List<String> correctValues) {
    public AdminPopupQuestion {
        correctValues = correctValues == null ? List.of() : List.copyOf(correctValues);
    }
}
