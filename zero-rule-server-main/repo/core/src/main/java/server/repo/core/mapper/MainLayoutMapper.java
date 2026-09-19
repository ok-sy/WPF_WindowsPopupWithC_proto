package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.lang.Nullable;
import server.domain.vo.*;

import java.util.List;

@Mapper
public interface MainLayoutMapper {
    /**
     * 분당 URL 호출 갯수
     */
    List<GetDateUrlRequestCntVo> getMinuteUrlRequestCnt(@Nullable @Param("hour") String hour);

    /**
     * 시간별 URL 호출 갯수
     */
    List<GetDateUrlRequestCntVo> getHourUrlRequestCnt(@Nullable @Param("day") String day);

    /**
     * 일별 URL 호출 갯수
     */
    List<GetDateUrlRequestCntVo> getDayUrlRequestCnt(@Nullable @Param("month") String month);

    /**
     * 월별 URL 호출 갯수
     */
    List<GetDateUrlRequestCntVo> getMonthlyUrlCallCnt();

    /**
     * URL별 수행속도 오래걸린 순서 TOP 10
     */
    List<GetMainChartProcessingSpeedByUrlVo> getProcessingSpeedByUrl();

    /**
     * URL별 호출빈도 많은순서 TOP 10
     */
    List<GetMainChartFrequentlyCalledUrlVo> getFrequentlyCalledUrl();

    /**
     * 월별 서비스 평균 응답시간
     */
    List<GetDateServiceAvgResponeTimeVo> getMonthServiceAvgResponseTime();

    /**
     * 일별 서비스 평균 응답시간
     */
    List<GetDateServiceAvgResponeTimeVo> getDayServiceAvgResponseTime(@Nullable @Param("month") String month);

    /**
     * 시간별 서비스 평균 응답시간
     */
    List<GetDateServiceAvgResponeTimeVo> getHourServiceAvgResponseTime(@Nullable @Param("day") String day);

    /**
     * 분당 서비스 평균 응답시간
     */
    List<GetDateServiceAvgResponeTimeVo> getMinServiceAvgResponseTime(@Nullable @Param("hour") String hour);

    /**
     * 월별 서비스 지연시간
     */
    List<GetDateServiceLateTimeVo> getMonthServiceLateTime();

    /**
     * 일별 서비스 지연시간
     */
    List<GetDateServiceLateTimeVo> getDayServiceLateTime(@Nullable @Param("month") String month);

    /**
     * 시간별 서비스 지연시간
     */
    List<GetDateServiceLateTimeVo> getHourServiceLateTime(@Nullable @Param("day") String day);

    /**
     * 분당 서비스 지연시간
     */
    List<GetDateServiceLateTimeVo> getMinServiceLateTime(@Nullable @Param("hour") String hour);

    /**
     * 업무별 사용량
     */
    List<UsedTaskVo> usedTask();
}
