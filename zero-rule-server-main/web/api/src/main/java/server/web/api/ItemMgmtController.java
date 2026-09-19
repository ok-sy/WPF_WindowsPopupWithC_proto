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
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.domain.entity.ItemMgmt;
import server.domain.vo.ItemRefVo;
import server.domain.vo.UsedRuleInfoVo;
import server.service.UserSecurityUtils;
import server.service.core.ItemMgmtService;
import server.sql.ParamsItemMgmt;
import server.web.api.payload.ITemMgmtPayloads;
import server.web.support.ApiBaseController;

import java.util.List;
import java.util.Objects;

@Slf4j
@Tag(name = DocTags.MSG_MNG_DESC)
@RestController
@SuppressWarnings("unused")
public class ItemMgmtController extends ApiBaseController {

    @Autowired
    private ItemMgmtService itemMgmtService;


    @Operation(
            // 메서드의 제목
            summary = "",
            // 내용을 설명합니다.
            description = "이정서 항목관리 등록 테스트"
    )
    // swagger 문사의 응답에 대한 정보를 보여줍니다.
    @ApiResponse(
            // 응답 상태코드
            responseCode = "200",
            // 응답 내용을 설명합니다.
            description = "성공 응답, 항목관리 등록",
            // 응답의 컨텐츠 타입과 스키마를 정의합니다.
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ITemMgmtPayloads.ItemMgmtInsertResponse.class)
            )
    )
    @PostMapping(value = "/apis/item-mgmt/item-insert")
    public CLNewApiResponse<ITemMgmtPayloads.ItemMgmtInsertResponse> itemMgmtInsert(
            @RequestBody ITemMgmtPayloads.ItemMgmtInsertRequest payload
    ) {
        int insertCnt = 0;
        try {
            insertCnt = itemMgmtService.itemMgmtInsert(
                    ParamsItemMgmt.ItemMgmtInsert
                            .builder()
                            .itemNm(payload.getItemNm())
                            .itemAliasNm(payload.getItemAliasNm())
                            .itemExplanDesc(payload.getItemExplanDesc())
                            .dataTypeCd(payload.getDataTypeCd())
                            .itemUseYn(payload.getItemUseYn())
                            .firstRegUserId(String.valueOf(Objects.requireNonNull(UserSecurityUtils.currentUserDetails()).getUserId()))
                            .ifid(payload.getIfid())
                            .build()
            );
        } catch(CLException e) {
            return resultMsg(e.getErrorCode());
        }
        return resultMsg("BE00000003",
                // EduExpTbListResponse 빌더패턴을 이용해 응답데이터 값 저장
                ITemMgmtPayloads.ItemMgmtInsertResponse.builder()
                        .insertCnt(insertCnt)
                        .build()
        );
    }

    @Operation(
            // 메서드의 제목
            summary = "",
            // 내용을 설명합니다.
            description = "이정서 항목관리 등록 테스트"
    )
    // swagger 문사의 응답에 대한 정보를 보여줍니다.
    @ApiResponse(
            // 응답 상태코드
            responseCode = "200",
            // 응답 내용을 설명합니다.
            description = "성공 응답, 항목관리 등록",
            // 응답의 컨텐츠 타입과 스키마를 정의합니다.
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ITemMgmtPayloads.ItemMgmtSelectResponse.class)
            )
    )
    @PostMapping(value = "/apis/item-mgmt/item-select")
    public CLNewApiResponse<ITemMgmtPayloads.ItemMgmtSelectResponse> itemMgmtSelect(
            @RequestBody ITemMgmtPayloads.ItemMgmtSelectRequest payload
    ) {
        List<ItemMgmt> itemMgmt = itemMgmtService.itemMgmtSelect(
                ParamsItemMgmt.ItemMgmtSelect
                        .builder()
                        .itemNm(payload.getItemNm())
                        .itemAliasNm(payload.getItemAliasNm())
                        .itemUseYn(payload.getItemUseYn())
                        .ifid(payload.getIfid())

                        .build()
        );

        return resultMsg("BE00000001",
                ITemMgmtPayloads.ItemMgmtSelectResponse.builder()
                        .itemMgmt(itemMgmt)
                        .build()
        );
    }


    @Operation(
            // 메서드의 제목
            summary = "",
            // 내용을 설명합니다.
            description = "사용중인 룰 상세 조회"
    )
    // swagger 문사의 응답에 대한 정보를 보여줍니다.
    @ApiResponse(
            // 응답 상태코드
            responseCode = "200",
            // 응답 내용을 설명합니다.
            description = "성공 응답, 항목관리 등록",
            // 응답의 컨텐츠 타입과 스키마를 정의합니다.
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ITemMgmtPayloads.UsedRuleInfoResponse.class)
            )
    )
    @PostMapping(value = "/apis/item-mgmt/item-select/used-rule-info")
    public CLNewApiResponse<ITemMgmtPayloads.UsedRuleInfoResponse> itemMgmtUsedRuleInfo(
            @RequestBody ITemMgmtPayloads.UsedRuleInfoRequest payload
    ) {
        List<UsedRuleInfoVo> result = itemMgmtService.itemUsedRuleInfo(
                payload.getItemid()
        );

        return resultMsg("BE00000001",
                ITemMgmtPayloads.UsedRuleInfoResponse.builder()
                        .usedRuleInfo(result)
                        .build()
        );
    }


    @Operation(
            summary = "",
            description = "이정서 항목관리 등록 테스트"
    )
    // swagger 문사의 응답에 대한 정보를 보여줍니다.
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 항목관리 등록",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ITemMgmtPayloads.ItemMgmtInsertResponse.class)
            )
    )
    @PostMapping(value = "/apis/item-mgmt/item-modify")
    public CLNewApiResponse<ITemMgmtPayloads.ItemMgmtInsertResponse> itemMgmtModify(
            @RequestBody ITemMgmtPayloads.ItemMgmtModifyRequest payload
    ) {
        // 수정이지만 등록과 가져오는 값이 같기때문에 같은 리스폰스
        int insertCnt = 0;
        // 단건조회
        ItemMgmt item = itemMgmtService.itemInfo(payload.getItemid());
        try {
            insertCnt = itemMgmtService.itemMgmtModify(
                    ParamsItemMgmt.ItemMgmtInsert
                            .builder()
                            .itemId(payload.getItemid())
                            .itemNm(payload.getItemNm())
                            .itemAliasNm(payload.getItemAliasNm())
                            .itemExplanDesc(payload.getItemExplanDesc())
                            .dataTypeCd(payload.getDataTypeCd())
                            .updateUserID(String.valueOf(Objects.requireNonNull(UserSecurityUtils.currentUserDetails()).getUserId()))
                            .itemUseYn(payload.getItemUseYn())
                            .firstRegUserId(item.getFirstRegUserId())
                            .firstregDatetime(item.getFirstRegDateTime())
                            .ifid(payload.getIfid())
                            .build()
            );
        } catch (CLException e) {
            return resultMsg(e.getErrorCode());
        }

        return resultMsg("BE00000001",
                // EduExpTbListResponse 빌더패턴을 이용해 응답데이터 값 저장
                ITemMgmtPayloads.ItemMgmtInsertResponse.builder()
                        .insertCnt(insertCnt)
                        .build()
        );
    }

    @Operation(
            summary = "",
            description = "항목참조리스트"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 항목참조리스트",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ITemMgmtPayloads.ItemRefListResponse.class)
            )
    )
    @PostMapping(value = "/apis/item-ref/list")
    public CLNewApiResponse<ITemMgmtPayloads.ItemRefListResponse> itemRefList(
            @RequestBody ITemMgmtPayloads.ItemRefListRequest payload
    ) {

        List<ItemRefVo> itemRefs = itemMgmtService.itemRefList(payload.getItemid());

        return resultMsg("BE00000001",
                ITemMgmtPayloads.ItemRefListResponse.builder()
                        .itemRefs(itemRefs)
                        .build()
        );
    }


    @Operation(
            summary = "",
            description = "항목참조 신규"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 항목참조 신규",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ITemMgmtPayloads.ItemRefCrudResponse.class)
            )
    )
    @PostMapping(value = "/apis/item-ref/insert")
    public CLNewApiResponse<ITemMgmtPayloads.ItemRefCrudResponse> itemRefInsert(
            @RequestBody ITemMgmtPayloads.ItemRefInsertRequest payload
    ) {
        int insertCnt = 0;

        int dupCnt = itemMgmtService.itemInsertDupCheck(payload.getItemid(), payload.getItemrefCd());

        if(dupCnt > 0){
            return resultMsg("BE00000058");
        }

        insertCnt = itemMgmtService.itemRefInsert(ParamsItemMgmt.ItemRefInsert.builder()
                .itemid(payload.getItemid())
                .updateUserid(String.valueOf( Objects.requireNonNull(UserSecurityUtils.currentUserDetails()).getUserId()))
                .itemrefCd(payload.getItemrefCd())
                .itemrefNm(payload.getItemrefNm())
                .itemrefaliasNm(payload.getItemrefaliasNm())
                .itemrefexprDesc(payload.getItemrefexprDesc())
                .build());
        return resultMsg("BE00000002",
                ITemMgmtPayloads.ItemRefCrudResponse.builder()
                        .insertCnt(insertCnt)
                        .build()
        );
    }

    @Operation(
            summary = "",
            description = "항목참조 수정"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 항목참조 수정",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ITemMgmtPayloads.ItemRefCrudResponse.class)
            )
    )
    @PostMapping(value = "/apis/item-ref/modify")
    public CLNewApiResponse<ITemMgmtPayloads.ItemRefCrudResponse> itemRefModify(
            @RequestBody ITemMgmtPayloads.ItemRefModifyRequest payload
    ) {
        int insertCnt = 0;
        insertCnt = itemMgmtService.itemRefModify(ParamsItemMgmt.ItemRefModify.builder()
                .itemId(payload.getItemid())
                .updateUserid(String.valueOf( Objects.requireNonNull(UserSecurityUtils.currentUserDetails()).getUserId()))
                .itemrefCd(payload.getItemrefCd())
                .itemrefNm(payload.getItemrefNm())
                .itemrefaliasNm(payload.getItemrefaliasNm())
                .itemrefexprDesc(payload.getItemrefexprDesc())
                .asisInputItemrefCd(payload.getAsisInputItemrefCd())
                .build());
        return resultMsg("BE00000003",
                ITemMgmtPayloads.ItemRefCrudResponse.builder()
                        .insertCnt(insertCnt)
                        .build()
        );
    }

    @Operation(
            summary = "",
            description = "항목참조 삭제"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 항목참조 삭제",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = ITemMgmtPayloads.ItemRefCrudResponse.class)
            )
    )
    @PostMapping(value = "/apis/item-ref/del")
    public CLNewApiResponse<ITemMgmtPayloads.ItemRefCrudResponse> itemRefDel(
            @RequestBody ITemMgmtPayloads.ItemRefDelRequest payload
    ) {
        int insertCnt = 0;
        insertCnt = itemMgmtService.itemRefDel(payload.getItemid(), payload.getItemrefCd());
        return resultMsg("BE00000038",
                ITemMgmtPayloads.ItemRefCrudResponse.builder()
                        .insertCnt(insertCnt)
                        .build()
        );
    }






}