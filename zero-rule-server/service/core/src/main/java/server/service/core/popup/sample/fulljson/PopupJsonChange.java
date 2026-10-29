package server.service.core.popup.sample.fulljson;

/**
 * POL-01-02 : 기본값의 적용
 * POL-14-03 : 서버 인계 예제
 * ■ 등록·수정 정규화 중 바뀐 값 1건(경고)
 * - in : path · before(없으면 {@code "(missing)"}) · after(제거면 {@code "(removed)"}) · reason
 * - out: 불변 값. 경고만 있으면 정규화 결과를 저장할 수 있다.
 *
 * <p>reason 값: DEFAULT_APPLIED(누락·null → 기본값) · SERVER_OWNED_REMOVED(deliveryId·pollingIntervalSeconds) · UNKNOWN_FIELD_REMOVED
 * · MOVED_FROM_CONTENT(content 안 창·푸터 옵션을 최상위로) · NOT_APPLICABLE_REMOVED(유형에 쓰지 않는 값) · POPUP_ID_SET(DB 키로 채움)
 * · VALUE_TRIMMED(footerLinkUrl 앞뒤 공백 제거).</p>
 */
public record PopupJsonChange(String path, String before, String after, String reason) {

    static final String MISSING = "(missing)";
    static final String REMOVED = "(removed)";
}
