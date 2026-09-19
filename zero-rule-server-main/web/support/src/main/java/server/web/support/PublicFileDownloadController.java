package server.web.support;

import cl.cloverframework.filemanager.CLFid;
import cl.cloverframework.filemanager.CLFileDomains;
import cl.cloverframework.filemanager.ICLFileDomain;
import cl.cloverframework.web.support.CLBinaryDownloadHelper;
import cl.cloverframework.web.support.CLImageDownloadHelper;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.ModelAndView;
import server.domain.vo.CommonFileVo;
import server.service.core.CommonFileService;

@Tag(name = "PUBLIC 파일 다운로드 컨트롤러 - PublicFileDownloadController")
@RestController
@Slf4j
public class PublicFileDownloadController {

    @Autowired
    CommonFileService commonFileService;

    @Autowired
    CLImageDownloadHelper imageDownloadHelper;

    @Autowired
    CLBinaryDownloadHelper binaryDownloadHelper;

    @Autowired
    CLFileDomains fileDomains;

    @RequestMapping(value = "/p/file/download/{fileName}", method = {RequestMethod.GET, RequestMethod.POST})
    public ModelAndView download(
        @PathVariable("fileName") String fileName,
        @RequestParam(value = "download", defaultValue = "false") Boolean download,
        HttpServletResponse response,
        ModelAndView mv
    ) {
        if (!org.springframework.util.StringUtils.hasText(fileName)) {
            response.setStatus(404);
            return null;
        }
        CLFid fid = CLFid.parseFileName(fileName);
        ICLFileDomain fileDomain = fileDomains.getFileDomainFromFileId(fid.getFileId());
        if (fileDomain == null) {
            log.debug("invalid fileId:" + fileName);
            response.setStatus(404);
            return null;
        }
        final String fileId = fid.getFileId();

        String fileNameHint = null;
        CommonFileVo file = commonFileService.findByFileId(fileDomain, fileId);
        if (file != null) {
            fileNameHint = file.getFileName();
        }
        // abcd_v_v01
        if (fileId.charAt(5) == 'i') {
            return imageDownloadHelper.download(
                fileId,
                fileNameHint,
                download,
                response,
                mv
            );
        }

        return binaryDownloadHelper.download(
            fileId,
            fileNameHint,
            download,
            response,
            mv
        );
    }


    @RequestMapping(value = "/p/file/download2/{fileId}/{fileName}", method = {RequestMethod.GET, RequestMethod.POST})
    public ModelAndView download2(
        @PathVariable("fileId") String fileId,
        @PathVariable("fileName") String fileName,
        @RequestParam(value = "download", defaultValue = "false") Boolean download,
        HttpServletResponse response,
        ModelAndView mv
    ) {
        if (!StringUtils.hasText(fileName)) {
            response.setStatus(404);
            return null;
        }
        // 올바른 FileDomain인지 체크
        CLFid fid = CLFid.parseFileName(fileId);
        ICLFileDomain fileDomain = fileDomains.getFileDomainFromFileId(fid.getFileId());
        if (fileDomain == null) {
            log.debug("invalid fileId:" + fileId);
            response.setStatus(404);
            return null;
        }

        // abcd_v_v01
        if (fileId.charAt(5) == 'i') {
            return imageDownloadHelper.download(
                fileId,
                fileName,
                download,
                response,
                mv
            );
        }

        return binaryDownloadHelper.download(
            fileId,
            fileName,
            download,
            response,
            mv
        );
    }
}
