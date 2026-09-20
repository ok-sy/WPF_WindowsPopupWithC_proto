package server.base.props;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 시스템 보안 관련 설정
 */
@Component
@ConfigurationProperties(prefix = "custom.server-security")
@Data
public class ServerSecurityProps {
    private List<String> allowedOrigins;
}
