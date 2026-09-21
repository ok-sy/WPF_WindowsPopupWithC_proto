package server.base.props;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.convert.DurationUnit;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.temporal.ChronoUnit;

/**
 * WPF SSO·토큰 프로토타입 설정. application-*.yml의 {@code custom.wpf-auth-prototype.*}.
 *
 * <p>[추가 이유 — 설계 10 §6·§9] WPF가 사내 SSO(Negotiate)에서 얻은 사용자 정보로 서버 로그인 API를 호출해
 * 짧은 유효기간의 opaque 토큰을 받고, 만료 후 {@code 401 → 재로그인 → 원 요청 재전송} 흐름이 동작하는지
 * 검증하기 위한 <b>프로토타입</b> 스위치다. 운영 인증(타 팀 통합 토큰)이 아니므로 기본값은 {@code enabled=false}이며,
 * 개발 프로파일(application-local.yml)에서만 켠다. 기존 {@link WpfPopupProps}(custom.wpf-popup)는 건드리지 않고
 * 접두어를 따로 둔다.</p>
 * <ul>
 *   <li>{@code enabled}: true면 {@code POST /p/api/wpf/auth/login}과 토큰 검사 사용자 식별기
 *       ({@code PrototypeTokenWpfUserResolver})가 빈으로 등록된다.</li>
 *   <li>{@code token-ttl-minutes}: 발급 토큰의 유효기간. 단위 없는 숫자는 분(설계 기본 10). 만료 시나리오를 빨리
 *       확인하려면 {@code 20s}처럼 단위를 붙여 초 단위로 줄일 수 있다(환경변수
 *       {@code CUSTOM_WPF_AUTH_PROTOTYPE_TOKEN_TTL_MINUTES=20s}).</li>
 * </ul>
 */
@Component
@ConfigurationProperties(prefix = "custom.wpf-auth-prototype")
@Data
public class WpfAuthPrototypeProps {

    /** 프로토타입 로그인 API·토큰 검사 활성 여부. 운영 기본 false. */
    private boolean enabled = false;

    /** 토큰 유효기간. 단위 없는 값은 분으로 해석한다(설계 10: 10분). */
    @DurationUnit(ChronoUnit.MINUTES)
    private Duration tokenTtlMinutes = Duration.ofMinutes(10);
}
