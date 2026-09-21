package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.OffsetDateTime;

/**
 * POST /p/api/wpf/auth/login 응답 (프로토타입).
 *
 * <p>[추가 이유 — 설계 10 §5.2] WPF가 메모리에만 보관할 토큰과 만료 시각. 토큰은 서버 메모리 저장소에서만
 * 유효한 opaque hash이며, WPF는 이후 요청에 {@code Authorization: Bearer {accessToken}}으로 붙인다.
 * 날짜는 다른 WPF DTO와 같이 ISO 8601 문자열로 고정한다(전역 ObjectMapper의 epoch 설정과 무관).</p>
 *
 * @param accessToken 64자 hex opaque 토큰
 * @param tokenType   항상 "Bearer"
 * @param expiresAt   서버 기준 만료 시각(발급 + custom.wpf-auth-prototype.token-ttl-minutes)
 */
public record WpfLoginResponse(
        String accessToken,
        String tokenType,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = WpfJson.DATE_TIME) OffsetDateTime expiresAt
) {
}
