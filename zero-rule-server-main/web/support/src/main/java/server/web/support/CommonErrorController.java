package server.web.support;

import cl.cloverframework.api.CLNewApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import server.base.BuildVars;

//@Tag(name = "PUBLIC 파일 다운로드 컨트롤러 - PublicFileDownloadController")
@RestController
@Slf4j
public class CommonErrorController extends ApiBaseController {

//    @PostMapping(BuildVars.ApiUrls.permissionDenied)
//    public CLApiResponse<Object> handlePermDenied(HttpServletRequest request) {
//        return errorResult(AppError.E1_PERM_DENIED.getErrorName(), null);
//    }
    @PostMapping(BuildVars.ApiUrls.permissionDenied)
    public CLNewApiResponse<Object> handlePermDenied(HttpServletRequest request) {
        return resultMsg("FW00000011");
    }
}
