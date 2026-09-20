package server.repo.core.mapper;

import org.apache.ibatis.annotations.Param;
import server.domain.entity.ItemMgmt;
import server.domain.vo.*;
import org.apache.ibatis.annotations.Mapper;
import server.sql.ParamRule;

import java.util.List;

@Mapper
public interface RuleMapper {

    List<InterfaceVo> findInterFaces() ;
    List<RuleVo> findRulesByInterfaceId(ParamRule.RuleTreeSearch params) ;


    List<RuleNameVo> findRuleNameAndIdList() ;

    RuleVo findRuleInfoByRuleid(@Param("ruleid") String ruleid,@Param("rulealiasNm") String rulealiasNm) ;

    List<RuleReturnItemAndItemInfoVo> findRuleReturnItemByRuleid(String ruleid);
//
//    /**
//     * 룰관리 상세 - RULE
//     * @param ruleid
//     * @return RuleInfoRuleVo
//     */
    RuleInfoRuleVo ruleInfoForRule(String ruleid);

    /**
     * 룰관리 상세 - RULE 반환 리스트
     * @param ruleid
     * @return RuleInfoRuleReturnVo
     */
    List<ItemMgmt> ruleInfoForRuleReturn(String ruleid);

    RuleVo findRuleDetailInfoByRuleid(String ruleid);

    /**
     * 룰관리 상세 - 조건식 리스트
     * @param ruleid
     * @return RuleInfoConditionVo
     */
    List<RuleInfoConditionVo> ruleInfoForCondition(String ruleid);


    /**
     * 룰 수정 - 조건식 리스트
     * @param param
     * @return RuleInfoConditionVo
     */
//    int updateRuleInfo(ParamRule.InputRuleInfo param);
//    int itemReturnDelAll(String ruleid);
//    int conditionDelAll(String ruleid);

    int insertRuleInfo(ParamRule.InsertRuleInfo param);
    int insertRuleReturnInfo(ParamRule.InsertRuleReturn param);

    int insertRulecondition(ParamRule.InsertRuleCondition param);
    int updateRulecondition(ParamRule.InsertRuleCondition param);
    int insertRuleconditionreturnitem(ParamRule.InsertRuleconditionreturnitem param);
    int updateRuleconditionreturnitem(ParamRule.InsertRuleconditionreturnitem param);

    int insertRuleConditionPostfixObject(ParamRule.InsertRuleconditionPostfixobject param);
    int insertRuleconditionReturnPostfixobject(ParamRule.InsertRuleconditionReturnPostfixobject param);



   List<RuleInfoConditionVo> ruleConditionInfo(String ruleid) ;

     String ruleInputItemIdToName(String itemId) ;

     String newMainRuleIdSeq();

     String newSubRuleIdSeq();

     List<String> ruleReturnItemInfo(String ruleid);



    String selectRuleIdToNm(String value);

    String selectItemIdToNm(@Param("itemNm") String itemNm, @Param("ifid") String ifid);

    int updateRuleInfo(ParamRule.InsertRuleInfo value);

    int deleteRuleReturnItem(String value);
    int deleteRuleCondition(String value);
    int deleteRuleConditionObject(String value);
    int deleteRuleConditionReturnItem(String value);
    int deleteRuleConditionReturnItemObject(String value);


    List<ParamRule.InsertRuleconditionPostfixobject> selectRuleConObj(String value);
    List<ParamRule.InsertRuleconditionReturnPostfixobject> selectRuleReturnConObj(String value);

    String ruleObjNextValInfo(ParamRule.SelectRuleObjType param);

     String findReturnItemDataType(String value);

     String findItemDataType(String value) ;
    int countReturnItem(String value);

    int ruleActiveUpt(ParamRule.RuleActiveUpdate params);

    int ruleDel(String ruleid);

    int ruleTestSubmit(String ruleid);

    int findRuleForLock(ParamRule.FindRuleForLock params);

    int updateRuleState(@Param("ruleid") String ruleid,
                        @Param("ruleState") String ruleState,
                        @Param("userId") Long userId,
                        @Param("ruleApplyYn") String ruleApplyYn
            );


    int updateRuleVerno(@Param("ruleid") String ruleid,
                        @Param("ruleVerno") double ruleVerno
                        );

    Long getRuleVernoOrNew(String value);

    RuleVo findRuleList(String value);

    List<RuleConditionInfixDescVo> ruleConditionInfixDesc(String value);


    int ruleProgressHistoryInsert(ParamRule.InsertRuleProgress param);
    List<RuleProgressHistoryVo> ruleProgressHstSelect(String ruleid);

    int ruleDeploy( @Param("ruleid") String ruleid,@Param("ruleApplyYn") String ruleApplyYn);
    int ruleDeployCancel( @Param("ruleid") String ruleid);

    String selectRuleState(String value);

    List<RuleDeployWaitVo> findDeployWaitRule();

    List<UsedItemInfo> findUsedItem(String value);
    List<UsedRuleDetailInfo> findUsedRule(String value);

    String findRecentDeploy();

    List<RuleDeployHistoryVo> findRuleDeployHis(ParamRule.FindRuleDeployHis param);


    List<UsedItemInfo> findDeployHisUsedItem(@Param("ruleid") String ruleId, @Param("ruleVerno") String ruleVerno);
    List<UsedRuleDetailInfo> findDeployHisUsedRule(@Param("ruleid") String ruleId, @Param("ruleVerno") String ruleVerno);


    int selectRuleNmDupCnt(@Param("ruleNm")String ruleNm, @Param("ruleid") String ruleid);

    int selectRuleAliasDupCnt(@Param("rulealiasNm")String rulealiasNm, @Param("ruleid") String ruleid);

}
