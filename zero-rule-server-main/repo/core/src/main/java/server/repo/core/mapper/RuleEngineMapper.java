package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import server.domain.vo.ruleEngine.*;
import server.sql.ParamsRuleEngine;

import java.util.List;

@Mapper
public interface RuleEngineMapper {

    List<RuleInfoVo> ruleInfoList() ;

    List<RuleInfoVo> ruleTestInfoList();

    List<RuleItemVo> ruleItemList() ;

    List<PostfixExpressionVo> ruleConditionPostfixExpressionList();

    List<PostfixExpressionVo> ruleConditionReturnPostfixExpressionList();

    void insertLog(ParamsRuleEngine.InsertLog param);


}
