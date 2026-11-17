package server.domain.popup.wpf;

/**
 * POL-09-03 : 저장 응답
 * POL-12-01 : 종결과 보관
 * ■ WPF API 응답 code 코드표 (VARCHAR2(5 BYTE), UTF-8 ASCII 5자)
 * - 응답 본문 {@code code} 값을 한 곳에서 정의한다. HTTP 오류 본문 {@code {code, message, timestamp}}과
 *   결과 응답 {@code {resultId, status, code, message}}이 같은 코드표를 쓴다.
 *
 * <p>추가 이유(2026-11-17): 폐쇄망 백엔드의 코드 컬럼이 VARCHAR2(5 BYTE)라 기존 이름형 코드(예: WPF_INVALID_DELIVERY, 20 Byte)를
 * 그대로 저장·응답할 수 없다. 형식은 「구분 1자 + HTTP 상태 기반 3자리 + 일련 1자리」다.
 * E = HTTP 오류 본문, R = HTTP 200 결과 응답. 예전 이름은 아래 표의 '이름'으로 문서·로그에서 의미를 설명할 때만 쓴다.</p>
 *
 * <p>WPF는 code를 판정에 쓰지 않는다(로그 전용). 처리 분기는 HTTP 상태와 결과 {@code status}로만 한다.
 * 그래서 code를 바꿔도 WPF 동작은 같고, 백엔드는 이 형식을 지키는 범위에서 코드를 늘릴 수 있다.</p>
 *
 * <table>
 *   <tr><th>code</th><th>이름</th><th>응답</th><th>상황</th></tr>
 *   <tr><td>E4000</td><td>BAD_REQUEST</td><td>HTTP 400</td><td>본문 JSON 구문·역직렬화 실패, 로그인 요청 형식 오류</td></tr>
 *   <tr><td>E4010</td><td>UNAUTHORIZED</td><td>HTTP 401</td><td>토큰 없음·만료, 사번 확인 실패</td></tr>
 *   <tr><td>E4030</td><td>USER_INACTIVE</td><td>HTTP 403</td><td>사용자 없음·비활성</td></tr>
 *   <tr><td>E4260</td><td>CLIENT_VERSION_NOT_SUPPORTED</td><td>HTTP 426</td><td>클라이언트 버전 미지원·버전 헤더 없음</td></tr>
 *   <tr><td>E5000</td><td>INTERNAL</td><td>HTTP 500</td><td>그 밖의 요청 처리 실패(조회 처리 오류 등)</td></tr>
 *   <tr><td>R2001</td><td>NEXT_STATUS_UNKNOWN</td><td>200 ACCEPTED·DUPLICATE</td><td>저장은 됐으나 다음 후보 확인 실패(nextStatus 생략)</td></tr>
 *   <tr><td>R4000</td><td>INVALID_RESULT</td><td>200 REJECTED</td><td>결과 형식 오류, 그 밖의 업무 검증 실패</td></tr>
 *   <tr><td>R4001</td><td>INVALID_DELIVERY</td><td>200 REJECTED</td><td>유효한 전달 건이 아님</td></tr>
 *   <tr><td>R4002</td><td>DELIVERY_COMPLETED</td><td>200 REJECTED</td><td>다른 resultId 결과가 이미 저장된 전달 건</td></tr>
 *   <tr><td>R4003</td><td>NOT_ELIGIBLE</td><td>200 REJECTED</td><td>제출·기록 가능한 팝업이 아님</td></tr>
 *   <tr><td>R4004</td><td>TYPE_MISMATCH</td><td>200 REJECTED</td><td>팝업 유형과 결과 유형 불일치</td></tr>
 *   <tr><td>R4005</td><td>INVALID_ANSWER</td><td>200 REJECTED</td><td>문항·선택지·답안 검증 실패</td></tr>
 *   <tr><td>R4006</td><td>INVALID_VIDEO</td><td>200 REJECTED</td><td>영상 시청 정보 검증 실패</td></tr>
 *   <tr><td>R5000</td><td>RESULT_INTERNAL</td><td>200 INTERNAL_ERROR</td><td>원인 미확정 내부 오류(롤백)</td></tr>
 *   <tr><td>R5030</td><td>RETRYABLE</td><td>200 RETRYABLE_ERROR</td><td>확인된 일시 장애(롤백)</td></tr>
 * </table>
 */
public final class WpfResponseCodes {

    // ── HTTP 오류 본문 {code, message, timestamp} ──
    public static final String BAD_REQUEST = "E4000";
    public static final String UNAUTHORIZED = "E4010";
    public static final String USER_INACTIVE = "E4030";
    public static final String CLIENT_VERSION_NOT_SUPPORTED = "E4260";
    public static final String INTERNAL = "E5000";

    // ── HTTP 200 결과 응답 {resultId, status, code, message} ──
    public static final String NEXT_STATUS_UNKNOWN = "R2001";
    public static final String INVALID_RESULT = "R4000";
    public static final String INVALID_DELIVERY = "R4001";
    public static final String DELIVERY_COMPLETED = "R4002";
    public static final String NOT_ELIGIBLE = "R4003";
    public static final String TYPE_MISMATCH = "R4004";
    public static final String INVALID_ANSWER = "R4005";
    public static final String INVALID_VIDEO = "R4006";
    public static final String RESULT_INTERNAL = "R5000";
    public static final String RETRYABLE = "R5030";

    private WpfResponseCodes() {
    }
}
