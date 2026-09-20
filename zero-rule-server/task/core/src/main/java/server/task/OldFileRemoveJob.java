package server.task;

import cl.cloverframework.filemanager.CLFileDomains;
import cl.cloverframework.filemanager.CLFileManager;
import cl.cloverframework.filemanager.ICLFileDomain;
import cl.cloverframework.task.CLBaseJob;
import com.google.common.base.Joiner;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.FileUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import server.base.filemanager.FileDomain;
import server.service.core.CommonFileService;
import java.io.File;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 삭제 마킹된 파일을 삭제하는 Job
 */
@Component
@Slf4j
public class OldFileRemoveJob extends CLBaseJob {

    @Autowired
    private CommonFileService commonFileService;

    @Autowired
    private CLFileDomains fileDomains;

    @Autowired
    private CLFileManager fileManager;

    @Override
    protected void runInternal() {
        ZonedDateTime now = ZonedDateTime.now();
        // 삭제 마킹후 4시간이 지난 파일만 삭제
        Instant maxTimestamp = now.minusHours(4).toInstant();
        for (ICLFileDomain fileDomain : fileDomains.findAll()) {
            if (this.isStopped()) break;
            FileDomain domain = FileDomain.findByName(fileDomain.getName());
            if (domain != null && StringUtils.hasText(domain.getTableName())) {
                processFileDomain(domain, maxTimestamp, 1000);
            }
        }
    }

    private void processFileDomain(FileDomain fileDomain, Instant maxTimestamp, int maxDeleteCount) {
        List<String> fileIds = commonFileService.findDeleteMarkedFileIds(fileDomain, maxTimestamp, maxDeleteCount);
        if (fileIds.isEmpty()) return;

        // 디스크에서 삭제 성공한 file id
        List<String> removeSuccessFileIdsOnDisk = new ArrayList<>();

        // 디스크에서 삭제 실패한 file id
        List<String> removeFailedFileIdsOnDisk = new ArrayList<>();

        // 디스크에서 삭제되었거나 존재하지 않는 file id들
        List<String> validFileIds = new ArrayList<>();

        // 디스크에서 삭제
        fileIds.forEach(fileId -> {
            File file = fileManager.findFileOrNull(fileId);
            if (file != null && file.exists()) {
                FileUtils.deleteQuietly(file);
                if (file.exists()) {
                    removeFailedFileIdsOnDisk.add(fileId);
                } else {
                    removeSuccessFileIdsOnDisk.add(fileId);
                }
            }

            if (file == null || !file.exists()) {
                validFileIds.add(fileId);
            }
        });
        if (this.isStopped()) return;
        if (!removeSuccessFileIdsOnDisk.isEmpty()) {
            logInfo(String.format("디스크에서 파일 삭제 성공(%d건).\n%s",
                removeSuccessFileIdsOnDisk.size(),
                Joiner.on(", ").join(removeSuccessFileIdsOnDisk)
            ));
        }
        if (!removeFailedFileIdsOnDisk.isEmpty()) {
            logWarn(String.format("디스크에서 파일 삭제 실패(%d).\n나중에 다시 시도합니다.\n%s",
                removeFailedFileIdsOnDisk.size(),
                Joiner.on(", ").join(removeFailedFileIdsOnDisk)
            ));
        }

        if (this.isStopped()) return;
        if (validFileIds.isEmpty()) return;
        int deleted = commonFileService.deleteFilesOnDb(validFileIds);
        if (deleted > 0) {
            logInfo(String.format("DB에서 파일 삭제: %d 건", validFileIds.size()));
        }
    }
}
