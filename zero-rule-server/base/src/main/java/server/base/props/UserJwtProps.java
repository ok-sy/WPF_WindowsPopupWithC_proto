package server.base.props;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 사용자의 JWT 관련 설정
 */
@Component
@ConfigurationProperties(prefix = "custom.user-jwt")
@Data
public class UserJwtProps {

    private String tokenSecret;

    private Duration tokenExpiration = Duration.ofMinutes(30);

    private Duration tokenExpirationLong = Duration.ofDays(30);

    private boolean allowDupLogin = true;

}
