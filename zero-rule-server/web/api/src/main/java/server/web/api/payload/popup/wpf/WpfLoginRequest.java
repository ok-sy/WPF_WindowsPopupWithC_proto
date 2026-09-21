package server.web.api.payload.popup.wpf;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * POST /p/api/wpf/auth/login 요청 본문 (프로토타입).
 *
 * <p>[추가 이유 — 설계 10 §5.2·§6.2] WPF가 사내 SSO XML에서 읽은 사용자 식별값을 그대로 전달한다.
 * 프로토타입에서는 서버가 SSO에 재확인하지 않고 필수 값 존재 여부만 검사한다(설계 10 §2 "제외" 참고).</p>
 *
 * @param logonId   SSO XML {@code MAIN_USER_ID} — 사번. WPF API의 사용자 식별값이 된다.
 * @param classCode SSO XML {@code MAIN_USER_CLASSI_CODE} — 사용자 구분 코드(저장만 하고 판단에 쓰지 않음).
 * @param linkYn    연동 구분. WPF는 "N"을 보낸다(선택, Y/N).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record WpfLoginRequest(
        @NotBlank @Size(max = 50) String logonId,
        @NotBlank @Size(max = 50) String classCode,
        @Pattern(regexp = "[YN]?") String linkYn
) {
}
