package server.domain.vo.ruleEngine;

import lombok.Data;

import java.util.ArrayList;

/**
 * 룰리턴항목리스트Vo
 */
@Data
public class RuleReturnItemListVo {
    private String ruleId;
    private ArrayList<RuleReturnItemVo> ruleReturnItemList;
}
