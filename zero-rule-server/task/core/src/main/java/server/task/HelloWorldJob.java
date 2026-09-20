package server.task;

import cl.cloverframework.task.CLBaseJob;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * HelloWorld Job
 * 샘플로 남겨둔다
 */
@Component
@Slf4j
public class HelloWorldJob extends CLBaseJob {

    @Override
    protected void setupJob() {
        log.debug("[jobId=" + this.getJobId() + "] setupJob()");
    }

    @Override
    protected void runInternal() {
        log.debug("[jobId=" + this.getJobId() + "] runInternal()");
    }
}
