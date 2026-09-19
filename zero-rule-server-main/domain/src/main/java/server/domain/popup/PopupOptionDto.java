package server.domain.popup;

/** WPF에 전달하는 선택지다. 정답 여부는 노출하지 않는다. */
public record PopupOptionDto(
        Long optionId,
        String value,
        String text,
        int sortOrder,
        @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL)
        Boolean isCorrect
) {
}
