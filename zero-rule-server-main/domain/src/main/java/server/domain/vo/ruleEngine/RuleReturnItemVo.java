package server.domain.vo.ruleEngine;

import lombok.Data;

/**
 * 룰리턴항목Vo
 */
@Data
public class RuleReturnItemVo {
    private String ruleId;
    private String returnItemId;
    private String returnItemNm;
    private String returnItemAliasNm;
    private String ruleReturnDataType;
    private int returnItemNo;
}
