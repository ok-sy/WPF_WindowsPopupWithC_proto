package server.web.api.payload.popup;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** WPF 영상 플레이어가 주기적으로 전송하는 재생 상태다. */
public record VideoProgressRequest(
        @NotBlank String userId,
        @NotNull @DecimalMin("0.001") BigDecimal durationSeconds,
        @NotNull @DecimalMin("0.0") BigDecimal positionSeconds,
        @NotNull @DecimalMin("0.0") BigDecimal maximumPositionSeconds,
        @NotNull @DecimalMin("0.0") BigDecimal watchedSeconds
) {
}
