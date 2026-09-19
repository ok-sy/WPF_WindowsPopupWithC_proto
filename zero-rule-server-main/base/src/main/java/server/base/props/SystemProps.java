package server.base.props;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 시스템 관련 설정
 */
@Component
@ConfigurationProperties(prefix = "custom.system")
@Data
public class SystemProps {
    private String configName;

    private String publicImageServerUrl = "/p/file/download/:FILEID:";

    private String baseServerUrl = "http://localhost:8080/zero-rule-server";
    //private String baseServerUrl = "https://zerorule.labcl.net/zero-rule-server";

}
