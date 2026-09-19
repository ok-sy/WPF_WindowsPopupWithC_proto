package server.base.props;

import cl.cloverframework.ICLTaskProps;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 백그라운드 태스크 관련 설정
 */
@Component
@ConfigurationProperties(prefix = "clover.task")
@Data
public class CloverTaskProps implements ICLTaskProps {

    /**
     * 주기적으로 서버의 health 상태를 체크하는데, 그 체크의 주기다
     * 보통 1분 정도로 설정한다.
     */
    private Duration healthCheckInterval = Duration.ofMinutes(1);

    /**
     * 백그라운드 태스크 비활성화 여부
     */
    private boolean taskDisabled = false;

}
