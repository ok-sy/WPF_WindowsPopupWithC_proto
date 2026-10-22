package server.base.props;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * POL-09-02 : 조회 응답
 * POL-15-02 : 인증·버전
 * ■ 신규 WPF 팝업 API(/p/api/wpf/**) 설정
 * - in : application-*.yml의 {@code custom.wpf-popup.*}
 * - out: pollingIntervalSeconds(int, 1800~3600으로 제한) 조회 주기 · devUserHeader(boolean) 개발용 사용자 헤더 사용 여부
 *
 * <p>추가 이유: 기존 custom.* 설정 클래스는 수정하지 않고 WPF 전용 접두어를 새로 둔다.</p>
 * <ul>
 *   <li>{@code polling-interval-seconds}: 조회 응답에 실어 WPF 주기 조회 간격을 서버가 통제하고, 미완료로 닫힌 전달 건의 재노출 유예 시간으로도 쓴다
 *       (기본 1800초, 응답값 1800~3600초로 제한)</li>
 *   <li>{@code dev-user-header}: true면 {@code X-Dev-User-Id} 헤더로 사번을 지정하는 개발용 사용자 식별기를 활성화.
 *       운영 프로파일에서는 반드시 false. 통합 토큰 필터(타 팀)가 적용되면 SecurityContext 기반 식별기가 쓰인다(요청 본문의 userId가 아니라 인증 정보 기준)</li>
 * </ul>
 */
@Component
@ConfigurationProperties(prefix = "custom.wpf-popup")
@Data
public class WpfPopupProps {

    private int pollingIntervalSeconds = 1800;

    /** 서버 설정이 조회 주기를 소유하며 응답값은 30~60분으로 제한한다. */
    public int getPollingIntervalSeconds() {
        return Math.max(1800, Math.min(3600, pollingIntervalSeconds));
    }

    private boolean devUserHeader = false;
}
