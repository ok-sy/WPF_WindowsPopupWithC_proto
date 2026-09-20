package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import server.domain.entity.ItemMgmt;
import server.domain.vo.*;
import server.sql.ParamRule;

import java.util.List;

@Mapper
public interface RuleVerstionMapper {
    RuleVerstionVo findRuleAsisVerstionInfo(@Param("ruleid") String ruleid, @Param("currentRuleVer") double currentRuleVer);

    List<RuleReturnItemVerstionVo> findRuleAsisVerstionItem(@Param("ruleid") String ruleid, @Param("currentRuleVer") double currentRuleVer);

    List<RuleConditionVerstionVo> findRuleAsisVerstionConditon(@Param("ruleid") String ruleid, @Param("currentRuleVer") double currentRuleVer);

    RuleVerstionVo findRuleTobeVerstionInfo(String ruleid);
    List<RuleReturnItemVerstionVo> findRuleTobeVerstionItem(String ruleid);
    List<RuleConditionVerstionVo> findRuleTobeVerstionConditon(String ruleid);


    void insertRuleHistory(@Param("ruleid") String ruleid, @Param("ruleversionchangecode") String ruleversionchangecode);

    void insertRuleReturnItemHistory(@Param("ruleid") String ruleid, @Param("ruleVerno") double ruleVerno);

    void insertRuleCondtionHistory(@Param("ruleid") String ruleid, @Param("ruleVerno") double ruleVerno);

    void insertRuleCondtionPostFixObjHistory(@Param("ruleid") String ruleid, @Param("ruleVerno") double ruleVerno);

    void insertRuleCondtionReturnItemHistory(@Param("ruleid") String ruleid, @Param("ruleVerno") double ruleVerno);

    List<RuleVerstionVo> findRuleAsisVerstion(String ruleid);

    List<RuleReturnItemVerstionVo> findRuleItemHistory(String ruleid);

    List<RuleConditionVerstionVo> findRuleConditonHistory(String ruleid);

    void insertRuleDeployHst(ParamRule.InsertRuleDeploy param);

    String findRecentDeploy();


}
