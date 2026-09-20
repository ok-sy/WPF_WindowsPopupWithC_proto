package server.domain.vo.ruleEngine;

import lombok.Data;

/**
 * 룰항목vo
 */
@Data
public class RuleItemVo {
    private String itemId;
    private String itemAliasNm;
    private String itemNm;
    private String dataTypeCd;
}
