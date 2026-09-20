package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 메타 단어
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RuleDeployWaitVo {
    private String ruleApplyYn;
    private String ruleModifyYn;
    private String deployWaitStateAppyYn;
    private String ifid;
    private String ruleid;
    private String ruleVerno;
    private String ruleNm;
    private String updateUserid;
    private String updateDatetime;
    private String deployWaitUserid;
    private String deployWaitDatetime;
    private String usedItemCnt;
    private String usedRuleCnt;
    private String recentDeployDate;
}
