package server.web.api;

import cl.cloverframework.CLException;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.service.core.CLGridService;
import server.sql.ParamCLGrid;
import server.web.api.payload.CLGridPayloads;
import server.web.support.ApiBaseController;

import static server.service.UserSecurityUtils.currentUserId;

@Slf4j
@Tag(name = DocTags.GRID)
@RestController
@SuppressWarnings("unused")
public class CLGridController extends ApiBaseController {
    @Autowired
    CLGridService clGridService;

    @Operation(
            summary = "그리드 등록",
            description = "그리드 등록한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 1을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Integer.class)
            )
    )
    @PostMapping("/apis/grid/insert")
    public CLNewApiResponse<Integer> gridInsert(
            @RequestBody CLGridPayloads.GridInsertRequest payload
    ) {
            try{
                return resultMsg("BE00000001",
                        clGridService.gridInsert(payload.getFilter(),payload.getColumns(), currentUserId()));
            }catch (CLException e){
                return resultMsg(e.getErrorCode());
            }
    }

    @Operation(
            summary = "그리드 목록 조회",
            description = "그리드 목록 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 그리드 목록 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = CLGridPayloads.GridListResponse.class)
            )
    )
    @PostMapping("/apis/grid/list")
    public CLNewApiResponse<CLGridPayloads.GridListResponse> gridList(
            @RequestParam("pageCode") String pageCode
    ) {
        return resultMsg("BE00000001",
                CLGridPayloads.GridListResponse.builder()
                        .list(clGridService.gridList(currentUserId(),pageCode))
                        .build());
    }

    @Operation(
            summary = "default_yn 변경",
            description = "default_yn 변경한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, N이면 0, Y이면 1 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Integer.class)
            )
    )
    @PostMapping("/apis/grid/update-default-yn")
    public CLNewApiResponse<Integer> updateDefaultYn(
            @RequestBody CLGridPayloads.UpdateDefaultYnRequest payload
    ) {
        return resultMsg("BE00000001",
                clGridService.updateDefaultYn(
                ParamCLGrid.UpdateDefaultYn.builder()
                        .filterNm(payload.getFilterNm())
                        .pageCode(payload.getPageCode())
                        .userId(currentUserId())
                        .build(),
                payload.getDefaultYn())
        );
    }

    @Operation(
            summary = "그리드 삭제",
            description = "그리드 삭제한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 1 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Integer.class)
            )
    )
    @PostMapping("/apis/grid/delete")
    public CLNewApiResponse<Integer> deleteGridFilter(
            @RequestBody CLGridPayloads.DeleteGridRequest payload
    ) {
        return resultMsg("BE00000001",
                clGridService.deleteGrid(
                ParamCLGrid.DelGridFilter.builder()
                        .filterNm(payload.getFilterNm())
                        .pageCode(payload.getPageCode())
                        .userId(currentUserId())
                        .build())
        );
    }
}
