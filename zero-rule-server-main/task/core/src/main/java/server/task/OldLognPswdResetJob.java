package server.task;

import cl.cloverframework.task.CLBaseJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import server.service.core.EtcService;
import server.service.core.UserService;

import java.time.ZonedDateTime;

@Component
@Slf4j
public class OldLognPswdResetJob extends CLBaseJob {

    @Autowired
    private UserService userService;

    @Override
    protected void runInternal() {
        ZonedDateTime now = ZonedDateTime.now();

        int updatedRows = 0;
        // 오래된 사용자 비밀번호 초기화, 만료시간이 1년 지난 것만 삭제함
        updatedRows = userService.updateByPwOverTime(now.minusDays(365).toInstant());
        if (updatedRows > 0) {
            logInfo(String.format("오래된 사용자 비밀번호 초기화 %d", updatedRows));
        }

    }
}
