package server.web.api.popup.sample.relay;

/**
 * POL-14-03 : 서버 인계 예제
 * ■ 중계 샘플의 백엔드 호출 실패 예외
 * - in : kind(Kind) 실패 분류 · status(int) 백엔드 HTTP 상태 · body(String) 백엔드 응답 본문
 * - out: RelayExceptionHandler가 WPF 오류 계약으로 변환
 * - 데이터 없음(정상 200 + popup:null)과 섞지 않는다.
 *
 * <p>{@code status}는 백엔드가 응답한 HTTP 상태(응답이 없으면 0), {@code body}는 백엔드 응답 본문(없으면 null)이다.</p>
 */
public class BackendCallException extends RuntimeException {

    /** 실패 분류. 로그와 진단 헤더 X-Sample-Upstream-Error 값으로 쓴다. */
    public enum Kind {
        /** 연결 실패(주소·포트·방화벽 등). */
        CONNECT,
        /** 연결 후 응답 timeout. */
        TIMEOUT,
        /** 백엔드 4xx. */
        HTTP_4XX,
        /** 백엔드 5xx. */
        HTTP_5XX,
        /** 응답이 JSON이 아님. */
        INVALID_JSON,
        /** JSON이지만 조회 계약(pollingIntervalSeconds·popup)과 다름. */
        INVALID_RESPONSE
    }

    private final Kind kind;
    private final int status;
    private final String body;

    public BackendCallException(Kind kind, int status, String body, String message, Throwable cause) {
        super(message, cause);
        this.kind = kind;
        this.status = status;
        this.body = body;
    }

    public Kind kind() { return kind; }

    public int status() { return status; }

    public String body() { return body; }
}
