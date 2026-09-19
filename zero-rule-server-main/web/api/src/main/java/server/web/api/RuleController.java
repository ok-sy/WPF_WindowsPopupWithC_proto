package server.web.api;

import cl.cloverframework.CLException;
import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.domain.entity.ItemMgmt;
import server.domain.vo.*;
import server.service.core.RuleEngineService;
import server.service.core.RuleService;
import server.service.core.ruleCore.RuleExecution;
import server.service.core.ruleCore.Util;
import server.sql.ParamRule;
import server.web.api.payload.RulePayloads;
import server.web.support.ApiBaseController;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static server.service.UserSecurityUtils.currentUserId;


@Tag(name = DocTags.META)
@RestController
@Slf4j
@SuppressWarnings("unused")
public class RuleController extends ApiBaseController {

    @Autowired
    RuleService ruleService;
    @Autowired
    RuleEngineService ruleEngineService;

    @Operation(
        summary = "룰 테이블 목록조회",
        description = "룰 테이블 목록을 전체 조회한다" +
            "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 파라미터로 전달한 룰 목록을 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = RulePayloads.RuleTreeListResponse.class)
        )
    )
    @PostMapping("/apis/rule/tree-list")
    public CLNewApiResponse<RulePayloads.RuleTreeListResponse> ruleTreeList(
        @RequestParam("keyword") @Nullable String keyword
    ) {
        List<TreeIfRuleVo> rules = ruleService.findRuleTree(keyword);

        if (rules == null) {
            return resultMsg("BE00000001");
        }

        return resultMsg("BE00000001",
                RulePayloads.RuleTreeListResponse.builder()
                        .treeIfRules(rules)
                        .build()
        );
    }

    @Operation(
            summary = "룰 이름만 목록조회(룰 테스트)",
            description = "룰 테이블에서 이름만 전체 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 전달한 룰 이름의 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleNameListResponse.class)
            )
    )
    @PostMapping("/apis/rule-name/list")
    public CLNewApiResponse<RulePayloads.RuleNameListResponse> ruleNameList() {
        List<RuleNameVo> ruleNames = ruleService.findRuleNameAndIdList();
        if (ruleNames == null) {
            return resultMsg("BE00000001");
        }
        return resultMsg("BE00000001",
                RulePayloads.RuleNameListResponse.builder()
                        .ruleNames(ruleNames)
                        .build()
        );
    }

    @Operation(
            summary = "룰 단건조회",
            description = "룰 테이블에서 룰 아이디를 받아 단건조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 전달한 룰 이름의 목록을 응답한다 (룰 테스트)",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleInfoResponse.class)
            )
    )
    @PostMapping("/apis/rule-test/info")
    public CLNewApiResponse<RulePayloads.RuleInfoResponse> ruleTestInfo(
            @Parameter(description = "룰 단건 조회 아이디")
            @RequestBody RulePayloads.RuleInfoRequest payload
    ) {
        RuleVo rule = ruleService.findRuleInfoByRuleid(payload.getRuleid(), payload.getRuleAlias());
        List<RuleReturnItemAndItemInfoVo> ruleReturnItems = ruleService.findRuleReturnItemByRuleid(rule.getRuleid());

        List<String> samplingRuleIds = new ArrayList<>();
        List<String> realRuleIds = new ArrayList<>();
        realRuleIds.add(rule.getRuleid());
        samplingRuleIds.add(rule.getRuleid());
        outerLoop:  while (true){
            List<List<String>> tmpArr = samplingRuleIds.stream().map((el) -> {
                // TODO:: 룰 조건식 목록 찾기
                List<RuleInfoConditionVo> infoConditionVo = ruleService.ruleConditionInfo(el);
                // TODO :: 조건식 후위연산 모아 String으로 합치기
                StringBuilder concatPostFixStr = new StringBuilder();
                infoConditionVo
                        .forEach((vo) -> {
                            concatPostFixStr.append(vo.getConditionPostfixDesc());
                        });
                return Util.getRuleInTheRule(concatPostFixStr);
            }).toList();

            ArrayList<String> arrayList = new ArrayList<>();
            for (List<String> innerList : tmpArr) {
                arrayList.addAll(innerList); // 각 내부 리스트의 요소를 ArrayList에 추가
            }
            if(arrayList.size() < 1){
                break outerLoop;
            }else{
                realRuleIds.addAll(arrayList);
                samplingRuleIds = arrayList;
            }
        }

        List<String> samplingReturnRuleIds = new ArrayList<>();
        List<String> realRetrunRuleIds = new ArrayList<>();
        realRetrunRuleIds.add(rule.getRuleid());
        samplingReturnRuleIds.add(rule.getRuleid());
        outerLoopReturn:  while (true){
            List<List<String>> tmpArr = samplingReturnRuleIds.stream().map((el) -> {
                // TODO:: 룰 조건식 목록 찾기
                List<String> infoConditionVo = ruleService.ruleReturnItemInfo(el);
                return infoConditionVo.stream().filter(ruleContact -> ruleContact.startsWith("{@")).collect(Collectors.toList());
            }).toList();

            ArrayList<String> arrayList = new ArrayList<>();
            for (List<String> innerList : tmpArr) {
                arrayList.addAll(innerList); // 각 내부 리스트의 요소를 ArrayList에 추가
            }
            if(arrayList.size() < 1){
                break outerLoopReturn;
            }else{
                realRetrunRuleIds.addAll(arrayList);
                samplingReturnRuleIds = arrayList;
            }
        }



        List<String> itemInputList = new ArrayList<>();
        realRuleIds.forEach((el)->{
            List<RuleInfoConditionVo> infoConditionVo = ruleService.ruleConditionInfo(el);
            // TODO :: 조건식 후위연산 모아 String으로 합치기
            StringBuilder concatPostFixStr = new StringBuilder();
            infoConditionVo
                    .forEach((el2)->{
                        concatPostFixStr.append(el2.getConditionPostfixDesc());
                    });
            // TODO :: 정규표현식으로 [ 시작  ] 끝 단어 추출
            Pattern pattern = Pattern.compile("\\[([^\\]]+)\\]");
            Matcher matcher = pattern.matcher(concatPostFixStr);
            while (matcher.find()) {
                String word = matcher.group(1); // 괄호 안의 단어 추출
                itemInputList.add(word);
            }
        });

        realRetrunRuleIds.forEach((el)->{
            List<String> infoConditionVo = ruleService.ruleReturnItemInfo(el);
            infoConditionVo.forEach(el2 -> {
                if(el2.trim().startsWith("[")){
                    String extractedItemNameNm = el2.trim().substring(1, el2.trim().length() - 1);
                    itemInputList.add(extractedItemNameNm);
                }
            });
        });
        // TODO :: 추출된 리스트아이디 항목을 입력항목 이름으로 조회해 배열로 리턴
        List<String> inputItems = itemInputList.stream().map((el)->{
           return ruleService.ruleInputItemIdToName(el.trim());
        }).distinct().filter(Objects::nonNull).collect(Collectors.toList());

        if (rule == null) {
            return resultMsg("BE00000001");
        }
        return resultMsg("BE00000001",
                RulePayloads.RuleInfoResponse.builder()
                        .rule(rule)
                        .ruleReturnItem(ruleReturnItems)
                        .inputItems(inputItems)
                        .build()
        );
    }

    @Operation(
            summary = "룰 단건조회",
            description = "룰 테이블에서 룰 아이디를 받아 단건조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 전달한 룰 이름의 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleDetailInfoResponse.class)
            )
    )
    @PostMapping("/apis/rule/detail-info")
    public CLNewApiResponse<RulePayloads.RuleDetailInfoResponse> ruleDefailInfo(
            @RequestParam("ruleid") String ruleid
    ) {

        String lockTfType="";
        int lockTf = ruleService.findRuleForLock(
                ParamRule.FindRuleForLock.builder()
                        .ruleid(ruleid)
                        .userid(currentUserId())
                        .build()
        );
        if(lockTf==0){
            lockTfType="N";
        }else{
            lockTfType="Y";
        }
        RuleVo findRuleDetailInfoByRuleid = ruleService.findRuleDetailInfoByRuleid(ruleid);
        List<ItemMgmt> ruleInfoRuleReturn = ruleService.ruleInfoForRuleReturn(ruleid);
        List<RuleInfoConditionVo> ruleInfoCondition = ruleService.ruleInfoForCondition(ruleid);


        List<RuleVerstionVo> ruleAsisVerstion = ruleService.findRuleAsisVerstion(ruleid);
        ruleAsisVerstion.stream().map((el) -> {
            el.setRuleReturnItemVerstion(ruleService.findRuleItemHistory(el.getRuleid()));
            el.setRuleConditionVerstion(ruleService.findRuleConditonHistory(el.getRuleid()));
            return el;
        }).collect(Collectors.toList());

        return resultMsg("BE00000001",
                RulePayloads.RuleDetailInfoResponse.builder()
                        .ruleInfo(findRuleDetailInfoByRuleid)
                        .ruleInfoRuleReturn(ruleInfoRuleReturn)
                        .ruleInfoCondition(ruleInfoCondition)
                        .ruleUseType(lockTfType)
                        .ruleHistory(ruleAsisVerstion)
                        .build()
        );
    }

    @Operation(
            summary = "룰 수정, 혹은 저장",
            description = "룰을 수정하거나 저장하는 api" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, update",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleUpdateCreateResponse.class)
            )
    )
    @PostMapping("/apis/rule/save/create-or-modify")
    public CLNewApiResponse<RulePayloads.RuleUpdateCreateResponse> ruleCreateOrModify(
            @RequestBody RulePayloads.RuleUpdateCreateRequest payload
    ) {
        int result = 0;
        String newRuleId = "";
        // TODO :: 먼저 룰 아이디 null 여부로 수정 혹은 등록
        if(payload.getRuleid() == null){
            // TODO :: RULE이 메인인지 서브인지에따른 룰아이디 채번
            if(payload.getRuleInfo().getRuleusageCd().equals("M")){
                newRuleId = ruleService.newMainRuleIdSeq();
                newRuleId = "#M" + payload.getRuleInfo().getRulesortCd()+newRuleId;
            }else{
                newRuleId = ruleService.newSubRuleIdSeq();
                newRuleId = "#S" + payload.getRuleInfo().getRulesortCd()+newRuleId;
            }
            //TODO :: 룰 신규등록
            try {
            result = ruleService.insertRuleInfo(newRuleId, payload.getRuleInfo(),
                    payload.getRuleInfoRuleReturn(),
                    payload.getRuleInfoCondition(),
                    currentUserId());
            } catch(CLException e) {
                return resultMsg(e.getErrorCode());
            }
//            catch (Exception e) {
//                // BE00000081:룰 저장중 문제가 발생했습니다.
//                return resultMsg("BE00000081");
//            }
        }else{
            //TODO :: 룰 수정, 업데이트
            try {
                newRuleId = payload.getRuleid();
            result = ruleService.updateRuleInfo(payload.getRuleid(), payload.getRuleInfo(),
                    payload.getRuleInfoRuleReturn(),
                    payload.getRuleInfoCondition(),
                    currentUserId());
            } catch(CLException e) {
                return resultMsg(e.getErrorCode());
            }
        }

        ruleEngineService.initRuleTestInfo();

        return resultMsg("BE00000001",
                RulePayloads.RuleUpdateCreateResponse.builder()
                        .updateRuleId(newRuleId)
                        .build()
        );
    }


    @Operation(
            summary = "룰 단건조회",
            description = "룰 테이블에서 룰 아이디를 받아 단건조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 파라미터로 전달한 룰 이름의 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleReturnConditonValiResponse.class)
            )
    )
    @PostMapping("/apis/validation/rule-return-condition")
    public CLNewApiResponse<RulePayloads.RuleReturnConditonValiResponse> ruleReturnConditionVali(
            @RequestBody RulePayloads.RuleReturnConditonValiRequest payload
    ) {
        AtomicReference<String> result = new AtomicReference<>("Y");
        List<RuleReturnItemValidation> ruleOrItemElements = payload.getRuleInfoCondition().stream().filter((el) -> {
            return RuleExecution.containsPattern(el.getReturnitemExprDesc(), "\\{@[\\s\\S]*?\\}|\\[[\\s\\S]*?\\]");
        }).toList();

        ruleOrItemElements.forEach((el)->{
            String returnDatatype = el.getDatatypeCd();
            List<String> ruleReturnItemOrRule =RuleExecution.findWords(el.getReturnitemExprDesc());
            ruleReturnItemOrRule.forEach((itemOrRule)->{
                boolean isRule = itemOrRule.trim().startsWith("{@");
                boolean isItem = itemOrRule.trim().startsWith("[");
                if(isRule){
                    String extractedRuleNm = itemOrRule.trim().substring(2, itemOrRule.trim().length() - 1);
                    if(ruleService.countReturnItem(extractedRuleNm) != 1 || !returnDatatype.equals(ruleService.findReturnItemDataType(extractedRuleNm))){
                        result.set("N");
                    }
                }else if(isItem){
                    String extractedItemNm = itemOrRule.trim().substring(1, itemOrRule.trim().length() - 1);
                    if(!returnDatatype.equals(ruleService.findItemDataType(extractedItemNm))){
                        result.set("N");
                    }
                }
            });

        });
        return resultMsg("BE00000001",
                RulePayloads.RuleReturnConditonValiResponse.builder()
                        .result(result.get())
                        .build()
        );
    }

    @Operation(
            summary = "룰 활성/비활성 업데이트",
            description = "룰 활성/비활성 업데이트한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 룰 활성/비활성 업데이트 상태를 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleDeleteResponse.class)
            )
    )
    @PostMapping("/apis/rule/delete")
    public CLNewApiResponse<RulePayloads.RuleDeleteResponse> ruleDel(
            @RequestParam("ruleid") String ruleid
    ) {
        return resultMsg("BE00000074",
                RulePayloads.RuleDeleteResponse.builder()
                        .delCnt(ruleService.ruleDel(ruleid, currentUserId()))
                        .build());
    }

    @Operation(
            summary = "룰테스트 완료",
            description = "룰테스트 완료" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답,룰테스트 완료",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleTestSubmitResponse.class)
            )
    )
    @PostMapping("/apis/rule/ruleTest/submit-test")
    public CLNewApiResponse<RulePayloads.RuleTestSubmitResponse> ruleTestSubmit(
            @RequestParam("ruleid") String ruleid
    ) {
        return resultMsg("BE00000074",
                RulePayloads.RuleTestSubmitResponse.builder()
                        .delCnt(ruleService.ruleTestSubmit(ruleid, currentUserId()))
                        .build());
    }


    @Operation(
            summary = "룰 적용 완료",
            description = "룰 적용 완료" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답,룰 적용 완료",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleApplyResponse.class)
            )
    )
    @PostMapping("/apis/rule/apply/all")
    public CLNewApiResponse<RulePayloads.RuleApplyResponse> ruleApply
            (   @RequestBody RulePayloads.RuleDeployRequest payload    ) {

        // TODO :: 적용 로직 트랜잭션
        ruleService.ruleDeploy(payload.getWaitList(), currentUserId());
        ruleEngineService.initRuleInfo();

        return resultMsg("BE00000034",
                RulePayloads.RuleApplyResponse.builder()
                        .applyYn(1)
                        .build());
    }


    @Operation(
            summary = "룰 배포 대기 리스트",
            description = "배포 대기 리스트" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답 배포 대기 리스트",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleDeployWaitResponse.class)
            )
    )
    @PostMapping("/apis/rule/deploy-list")
    public CLNewApiResponse<RulePayloads.RuleDeployWaitResponse> ruleDeployWaitList() {

        return resultMsg("BE00000034",
                RulePayloads.RuleDeployWaitResponse.builder()
                        .waitList(ruleService.findDeployWaitRule())
                        .recentDeploy(ruleService.findRecentDeploy())
                        .build());
    }


    @Operation(
            summary = "룰 적용 완료",
            description = "룰 적용 완료" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답,룰 적용 완료",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleApplyCntResponse.class)
            )
    )
    @PostMapping("/apis/rule/condition-infix-desc/select-llist")
    public CLNewApiResponse<RulePayloads.RuleConditionInfixDescResponse> ruleConditionInfixDesc(@RequestParam("ifid") String ifid) {

        return resultMsg("BE00000034",
                RulePayloads.RuleConditionInfixDescResponse.builder()
                        .ruleConditionInfixDescVo(ruleService.ruleConditionInfixDesc(ifid))
                        .build());

    }

    @Operation(
            summary = "룰 적용 완료",
            description = "룰 적용 완료" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답,룰 적용 완료",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleProgressHstResponse.class)
            )
    )
    @PostMapping("/apis/rule/progress-hst-list/select")
    public CLNewApiResponse<RulePayloads.RuleProgressHstResponse> ruleProgressHistorySelect(@RequestParam("ruleid") String ruleid) {

        return resultMsg("BE00000034",
                RulePayloads.RuleProgressHstResponse.builder()
                        .ruleProgressHistoryVo(ruleService.ruleProgressHstSelect(ruleid))
                        .build());
    }


    @Operation(
            summary = "배포 대기 ",
            description = "배포 대기 배은" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "배포 대기 배은",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Integer.class)
            )
    )
    @PostMapping("/apis/rule/deploy-wait")
    public CLNewApiResponse<Integer> ruleDeployWait(
            @RequestParam("ruleid") String ruleid,
            @RequestParam("ruleApplyYn") String ruleApplyYn) {


        return resultMsg("BE00000034",
                ruleService.ruleDeploy(ruleid, ruleApplyYn,currentUserId()));
    }


    @Operation(
            summary = "배포 대기 ",
            description = "배포 대기 취소 배은" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "배포 대기 배은",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Integer.class)
            )
    )
    @PostMapping("/apis/rule/deploy-wait/cancel")
    public CLNewApiResponse<Integer> ruleDeployWaitCancel(
            @RequestParam("ruleid") String ruleid,
            @RequestParam("beforeRuleVerno") double beforeRuleVerno) {
        try{
            return resultMsg("BE00000034",
                    ruleService.ruleDeployCancel(ruleid,beforeRuleVerno, currentUserId()));
        }catch (CLException e){
            return resultMsg(e.getErrorCode());
        }
    }



    @Operation(
            summary = "사용중인 항목",
            description = "사용중인 항목" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "사용중인 항목",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.UsedItem.class)
            )
    )
    @PostMapping("/apis/rule/used-item/list")
    public CLNewApiResponse<RulePayloads.UsedItem> usedItemList(
            @RequestParam("ruleid") String ruleid) {
        return resultMsg("BE00000034",
                RulePayloads.UsedItem.builder()
                        .usedItem(ruleService.findUsedItem(ruleid))
                        .build());
    }

    @Operation(
            summary = "사용중인 룰",
            description = "사용중인 룰" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "사용중인 룰",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.UsedRule.class)
            )
    )
    @PostMapping("/apis/rule/used-rule/list")
    public CLNewApiResponse<RulePayloads.UsedRule> usedRuleList(
            @RequestParam("ruleid") String ruleid) {
        return resultMsg("BE00000034",
                RulePayloads.UsedRule.builder()
                        .usedRule(ruleService.findUsedRule(ruleid))
                        .build());
    }

    @Operation(
            summary = "룰 배포 내역",
            description = "룰 배포 내역" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 룰 배포 내역",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.RuleDeployHisResponse.class)
            )
    )
    @PostMapping("/apis/rule/deploy/list")
    public CLNewApiResponse<RulePayloads.RuleDeployHisResponse> ruleDeployHis(
            @Parameter(description = "룰 단건 조회 아이디")
            @RequestBody RulePayloads.RuleDeployHisRequest payload
    ) {

        return resultMsg("BE00000001",
                RulePayloads.RuleDeployHisResponse.builder()
                        .deployHis(ruleService.findRuleDeployHis(ParamRule.FindRuleDeployHis
                                        .builder()
                                        .ifid(payload.getIfid())
                                        .ruleNm(payload.getRuleNm())
                                        .deployUserid(payload.getDeployUserid())
                                        .fromDt(payload.getFromDt())
                                        .toDt(payload.getToDt())
                                        .build()
                                )
                        )
                        .build()
        );

    }




    @Operation(
            summary = "사용중인 배포히스토리 룰 항목",
            description = "사용중인  배포히스토리 룰 항목" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "사용중인  배포히스토리 룰 항목",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.UsedItem.class)
            )
    )
    @PostMapping("/apis/rule/used-item/deploy-his/list")
    public CLNewApiResponse<RulePayloads.UsedItem> usedDeployHisItemList(
            @RequestParam("ruleid") String ruleid,
            @RequestParam("ruleVerno") String ruleVerno) {
        return resultMsg("BE00000034",
                RulePayloads.UsedItem.builder()
                        .usedItem(ruleService.findDeployHisUsedItem(ruleid, ruleVerno))
                        .build());
    }

    @Operation(
            summary = "사용중인 배포히스토리 룰",
            description = "사용중인 배포히스토리 룰" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "사용중인 룰",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RulePayloads.UsedRule.class)
            )
    )
    @PostMapping("/apis/rule/used-rule/deploy-his/list")
    public CLNewApiResponse<RulePayloads.UsedRule> usedDeployHisRuleList(
            @RequestParam("ruleid") String ruleid,
            @RequestParam("ruleVerno") String ruleVerno) {
        return resultMsg("BE00000034",
                RulePayloads.UsedRule.builder()
                        .usedRule(ruleService.findDeployHisUsedRule(ruleid,ruleVerno))
                        .build());
    }

}
