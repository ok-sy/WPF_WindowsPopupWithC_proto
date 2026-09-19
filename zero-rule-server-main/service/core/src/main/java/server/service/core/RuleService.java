package server.service.core;

import cl.cloverframework.CLException;
import org.apache.ibatis.annotations.Param;
import org.springframework.lang.Nullable;
import org.springframework.transaction.annotation.Transactional;
import server.domain.entity.ItemMgmt;
import server.domain.vo.*;
import server.repo.core.mapper.ItemMgmtMapper;
import server.repo.core.mapper.RuleMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import server.repo.core.mapper.RuleVerstionMapper;
import server.service.core.ruleCore.RuleExecution;
import server.service.core.ruleCore.RuleManageConstants;
import server.service.core.ruleCore.Util;
import server.sql.ParamRule;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class RuleService {

    @Autowired
    RuleMapper ruleMapper;
    @Autowired
    ItemMgmtMapper itemMapper;

    @Autowired
    RuleVerstionMapper ruleVerstionMapper;

    public List<TreeIfRuleVo> findRuleTree(String keyword) {
        // TODO:: 검색기능 추후에 추가될 예정
        List<InterfaceVo> interfaces = ruleMapper.findInterFaces();
        return interfaces.stream().map((el) -> {
           List<RuleVo> rules =  ruleMapper.findRulesByInterfaceId(
                   ParamRule.RuleTreeSearch.builder()
                           .value(el.getIfid())
                           .keyword(keyword)
                           .build());
           // TODO :: 인터페이스에 딸린 룰이 없을때
                return TreeIfRuleVo.builder()
                        .ifid(el.getIfid())
                        .ifNm(el.getIfNm())
                        .rules(rules)
                        .build();
//            }
            // TODO :: 인터페이스에 딸린 룰이 있을때
        })
//                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }




    /**
     * rule 이름 목록 조회
     *
     */
    public List<RuleNameVo> findRuleNameAndIdList() {
       return ruleMapper.findRuleNameAndIdList();
    }

    public RuleVo findRuleInfoByRuleid(String ruleid, String rulealiasNm) {
        return ruleMapper.findRuleInfoByRuleid(ruleid, rulealiasNm);
    }

    public List<RuleReturnItemAndItemInfoVo> findRuleReturnItemByRuleid(String ruleid) {
        return ruleMapper.findRuleReturnItemByRuleid(ruleid);
    }

    /**
     * 룰관리 상세 - RULE 반환 리스트
     * @param ruleid
     * @return RuleInfoRuleReturnVo
     */
    public List<ItemMgmt> ruleInfoForRuleReturn(String ruleid){
        return ruleMapper.ruleInfoForRuleReturn(ruleid);
    }

    public RuleVo findRuleDetailInfoByRuleid(String ruleid){
        return ruleMapper.findRuleDetailInfoByRuleid(ruleid);
    }

    /**
     * 룰관리 상세 - 조건식 리스트
     * @param ruleid
     * @return RuleInfoConditionVo
     */
    public List<RuleInfoConditionVo> ruleInfoForCondition(String ruleid){
        return ruleMapper.ruleInfoForCondition(ruleid);
    }





    public List<RuleInfoConditionVo> ruleConditionInfo(String ruleid) {
        return ruleMapper.ruleConditionInfo(ruleid);
    }


    public String ruleInputItemIdToName(String itemId) {
        return ruleMapper.ruleInputItemIdToName(itemId);
    }
    public String newMainRuleIdSeq() {
        return ruleMapper.newMainRuleIdSeq();
    }

    public List<String> ruleReturnItemInfo(String ruleid) {
        return ruleMapper.ruleReturnItemInfo(ruleid);
    }

    public String newSubRuleIdSeq() {
        return ruleMapper.newSubRuleIdSeq();
    }

    /**
     * 룰 등록 로직
     * @param ?
     * @return int
     */
    @Transactional
    public int insertRuleInfo(String ruleid, RuleVo ruleInfo
            , List<RuleInfoRuleReturnVo> ruleInfoRuleReturn
            ,List<RuleInfoConditionVo> ruleInfoCondition, long userid){
        Util util = new Util();

        if(ruleMapper.selectRuleNmDupCnt(ruleInfo.getRuleNm(), null) > 0){
            throw new CLException("BE00000084", "같은 이름의 룰 이름이 존재합니다.");
        }
        if(ruleMapper.selectRuleAliasDupCnt(ruleInfo.getRulealiasNm(),null) > 0){
            throw new CLException("BE00000085", "같은 이름의 룰 별칭이 존재합니다.");
        }

        int result = ruleMapper.insertRuleInfo(ParamRule.InsertRuleInfo.builder()
                .ruleid(ruleid)
                .ruleNm(ruleInfo.getRuleNm())
                .rulealiasNm(ruleInfo.getRulealiasNm())
                .ruleDesc(ruleInfo.getRuleDesc())
                .rulereturnType(ruleInfo.getRulereturnType())
                .rulesortCd(ruleInfo.getRulesortCd())
                .ruleusageCd(ruleInfo.getRuleusageCd())
                .allreturnYn(ruleInfo.getAllreturnYn())
                .useYn("Y")
                .ruleVerno(0.01)
                .activateYn("N")
                .ruleState("1")
                .ifid(ruleInfo.getIfid())
                .firstregUserid(userid)
                .ruleApplyYn("N")
                .build());

        // 룰 상태 변경이력 추가
        ruleMapper.ruleProgressHistoryInsert(ParamRule.InsertRuleProgress.builder()
                .ruleid(ruleid)
                .ruleVerno(0.01)
                .ruleState("1")
                .currentRuleApplyYn("N")
                .deployWaitStateApplyYn(null)
                .updateUserid((int) userid)
                .build());

        final Long[] idx = {1L};
        // TODO :: 리턴 항목 인서트
        ruleInfoRuleReturn.stream().forEach((el)->{
            ruleMapper.insertRuleReturnInfo(ParamRule.InsertRuleReturn.builder()
                    .ruleid(ruleid)
                    .returnItemid(el.getItemid())
                    .returnitemNo(idx[0])
                    .updateUserid(userid)
                    .build());
            idx[0] = idx[0] + 1;
        });
        // TODO :: 조건 줄인 항목 발라내 인서트 (Rule Condition 테이블에 )
        List<RuleInfoConditionVo> uniqueFieldValues = new ArrayList<>();
        List<Long> tmpNo = new ArrayList<>();
        ruleInfoCondition.stream().forEach((el)->{
            if(!tmpNo.contains((long) el.getRuleconditionno())){
                tmpNo.add((long) el.getRuleconditionno());
                uniqueFieldValues.add(el);
            }
        });
        uniqueFieldValues.stream().forEach((el)->{
            String postfixDesc = util.convertFromInfixToPostfix(el.getConditionInfixDesc());
            String[] returnPostfixDescSep = postfixDesc.split(",");
            List<String> ListSepArr = Arrays.asList(returnPostfixDescSep);
            //TODO:: {@ 로 시작하거나, [ 로 시작할때 항목 아이디나 룰 아이디로 변경
            List<String> postSepChangeIdArr = ListSepArr.stream().map((sepRuleOrItem)->{
                boolean isRule = sepRuleOrItem.trim().startsWith("{@");
                boolean isItem = sepRuleOrItem.trim().startsWith("[");
                if(isRule){
                    String extractedRuleNm = sepRuleOrItem.trim().substring(2, sepRuleOrItem.trim().length() - 1);
                    String extractRuleId = ruleMapper.selectRuleIdToNm(extractedRuleNm);
                    return "{@" + extractRuleId + "}";
                }else if(isItem){
                    String extractedItemNm = sepRuleOrItem.trim().substring(1, sepRuleOrItem.trim().length() - 1);
                    String extractedItemId = ruleMapper.selectItemIdToNm(extractedItemNm, ruleInfo.getIfid());
                    return "[" + extractedItemId + "]";
                }else{
                    return sepRuleOrItem;
                }
            }).collect(Collectors.toList());


            ruleMapper.insertRulecondition(ParamRule.InsertRuleCondition.builder()
                            .ruleid(ruleid)
                            .ruleconditionno((long) el.getRuleconditionno())
                            .conditionInfixDesc(el.getConditionInfixDesc())
                            .conditionPostfixDesc(String.join(",", postSepChangeIdArr))
                            .conditionDesc(el.getConditionDesc())
                            .firstregUserid(userid)
                    .build());
            // TODO :: postfix 오브젝트 테이블에 인서트 (condition object)

            final Long[] objNo = {1L};
            postSepChangeIdArr.stream().forEach((postEl)->{
                String dataType = RuleExecution.dataTypeCheck(postEl);
                String operationYn =RuleExecution.operationCheck(postEl);
                ruleMapper.insertRuleConditionPostfixObject(ParamRule.InsertRuleconditionPostfixobject.builder()
                        .ruleid(ruleid)
                        .postfixobjectno(objNo[0])
                        .ruleconditionno((long) el.getRuleconditionno())
                        .datatypeCd(operationYn.equals("Y") ? null : dataType)
                        .operatorYn(operationYn)
                        .objectData(postEl.trim())
                        .build());
                objNo[0] = objNo[0] + 1;
            });
        });

        // TODO :: 조건 리턴아이템 인서트 (Rule Condition Return ITem 테이블에 인서트)
        ruleInfoCondition.stream().forEach((el)->{
            String returnPostfixDesc = util.convertFromInfixToPostfix(el.getReturnitemExprDesc());
            String[] returnPostfixDescSep = returnPostfixDesc.split(",");
            List<String> ListSepArrVali = Arrays.asList(returnPostfixDescSep).stream().filter(aaa -> RuleExecution.operationCheck(aaa) != "Y").collect(Collectors.toList());
            List<String> ListSepArr = Arrays.asList(returnPostfixDescSep).stream().filter(aaa -> RuleExecution.operationCheck(aaa) != "Y").collect(Collectors.toList());
            String regex = "\\{@[^{}]*}|\\[[^\\[\\]]*\\]";
            Pattern pattern = Pattern.compile(regex);
            Matcher matcher = pattern.matcher(el.getConditionInfixDesc());
            if(!matcher.find()){
                for (int i = 0; i < ListSepArrVali.size(); i += 2) {
                    if(i < ListSepArrVali.size()-1) {
                        String sepRuleOrItem = ListSepArrVali.get(i).trim();
                        String nextVal = ListSepArrVali.get(i + 1).trim();
                        if (sepRuleOrItem.startsWith("\"") && sepRuleOrItem.endsWith("\"")) {
                            // 문자열인 경우: 쌍따옴표로 둘러싸인 경우
                            if(nextVal.startsWith("\"") && nextVal.endsWith("\"")){
                            }else{
                                throw new CLException("BE00000066", "올바르지 않은 중위식입니다.");
                            }
                        } else if (RuleExecution.isNumeric(sepRuleOrItem)) {
                            // 숫자인 경우: 숫자로만 이루어진 경우
                            if(nextVal.startsWith("\"") && nextVal.endsWith("\"")){
                                throw new CLException("BE00000066", "올바르지 않은 중위식입니다.");
                            }else{
                                if(!RuleExecution.isNumeric(nextVal)){
                                    throw new CLException("BE00000066", "올바르지 않은 중위식입니다.");
                                }
                            }
                        }
                    }
                }
            }
            //TODO:: {@ 로 시작하거나, [ 로 시작할때 항목 아이디나 룰 아이디로 변경
            List<String> postSepChangeIdArr = ListSepArr.stream().map((sepRuleOrItem)->{
                boolean isRule = sepRuleOrItem.trim().startsWith("{@");
                boolean isItem = sepRuleOrItem.trim().startsWith("[");
                if(isRule){
                    String extractedRuleNm = sepRuleOrItem.trim().substring(2, sepRuleOrItem.trim().length() - 1);
                    String extractRuleId = ruleMapper.selectRuleIdToNm(extractedRuleNm);
                    return "{@" + extractRuleId + "}";

                }else if(isItem){
                    String extractedItemNm = sepRuleOrItem.trim().substring(1, sepRuleOrItem.trim().length() - 1);
                    String extractedItemId = ruleMapper.selectItemIdToNm(extractedItemNm,ruleInfo.getIfid());
                    return "[" + extractedItemId + "]";
                }else{
                    return sepRuleOrItem;
                }
            }).collect(Collectors.toList());

            ruleMapper.insertRuleconditionreturnitem(ParamRule.InsertRuleconditionreturnitem.builder()
                    .returnItemid(el.getReturnItemid())
                    .ruleid(ruleid)
                    .ruleconditionno((long) el.getRuleconditionno())
                    .returnitemExprDesc(el.getReturnitemExprDesc())
                    .returnitemPostfixDesc(String.join(",", postSepChangeIdArr))
                    .firstregUserid(userid)
                    .build());

            // TODO :: postfix 오브젝트 테이블에 인서트 (Condition Return ITem object)
            final Long[] objNo = {1L};
            postSepChangeIdArr.stream().forEach((postEl)->{
                String dataType = RuleExecution.dataTypeCheck(postEl);
                String operationYn =RuleExecution.operationCheck(postEl);
                ruleMapper.insertRuleconditionReturnPostfixobject(ParamRule.InsertRuleconditionReturnPostfixobject.builder()
                        .returnItemid(el.getReturnItemid())
                        .ruleid(ruleid)
                        .postfixobjectno(objNo[0])
                        .ruleconditionno((long) el.getRuleconditionno())
                        .datatypeCd(operationYn.equals("Y") ? null : dataType)
                        .operatorYn(operationYn)
                        .objectData(postEl.trim())
                        .build());
                objNo[0] = objNo[0] + 1;
            });
        });

        //TODO :: 유효성 체크 영역

        List<ParamRule.InsertRuleconditionPostfixobject> ruleConPostfixObj = ruleMapper.selectRuleConObj(ruleid);
        List<ParamRule.InsertRuleconditionPostfixobject> ruleNonOperPostfixObj = ruleConPostfixObj.stream().filter(el -> Objects.equals(el.getOperatorYn(), "N")).collect(Collectors.toList());
        ruleNonOperPostfixObj.stream().forEach((el) -> {
            boolean isRule = el.getObjectData().trim().startsWith("{@");
            boolean isItem = el.getObjectData().trim().startsWith("[");
            String nextValType = ruleMapper.ruleObjNextValInfo(ParamRule.SelectRuleObjType.builder()
                    .ruleid(ruleid)
                    .postfixobjectno(el.getPostfixobjectno() + 1)
                    .ruleconditionno(el.getRuleconditionno())
                    .build());
            if (isRule) {
                String extractedRuleId = el.getObjectData().substring(2, el.getObjectData().length() - 1);
                if (extractedRuleId.equals("null")) {
                    throw new CLException("BE00000059", "서브룰이 존재하지 않습니다.");
                }
                List<ItemMgmt> subRuleInfo = ruleMapper.ruleInfoForRuleReturn(extractedRuleId);
                if (subRuleInfo.size() < 1) {
                    throw new CLException("BE00000061", "서브룰의 항목이 존재하지 않습니다.");
                } else if (subRuleInfo.size() > 1){
                    throw new CLException("BE00000062", "서브룰에 리턴항목이 1개 이상입니다.");
                }else{
                    if(nextValType == null){
                        throw new CLException("BE00000066", "올바르지 않은 중위식입니다.");
                    }else{
                        if(Objects.equals(subRuleInfo.get(0).getDataTypeCd(), "1")){
                            if(nextValType.equals("1") || nextValType.equals("2")){

                            }else{
                                throw new CLException("BE00000063", "서브룰 뒤 조건 타입이 맞지 않습니다.");
                            }
                        }else{
                            if(!nextValType.equals(subRuleInfo.get(0).getDataTypeCd())){
                                throw new CLException("BE00000063", "서브룰 뒤 조건 타입이 맞지 않습니다.");
                            }
                        }

                    }
                }

            } else if (isItem) {
                String extractedItemId = el.getObjectData().substring(1, el.getObjectData().length() - 1);
                if (extractedItemId.equals("null")) {
                    throw new CLException("BE00000064", "아이템이 존재하지 않습니다.");
                }
                ItemMgmt itemInfo = itemMapper.itemInfo(extractedItemId);
                if (itemInfo == null) {
                    throw new CLException("BE00000064", "항목이 존재하지 않습니다.");
                }else{
                    if(nextValType == null){
                        throw new CLException("BE00000066", "올바르지 않은 중위식입니다.");
                    }else{
                        if(Objects.equals(itemInfo.getDataTypeCd(), "1")){
                            if(nextValType.equals("1") || nextValType.equals("2")){

                            }else{
                                throw new CLException("BE00000065", "서브룰 뒤 조건 타입이 맞지 않습니다.");
                            }
                        }else{
                            if(!nextValType.equals(itemInfo.getDataTypeCd())){
                                throw new CLException("BE00000065", "서브룰 뒤 조건 타입이 맞지 않습니다.");
                            }
                        }
                    }
                }
            }
        });

        List<ParamRule.InsertRuleconditionReturnPostfixobject> ruleReturnConPostfixObj = ruleMapper.selectRuleReturnConObj(ruleid);
        List<ParamRule.InsertRuleconditionReturnPostfixobject> ruleReturnNonOperPostfixObj = ruleReturnConPostfixObj.stream().filter(el -> Objects.equals(el.getOperatorYn(), "N")).collect(Collectors.toList());
        ruleReturnNonOperPostfixObj.stream().forEach((el) -> {
            boolean isRule = el.getObjectData().trim().startsWith("{@");
            boolean isItem = el.getObjectData().trim().startsWith("[");
            if (isRule) {
                String extractedRuleId = el.getObjectData().substring(2, el.getObjectData().length() - 1).trim();
                if (extractedRuleId.equals("null")) {
                    throw new CLException("BE00000067", "반환값의 서브룰이 존재하지 않거나 비활성상태입니다.");
                }
                List<ItemMgmt> subRuleInfo = ruleMapper.ruleInfoForRuleReturn(extractedRuleId);
                if (subRuleInfo.size() < 1) {
                    throw new CLException("BE00000068", "반환값의 서브룰의 항목이 존재하지 않습니다.");
                } else if (subRuleInfo.size() > 1){
                    throw new CLException("BE00000069", "반환값의 서브룰에 리턴항목이 1개 이상입니다.");
                }
            } else if (isItem) {
                String extractedItemId = el.getObjectData().substring(1, el.getObjectData().length() - 1);
                if (extractedItemId.equals("null")) {
                    throw new CLException("BE00000070", "아이템이 존재하지 않습니다.");
                }
                ItemMgmt itemInfo = itemMapper.itemInfo(extractedItemId);
                if (itemInfo == null) {
                    throw new CLException("BE00000070", "항목이 존재하지 않습니다.");
                }
            }
        });
        return result;
    }

    /**
     * 룰 수정 로직
     * @param ?
     * @return int
     */
    @Transactional
    public int updateRuleInfo(String ruleid, RuleVo ruleInfo
            , List<RuleInfoRuleReturnVo> ruleInfoRuleReturn
            ,List<RuleInfoConditionVo> ruleInfoCondition, long userid){
        Util util = new Util();


        if(ruleMapper.selectRuleNmDupCnt(ruleInfo.getRuleNm(), ruleid) > 0){
            throw new CLException("BE00000084", "같은 이름의 룰 이름이 존재합니다.");
        }
        if(ruleMapper.selectRuleAliasDupCnt(ruleInfo.getRulealiasNm(), ruleid) > 0){
            throw new CLException("BE00000085", "같은 이름의 룰 별칭이 존재합니다.");
        }

        double ruleVerno = ruleInfo.getRuleVerno() + 0.01;
        if (Math.round((ruleVerno * 100) % 100) == 99) {  // 소수점 이하 두 자리가 99인지 확인
            throw new CLException("BE00000080", "룰 수정은 최대 99번까지입니다.");
        }
        int result = ruleMapper.updateRuleInfo(ParamRule.InsertRuleInfo.builder()
                .ruleid(ruleid)
                .ruleNm(ruleInfo.getRuleNm())
                .rulealiasNm(ruleInfo.getRulealiasNm())
                .ruleDesc(ruleInfo.getRuleDesc())
                .rulereturnType(ruleInfo.getRulereturnType())
                .rulesortCd(ruleInfo.getRulesortCd())
                .ruleusageCd(ruleInfo.getRuleusageCd())
                .allreturnYn(ruleInfo.getAllreturnYn())
                .useYn(ruleInfo.getUseYn())
                .ruleVerno(ruleVerno)
                .activateYn(ruleInfo.getActivateYn())
                .ruleState("1")
                .ifid(ruleInfo.getIfid())
                .updateUserid(userid)
                .build());

        ruleMapper.ruleProgressHistoryInsert(ParamRule.InsertRuleProgress.builder()
                .ruleid(ruleid)
                .ruleVerno(ruleVerno)
                .ruleState("1")
                .deployWaitStateApplyYn(null)
                .updateUserid((int) userid)
                .build());


        //TODO :: 기존 RULE 관련 전체 삭제
        ruleMapper.deleteRuleConditionReturnItemObject(ruleid);
        ruleMapper.deleteRuleConditionObject(ruleid);
        ruleMapper.deleteRuleConditionReturnItem(ruleid);
        ruleMapper.deleteRuleReturnItem(ruleid);
        ruleMapper.deleteRuleCondition(ruleid);

        // TODO :INSERT
        final Long[] idx = {1L};
        // TODO :: 리턴 항목 인서트
        ruleInfoRuleReturn.stream().forEach((el)->{
            ruleMapper.insertRuleReturnInfo(ParamRule.InsertRuleReturn.builder()
                    .ruleid(ruleid)
                    .returnItemid(el.getItemid())
                    .returnitemNo(idx[0])
                    .updateUserid(userid)
                    .build());
            idx[0] = idx[0] + 1;
        });
        // TODO :: 조건 줄인 항목 발라내 인서트 (Rule Condition 테이블에 )
        List<RuleInfoConditionVo> uniqueFieldValues = new ArrayList<>();
        List<Long> tmpNo = new ArrayList<>();
        ruleInfoCondition.stream().forEach((el)->{
            if(!tmpNo.contains((long) el.getRuleconditionno())){
                tmpNo.add((long) el.getRuleconditionno());
                uniqueFieldValues.add(el);
            }
        });
        uniqueFieldValues.stream().forEach((el)->{
            String postfixDesc = util.convertFromInfixToPostfix(el.getConditionInfixDesc());
            String[] returnPostfixDescSep = postfixDesc.split(",");
            List<String> ListSepArrVali = Arrays.asList(returnPostfixDescSep).stream().filter(aaa -> RuleExecution.operationCheck(aaa) != "Y").collect(Collectors.toList());
            List<String> ListSepArr = Arrays.asList(returnPostfixDescSep);

            String regex = "\\{@[^{}]*}|\\[[^\\[\\]]*\\]";
            Pattern pattern = Pattern.compile(regex);
            Matcher matcher = pattern.matcher(el.getConditionInfixDesc());
            if(!matcher.find()){
                for (int i = 0; i < ListSepArrVali.size(); i += 2) {
                    if(i < ListSepArrVali.size()-1) {
                        String sepRuleOrItem = ListSepArrVali.get(i).trim();
                        String nextVal = ListSepArrVali.get(i + 1).trim();
                        if (sepRuleOrItem.startsWith("\"") && sepRuleOrItem.endsWith("\"")) {
                            // 문자열인 경우: 쌍따옴표로 둘러싸인 경우
                            if(nextVal.startsWith("\"") && nextVal.endsWith("\"")){
                            }else{
                                throw new CLException("BE00000066", "올바르지 않은 중위식입니다.");
                            }
                        } else if (RuleExecution.isNumeric(sepRuleOrItem)) {
                            // 숫자인 경우: 숫자로만 이루어진 경우
                            if(nextVal.startsWith("\"") && nextVal.endsWith("\"")){
                                throw new CLException("BE00000066", "올바르지 않은 중위식입니다.");
                            }else{
                                if(!RuleExecution.isNumeric(nextVal)){
                                    throw new CLException("BE00000066", "올바르지 않은 중위식입니다.");
                                }
                            }
                        }
                    }
                }
            }
            //TODO:: {@ 로 시작하거나, [ 로 시작할때 항목 아이디나 룰 아이디로 변경
            List<String> postSepChangeIdArr = ListSepArr.stream().map((sepRuleOrItem)->{
                boolean isRule = sepRuleOrItem.trim().startsWith("{@");
                boolean isItem = sepRuleOrItem.trim().startsWith("[");
                if(isRule){
                    String extractedRuleNm = sepRuleOrItem.trim().substring(2, sepRuleOrItem.trim().length() - 1);
                    return "{@" + ruleMapper.selectRuleIdToNm(extractedRuleNm) + "}";
                }else if(isItem){
                    String extractedItemNm = sepRuleOrItem.trim().substring(1, sepRuleOrItem.trim().length() - 1);
                    return "[" + ruleMapper.selectItemIdToNm(extractedItemNm,ruleInfo.getIfid()) + "]";
                }else{
                    return sepRuleOrItem;
                }
            }).collect(Collectors.toList());


            ruleMapper.updateRulecondition(ParamRule.InsertRuleCondition.builder()
                    .ruleid(ruleid)
                    .ruleconditionno((long) el.getRuleconditionno())
                    .conditionInfixDesc(el.getConditionInfixDesc())
                    .conditionPostfixDesc(String.join(",", postSepChangeIdArr))
                    .conditionDesc(el.getConditionDesc())
                    .firstregUserid(userid)
                    .build());
            // TODO :: postfix 오브젝트 테이블에 인서트 (condition object)

            final Long[] objNo = {1L};
            postSepChangeIdArr.stream().forEach((postEl)->{
                String dataType = RuleExecution.dataTypeCheck(postEl);
                String operationYn =RuleExecution.operationCheck(postEl);
                ruleMapper.insertRuleConditionPostfixObject(ParamRule.InsertRuleconditionPostfixobject.builder()
                        .ruleid(ruleid)
                        .postfixobjectno(objNo[0])
                        .ruleconditionno((long) el.getRuleconditionno())
                        .datatypeCd(operationYn.equals("Y") ? null : dataType)
                        .operatorYn(RuleExecution.operationCheck(postEl))
                        .objectData(postEl.trim())
                        .build());
                objNo[0] = objNo[0] + 1;
            });
        });

        // TODO :: 조건 리턴아이템 인서트 (Rule Condition Return ITem 테이블에 인서트)
        ruleInfoCondition.stream().forEach((el)->{
            String returnPostfixDesc = util.convertFromInfixToPostfix(el.getReturnitemExprDesc());
            String[] returnPostfixDescSep = returnPostfixDesc.split(",");
            List<String> ListSepArr = Arrays.asList(returnPostfixDescSep);
            //TODO:: {@ 로 시작하거나, [ 로 시작할때 항목 아이디나 룰 아이디로 변경
            List<String> postSepChangeIdArr = ListSepArr.stream().map((sepRuleOrItem)->{
                boolean isRule = sepRuleOrItem.trim().startsWith("{@");
                boolean isItem = sepRuleOrItem.trim().startsWith("[");
                if(isRule){
                    String extractedRuleNm = sepRuleOrItem.trim().substring(2, sepRuleOrItem.trim().length() - 1);
                    return "{@" + ruleMapper.selectRuleIdToNm(extractedRuleNm) + "}";
                }else if(isItem){
                    String extractedItemNm = sepRuleOrItem.trim().substring(1, sepRuleOrItem.trim().length() - 1);

                    return "[" + ruleMapper.selectItemIdToNm(extractedItemNm,ruleInfo.getIfid()) + "]";
                }else{
                    return sepRuleOrItem;
                }
            }).collect(Collectors.toList());
            ruleMapper.updateRuleconditionreturnitem(ParamRule.InsertRuleconditionreturnitem.builder()
                    .returnItemid(el.getReturnItemid())
                    .ruleid(ruleid)
                    .ruleconditionno((long) el.getRuleconditionno())
                    .returnitemExprDesc(el.getReturnitemExprDesc())
                    .returnitemPostfixDesc(String.join(",", postSepChangeIdArr))
                    .firstregUserid(userid)
                    .build());
            // TODO :: postfix 오브젝트 테이블에 인서트 (Condition Return ITem object)
            final Long[] objNo = {1L};
            postSepChangeIdArr.stream().forEach((postEl)->{
                String dataType = RuleExecution.dataTypeCheck(postEl);
                String operationYn =RuleExecution.operationCheck(postEl);
                ruleMapper.insertRuleconditionReturnPostfixobject(ParamRule.InsertRuleconditionReturnPostfixobject.builder()
                        .returnItemid(el.getReturnItemid())
                        .ruleid(ruleid)
                        .postfixobjectno(objNo[0])
                        .ruleconditionno((long) el.getRuleconditionno())
                        .datatypeCd(operationYn.equals("Y") ? null : dataType)
                        .operatorYn(RuleExecution.operationCheck(postEl))
                        .objectData(postEl.trim())
                        .build());
                objNo[0] = objNo[0] + 1;
            });
        });

        //TODO :: 유효성 체크 영역

        List<ParamRule.InsertRuleconditionPostfixobject> ruleConPostfixObj = ruleMapper.selectRuleConObj(ruleid);
        List<ParamRule.InsertRuleconditionPostfixobject> ruleNonOperPostfixObj = ruleConPostfixObj.stream().filter(el -> Objects.equals(el.getOperatorYn(), "N")).collect(Collectors.toList());
                ruleNonOperPostfixObj.stream().forEach((el) -> {
                    boolean isRule = el.getObjectData().trim().startsWith("{@");
                    boolean isItem = el.getObjectData().trim().startsWith("[");
                    String nextValType = ruleMapper.ruleObjNextValInfo(ParamRule.SelectRuleObjType.builder()
                            .ruleid(ruleid)
                            .postfixobjectno(el.getPostfixobjectno() + 1)
                            .ruleconditionno(el.getRuleconditionno())
                            .build());
                    if (isRule) {
                        String extractedRuleId = el.getObjectData().substring(2, el.getObjectData().length() - 1);
                        if (extractedRuleId.equals("null")) {
                            throw new CLException("BE00000059", "중위식 조건식의 서브룰이 존재하지 않거나 미적용상태입니다.");
                        }
                        List<ItemMgmt> subRuleInfo = ruleMapper.ruleInfoForRuleReturn(extractedRuleId);
                        if (subRuleInfo.size() < 1) {
                            throw new CLException("BE00000061", "중위식 조건식의 서브룰의 항목이 존재하지 않습니다.");
                        } else if (subRuleInfo.size() > 1){
                            throw new CLException("BE00000062", "중위식 조건식의 서브룰에 리턴항목이 1개 이상입니다.");
                        }else{
                            if(nextValType == null){
                                throw new CLException("BE00000066", "올바르지 않은 중위식입니다.");
                            }else{
                                if(Objects.equals(subRuleInfo.get(0).getDataTypeCd(), "1")){
                                    if(nextValType.equals("1") || nextValType.equals("2")){

                                    }else{
                                        throw new CLException("BE00000063", "서브룰 뒤 조건 타입이 맞지 않습니다.");
                                    }
                                }else{
                                    if(!nextValType.equals(subRuleInfo.get(0).getDataTypeCd())){
                                        throw new CLException("BE00000063", "서브룰 뒤 조건 타입이 맞지 않습니다.");
                                    }
                                }
                            }
                        }

                    } else if (isItem) {
                        String extractedItemId = el.getObjectData().substring(1, el.getObjectData().length() - 1);
                        if (extractedItemId.equals("null")) {
                            throw new CLException("BE00000064", "중위식 조건식의 아이템이 존재하지 않습니다.");
                        }
                        ItemMgmt itemInfo = itemMapper.itemInfo(extractedItemId);
                        if (itemInfo == null) {
                            throw new CLException("BE00000064", "중위식 조건식의 항목이 존재하지 않습니다.");
                        }else{
                            if(nextValType == null){
                                throw new CLException("BE00000066", "올바르지 않은 중위식입니다.");
                            }else{
                                if(Objects.equals(itemInfo.getDataTypeCd(), "1")){
                                    if(nextValType.equals("1") || nextValType.equals("2")){

                                    }else{
                                        throw new CLException("BE00000065", "서브룰 뒤 조건 타입이 맞지 않습니다.");
                                    }
                                }else{
                                    if(!nextValType.equals(itemInfo.getDataTypeCd())){
                                        throw new CLException("BE00000065", "서브룰 뒤 조건 타입이 맞지 않습니다.");
                                    }
                                }
                            }
                        }
                    }
                });


        List<ParamRule.InsertRuleconditionReturnPostfixobject> ruleReturnConPostfixObj = ruleMapper.selectRuleReturnConObj(ruleid);
        List<ParamRule.InsertRuleconditionReturnPostfixobject> ruleReturnNonOperPostfixObj = ruleReturnConPostfixObj.stream().filter(el -> Objects.equals(el.getOperatorYn(), "N")).collect(Collectors.toList());
        ruleReturnNonOperPostfixObj.stream().forEach((el) -> {
            boolean isRule = el.getObjectData().trim().startsWith("{@");
            boolean isItem = el.getObjectData().trim().startsWith("[");
            if (isRule) {
                String extractedRuleId = el.getObjectData().substring(2, el.getObjectData().length() - 1).trim();
                if (extractedRuleId.equals("null")) {
                    throw new CLException("BE00000067", "반환값의 서브룰이 존재하지 않거나 비활성상태입니다.");
                }
                List<ItemMgmt> subRuleInfo = ruleMapper.ruleInfoForRuleReturn(extractedRuleId);
                if (subRuleInfo.size() < 1) {
                    throw new CLException("BE00000068", "반환값의 서브룰의 항목이 존재하지 않습니다.");
                } else if (subRuleInfo.size() > 1){
                    throw new CLException("BE00000069", "반환값의 서브룰에 리턴항목이 1개 이상입니다.");
                }
            } else if (isItem) {
                String extractedItemId = el.getObjectData().substring(1, el.getObjectData().length() - 1);
                if (extractedItemId.equals("null")) {
                    throw new CLException("BE00000070", "아이템이 존재하지 않습니다.");
                }
                ItemMgmt itemInfo = itemMapper.itemInfo(extractedItemId);
                if (itemInfo == null) {
                    throw new CLException("BE00000070", "항목이 존재하지 않습니다.");
                }
            }
        });
        return result;
    }

    public int countReturnItem(String value) {
        return ruleMapper.countReturnItem(value);
    }

    public String findReturnItemDataType(String value) {
        return ruleMapper.findReturnItemDataType(value);
    }

    public String findItemDataType(String value) {
        return ruleMapper.findItemDataType(value);
    }

    public int ruleActiveUpt(ParamRule.RuleActiveUpdate params) {
        return ruleMapper.ruleActiveUpt(params);
    }

    public int ruleDel(String ruleid,Long userId) {
        RuleVo ruleInfo =ruleMapper.findRuleDetailInfoByRuleid(ruleid);
        ruleMapper.ruleProgressHistoryInsert(ParamRule.InsertRuleProgress.builder()
                .ruleid(ruleid)
                .ruleVerno(ruleInfo.getRuleVerno())
                .ruleState("D")
                .deployWaitStateApplyYn(null)
                .updateUserid(Math.toIntExact(userId))
                .build());
        return ruleMapper.ruleDel(ruleid);
    }

    public int ruleTestSubmit(String ruleid, Long userId) {

        ruleMapper.ruleTestSubmit(ruleid);
        RuleVo ruleInfo =ruleMapper.findRuleDetailInfoByRuleid(ruleid);
    return ruleMapper.ruleProgressHistoryInsert(ParamRule.InsertRuleProgress.builder()
            .ruleid(ruleid)
            .ruleVerno(ruleInfo.getRuleVerno())
            .ruleState("2")
            .deployWaitStateApplyYn(null)
            .updateUserid(Math.toIntExact(userId))
            .build());
    }

    public int findRuleForLock(ParamRule.FindRuleForLock params) {
        return ruleMapper.findRuleForLock(params);
    }



//    public int updateRuleState(String ruleid, String ruleState, Long userId) {
//        return ruleMapper.updateRuleState(ruleid,ruleState,userId);
//    }
    public Long getRuleVernoOrNew(String value) {
        return ruleMapper.getRuleVernoOrNew(value);
    }


    public RuleVerstionVo findRuleAsisVerstion(String ruleid, Long currentRuleVerOrNull) {
        RuleVerstionVo rule = ruleVerstionMapper.findRuleAsisVerstionInfo(ruleid, currentRuleVerOrNull);
        rule.setRuleReturnItemVerstion(ruleVerstionMapper.findRuleAsisVerstionItem(ruleid,currentRuleVerOrNull));
        rule.setRuleConditionVerstion(ruleVerstionMapper.findRuleAsisVerstionConditon(ruleid,currentRuleVerOrNull));
        return rule;
    }
    public RuleVerstionVo findRuleTobeVerstion(String ruleid ) {
        RuleVerstionVo rule = ruleVerstionMapper.findRuleTobeVerstionInfo(ruleid);
        rule.setRuleReturnItemVerstion(ruleVerstionMapper.findRuleTobeVerstionItem(ruleid));
        rule.setRuleConditionVerstion(ruleVerstionMapper.findRuleTobeVerstionConditon(ruleid));
        return rule;
    }
    @Transactional
    public void insertHstRuleInfo(String ruleid, int ruleVerno, String ruleversionchangecode) {
        ruleVerstionMapper.insertRuleHistory(ruleid, ruleversionchangecode);
        ruleVerstionMapper.insertRuleReturnItemHistory(ruleid, ruleVerno);
        ruleVerstionMapper.insertRuleCondtionHistory(ruleid, ruleVerno);
        ruleVerstionMapper.insertRuleCondtionPostFixObjHistory(ruleid, ruleVerno);
        ruleVerstionMapper.insertRuleCondtionReturnItemHistory(ruleid, ruleVerno);
    }

    public List<RuleVerstionVo> findRuleAsisVerstion(String ruleid) {
        return ruleVerstionMapper.findRuleAsisVerstion(ruleid);
    }
    public List<RuleReturnItemVerstionVo> findRuleItemHistory(String ruleid) {
        return ruleVerstionMapper.findRuleItemHistory(ruleid);
    }
    public List<RuleConditionVerstionVo> findRuleConditonHistory(String ruleid) {
        return ruleVerstionMapper.findRuleConditonHistory(ruleid);
    }

    public List<RuleConditionInfixDescVo> ruleConditionInfixDesc(String ifid){
        return ruleMapper.ruleConditionInfixDesc(ifid);
    }


    public List<RuleProgressHistoryVo> ruleProgressHstSelect(String ruleid){
        return ruleMapper.ruleProgressHstSelect(ruleid);
    }

    public int ruleDeploy(String ruleid, String ruleApplyYn, Long userId){

        ruleMapper.ruleDeploy(ruleid, ruleApplyYn);
        RuleVo ruleInfo =ruleMapper.findRuleDetailInfoByRuleid(ruleid);
        String ruleState = ruleMapper.selectRuleState(ruleid);
        return ruleMapper.ruleProgressHistoryInsert(ParamRule.InsertRuleProgress.builder()
                .ruleid(ruleid)
                .ruleVerno(ruleInfo.getRuleVerno())
                .ruleState(ruleState)
                .deployWaitStateApplyYn(ruleApplyYn)
                .updateUserid(Math.toIntExact(userId))
                .build());
    }

    @Transactional
    public int ruleDeployCancel(String ruleid,double beforeRuleVerno,  Long userId){
        ruleMapper.ruleDeployCancel(ruleid);
        RuleVo ruleInfo =ruleMapper.findRuleDetailInfoByRuleid(ruleid);
        String ruleState = ruleMapper.selectRuleState(ruleid);
        if(ruleInfo.getRuleVerno() > beforeRuleVerno){
            throw new CLException("BE00000086", "같은 이름의 룰 이름이 존재합니다.");
        }
        return ruleMapper.ruleProgressHistoryInsert(ParamRule.InsertRuleProgress.builder()
                .ruleid(ruleid)
                .ruleVerno(ruleInfo.getRuleVerno())
                .ruleState(ruleState)
                .deployWaitStateApplyYn(null)
                .updateUserid(Math.toIntExact(userId))
                .build());
    }

    public List<RuleDeployWaitVo> findDeployWaitRule(){
        return ruleMapper.findDeployWaitRule();
    }

    public List<UsedItemInfo> findUsedItem(String value){
        return ruleMapper.findUsedItem(value);
    }
    public List<UsedRuleDetailInfo> findUsedRule(String value){
        return ruleMapper.findUsedRule(value);
    }


    @Transactional
    public int ruleDeploy(List<RuleDeployWaitVo> updateList, Long userId){
        updateList.stream().forEach((el)->{
            ruleMapper.updateRuleState(el.getRuleid(), "9", userId, el.getDeployWaitStateAppyYn());

            if(el.getRuleModifyYn().equals("N")){
                ruleMapper.updateRuleVerno(el.getRuleid(), Double.parseDouble(el.getRuleVerno()) + 1);
            }
            RuleVo updatedRuleInfo = ruleMapper.findRuleList(el.getRuleid());
            ruleMapper.ruleProgressHistoryInsert(ParamRule.InsertRuleProgress.builder()
                    .ruleid(el.getRuleid())
                    .ruleVerno(updatedRuleInfo.getRuleVerno())
                    .ruleState("9")
                    .currentRuleApplyYn(el.getRuleApplyYn())
                    .deployWaitStateApplyYn(null)
                    .updateUserid(Math.toIntExact(userId))
                    .build());

            ruleVerstionMapper.insertRuleDeployHst(ParamRule.InsertRuleDeploy.builder()
                    .ruleid(el.getRuleid())
                    .ruleVerno(updatedRuleInfo.getRuleVerno())
                    .ruleUpdateYn(el.getRuleModifyYn())
                    .beforeDeployApplyYn(el.getRuleApplyYn())
                    .afterDeployApplyYn(el.getDeployWaitStateAppyYn())
                    .ruleUpdateUserid(el.getRuleModifyYn().equals("N") ? null : updatedRuleInfo.getUpdateUserid())
                    .ruleUpdateDatetime(el.getRuleModifyYn().equals("N") ? null : updatedRuleInfo.getUpdateDatetime())
                    .regUserid(userId)
//                    .deployDatetime(deployDateTime)
                    .build());
            // TODO :: HIS 남기기
                double ruleVerno = updatedRuleInfo.getRuleVerno();
                String result = (ruleVerno < 1.01) ? "true" : "false";
                if (ruleVerno < 1.01) {
                    // TODO:: 신규건
                    ruleVerstionMapper.insertRuleHistory(updatedRuleInfo.getRuleid(), RuleManageConstants.RULE_NEW);
                    ruleVerstionMapper.insertRuleReturnItemHistory(updatedRuleInfo.getRuleid(), 1);
                    ruleVerstionMapper.insertRuleCondtionHistory(updatedRuleInfo.getRuleid(), 1);
                    ruleVerstionMapper.insertRuleCondtionPostFixObjHistory(updatedRuleInfo.getRuleid(), 1);
                    ruleVerstionMapper.insertRuleCondtionReturnItemHistory(updatedRuleInfo.getRuleid(), 1);
                } else {
                    // TODO :: 수정건
                    RuleVerstionVo ruleAsisVerstion = null;
                    RuleVerstionVo ruleTobeVerstion = null;
                    List<String> ruleversionchangecode = new ArrayList<>();
                    if(el.getRuleModifyYn().equals("Y")){
                        ruleAsisVerstion = ruleVerstionMapper.findRuleAsisVerstionInfo(updatedRuleInfo.getRuleid(), ruleVerno- 1);
                        ruleAsisVerstion.setRuleReturnItemVerstion(ruleVerstionMapper.findRuleAsisVerstionItem(updatedRuleInfo.getRuleid(), ruleVerno - 1));
                        ruleAsisVerstion.setRuleConditionVerstion(ruleVerstionMapper.findRuleAsisVerstionConditon(updatedRuleInfo.getRuleid(), ruleVerno- 1));

                        ruleTobeVerstion = ruleVerstionMapper.findRuleTobeVerstionInfo(updatedRuleInfo.getRuleid());
                        ruleTobeVerstion.setRuleReturnItemVerstion(ruleVerstionMapper.findRuleTobeVerstionItem(updatedRuleInfo.getRuleid()));
                        ruleTobeVerstion.setRuleConditionVerstion(ruleVerstionMapper.findRuleTobeVerstionConditon(updatedRuleInfo.getRuleid()));

                        if (!ruleAsisVerstion.equals(ruleTobeVerstion)) {
                            ruleversionchangecode.add(RuleManageConstants.RULE_INFO_UPDATE);
                        }
                        if (!ruleAsisVerstion.getRuleReturnItemVerstion().equals(ruleTobeVerstion.getRuleReturnItemVerstion())) {
                            ruleversionchangecode.add(RuleManageConstants.RULE_RETURN_ITEM_UPDATE);
                        }
                        if (!ruleAsisVerstion.getRuleConditionVerstion().equals(ruleTobeVerstion.getRuleConditionVerstion())) {
                            ruleversionchangecode.add(RuleManageConstants.RULE_CONDITON_UPDATE);
                        }

                    }else{
                        if (el.getRuleModifyYn().equals("N") && el.getDeployWaitStateAppyYn().equals("N")) {
                            ruleversionchangecode.add(RuleManageConstants.RULE_USE_TO_UNUSED);
                        }
                        if (el.getRuleModifyYn().equals("N") && el.getDeployWaitStateAppyYn().equals("Y")) {
                            ruleversionchangecode.add(RuleManageConstants.RULE_UNUSED_TO_USED);
                        }
                    }
                    ruleVerstionMapper.insertRuleHistory(updatedRuleInfo.getRuleid(), String.join(",", ruleversionchangecode));
                    ruleVerstionMapper.insertRuleReturnItemHistory(updatedRuleInfo.getRuleid(), updatedRuleInfo.getRuleVerno());
                    ruleVerstionMapper.insertRuleCondtionHistory(updatedRuleInfo.getRuleid(), updatedRuleInfo.getRuleVerno());
                    ruleVerstionMapper.insertRuleCondtionPostFixObjHistory(updatedRuleInfo.getRuleid(), updatedRuleInfo.getRuleVerno());
                    ruleVerstionMapper.insertRuleCondtionReturnItemHistory(updatedRuleInfo.getRuleid(), updatedRuleInfo.getRuleVerno());
            }

        });

        return 0;
    }
    public String findRecentDeploy(){
        return ruleMapper.findRecentDeploy();
    }

    public List<RuleDeployHistoryVo> findRuleDeployHis(ParamRule.FindRuleDeployHis param){
        return ruleMapper.findRuleDeployHis(param);
    }


    public List<UsedItemInfo> findDeployHisUsedItem(String ruleId, String ruleVerno){
        return ruleMapper.findDeployHisUsedItem(ruleId,ruleVerno);
    }
    public List<UsedRuleDetailInfo> findDeployHisUsedRule(String ruleId, String ruleVerno){
        return ruleMapper.findDeployHisUsedRule(ruleId,ruleVerno);
    }

}
