package server.domain.popup;

/**
 * 문항 선택지. 관리자 상세에는 정답 여부(isCorrect)를 포함한다. WPF에는 QUIZ만 로컬 채점용으로 isCorrect를 전달하고,
 * 그 밖의 유형은 {@code WpfPopupItem.withoutAnswerKey}가 null로 비워 JSON에서 생략한다.
 */
public record PopupOptionDto(
        Long optionId,
        String value,
        String text,
        int sortOrder,
        @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
        Boolean isCorrect,
        // [TODO55] 선택지 표시 문구 서식(textBlocks 스키마 문단 배열). 없으면 null로 JSON에서 생략하고 text만 쓴다.
        @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
        java.util.List<Object> textBlocks
) {
    /** [TODO55] 서식 도입 전 생성자. 서식 없는 선택지(textBlocks = null)를 만든다. */
    public PopupOptionDto(Long optionId, String value, String text, int sortOrder, Boolean isCorrect) {
        this(optionId, value, text, sortOrder, isCorrect, null);
    }
}
