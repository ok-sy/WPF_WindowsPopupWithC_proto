package server.app.log;


import cl.cloverframework.impl.log.CLAuditLogSaver;
import cl.cloverframework.log.CLAuditLogKind;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import server.base.logger.IAuditLogger;
import server.domain.CustomUserDetails;
import server.domain.entity.CLUser;
import server.service.UserSecurityUtils;
import server.service.core.UserService;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Component
public class AuditLoggerImpl implements IAuditLogger {
    @Autowired
    private CLAuditLogSaver logSaver;
    @Autowired
    private UserService userService;

    @Nullable
    private String currentUserId() {
        CustomUserDetails userDetails = UserSecurityUtils.currentUserDetails();
        if (userDetails != null) {
            return userDetails.getLgonId();
        }
        return null;
    }

    /**
     * 사용자 로그인 성공
     */
    @Override
    public void userLoginSuccess(@NonNull String userId) {
        String title = "사용자 로그인 성공";
        String msg = String.format("userId=%s", userId);
        logSaver.d(
                CLAuditLogKind.AUTH,
                title,
                msg,
                userId,
                currentUserId(),
                null,
                null
        );
    }

    /**
     * 사용자 로그 아웃
     */
    @Override
    public void userLogout(@NonNull String userId) {
        String title = "사용자 로그 아웃";
        String msg = String.format("userId=%s", userId);
        logSaver.d(
                CLAuditLogKind.AUTH,
                title,
                msg,
                userId,
                currentUserId(),
                null,
                null
        );
    }

    @Override
    public void userLoginPasswdMismatch(@NonNull String userId) {
        String title = "사용자 로그인 실패 - 비밀번호 불일치";
        String msg = String.format("userId=%s", userId);
        logSaver.i(
                CLAuditLogKind.AUTH,
                title,
                msg,
                currentUserId(),
                null,
                null,
                null
        );
    }

    @Override
    public void userLoginNoPasswdParam(@NonNull String userId) {
        String title = "사용자 로그인 실패 - 비밀번호 파라미터 없음";
        String msg = String.format("userId=%s", userId);
        logSaver.i(
                CLAuditLogKind.AUTH,
                title,
                msg,
                currentUserId(),
                null,
                null,
                null
        );
    }

    @Override
    public void userLoginNoSuchUser(@NonNull String userId) {
        String title = "사용자 로그인 실패 - 해당 사용자 없음";
        String msg = String.format("userId=%s", userId);
        logSaver.i(
                CLAuditLogKind.AUTH,
                title,
                msg,
                currentUserId(),
                null,
                null,
                null
        );
    }

    private String formatDttm(ZonedDateTime dttm) {
        return String.format("%d-%d-%d %02d:%02d:%02d",
                dttm.getYear(),
                dttm.getMonthValue(),
                dttm.getDayOfMonth(),
                dttm.getHour(),
                dttm.getMinute(),
                dttm.getSecond()
        );
    }

    @Override
    public void startLoginIpBlocked(@NonNull String ip, @NonNull Instant expiryDttm) {
        String title = "로그인 IP 주소 차단";
        ZonedDateTime expire = ZonedDateTime.ofInstant(expiryDttm, ZoneId.systemDefault());
        String msg = String.format("ip=%s, dttm=%s", ip, formatDttm(expire));
        logSaver.i(
                CLAuditLogKind.AUTH,
                title,
                msg,
                currentUserId(),
                null,
                null,
                null
        );
    }

    @Override
    public void userInitPswd(@NonNull long userId) {
        String title = "사용자 비밀번호 초기화";
        CLUser user = userService.findUserByUserId(userId);

        String msg = String.format("비밀번호가 초기화된 사용자 ID : %s", user.getLgonId());
        logSaver.i(
                CLAuditLogKind.AUTH,
                title,
                msg,
                currentUserId(),
                null,
                null,
                null
        );
    }

    @Override
    public void userUpdatePswd() {
        String title = "사용자 비밀번호 변경";

        String msg = String.format("변경자 ID : %s", UserSecurityUtils.currentLgonIdOrNull() );
        logSaver.i(
                CLAuditLogKind.AUTH,
                title,
                msg,
                currentUserId(),
                null,
                null,
                null
        );
    }
}
