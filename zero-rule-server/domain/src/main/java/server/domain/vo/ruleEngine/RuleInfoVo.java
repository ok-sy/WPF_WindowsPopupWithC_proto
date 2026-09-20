package server.domain.vo.ruleEngine;

import lombok.Data;
/**
 * 룰vo
 */
@Data
public class RuleInfoVo {
    private String ruleConfigType;
    private String ruleId;
    private String ruleAliasNm;
    private String ruleNm;
    private String ruleSortCd;
    private String ruleReturnType;
    private String allReturnYn;
    private int conditionCount;
    private int returnItemCount;
    private int ruleConditionNo;
    private String conditionInfixDesc;
    private String conditionPostfixDesc;
    private String returnValue;
    private String returnDataType;
    private String itemNm;
    private String itemAliasNm;
    private String itemId;
    private int returnItemNo;
    private String returnItemExprDesc;
    private String useYn;
    private float ruleVerNo;
}
