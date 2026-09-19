package server.web.api;

import cl.cloverframework.CLException;
import cl.cloverframework.CLMsg;
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
import server.domain.vo.RuleInterfaceInfoVo;
import server.domain.vo.RuleInterfaceMapVo;
import server.service.core.RuleInterfaceService;
import server.sql.ParamsInterface;
import server.web.api.payload.RuleInterfacePayloads;
import server.web.support.ApiBaseController;

import java.util.List;

import static server.service.UserSecurityUtils.currentUserId;


@Tag(name = DocTags.RUEL_INTERFACE)
@RestController
@Slf4j
@SuppressWarnings("unused")
public class RuleInterfaceController extends ApiBaseController {

    @Autowired
    RuleInterfaceService ruleInterfaceService;


    @Operation(
            summary = "인터페이스 인포 테이블 목록조회",
            description = "인터페이스 인포 테이블 목록을 전체 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 전달한 인터페이스 인포 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RuleInterfacePayloads.InterfaceInfoResponse.class)
            )
    )
    @PostMapping("/apis/interface/info-list")
    public CLNewApiResponse<RuleInterfacePayloads.InterfaceInfoResponse> ruleTreeList(
            @RequestBody RuleInterfacePayloads.InterfaceInfoRequest payload
            ) {

        List<RuleInterfaceInfoVo> interfaceInfoVos = ruleInterfaceService.findRuleInterfaceInfo(ParamsInterface.InterfaceInfos
                .builder()
                .ifid(payload.getIfid())
                .ifNm(payload.getIfNm())
                .build());

        return resultMsg("BE00000001",
                RuleInterfacePayloads.InterfaceInfoResponse.builder()
                        .interfaceInfos(interfaceInfoVos)
                        .build()
        );
    }

    @Operation(
            summary = "인터페이스 인서트 테이블 ",
            description = "인터페이스 인서트 한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로  인서트 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RuleInterfacePayloads.InterfaceInsertResponse.class)
            )
    )
    @PostMapping("/apis/interface/info-insert")
    public CLNewApiResponse<RuleInterfacePayloads.InterfaceInsertResponse> ruleInterfaceInsert(
            @RequestBody RuleInterfacePayloads.InterfaceInsertRequest payload
    ) {

        String newIfid = "IF" + ruleInterfaceService.newIfidSeq();
       int result = ruleInterfaceService.insertRuleInterface(ParamsInterface.InterfaceInsert
                .builder()
                       .ifid(newIfid)
                       .ifNm(payload.getIfNm())
                       .ifDesc(payload.getIfDesc())
                       .ifProcessTypeCd(payload.getIfProcessTypeCd())
                       .ifConnectionTypeCd(payload.getIfConnectionTypeCd())
                       .ruleUseYn(payload.getRuleUseYn())
                       .docLength(payload.getDocLength())
                       .characterset(payload.getCharacterset())
                       .eaiid(payload.getEaiid())
                       .firstregUserid(Math.toIntExact(currentUserId()))
//               .firstregDatetime()
                .build());

        return resultMsg("BE00000001",
                RuleInterfacePayloads.InterfaceInsertResponse.builder()
                        .result(result)
                        .build()
        );
    }

    @Operation(
            summary = "인터페이스 삭제 테이블 ",
            description = "인터페이스 삭제 한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로  삭제 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RuleInterfacePayloads.InterfaceInsertResponse.class)
            )
    )
    @PostMapping("/apis/interface/del-all")
    public CLNewApiResponse<RuleInterfacePayloads.InterfaceInsertResponse> ruleInterfaceDelAll(
            @RequestBody RuleInterfacePayloads.InterfaceDelRequest payload
    ) {
        final int[] result = {0};
        payload.getDelInterfaceList().forEach((el)->{
            result[0] = result[0] + ruleInterfaceService.delInterfaceInfo(el);
        });


        return resultMsg("BE00000001",
                RuleInterfacePayloads.InterfaceInsertResponse.builder()
                        .result(result[0])
                        .build()
        );
    }


    @Operation(
            summary = "인터페이스 인서트 테이블 ",
            description = "인터페이스 인서트 한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로  인서트 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RuleInterfacePayloads.InterfaceInsertResponse.class)
            )
    )
    @PostMapping("/apis/interface/info-update")
    public CLNewApiResponse<RuleInterfacePayloads.InterfaceInsertResponse> ruleTreeInsert(
            @RequestBody RuleInterfacePayloads.InterfaceUpdtaeRequest payload
    ) {
        int result = ruleInterfaceService.updateInterfaceInfo(ParamsInterface.InterfaceUpdate
                .builder()
                .ifid(payload.getIfid())
                .ifNm(payload.getIfNm())
                .ifDesc(payload.getIfDesc())
                .ifProcessTypeCd(payload.getIfProcessTypeCd())
                .ifConnectionTypeCd(payload.getIfConnectionTypeCd())
                .ruleUseYn(payload.getRuleUseYn())
                .docLength(payload.getDocLength())
                .characterset(payload.getCharacterset())
                .eaiid(payload.getEaiid())
                .updateUserid(Math.toIntExact(currentUserId()))
//               .updateDatetime()
                .build());

        return resultMsg("BE00000001",
                RuleInterfacePayloads.InterfaceInsertResponse.builder()
                        .result(result)
                        .build()
        );
    }


    @Operation(
            summary = "인터페이스 맵  테이블 목록조회",
            description = "인터페이스 맵 테이블 목록을 전체 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 전달한 인터페이스 맵 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RuleInterfacePayloads.InterfaceMapResponse.class)
            )
    )
    @PostMapping("/apis/interface/map-list")
    public CLNewApiResponse<RuleInterfacePayloads.InterfaceMapResponse> interfaceMapList(
            @RequestBody RuleInterfacePayloads.InterfaceInfoRequest payload
    ) {

        List<RuleInterfaceMapVo> interfaceMapVos = ruleInterfaceService.findRuleInterfaceMap(ParamsInterface.InterfaceInfos
                .builder()
                .ifid(payload.getIfid())
                .ifNm(payload.getIfNm())
                .build());

        return resultMsg("BE00000001",
                RuleInterfacePayloads.InterfaceMapResponse.builder()
                        .interfaceMaps(interfaceMapVos)
                        .build()
        );
    }


    @Operation(
            summary = "인터페이스 맵  전체 저장 버튼",
            description = "인터페이스 맵전체 저장 버튼" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 전달한 인터페이스 전체 저장 버튼",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RuleInterfacePayloads.InterfaceMapSaveResponse.class)
            )
    )
    @PostMapping("/apis/interface/map-all-save")
    public CLNewApiResponse<RuleInterfacePayloads.InterfaceMapSaveResponse> interfaceMapAllSave(
            @RequestBody RuleInterfacePayloads.InterfaceMapSaveRequest payload
    ) {
        int result = 0;
        try {
            result = ruleInterfaceService.saveAllInterface(payload.getInterfaceMaps(), Math.toIntExact(currentUserId()));
        } catch(CLException e) {
            if(e.getErrorCode().equals("BE00000079") ){
                return CLNewApiResponse.error(
                        new CLMsg("BE00000079", e.getMsg(), "NM","2")
                        , "","",   RuleInterfacePayloads.InterfaceMapSaveResponse.builder()
                                .result(0)
                                .build()
                );

            }
            return resultMsg(e.getErrorCode());
        } catch (Exception e) {

            return resultMsg("FW00000009");
        }

        return resultMsg("BE00000001",
                RuleInterfacePayloads.InterfaceMapSaveResponse.builder()
                        .result(result)
                        .build()
        );
    }


}
