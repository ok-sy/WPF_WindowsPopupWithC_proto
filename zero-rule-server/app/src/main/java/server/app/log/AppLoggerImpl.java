package server.app.log;

import cl.cloverframework.impl.log.CLAppLogSaver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import server.base.logger.IAppLogger;
import server.domain.CustomUserDetails;
import server.service.UserSecurityUtils;

@Component
public class AppLoggerImpl implements IAppLogger {
    @Autowired
    private CLAppLogSaver logSaver;

    @Nullable
    private String currentUserId() {
        CustomUserDetails userDetails = UserSecurityUtils.currentUserDetails();
        if (userDetails != null) {
            return userDetails.getLgonId();
        }
        return null;
    }

    @Override
    public void pdsInserted(long pdsId, @NonNull String pdsTitle) {
        String title = "PDS 자료 등록";
        String msg = String.format("pdsId=%d, title=%s", pdsId, title);
        logSaver.d(
            title,
            msg,
            currentUserId(),
            null,
            null
        );
    }

    @Override
    public void pdsUpdated(long pdsId, @NonNull String pdsTitle) {
        String title = "PDS 자료 수정";
        String msg = String.format("pdsId=%d, title=%s", pdsId, title);
        logSaver.d(
            title,
            msg,
            currentUserId(),
            null,
            null
        );
    }

    @Override
    public void pdsDeleted(long pdsId) {
        String title = "PDS 자료 삭제";
        String msg = String.format("pdsId=%d", pdsId);
        logSaver.d(
            title,
            msg,
            currentUserId(),
            null,
            null
        );
    }

    @Override
    public void userAuthTokenDeleteFail(@NonNull String userId, @Nullable String authorizationHeader) {
        String title = "사용자 인증 토큰 삭제 실패";
        String msg = String.format("userId=%s, authorizationHeader=%s", userId, authorizationHeader);
        logSaver.i(
            title,
            msg,
            currentUserId(),
            null,
            null
        );
    }

    @Override
    public void userAuthTokenDeleteSuccess(@Nullable String userId, @NonNull String authorizationHeader) {
        String title = "사용자 인증 토큰 삭제 성공";
        String msg = String.format("userId=%s, authorizationHeader=%s", userId, authorizationHeader);
        logSaver.i(
            title,
            msg,
            currentUserId(),
            null,
            null
        );
    }

    @Override
    public void userLoginBlocked(@NonNull String clientIp) {
        String title = "사용자 로그인 IP 주소 차단";
        String msg = String.format("ip=%s", clientIp);
        logSaver.i(
            title,
            msg,
            currentUserId(),
            null,
            null
        );
    }

    @Override
    public void devWarning(@NonNull String msg, @Nullable String clientIp) {
        String title = String.format("개발 환경에서 실행중 IP=%s", clientIp);
        logSaver.w(
            title,
            msg,
            currentUserId(),
            null,
            null
        );
    }

    @Override
    public void devDebug(@NonNull String msg, @Nullable String clientIp) {
        String title = String.format("개발 환경에서 실행중 IP=%s", clientIp);
        logSaver.d(
            title,
            msg,
            currentUserId(),
            null,
            null
        );
    }
}
