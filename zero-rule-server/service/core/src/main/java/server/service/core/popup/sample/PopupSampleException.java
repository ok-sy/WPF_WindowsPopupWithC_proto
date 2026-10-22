package server.service.core.popup.sample;



/**
 * [TODO65] 저장 데이터가 응답 계약을 만족하지 않을 때(잘못된 JSON·객체가 아닌 JSON·필수 콘텐츠 누락·모르는 코드).
 * 서버 데이터 문제이므로 WPF에는 500 WPF_INTERNAL(메시지 비노출)로 응답하고, 원인은 로그에 콘텐츠 ID와 함께 남긴다.
 * 빈 content·기본값으로 덮어 정상처럼 반환하지 않는다.
 */
public class PopupSampleException extends RuntimeException {

    public enum Reason { INVALID_CONTENT_JSON, CONTENT_NOT_OBJECT, MISSING_REQUIRED_CONTENT, UNKNOWN_CODE, INVALID_COLUMN, QUESTIONS_NOT_CONNECTED }

    private final Reason reason;
    private final String contentId;

    public PopupSampleException(Reason reason, String contentId, String message, Throwable cause) {
        super(message, cause);
        this.reason = reason;
        this.contentId = contentId;
    }

    public PopupSampleException(Reason reason, String contentId, String message) {
        this(reason, contentId, message, null);
    }

    public Reason reason() { return reason; }

    public String contentId() { return contentId; }
}
