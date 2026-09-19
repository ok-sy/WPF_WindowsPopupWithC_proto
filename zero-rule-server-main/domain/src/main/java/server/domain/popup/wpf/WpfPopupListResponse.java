package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * GET /p/api/wpf/popups 응답.
 *
 * <p>[추가 이유 — 기준 2·4] 서버가 노출 판단(활성·기간·대상·숨김·완료)을 끝낸 최종 목록이다.
 * {@code serverTime}은 WPF가 시각 판단을 하지 않도록 참고용으로 내리고,
 * {@code pollingIntervalSeconds}는 주기 조회 간격을 서버가 통제하기 위한 값이다.</p>
 */
public record WpfPopupListResponse(
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = WpfJson.DATE_TIME) OffsetDateTime serverTime,
        String userId,
        int pollingIntervalSeconds,
        List<WpfPopupItem> popups
) {
    public WpfPopupListResponse {
        popups = popups == null ? List.of() : List.copyOf(popups);
    }
}
