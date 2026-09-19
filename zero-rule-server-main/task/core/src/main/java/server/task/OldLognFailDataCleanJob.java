package server.task;

import cl.cloverframework.task.CLBaseJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import server.service.core.EtcService;

import java.time.ZonedDateTime;

@Component
@Slf4j
public class OldLognFailDataCleanJob extends CLBaseJob {

    @Autowired
    private EtcService etcService;

    @Override
    protected void runInternal() {
        ZonedDateTime now = ZonedDateTime.now();

        int deletedRows = 0;
        // 오래된 사용자 로그인 실패 data 삭제 1시간 지난 것만 삭제함
        deletedRows = etcService.deleteOld(now.minusHours(1).toInstant());
        if (deletedRows > 0) {
            logInfo(String.format("오래된 사용자 로그인 실패 DATA %d건 삭제", deletedRows));
        }
    }
}
