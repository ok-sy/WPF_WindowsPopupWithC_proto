package server.app.config;

import cl.cloverframework.task.ICLJobMetadataRegistry;
import cl.cloverframework.task.impl.CLDefaultJobMetadataRegistry;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import server.base.BuildVars;
import server.task.JobMetadatas;

@Configuration
@EnableScheduling
@ComponentScan(basePackages = {BuildVars.Package.task})
public class CloverTaskConfig {
    /**
     * Job config registry - 기본 구현체
     * Job의 설정들을 보관하는 객체
     * base 모듈의 JobConfigs에 전체 JobConfig의 목록이 있다.
     */
    @Bean
    public ICLJobMetadataRegistry clJobMetadataRegistry() {
        return new CLDefaultJobMetadataRegistry(JobMetadatas.generate());
    }
}
