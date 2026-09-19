package server.app.config;

import cl.cloverframework.CLError;
import cl.cloverframework.CLErrorResolver;
import cl.cloverframework.ICLErrorResolver;
import cl.cloverframework.ICLFileManagerProps;
import cl.cloverframework.filemanager.CLFileDomains;
import cl.cloverframework.filemanager.CLFileIdParserDelegate;
import cl.cloverframework.filemanager.ICLFileIdParser;
import cl.cloverframework.filemanager.ICLFileIdToUrl;
import cl.cloverframework.filemanager.impl.CLFileIdParserV01;
import cl.cloverframework.impl.log.CLAppLogSaver;
import cl.cloverframework.impl.log.CLAuditLogSaver;
import cl.cloverframework.impl.log.CLJobLogSaver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import server.base.AppError;
import server.base.filemanager.FileDomain;
import server.base.impl.FileIdToUrlImpl;
import server.web.support.message.CLMsgDbRepository;
import server.web.support.message.ICLMsgRepository;

import java.util.Arrays;

@Configuration
public class CloverBasicConfig {
    @Autowired
    private ICLFileManagerProps fileManagerProps;

    /**
     * 파일ID를 URL로 변환해주는 객체
     */
    @Bean
    public ICLFileIdToUrl fileIdToUrl() {
        return new FileIdToUrlImpl();
    }

    /**
     * 파일 도메인 목록 등록
     */
    @Bean
    public CLFileDomains fileDomains() {
        return new CLFileDomains(Arrays.asList(FileDomain.values()));
    }

    /**
     * 파일 ID 파서
     */
    @Bean
    public ICLFileIdParser fileIdParser() {
        CLFileIdParserV01 parser = new CLFileIdParserV01(FileDomain::findByPrefix);
        return new CLFileIdParserDelegate(parser);
    }

    @Bean
    public CLAppLogSaver cloverAppLogSaver() {
        return new CLAppLogSaver(2000L, 100);
    }

    @Bean
    public CLJobLogSaver cloverJobLogSaver() {
        return new CLJobLogSaver(2000L, 100);
    }

    @Bean
    public CLAuditLogSaver cloverAuditLogSaver() {
        return new CLAuditLogSaver(2000L, 100);
    }

    /**
     * 에러 목록 제공자
     */
    @Bean
    public ICLErrorResolver cloverErrorResolver() {
        return new CLErrorResolver(
                // ICLErrorMeta list
                Arrays.asList(AppError.values()),

                // convert ICLErrorMeta to ICLError
                meta -> new CLError(meta.getErrorName(), meta.getErrorMessage())
        );
    }

    /**
     * 에러 목록 제공자
     * 메시지방식선택 : (MSGDB, ENUM)
     */
    @Bean
    public ICLMsgRepository msgRepository() {  return new CLMsgDbRepository("MSGDB");   }
}
