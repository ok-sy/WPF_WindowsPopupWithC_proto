package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * RULE 메타 용어
 */
@Data
public class RuleProgressHistoryVo {
    private String ruleid;
    private double ruleVerno;
    private String ruleState;
    private String currentRuleApplyYn;
    private String deployWaitStateApplyYn;
    private String updateUserid;
    private String updateDatetime;
}
