package server.domain.vo.ruleEngine;

import lombok.Data;

import java.util.List;

@Data
public class CallRuleParamVo {
    private CallRuleVo ruleInfo;
    private List<CallRuleItemVo> ruleItemList;
}
