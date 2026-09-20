package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.Instant;

/**
 * 메타 단어
 */
@Data
public class RuleVo {
    @Schema(description = "")
    private String ruleNm;

    @Schema(description = "")
    private String ruleid;
    @Schema(description = "")

    private String rulealiasNm;

    @Schema(description = "")
    private String ruleDesc;

    @Schema(description = "")
    private String rulereturnType;

    @Schema(description = "")
    private String updateDatetime;

    @Schema(description = "")
    private String updateUserid;

    @Schema(description = "")
    private String rulesortCd;

    @Schema(description = "")
    private String ruleusageCd;

    @Schema(description = "")
    private String firstregUserid;

    @Schema(description = "")
    private String firstregDatetime;

    @Schema(description = "")
    private String allreturnYn;

    @Schema(description = "")
    private String useYn;

    @Schema(description = "")
    private String ifid;

    @Schema(description = "")
    private double ruleVerno;

    @Schema(description = "")
    private String activateYn;

    @Schema(description = "")
    private String activateDatetime;

    @Schema(description = "")
    private String ruleState;

    @Schema(description = "")
    private String deployDatetime;

    @Schema(description = "")
    private String deployUserid;

    private String ruleApplyYn;
    private String deployWaitStateAppyYn;
    private String treeIconType;
}
