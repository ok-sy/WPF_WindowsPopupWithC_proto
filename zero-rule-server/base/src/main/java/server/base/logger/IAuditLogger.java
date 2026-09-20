package server.base.logger;

import org.springframework.lang.NonNull;

import java.time.Instant;

/**
 * Audit 로깅
 */
public interface IAuditLogger {
    /**
     * 사용자 로그인 성공
     */
    void userLoginSuccess(@NonNull String userId);

    /**
     * 사용자 로그아웃
     */
    void userLogout(@NonNull String userId);

    /**
     * 사용자 실패 - 로그인 비밀번호 불일치
     */
    void userLoginPasswdMismatch(@NonNull String userId);


    /**
     * 사용자 로그인 실패 - 비밀번호 파라미터가 전달되지 않음
     */
    void userLoginNoPasswdParam(@NonNull String userId);

    /**
     * 사용자 로그인 실패 - 해당 사용자 없음
     */
    void userLoginNoSuchUser(@NonNull String userId);

    /**
     * 로그인 IP주소를 차단합니다.
     */
    void startLoginIpBlocked(@NonNull String ip, @NonNull Instant expiryDttm);

    /**
     * 사용자의 비밀번호를 초기화 합니다.
     */
    void userInitPswd(@NonNull long userId);

    /**
     * 사용자가 비밀번호를 변경했습니다.
     */
    void userUpdatePswd();
}
