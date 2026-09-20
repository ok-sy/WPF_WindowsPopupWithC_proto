package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class CodeVo {
    @Schema(description = "코드유형")
    private String codeType;

    @Schema(description = "코드")
    private String code;

    @Schema(description = "코드명")
    private String codeNm;

    @Schema(description = "코드설명")
    private String dtlExpl;
}
