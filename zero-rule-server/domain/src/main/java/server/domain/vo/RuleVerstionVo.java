package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.Instant;
import java.util.List;

/**
 */
@Data
@EqualsAndHashCode(exclude = {"ruleReturnItemVerstion","ruleConditionVerstion"})
public class RuleVerstionVo {
    private String ruleid;
    private String ruleNm;
    private String rulealiasNm;
    private String ruleDesc;
    private String rulereturnType;
    private String rulesortCd;
    private String ruleusageCd;
    private String allreturnYn;
    private String useYn;
    private int ruleVerno;
    private String activateYn;
    private String activateDatetime;
    private String ruleState;
    private String deployDatetime;
    private String deployUserid;
    private String ifid;
    private int firstregUserid;
    private String firstregDatetime;
    private String updateUserid;
    private String updateDatetime;
    private String ruleversionchangecode;
    private String ruleApplyYn;
    private String deployWaitStateAppyYn;
    private List<RuleReturnItemVerstionVo> ruleReturnItemVerstion;
    private List<RuleConditionVerstionVo> ruleConditionVerstion;
}
