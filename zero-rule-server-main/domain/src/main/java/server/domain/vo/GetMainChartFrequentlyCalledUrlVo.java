package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * URL별 호출빈도 많은 순서 탑10
 */
@Data
public class GetMainChartFrequentlyCalledUrlVo {

    @Schema(description = "API호출URL")
    private String apiUrl;
    @Schema(description = "API호출URL이름")
    private String apiUrlNm;
    @Schema(description = "최대응답시간")
    private double cnt;


}
