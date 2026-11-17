package server.service.core.popup.wpf;

/**
 * POL-09-03 : 저장 응답
 * POL-12-01 : 종결과 보관
 * ■ 결과 API 처리 실패 → HTTP 200 결과 응답(status·code·message) 분류 [백엔드 인계 참고 소스]
 * - in : 결과 1건 처리 중 발생한 예외
 * - out: REJECTED 세부 code / RETRYABLE_ERROR·INTERNAL_ERROR 구분 / 고정 code·message 상수
 *
 * <p>추가 이유(2026-11-17): 결과 API는 요청을 읽은 뒤의 실패를 HTTP 오류가 아니라 HTTP 200의 {@code status}로 알린다.
 * WPF는 {@code status}로 "이 결과를 지울지(ACCEPTED·DUPLICATE·REJECTED) / 보관·재전송할지(RETRYABLE_ERROR·INTERNAL_ERROR)"를
 * 정하기 때문이다. 이 판정이 {@code WpfPopupService} 안에 흩어져 있어 폐쇄망 백엔드가 그대로 옮겨 쓸 수 있도록 한 클래스로 모았다.
 * 동작은 분리 전과 같다(WpfPopupServiceTest가 같은 결과를 검증).
 * HTTP 오류로 응답해야 하는 경우(본문 해석 불가 400·인증 401·비활성 403·버전 426·그 밖의 500)는 이 클래스가 아니라
 * {@code WpfApiExceptionHandler}·{@code WpfClientVersionInterceptor}가 담당한다. 정의서: docs/interfaces/Server/SERVER_WPF_ERROR_BRANCH_GUIDE.md</p>
 *
 * <p>분류 원칙</p>
 * <ul>
 *   <li>업무 검증 실패(같은 본문을 다시 보내도 실패) → {@code REJECTED} + 세부 code. 세부 code는 진단값이며 WPF는 로그에만 쓴다.</li>
 *   <li>재시도하면 성공할 수 있는 확인된 일시 장애 → {@code RETRYABLE_ERROR}({@link #RETRYABLE_CODE}). 판정은 예외 형식(원인 체인)으로 하고
 *       메시지 문자열로 하지 않는다({@link #isTransient}).</li>
 *   <li>그 밖의 예외(원인 미확정) → {@code INTERNAL_ERROR}({@link #INTERNAL_CODE}). 분류되지 않은 예외를 REJECTED로 보내지 않는다 —
 *       REJECTED면 WPF가 결과를 지워 데이터가 사라진다.</li>
 *   <li>RETRYABLE_ERROR·INTERNAL_ERROR는 결과 저장 트랜잭션이 롤백된 상태여야 한다(같은 resultId로 다시 받을 수 있게).</li>
 * </ul>
 *
 * <p>[교체 지점] 폐쇄망 업무 예외가 메시지가 아닌 예외 클래스·오류 코드를 갖고 있으면 {@link #rejectCode}를 그 기준으로 바꾼다.
 * DB 드라이버·프레임워크가 다르면 {@link #isTransient}의 예외 형식 목록에 해당 일시 장애 예외를 추가한다
 * (예: 자체 래핑 예외가 원인을 감추면 그 예외 형식을 추가하거나 원인을 보존하도록 래핑을 고친다).</p>
 */
public final class WpfResultFailures {

    /** 확인된 일시 장애(RETRYABLE_ERROR)의 code·message. WPF는 같은 resultId로 다시 보낸다. */
    public static final String RETRYABLE_CODE = "WPF_RETRYABLE";
    public static final String RETRYABLE_MESSAGE = "일시적인 서버 오류로 처리하지 못했습니다. 다시 전송해 주세요.";
    /** 원인 미확정 내부 오류(INTERNAL_ERROR)의 code·message. 내부 상세는 응답에 넣지 않고 서버 로그에만 남긴다. */
    public static final String INTERNAL_CODE = "WPF_INTERNAL";
    public static final String INTERNAL_MESSAGE = "서버 처리 중 오류가 발생했습니다.";
    /** 결과는 저장했으나(ACCEPTED·DUPLICATE) 다음 후보 확인이 실패한 경우. nextStatus를 생략하고 이 code를 준다(EMPTY로 보내지 않음). */
    public static final String NEXT_STATUS_UNKNOWN_CODE = "WPF_NEXT_STATUS_UNKNOWN";
    public static final String NEXT_STATUS_UNKNOWN_MESSAGE = "결과는 저장했으나 다음 팝업 유무를 확인하지 못했습니다.";

    private WpfResultFailures() {
    }

    /**
     * POL-09-03 : 저장 응답
     * ■ 일시 장애 판정
     * - in : ex(Throwable) 결과 처리 예외
     * - out: boolean true = RETRYABLE_ERROR, false = INTERNAL_ERROR
     * - 재시도하면 성공할 수 있는 일시 장애인지 예외 형식(원인 체인 포함)으로 판단한다.
     * Spring 일시 장애 계열(TransientDataAccessException: 데드락·잠금 대기·쿼리 타임아웃 등), 복구 가능 오류,
     * DB 자원 접근 실패(연결 불가), 트랜잭션 시작 실패·트랜잭션 타임아웃, JDBC 일시·복구 가능 예외를 일시 장애로 본다.
     * 무결성 위반(DataIntegrityViolationException 등)은 재시도해도 같으므로 일시 장애가 아니다.
     */
    public static boolean isTransient(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause() == t ? null : t.getCause()) {
            if (t instanceof org.springframework.dao.TransientDataAccessException
                    || t instanceof org.springframework.dao.RecoverableDataAccessException
                    || t instanceof org.springframework.dao.DataAccessResourceFailureException
                    || t instanceof org.springframework.transaction.CannotCreateTransactionException
                    || t instanceof org.springframework.transaction.TransactionTimedOutException
                    || t instanceof java.sql.SQLTransientException
                    || t instanceof java.sql.SQLRecoverableException) {
                return true;
            }
        }
        return false;
    }

    /**
     * POL-09-03 : 저장 응답
     * ■ 업무 검증 실패 → REJECTED 세부 code
     * - in : ex(IllegalArgumentException) 업무 검증 예외(현재 저장소는 PopupService의 한국어 메시지)
     * - out: String WPF_NOT_ELIGIBLE · WPF_DELIVERY_COMPLETED · WPF_INVALID_DELIVERY · WPF_TYPE_MISMATCH · WPF_INVALID_ANSWER ·
     *        WPF_INVALID_VIDEO · 그 밖 WPF_INVALID_RESULT
     * - 세부 code는 진단값이다. WPF 큐 처리는 status(REJECTED)만 보므로 백엔드는 code를 늘리거나 합쳐도 된다.
     * 범위 밖 hideDays는 요청 형식 검사에서 WPF_INVALID_RESULT로 먼저 거절되고 누락은 결과 처리의 "hideDays가 필요" 메시지로
     * WPF_INVALID_RESULT가 되어, 별도 숨김 일수 코드는 두지 않는다.
     */
    public static String rejectCode(IllegalArgumentException ex) {
        String message = ex.getMessage() == null ? "" : ex.getMessage();
        if (message.contains("제출 가능한 팝업이 아닙니다") || message.contains("유효한 영상 팝업이 아닙니다")
                || message.contains("유효한 사용자 또는 팝업이 아닙니다")) {
            return "WPF_NOT_ELIGIBLE";
        }
        if (message.contains("이미 결과가 저장된 전달 건")) {
            return "WPF_DELIVERY_COMPLETED";
        }
        if (message.contains("전달 건")) {
            return "WPF_INVALID_DELIVERY";
        }
        if (message.contains("설문형 팝업만")) {
            return "WPF_TYPE_MISMATCH";
        }
        if (message.contains("문항") || message.contains("선택지") || message.contains("답안")) {
            return "WPF_INVALID_ANSWER";
        }
        if (message.contains("영상")) {
            return "WPF_INVALID_VIDEO";
        }
        return "WPF_INVALID_RESULT";
    }
}
