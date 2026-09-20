package server.domain.popup;

import java.util.List;

/** 설문 문항 하나에 사용자가 제출한 답안이다. */
public record PopupSubmitAnswer(
        Long questionId,
        String textAnswer,
        List<Long> optionIds
) {
    public PopupSubmitAnswer {
        optionIds = optionIds == null ? List.of() : List.copyOf(optionIds);
    }
}
