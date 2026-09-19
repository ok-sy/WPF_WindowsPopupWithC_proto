package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class RuleInfoConditionVo {

    private String itemNm;

    private String datatypeCd;

    @Schema(description = "조건식번호")
    private int ruleconditionno;

    @Schema(description = "반환값")
    private String returnitemExprDesc;

    @Schema(description = "중위식조건")
    private String conditionInfixDesc;

    @Schema(description = "후위식조건")
    private String conditionPostfixDesc;

    @Schema(description = "설명")
    private String conditionDesc;

    @Schema(description = "반환항목 ID")
    private String returnItemid;
}
