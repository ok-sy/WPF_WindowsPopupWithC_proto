package server.base.props;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * WPF 클라이언트 버전 검증 설정. application-*.yml의 {@code custom.wpf-client.*}.
 *
 * <p>[추가 이유 — 설계 13 §1·§12] 오래된 WPF가 DTO/API 계약이 바뀐 서버를 계속 호출하는 것을 막기 위해
 * 서버가 버전 기준을 보유한다. 프로토타입/초기 운영에서는 설정값으로 관리하고, 관리자 화면에서 바꿔야 할 필요가
 * 생기면 DB로 옮긴다(§12). 기존 {@link WpfPopupProps}·{@link WpfAuthPrototypeProps}는 건드리지 않고 접두어를 따로 둔다.</p>
 * <ul>
 *   <li>{@code latest-version}: 현재 배포된 최신 WPF 버전(안내용, 예 1.4.2)</li>
 *   <li>{@code minimum-supported-version}: 서버가 정상 동작을 보장하는 최소 WPF 버전(예 1.3.0).
 *       <b>비어 있으면 검증을 하지 않는다</b>(헤더 없는 요청도 통과) — 기존 테스트·구 클라이언트 호환 스위치.</li>
 *   <li>{@code require-header}: true(기본)면 검증이 켜진 상태에서 {@code X-Client-Version} 헤더가 없는 요청을
 *       미지원 클라이언트로 보고 426으로 차단한다(설계 13 T5). false면 헤더 없는 요청은 통과시킨다.</li>
 * </ul>
 * 비교는 문자열이 아니라 major.minor.patch 숫자 단위로 한다(§6).
 */
@Component
@ConfigurationProperties(prefix = "custom.wpf-client")
@Data
public class WpfClientVersionProps {

    private String latestVersion = "";

    private String minimumSupportedVersion = "";

    private boolean requireHeader = true;

    /** 최소 지원 버전이 설정되어 있을 때만 검증한다. */
    public boolean isEnabled() {
        return minimumSupportedVersion != null && !minimumSupportedVersion.isBlank();
    }
}
