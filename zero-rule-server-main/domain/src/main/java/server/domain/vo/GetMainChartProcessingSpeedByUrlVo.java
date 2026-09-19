package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * URL별 수행속도 오래걸린 순서 탑10
 */
@Data
public class GetMainChartProcessingSpeedByUrlVo {

    @Schema(description = "API호출URL")
    private String apiUrl;
    @Schema(description = "API호출URL이름")
    private String apiUrlNm;
    @Schema(description = "수행시간")
    private int procTmMax;


}
