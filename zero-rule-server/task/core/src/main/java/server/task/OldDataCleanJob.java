package server.task;

import cl.cloverframework.impl.service.CLSystemNodeService;
import cl.cloverframework.task.CLBaseJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import server.service.core.UserService;

import java.time.ZonedDateTime;

/**
 * 오래된 데이터를 삭제하는 Job
 */
@Component
@Slf4j
public class OldDataCleanJob extends CLBaseJob {

    @Autowired
    private UserService userService;

    @Autowired
    private CLSystemNodeService clSystemNodeService;

    @Override
    protected void runInternal() {
        ZonedDateTime now = ZonedDateTime.now();

        int deletedRows = 0;
        // 오래된 사용자 인증 토큰 제거, 만료시간이 30분 지난 것만 삭제함
        deletedRows = userService.deleteOldUserAuth(now.minusMinutes(30).toInstant());
        if (deletedRows > 0) {
            logInfo(String.format("오래된 사용자 인증토큰 %d건 삭제", deletedRows));
        }

        // 오래된 SystemNode 삭제 - healthDttm이 1시간 넘은 System Node를 삭제한다.
        deletedRows = clSystemNodeService.deleteOldSystemNode(now.minusHours(1).toInstant());
        if (deletedRows > 0) {
            logInfo(String.format("오래된 시스템 노드 %d건 삭제", deletedRows));
        }
    }
}
