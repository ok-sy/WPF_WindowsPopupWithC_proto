package server.base.props;

import com.google.common.collect.Sets;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.HashSet;

/**
 * API 인증 헤더 관련 설정
 */
@Component
@ConfigurationProperties(prefix = "custom.auth-header")
@Data
public class AuthHeaderProps {

    /**
     * 사용자 인증 헤더
     * ex: x-custom-authorization: xxxx
     * ex: Authentication: Bearer xxxx
     */
    private String userRefreshTokenHeader;

    /**
     * 사용자 인증 취소 헤더
     * ex: x-custom-authorization-clear: 1
     */
    private String userClearHeader;


    public HashSet<String> allHeaders() {
        return Sets.newHashSet(
            this.userRefreshTokenHeader,
            this.userClearHeader
        );
    }
}
