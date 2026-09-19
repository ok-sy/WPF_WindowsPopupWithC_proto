package server.domain.popup.wpf;

/**
 * WPF API DTO 공통 상수.
 *
 * <p>[추가 이유 — 기준 3] zeroserver 전역 ObjectMapper는 {@code WRITE_DATES_AS_TIMESTAMPS}(epoch 초)로 설정되어 있고
 * 이 설정은 다른 업무 API가 공유하므로 바꾸지 않는다(구조 변경 최소화). WPF DTO의 날짜 필드에만
 * {@code @JsonFormat(shape = STRING, pattern = WpfJson.DATE_TIME)}을 붙여 ISO 8601(+오프셋) 문자열로 내린다.</p>
 */
public final class WpfJson {

    /** 예: 2026-09-19T09:00:00+09:00 */
    public static final String DATE_TIME = "yyyy-MM-dd'T'HH:mm:ssXXX";

    private WpfJson() {
    }
}
