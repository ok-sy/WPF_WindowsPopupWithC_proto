package server.base.props;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * 사용자의 보안 관련 설정
 */
@Component
@ConfigurationProperties(prefix = "custom.user-security")
@Data
public class UserSecurityProps {

    /**
     * 비밀번호 리셋토큰 만료 기간
     */
    private Duration passwdResetTokenExpire = Duration.ofHours(1);

    /**
     * 로그인 실패 디버깅
     * 운영서버에서는 false
     */
    private boolean debugLoginFail = false;


    /**
     * 중복 로그인 허용 여부
     */
    private Boolean allowDupLogin = true;
}
