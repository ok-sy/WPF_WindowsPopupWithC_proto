package server.web.api;

import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.domain.entity.EmailTransInfo;
import server.service.core.EmailTransInfoService;
import server.sql.ParamEmailTransInfo;
import server.web.api.payload.EmailTransInfoPayloads;
import server.web.support.ApiBaseController;

import java.util.List;

@Slf4j
@RestController
@Tag(name = DocTags.EMAIL_TRANS_INFO)
@SuppressWarnings("unused")
public class EmailTransInfoController extends ApiBaseController {
    @Autowired
    EmailTransInfoService emailTransInfoService;

    @Operation(
            summary = "이메일송수신조회 다건조회",
            description = "이메일송수신조회 다건조회"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 이메일송수신조회 다건조회",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = EmailTransInfoPayloads.EmailTransInfoListResponse.class)
            )
    )
    @PostMapping(value = "/apis/email-trans-info/list")
    public CLNewApiResponse<EmailTransInfoPayloads.EmailTransInfoListResponse> emailTransInfoList(
            @RequestBody EmailTransInfoPayloads.EmailTransInfoListRequest payload
    ) {
        List<EmailTransInfo> list = emailTransInfoService.emailTransInfoList(
                ParamEmailTransInfo.EmailTransInfoList.builder()
                        .empId(payload.getEmpId())
                        .emailTransceiveTypeCd(payload.getEmailTransceiveTypeCd())
                        .fromDt(payload.getFromDt())
                        .toDt(payload.getToDt())
                        .build()
        );

        return resultMsg("BE00000001",
                EmailTransInfoPayloads.EmailTransInfoListResponse.builder()
                        .list(list)
                        .build()
        );
    }
}
