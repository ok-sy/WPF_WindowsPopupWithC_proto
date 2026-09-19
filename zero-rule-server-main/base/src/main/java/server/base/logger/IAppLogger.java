package server.base.logger;

import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

/**
 * 애플리케이션 로깅
 */
public interface IAppLogger {
    void pdsInserted(long pdsId, @NonNull String pdsTitle);

    void pdsUpdated(long pdsId, @NonNull String pdsTitle);

    void pdsDeleted(long pdsId);

    void userAuthTokenDeleteFail(@Nullable String userId, @Nullable String authorizationHeader);

    void userAuthTokenDeleteSuccess(@Nullable String userId, @NonNull String authorizationHeader);

    void userLoginBlocked(@NonNull String clientIp);

    /**
     * 개발 모드 경고
     */
    void devWarning(@NonNull String msg, @Nullable String clientIp);


    /**
     * 개발 모드 디버그
     */
    void devDebug(@NonNull String msg, @Nullable String clientIp);
}
