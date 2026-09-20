package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RuleInfoRuleVo {
    @Schema(description = "인터페이스명")
    private String ifNm;

    @Schema(description = "룰 버전")
    private long ruleVerno;

    @Schema(description = "룰 상태")
    private String ruleState;

    @Schema(description = "룰 명")
    private String ruleNm;

    @Schema(description = "룰 설명")
    private String ruleDesc;

    @Schema(description = "룰 종류")
    private String rulesortCd;

    @Schema(description = "룰 구분")
    private String ruleusageCd;

    @Schema(description = "수정자명")
    private String updateUserid;

    @Schema(description = "수정일시")
    private String updateDatetime;

    @Schema(description = "리턴 형식")
    private String rulereturnType;

    @Schema(description = "계속점검여부(만족하는모든리턴항목반환여부)")
    private String allreturnYn;
    @Schema(description = "계속점검여부(만족하는모든리턴항목반환여부)")
    private String activateYn;
}
