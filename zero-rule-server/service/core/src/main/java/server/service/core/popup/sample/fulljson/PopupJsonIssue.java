package server.service.core.popup.sample.fulljson;

/**
 * POL-01-02 : 기본값의 적용
 * POL-14-03 : 서버 인계 예제
 * ■ 등록·수정 JSON 검증 오류 1건
 * - in : path(JSON 경로, 예 {@code $.content.videoEnabled}) · code · expected · actual · message
 * - out: 불변 값(관리자 화면·API 응답에 필드별로 그대로 보여줄 수 있는 형태)
 * - 오류가 1건이라도 있으면 저장하지 않는다({@link PopupJsonValidationResult#valid()}).
 *
 * <p>code 값: INVALID_JSON · NOT_OBJECT · ENVELOPE_NOT_ALLOWED · MISSING_REQUIRED · TYPE_MISMATCH · INVALID_ENUM · OUT_OF_RANGE
 * · ID_MISMATCH · RULE_VIOLATION. actual은 입력값의 JSON 표현을 최대 200자로 자른 값이며 비밀값을 담는 필드는 계약에 없다.</p>
 */
public record PopupJsonIssue(String path, String code, String expected, String actual, String message) {
}
