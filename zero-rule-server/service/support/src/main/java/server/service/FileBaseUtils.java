package server.service;

import cl.cloverframework.filemanager.CLFileType;
import cl.cloverframework.filemanager.ICLFileIdToUrl;
import cl.cloverframework.filemanager.saver.CLBinaryFileSaveResult;
import cl.cloverframework.filemanager.saver.CLImageFileSaveResult;
import cl.cloverframework.filemanager.saver.ICLFileSaveResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import server.domain.entity.FileBase;
import server.domain.vo.UploadedFile;

/**
 * FileBase 관련 유틸리티
 */
@Component
public class FileBaseUtils {

    @Autowired
    private ICLFileIdToUrl fileIdToUrl;


    /**
     * FileBase를 UploadedFile로 변경
     */
    public UploadedFile toUploadedFile(FileBase file) {
        return UploadedFile.builder()
            .downloadUrl(fileIdToUrl.urlWithFileName(file.getFileId(), file.getFileName()))
            .fileId(file.getFileId())
            .fileName(file.getFileName())
            .fileSize(file.getFileSize())
            .build();
    }

    /**
     * 디스크에 저장한 SaveResult를 FileBase에 복사
     */
    public void copyFromDiskSaveResult(ICLFileSaveResult from, FileBase to) {
        if (from instanceof CLImageFileSaveResult) {
            CLImageFileSaveResult f = (CLImageFileSaveResult) from;
            to.setFileType(CLFileType.IMAGE);
            to.setFileSize(f.getFileSize());
            to.setFileName(f.getFileName());
            to.setWidth(f.getWidth());
            to.setHeight(f.getHeight());
        } else if (from instanceof CLBinaryFileSaveResult) {
            CLBinaryFileSaveResult f = (CLBinaryFileSaveResult) from;
            to.setFileType(CLFileType.BINARY);
            to.setFileSize(f.getFileSize());
            to.setFileName(f.getFileName());
            to.setWidth(0);
            to.setHeight(0);
        }
    }
}
