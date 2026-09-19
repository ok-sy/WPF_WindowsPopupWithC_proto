package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * RULE 메타 용어
 */
@Data
public class ItemMgmtCheckNmVo {
    @Schema(description ="건수")
    private int cnt;


}
