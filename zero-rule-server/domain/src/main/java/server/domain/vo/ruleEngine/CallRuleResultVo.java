package server.domain.vo.ruleEngine;

import lombok.Data;

import java.util.List;

/**
 * 룰vo
 */
@Data
public class CallRuleResultVo {
    private String ruleId;
    private float ruleVerNo;
    private String resCode;
    private String inspectionYn;
    private List<CallRuleReturnItemVo> ruleReturnList;
}
