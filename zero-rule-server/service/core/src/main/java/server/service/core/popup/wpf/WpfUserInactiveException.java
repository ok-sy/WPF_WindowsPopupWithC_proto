package server.service.core.popup.wpf;

/**
 * POL-15-02 : 인증·버전
 * ■ 비활성 사용자 예외
 * - in : employeeNo(String) 인증된 사번
 * - out: RuntimeException(WpfApiExceptionHandler가 403 WPF_USER_INACTIVE로 변환)
 * - 인증은 되었지만 사번이 POPUP.APP_USER에 없거나 ACTIVE_YN='N'인 경우.
 * WpfApiExceptionHandler가 403 {@code WPF_USER_INACTIVE}로 변환한다.
 *
 * <p>[추가 이유] POL-15-02 : 인증·버전 — 사용자 식별은 인증 정보(토큰)에서 오지만, 팝업 대상 계산의 기준 키는 APP_USER.EMPLOYEE_NO다.
 * 두 체계가 어긋난 사용자(퇴직·미등록)는 목록을 비우는 대신 명시적으로 거절해 연동 문제를 드러낸다.</p>
 */
public class WpfUserInactiveException extends RuntimeException {

    /** ■ 생성 - in : employeeNo(String) 사번 - out: 예외(메시지에 사번 포함) */
    public WpfUserInactiveException(String employeeNo) {
        super("활성 사용자가 아닙니다. employeeNo=" + employeeNo);
    }
}
