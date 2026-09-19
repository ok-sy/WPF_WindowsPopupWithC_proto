package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.Instant;

/**
 * RULE 메타 용어
 */
@Data
public class UsedRuleInfoVo {
    @Schema(description ="룰아이디")
    private String ruleid;

    @Schema(description ="룰명")
    private String ruleNm;

    @Schema(description ="현재상태")
    private String ruleState;

    @Schema(description ="영어명")
    private String activateYn;

}
