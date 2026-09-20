package server.base.props;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 신규 WPF 팝업 API(/p/api/wpf/**) 설정. application-*.yml의 {@code custom.wpf-popup.*}.
 *
 * <p>[추가 이유 — 기준 3·4·6] 기존 custom.* 설정 클래스는 수정하지 않고 WPF 전용 접두어를 새로 둔다.</p>
 * <ul>
 *   <li>{@code polling-interval-seconds}: 목록 응답에 실어 WPF 주기 조회 간격을 서버가 통제 (기본 1800초, 기준 4)</li>
 *   <li>{@code dev-user-header}: true면 {@code X-Dev-User-Id} 헤더로 사번을 지정하는 개발용 사용자 식별기를 활성화.
 *       운영 프로파일에서는 반드시 false. 통합 토큰 필터(타 팀)가 적용되면 SecurityContext 기반 식별기가 쓰인다 (기준 6)</li>
 * </ul>
 */
@Component
@ConfigurationProperties(prefix = "custom.wpf-popup")
@Data
public class WpfPopupProps {

    private int pollingIntervalSeconds = 1800;

    private boolean devUserHeader = false;
}
