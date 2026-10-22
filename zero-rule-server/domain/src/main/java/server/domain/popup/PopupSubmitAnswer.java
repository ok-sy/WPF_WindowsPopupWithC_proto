package server.domain.popup;

import java.util.List;

/**
 * POL-06-02 : 선택·제출
 * ■ 문항 답안 1건
 * - in : questionId(Long) · textAnswer(String) 주관식 답 · optionIds(List) 선택한 선택지 ID
 * - out: 답안(record). optionIds가 null이면 빈 목록
 * - 설문 문항 하나에 사용자가 제출한 답안이다.
 */
public record PopupSubmitAnswer(
        Long questionId,
        String textAnswer,
        List<Long> optionIds
) {
    public PopupSubmitAnswer {
        optionIds = optionIds == null ? List.of() : List.copyOf(optionIds);
    }
}
