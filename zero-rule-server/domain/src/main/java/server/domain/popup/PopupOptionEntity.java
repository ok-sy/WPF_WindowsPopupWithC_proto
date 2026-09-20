package server.domain.popup;

/** 선택지 조회 모델이다. correctYn은 서버 내부에서만 보존한다. */
public record PopupOptionEntity(
        Long optionId,
        Long questionId,
        String optionValue,
        String optionText,
        String correctYn,
        Integer sortOrder
) {
}
