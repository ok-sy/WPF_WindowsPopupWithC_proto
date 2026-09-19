package server.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 메타 단어
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RuleDeployHistoryVo {
    private String deployDatetime;
    private String beforeDeployApplyYn;
    private String afterDeployApplyYn;
    private String ruleUpdateYn;
    private String ifid;
    private String ruleid;
    private String ruleNm;

    private int ruleCallD3;
    private int ruleCheckD3;

    private String deployUserid;
    private String usedItemCnt;
    private String usedRuleCnt;
    private String ruleVerno;
}
