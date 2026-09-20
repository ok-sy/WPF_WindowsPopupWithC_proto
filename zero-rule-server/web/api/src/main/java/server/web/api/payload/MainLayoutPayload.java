package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import server.domain.vo.*;

import java.util.List;

public class MainLayoutPayload {

    @Schema(description = "분당 URL 호출 갯수 응답 데이터")
    @Builder
    @Data
    public static class GetMinuteUrlRequestCntResponse {
        @Schema(description = "분당 URL 호출 응답 데이터")
        private List<GetDateUrlRequestCntVo> list;
    }

    @Schema(description = "시간별 URL 호출 갯수 응답 데이터")
    @Builder
    @Data
    public static class GetHourUrlRequestCntResponse {
        @Schema(description = "시간별 URL 호출 응답 데이터")
        private List<GetDateUrlRequestCntVo> list;
    }

    @Schema(description = "일별 URL 호출 갯수")
    @Builder
    @Data
    public static class GetDateUrlRequestCntResponse {
        @Schema(description = "시간별 URL 호출 응답 데이터")
        private List<GetDateUrlRequestCntVo> list;
    }

    @Schema(description = "월별 URL 호출 갯수")
    @Builder
    @Data
    public static class GetMonthlyUrlRequestCntResponse {
        @Schema(description = "월별 URL 호출 응답 데이터")
        private List<GetDateUrlRequestCntVo> list;
    }

    @Schema(description = "URL별 수행속도 오랜걸린 순서 TOP10")
    @Builder
    @Data
    public static class GetProcessingSpeedByUrlRequestCntResponse {
        @Schema(description = "URL별 수행속도 오랜걸린 순서 TOP10 응답 데이터")
        private List<GetMainChartProcessingSpeedByUrlVo> list;
    }

    @Schema(description = "URL별 호출빈도 많은순서 TOP 10")
    @Builder
    @Data
    public static class GetFrequentlyCalledUrlRequestCntResponse {
        @Schema(description = "URL별 호출빈도 많은순서 TOP 10 응답 데이터")
        private List<GetMainChartFrequentlyCalledUrlVo> list;
    }

    @Schema(description = "분당 URL 호출 갯수 응답 데이터")
    @Builder
    @Data
    public static class GetDateServiceAvgResponseTimeResponse {
        @Schema(description = "분당 URL 호출 응답 데이터")
        private List<GetDateServiceAvgResponeTimeVo> list;
    }

    @Schema(description = "지연시간 응답")
    @Builder
    @Data
    public static class GetDateServiceLateTimeResponse {
        @Schema(description = "지연시간 응답 데이터")
        private List<GetDateServiceLateTimeVo> list;
    }

    @Schema(description = "업무별 사용량 응답")
    @Builder
    @Data
    public static class UsedTaskResponse {
        @Schema(description = "지연시간 응답 데이터")
        private List<UsedTaskVo> list;
    }
}
