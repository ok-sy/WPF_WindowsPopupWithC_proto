package server.domain.popup.wpf;

import java.math.BigDecimal;

/**
 * 결과 항목(VIDEO_WATCHED)에 담기는 영상 시청 누적값. 단위는 초.
 *
 * <p>[추가 이유 — 기준 4] 기존에는 재생 중 주기적으로 /video-progress를 호출했다. 이제 팝업이 닫힐 때
 * 최종 누적값 1건만 보내며, 기존 {@code PopupService.saveVideoProgress}가 같은 규칙으로 비율·완료를 판정한다.</p>
 */
public record WpfVideoProgress(
        BigDecimal durationSeconds,
        BigDecimal positionSeconds,
        BigDecimal maximumPositionSeconds,
        BigDecimal watchedSeconds
) {
}
