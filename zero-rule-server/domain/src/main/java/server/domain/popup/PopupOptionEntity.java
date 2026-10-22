package server.domain.popup;

/**
 * POL-06-01 : 문항·서식
 * ■ 선택지 조회 모델
 * - in : POPUP_OPTION 조회 컬럼(서식은 JSON 배열 문자열)
 * - out: 선택지 1행(record)
 * - 선택지 조회 모델이다. correctYn은 서버 내부에서만 보존한다.
 */
public record PopupOptionEntity(
        Long optionId,
        Long questionId,
        String optionValue,
        String optionText,
        String correctYn,
        Integer sortOrder,
        // POL-06-01 : 문항·서식 — 선택지 표시 문구 서식 JSON 배열 문자열(CLOB). NULL = 서식 없음.
        String textBlocksJson
) {
    /** POL-06-01 : 문항·서식 — 서식 컬럼 도입 전 생성자(테스트용). 서식 없음으로 만든다. */
    public PopupOptionEntity(Long optionId, Long questionId, String optionValue, String optionText,
            String correctYn, Integer sortOrder) {
        this(optionId, questionId, optionValue, optionText, correctYn, sortOrder, null);
    }
}
