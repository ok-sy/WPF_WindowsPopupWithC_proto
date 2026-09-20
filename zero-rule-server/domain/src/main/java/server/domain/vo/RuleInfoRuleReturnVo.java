package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class RuleInfoRuleReturnVo {
    @Schema(description = "항목 아이디")
    private String itemid;

    @Schema(description = "순서")
    private int returnitemNo;

    @Schema(description = "반환항목명")
    private String itemNm;

    @Schema(description = "반환항목 별칭")
    private String itemaliasNm;

    @Schema(description = "데이터 타입")
    private String datatypeCd;

    @Schema(description = "수정구분")
    private String uptGubun;

    @Schema(description = "룰아이디")
    private String ruleid;
}
