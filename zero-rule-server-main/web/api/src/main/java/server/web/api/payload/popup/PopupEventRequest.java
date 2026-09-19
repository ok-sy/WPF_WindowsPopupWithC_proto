package server.web.api.payload.popup;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** WPF에서 발생한 팝업 표시 또는 닫기 이벤트다. */
public record PopupEventRequest(
        @NotBlank String userId,
        @NotBlank @Pattern(regexp = "DISPLAYED|CLOSED") String eventType
) {
}
