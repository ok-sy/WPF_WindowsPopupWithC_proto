package server.web.api;

import cl.cloverframework.CLMsg;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.domain.vo.LockVo;
import server.service.core.LockService;
import server.sql.ParamLock;
import server.web.api.payload.LockPayloads;
import server.web.support.ApiBaseController;

import java.time.Instant;
import java.util.List;

import static server.service.UserSecurityUtils.currentUserId;

@Tag(name = DocTags.META)
@RestController
@Slf4j
@SuppressWarnings("unused")
public class LockController extends ApiBaseController {

    @Autowired
    LockService lockService;


    @Operation(
            summary = "락 테이블 목록조회",
            description = "락 테이블 목록을 전체 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 전달한 룰 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = LockPayloads.LockListResponse.class)
            )
    )
    @PostMapping("/apis/lock/list")
    public CLNewApiResponse<LockPayloads.LockListResponse> ruleList(
            @Parameter(description = "락리스트")
            @RequestBody LockPayloads.LockListRequest payload
    ) {
        List<LockVo> lockVoList = lockService.findList(ParamLock.LockSearch.builder()
                        .lockcode(payload.getLockcode())
                        .userid(payload.getUserid())
                        .userNm(payload.getUserNm())
                .build());
        if (lockVoList == null) {
            return resultMsg("BE00000001");
        }

        return resultMsg("BE00000001",
                LockPayloads.LockListResponse.builder()
                        .locks(lockVoList)
                        .build()
        );
    }

    @Operation(
            summary = "락 테이블 삭제",
            description = "파라미터로 받은 키배열에 맞는 값을 전부 지운다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 삭제한 목록을 리턴한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = LockPayloads.LockDeleteResponse.class)
            )
    )
    @PostMapping("/apis/lock/delete")
    public CLNewApiResponse<LockPayloads.LockDeleteResponse> ruleList(
            @Parameter(description = "락리스트")
            @RequestBody LockPayloads.LockDeleteRequest payload
    ) {
        Long result = lockService.deleteArr(payload.getDelList());

        return resultMsg("BE00000001",
                LockPayloads.LockDeleteResponse.builder()
                        .result(result)
                        .build()
        );
    }

    @Operation(
            summary = "락 인서트",
            description = "파라미터로 받은 값을 인서트한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 값을 인서트한 갯수",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = LockPayloads.LockInsertResponse.class)
            )
    )
    @PostMapping("/apis/lock/insert")
    public CLNewApiResponse<LockPayloads.LockInsertResponse> ruleList(
            @Parameter(description = "insert")
            @RequestBody LockPayloads.LockInsertRequest payload
    ) {
        Instant currentTime = Instant.now();

        int result = lockService.insertLock(ParamLock.InsertLock.builder()
                        .lockkey(payload.getLockkey())
                        .locktypecode(payload.getLocktypecode())
                        .locknote(payload.getLocknote())
                        .lockcode(payload.getLockcode())
                        .userid(String.valueOf(currentUserId()))
                        .insertTime(currentTime)
                .build());

        return resultMsg("BE00000001",
                LockPayloads.LockInsertResponse.builder()
                        .result((long) result)
                        .build()
        );
    }

    @Operation(
            summary = "룰관리 락 조회",
            description = "룰관리에서 락 상태를 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 룰관리의 락상태 값",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = LockPayloads.RuleForUserLockResponse.class)
            )
    )
    @PostMapping("/apis/lock/select-rule")
    public CLNewApiResponse<LockPayloads.RuleForUserLockResponse> ruleForUserLock(
            @RequestParam("lockkey") String lockkey
    ) {
        int result = lockService.findRuleUptMode(
                ParamLock.FindRuleUptMode.builder()
                        .lockkey(lockkey)
                        .build()
        );
        int ApplyResult = lockService.findRuleApplyMode(lockkey);

        String locknote = lockService.findLockNote(lockkey);

        if (result >0){
            return CLNewApiResponse.error(
                    new CLMsg("BE11000075", locknote, "NM","2")
                    , "","",LockPayloads.RuleForUserLockResponse.builder()
                            .result(result)
                            .build()
            );
        }else  {
            System.out.println("값이 뭐가 나오냐???"+ApplyResult);
            if(ApplyResult >0){
                return CLNewApiResponse.error(
                        new CLMsg("BE11000078", locknote, "NM","2")
                        , "","",LockPayloads.RuleForUserLockResponse.builder()
                                .result(ApplyResult)
                                .build()
                );
            }else if(ApplyResult == 0){
                return resultMsg("BE00000077",
                        LockPayloads.RuleForUserLockResponse.builder()
                                .result(ApplyResult)
                                .build()
                );
            }else {
                return resultMsg("BE00000076",
                        LockPayloads.RuleForUserLockResponse.builder()
                                .result(result)
                                .build()
                );
            }

        }
    }

    @Operation(
            summary = "배포자 락 테이블 삭제",
            description = "배포자 락을 지운다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 삭제한 목록을 리턴한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = LockPayloads.DepLockDeleteResponse.class)
            )
    )
    @PostMapping("/apis/lock/delete-dep")
    public CLNewApiResponse<LockPayloads.DepLockDeleteResponse> ruleList(
            @Parameter(description = "락리스트")
            @RequestBody LockPayloads.DepLockDeleteRequest payload
    ) {
        int result = lockService.deleteDepLock(payload.getDelKey());

        return resultMsg("BE00000001",
                LockPayloads.DepLockDeleteResponse.builder()
                        .result(result)
                        .build()
        );
    }

    @Operation(
            summary = "배포자 락 테이블 삭제",
            description = "배포자 락을 지운다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 삭제한 목록을 리턴한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = LockPayloads.DepLockDeleteResponse.class)
            )
    )
    @PostMapping("/apis/lock/check")
    public CLNewApiResponse<LockPayloads.DepLockDeleteResponse> lockCheck(
            @RequestParam("lockKey") String lockKey
    ) {
        int result = lockService.findRuleApplyMode(lockKey);

        return resultMsg("BE00000001",
                LockPayloads.DepLockDeleteResponse.builder()
                        .result(result)
                        .build()
        );
    }

    @Operation(
            summary = "룰에서 배포자 락 테이블 체크",
            description = "룰에서 배포자 락 테이블 체크한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 삭제한 목록을 리턴한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = LockPayloads.DepLockDeleteResponse.class)
            )
    )
    @PostMapping("/apis/lock/rule-dep-check")
    public CLNewApiResponse<LockPayloads.RuleDeplockCheckResponse> ruleDeplockCheck() {
        String result = lockService.findRuleApplyModeCnt();
        System.out.println("resultresult"+result);

        if(result != null){
            return CLNewApiResponse.error(
                    new CLMsg("BE11000078", result, "NM","2")
                    , "","ruleDeplockCheck",LockPayloads.RuleDeplockCheckResponse.builder()
                            .result(0)
                            .build()
            );

        }else{
            return resultMsg("BE00000001",
                    LockPayloads.RuleDeplockCheckResponse.builder()
                            .result(1)
                            .build()
            );
        }
    }

}
