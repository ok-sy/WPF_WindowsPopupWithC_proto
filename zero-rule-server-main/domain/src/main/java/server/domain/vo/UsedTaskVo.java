package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 업무별 사용량 응답데이터
 */
@Data
public class UsedTaskVo {

    @Schema(description = "업무")
    private String task;
    @Schema(description = "건수")
    private long cnt;


}
