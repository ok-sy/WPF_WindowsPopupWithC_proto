package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * [설계 35] POST /p/api/wpf/popups 응답. 현재 표시할 팝업 최대 1건.
 *
 * <p>{@code pollingIntervalSeconds}는 매 응답에 포함하며 클라이언트는 최신 값을 반영한다.
 * {@code popup}이 없으면 명시적으로 {@code null}을 보낸다(전역 NON_NULL과 무관하게 키 유지).
 * 이전 목록 응답의 serverTime·userId·popups[]는 삭제했다. 사용자는 인증 정보로 정해지고 nextStatus는 결과 응답에만 있다.</p>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WpfNextPopupResponse(
        int pollingIntervalSeconds,
        @JsonInclude(JsonInclude.Include.ALWAYS) WpfPopupItem popup
) {
}