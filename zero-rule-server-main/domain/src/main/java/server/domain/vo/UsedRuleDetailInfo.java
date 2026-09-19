package server.domain.vo;

import lombok.Data;

/**
 * RULE 메타 용어
 */
@Data
public class UsedRuleDetailInfo {
    private String useGubun;
    private String ruleid;
    private String ruleNm;
    private String ruleState;
    private String updateUserid;
    private String updateDatetime;
    private String ruleApplyYn;
}
