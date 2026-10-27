package server.domain.popup.sample.fulljson;

/**
 * POL-13-03 : 적용·샘플 구분
 * POL-14-03 : 서버 인계 예제
 * ■ DTIY3117 전체 JSON 조회 결과 VO(샘플)
 * - in : MyBatis resultMap {@code popupBulletinRow} 컬럼(아래 표)
 * - out: 팝업 1건(getter/setter)
 * - 게시내용 CLOB에 저장한 popup 객체 본체 JSON을 그대로 받는다. 파싱·기본값·검증은 서비스에서 한다.
 *
 * <p>컬럼은 DTIY3117 사진 판독(docs/design/20261027_DTIY3117_전체JSON_별도조회프로그램_TODO.md)이며 확정 DDL이 아니다.
 * 등록 사용자·일시(REG_USER_ID·REG_DTTM·CHNG_*)는 응답에 쓰지 않아 조회하지 않는다.
 * 기존 DTIY3111용 {@code PopupContentRow}와 섞지 않는다.</p>
 *
 * <table>
 *   <tr><th>필드</th><th>컬럼</th><th>의미</th></tr>
 *   <tr><td>popupId</td><td>POPU_ID VARCHAR2(10) PK</td><td>팝업 ID → 응답 {@code popupId}(저장 JSON보다 우선)</td></tr>
 *   <tr><td>popupJson</td><td>POPU_BLTN_CN CLOB</td><td>팝업 게시내용 = popup 객체 본체 JSON(content·questions 포함)</td></tr>
 * </table>
 */
public class PopupBulletinRow {

    private String popupId;
    private String popupJson;

    public String getPopupId() { return popupId; }

    public void setPopupId(String popupId) { this.popupId = popupId; }

    public String getPopupJson() { return popupJson; }

    public void setPopupJson(String popupJson) { this.popupJson = popupJson; }
}
