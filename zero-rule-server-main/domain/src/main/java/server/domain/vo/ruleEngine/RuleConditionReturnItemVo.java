package server.domain.vo.ruleEngine;

import lombok.Data;

import java.util.ArrayList;

/**
 * 룰조건식리턴항목Vo
 */
@Data
public class RuleConditionReturnItemVo {
    private String ruleId;
    private int ruleConditionNo;
    private String returnItemId;
    private int returnItemNo;
    private String returnDataType;
    private String returnItemExprDesc;
    private String itemNm;
    private String itemAliasNm;
    private ArrayList<String> outputDataList;
}
