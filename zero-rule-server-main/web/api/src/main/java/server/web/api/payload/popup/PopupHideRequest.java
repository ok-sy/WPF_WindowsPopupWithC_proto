package server.web.api.payload.popup;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** WPF가 일정 기간 팝업을 숨길 때 전달하는 요청이다. */
public record PopupHideRequest(
        @NotBlank(message = "사용자 ID는 필수입니다.")
        String userId,

        @NotNull(message = "숨김 일수는 필수입니다.")
        @Min(value = 1, message = "숨김 일수는 1일 이상이어야 합니다.")
        @Max(value = 3650, message = "숨김 일수는 3650일 이하여야 합니다.")
        Integer hideDays
) {
}
