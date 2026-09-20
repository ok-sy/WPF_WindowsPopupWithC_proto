package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 메타 단어
 */
@Data
public class RuleNameVo {
    @Schema(description = "")
    private String ruleNm;

    @Schema(description = "")
    private String ruleid;
}
