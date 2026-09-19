package server.web.api;

import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.service.core.MainLayoutService;
import server.web.api.payload.MainLayoutPayload;
import server.web.support.ApiBaseController;

@Tag(name = DocTags.MAIN_LAAYOUT)
@RestController
@Slf4j
@SuppressWarnings("unused")
public class MainLayoutController extends ApiBaseController {
    @Autowired
    MainLayoutService mainLayoutService;

    @Operation(
            summary = "시간별 URL 호출 갯수조회",
            description = "시간별 URL 호출 갯수 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 시간별 URL 호출 갯수 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetMinuteUrlRequestCntResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-minute-url-request-cnt")
    public CLNewApiResponse<MainLayoutPayload.GetMinuteUrlRequestCntResponse> getMinuteUrlRequestCntList(
            @RequestParam("hour") @Nullable String hour
    ) {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetMinuteUrlRequestCntResponse.builder()
                        .list(mainLayoutService.getMinuteUrlRequestCnt(hour))
                        .build());
    }

    @Operation(
            summary = "시간별 URL 호출 갯수조회",
            description = "시간별 URL 호출 갯수 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 시간별 URL 호출 갯수 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetHourUrlRequestCntResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-hour-url-request-cnt")
    public CLNewApiResponse<MainLayoutPayload.GetHourUrlRequestCntResponse> getHourUrlRequestCntList(
            @RequestParam("day") @Nullable String day
    ) {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetHourUrlRequestCntResponse.builder()
                        .list(mainLayoutService.getHourUrlRequestCnt(day))
                        .build());
    }

    @Operation(
            summary = "일별 URL 호출 갯수조회",
            description = "일별 URL 호출 갯수 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 일별 URL 호출 갯수 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetDateUrlRequestCntResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-day-url-request-cnt")
    public CLNewApiResponse<MainLayoutPayload.GetDateUrlRequestCntResponse> getDayUrlRequestCntList(
            @RequestParam("month") @Nullable String month
    ) {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetDateUrlRequestCntResponse.builder()
                        .list(mainLayoutService.getDayUrlRequestCnt(month))
                        .build());
    }

    @Operation(
            summary = "월별 URL 호출 갯수조회",
            description = "월별 URL 호출 갯수 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 월별 URL 호출 갯수 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetMonthlyUrlRequestCntResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-month-url-request-cnt")
    public CLNewApiResponse<MainLayoutPayload.GetMonthlyUrlRequestCntResponse> getMonthlyUrlRequestCntList() {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetMonthlyUrlRequestCntResponse.builder()
                        .list(mainLayoutService.getMonthlyUrlCallCnt())
                        .build());
    }

    @Operation(
            summary = "URL별 수행속도 오래걸린 순서 TOP 10 조회",
            description = "URL별 수행속도 오래걸린 순서 TOP 10을 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, URL별 수행속도 오래걸린 순서 TOP 10을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetProcessingSpeedByUrlRequestCntResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-processing-speed-url-request-cnt")
    public CLNewApiResponse<MainLayoutPayload.GetProcessingSpeedByUrlRequestCntResponse> getProcessingSpeedByUrlUrlRequestCntList() {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetProcessingSpeedByUrlRequestCntResponse.builder()
                        .list(mainLayoutService.getProcessingSpeedByUrl())
                        .build());
    }

    @Operation(
            summary = "URL별 호출빈도 많은순서 TOP 10 조회",
            description = "URL별 호출빈도 많은순서 TOP 10을 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, URL별 호출빈도 많은순서 TOP 10을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetFrequentlyCalledUrlRequestCntResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-frequently-called-url-request-cnt")
    public CLNewApiResponse<MainLayoutPayload.GetFrequentlyCalledUrlRequestCntResponse> getFrequentlyCalledUrlRequestCntList() {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetFrequentlyCalledUrlRequestCntResponse.builder()
                        .list(mainLayoutService.getFrequentlyCalledUrl())
                        .build());
    }

    @Operation(
            summary = "월별 서비스 평균 응답시간조회",
            description = "월별 서비스 평균 응답시간 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 월별 서비스 평균 응답시간 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetDateServiceAvgResponseTimeResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-month-service-avg-response-time")
    public CLNewApiResponse<MainLayoutPayload.GetDateServiceAvgResponseTimeResponse> getMonthServiceAvgResponseTime() {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetDateServiceAvgResponseTimeResponse.builder()
                        .list(mainLayoutService.getMonthServiceAvgResponseTime())
                        .build());
    }

    @Operation(
            summary = "일별 서비스 평균 응답시간조회",
            description = "일별 서비스 평균 응답시간 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 일별 서비스 평균 응답시간 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetDateServiceAvgResponseTimeResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-day-service-avg-response-time")
    public CLNewApiResponse<MainLayoutPayload.GetDateServiceAvgResponseTimeResponse> getDayServiceAvgResponseTime(
            @RequestParam("month") @Nullable String month
    ) {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetDateServiceAvgResponseTimeResponse.builder()
                        .list(mainLayoutService.getDayServiceAvgResponseTime(month))
                        .build());
    }

    @Operation(
            summary = "시간별 서비스 평균 응답시간조회",
            description = "시간별 서비스 평균 응답시간 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 시간별 서비스 평균 응답시간 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetDateServiceAvgResponseTimeResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-hour-service-avg-response-time")
    public CLNewApiResponse<MainLayoutPayload.GetDateServiceAvgResponseTimeResponse> getHourServiceAvgResponseTime(
            @RequestParam("day") @Nullable String day
    ) {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetDateServiceAvgResponseTimeResponse.builder()
                        .list(mainLayoutService.getHourServiceAvgResponseTime(day))
                        .build());
    }

    @Operation(
            summary = "분당 서비스 평균 응답시간조회",
            description = "분당 서비스 평균 응답시간 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 분당 서비스 평균 응답시간 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetDateServiceAvgResponseTimeResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-min-service-avg-response-time")
    public CLNewApiResponse<MainLayoutPayload.GetDateServiceAvgResponseTimeResponse> getMinServiceAvgResponseTime(
            @RequestParam("hour") @Nullable String hour
    ) {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetDateServiceAvgResponseTimeResponse.builder()
                        .list(mainLayoutService.getMinServiceAvgResponseTime(hour))
                        .build());
    }

    @Operation(
            summary = "월별 서비스 지연시간조회",
            description = "월별 서비스 지연시간 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 월별 서비스 지연시간 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetDateServiceLateTimeResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-month-service-late-time")
    public CLNewApiResponse<MainLayoutPayload.GetDateServiceLateTimeResponse> getMonthServiceLateTime() {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetDateServiceLateTimeResponse.builder()
                        .list(mainLayoutService.getMonthServiceLateTime())
                        .build());
    }

    @Operation(
            summary = "일별 서비스 지연시간조회",
            description = "일별 서비스 지연시간 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 일별 서비스 지연시간조회 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetDateServiceLateTimeResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-day-service-late-time")
    public CLNewApiResponse<MainLayoutPayload.GetDateServiceLateTimeResponse> getDayServiceLateTime(
            @RequestParam("month") @Nullable String month
    ) {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetDateServiceLateTimeResponse.builder()
                        .list(mainLayoutService.getDayServiceLateTime(month))
                        .build());
    }

    @Operation(
            summary = "시간별 서비스 지연시간조회",
            description = "시간별 서비스 지연시간 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 시간별 서비스 지연시간조회 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetDateServiceLateTimeResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-hour-service-late-time")
    public CLNewApiResponse<MainLayoutPayload.GetDateServiceLateTimeResponse> getHourServiceLateTime(
            @RequestParam("day") @Nullable String day
    ) {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetDateServiceLateTimeResponse.builder()
                        .list(mainLayoutService.getHourServiceLateTime(day))
                        .build());
    }

    @Operation(
            summary = "분당 서비스 지연시간조회",
            description = "분당 서비스 지연시간 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 분당 서비스 지연시간조회 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.GetDateServiceLateTimeResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/get-min-service-late-time")
    public CLNewApiResponse<MainLayoutPayload.GetDateServiceLateTimeResponse> getMinServiceLateTime(
            @RequestParam("hour") @Nullable String hour
    ) {
        return resultMsg("BE00000001",
                MainLayoutPayload.GetDateServiceLateTimeResponse.builder()
                        .list(mainLayoutService.getMinServiceLateTime(hour))
                        .build());
    }

    @Operation(
            summary = "업무별 사용량 조회",
            description = "업무별 사용량 조회한다" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 업무별 사용량 조회 목록을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = MainLayoutPayload.UsedTaskResponse.class)
            )
    )
    @PostMapping("/apis/main-layout/used-task")
    public CLNewApiResponse<MainLayoutPayload.UsedTaskResponse> usedTask() {
        return resultMsg("BE00000001",
                MainLayoutPayload.UsedTaskResponse.builder()
                        .list(mainLayoutService.usedTask())
                        .build());
    }
}
