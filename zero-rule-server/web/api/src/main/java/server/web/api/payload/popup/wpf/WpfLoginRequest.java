package server.web.api.payload.popup.wpf;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * POL-15-02 : 인증·버전
 * POL-09-01 : 3 API 순서
 * ■ WPF 프로토타입 로그인 요청 본문 (POST /p/api/wpf/auth/login)
 * - in : lgonId · classCode · linkYn (아래 @param)
 * - out: 없음(요청 형식)
 * - WPF가 사내 SSO XML에서 읽은 사용자 식별값을 그대로 전달한다.
 *   프로토타입에서는 서버가 SSO에 재확인하지 않고 필수 값 존재 여부만 검사한다(SSO 진위 확인은 프로토타입 범위 밖,
 *   docs/design/10_WPF_SSO_토큰_프로토타입_계획.md).
 * - 요청 키는 폐쇄망 로그인 API(p/api/ssoLogin) 요청 DTO와 같은 {@code lgonId}다. 이전 WPF가 보내던 {@code logonId}도
 *   {@link JsonAlias}로 받는다. Java 이름 logonId는 내부 이름이다.
 *
 * @param logonId   JSON {@code lgonId}(별칭 logonId). SSO XML {@code MAIN_USER_ID} — 사번. WPF API의 사용자 식별값이 된다.
 * @param classCode SSO XML {@code MAIN_USER_CLASSI_CODE} — 사용자 구분 코드(저장만 하고 판단에 쓰지 않음).
 * @param linkYn    연동 구분. WPF는 "N"을 보낸다(선택, Y/N).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record WpfLoginRequest(
        @JsonProperty("lgonId") @JsonAlias("logonId") @NotBlank @Size(max = 50) String logonId,
        @NotBlank @Size(max = 50) String classCode,
        @Pattern(regexp = "[YN]?") String linkYn
) {
}
