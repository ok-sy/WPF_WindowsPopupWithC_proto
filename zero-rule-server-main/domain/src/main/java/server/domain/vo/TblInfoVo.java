package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TblInfoVo {
    @Schema(description = "테이블명")
    private String tableName;

    @Schema(description = "컬럼명")
    private String columnName;

    @Schema(description = "컬럼설명")
    private String comments;

    @Schema(description = "데이터타입")
    private String dataType;
}
