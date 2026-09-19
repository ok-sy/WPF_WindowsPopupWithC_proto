package server.web.api;

import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.domain.vo.CodeVo;
import server.service.core.CmmnService;
import server.web.api.payload.CmmnPayloads;
import server.web.support.ApiBaseController;

import java.util.List;

import static server.service.UserSecurityUtils.currentUserId;

@Tag(name = DocTags.CMMN)
@RestController
@Slf4j
@SuppressWarnings("unused")
public class CmmnController extends ApiBaseController {

    @Autowired
    CmmnService cmmnService;

    @Operation(
        summary = "코드 정보 조회",
        description = "입력한 코드 해당하는 코드정보 조회<br/>" +
            "<b>[에러코드]</b><br/>" +
            "E1_NO_SUCH_RULE_DETAIL_INFO: 룰 상세정보를 찾을 수 없습니다.<br/>"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 파라미터로 전달한 룰 상세를 조회한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = CmmnPayloads.CmmnCdListResponse.class)
        )
    )
    @PostMapping("/api/cmmn/code/info")
    public CLNewApiResponse<CmmnPayloads.CmmnCdListResponse> Search(
        @Parameter(description = "코드유형")
        @RequestParam("codeType") String codeType
    ) {

        List<CodeVo> codeList = cmmnService.findCode(codeType);

        if (codeList == null) {
            return resultMsg("BE00000013");
        }

        return resultMsg("BE00000001",
            CmmnPayloads.CmmnCdListResponse.builder()
                .codeList(codeList)
                .build()
        );
    }

    @Operation(
            summary = "사용자페이지롤권한유형 여부 목록",
            description = "사용자페이지롤권한유형 여부 목록"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 사용자페이지롤권한유형 여부 목록을 조회한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = CmmnPayloads.UserPageRolePrivListResponse.class)
            )
    )
    @PostMapping("/api/cmmn/user-page-role/priv-list")
    public CLNewApiResponse<CmmnPayloads.UserPageRolePrivListResponse> userPageRolePrivList(
    ) {

        return resultMsg("BE00000001",
                CmmnPayloads.UserPageRolePrivListResponse.builder()
                        .privList(cmmnService.userPageRolePrivList(currentUserId()))
                        .build()
        );
    }

}
