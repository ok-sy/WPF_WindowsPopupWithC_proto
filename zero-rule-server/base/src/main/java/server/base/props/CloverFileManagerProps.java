package server.base.props;

import cl.cloverframework.ICLFileManagerProps;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

import java.io.File;

/**
 * 파일 매니저 설정
 */
@Component
@ConfigurationProperties(prefix = "clover.file-manager")
@Data
@Slf4j
public class CloverFileManagerProps implements InitializingBean, ICLFileManagerProps {
    /**
     * 업로드 폴더
     */
    private String uploadRootFolder;

    @Override
    @NonNull
    public File getUploadRootDir() {
        File f = new File(this.uploadRootFolder);
        if (!f.exists()) {
            f.mkdirs();
        }
        return f;
    }

    @Override
    @NonNull
    public File getUploadRootDir(@NonNull String folder) {
        File f = new File(getUploadRootDir(), folder);
        if (!f.exists()) {
            f.mkdirs();
        }
        return f;
    }

    @Override
    public void afterPropertiesSet() {
        if (log.isInfoEnabled()) {
            log.info("upload root dir = {}", this.getUploadRootDir().getAbsolutePath());
        }
    }
}
