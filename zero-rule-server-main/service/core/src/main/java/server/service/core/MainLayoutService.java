package server.service.core;

import org.apache.ibatis.annotations.Param;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import server.domain.vo.*;
import server.repo.core.mapper.MainLayoutMapper;

import java.util.List;

@Service
public class MainLayoutService {

    @Autowired
    MainLayoutMapper mainLayoutMapper;

    /**
     * 분당 URL 호출 갯수
     */
    public List<GetDateUrlRequestCntVo> getMinuteUrlRequestCnt(@Nullable String hour) {
        return mainLayoutMapper.getMinuteUrlRequestCnt(hour);
    }

    /**
     * 시간별 URL 호출 갯수
     */
    public List<GetDateUrlRequestCntVo> getHourUrlRequestCnt(@Nullable String day) {
        return mainLayoutMapper.getHourUrlRequestCnt(day);
    }

    /**
     * 일별 URL 호출 갯수
     */
    public List<GetDateUrlRequestCntVo> getDayUrlRequestCnt(@Nullable String month) {
        return mainLayoutMapper.getDayUrlRequestCnt(month);
    }
    /**
     * 월별 URL 호출 갯수
     */
    public List<GetDateUrlRequestCntVo> getMonthlyUrlCallCnt() {
        return mainLayoutMapper.getMonthlyUrlCallCnt();
    }
    /**
     * URL별 수행속도 오래걸린 순서 TOP 10
     */
    public List<GetMainChartProcessingSpeedByUrlVo> getProcessingSpeedByUrl() {
        return mainLayoutMapper.getProcessingSpeedByUrl();
    }
    /**
     * URL별 호출빈도 많은순서 TOP 10
     */
    public List<GetMainChartFrequentlyCalledUrlVo> getFrequentlyCalledUrl() {
        return mainLayoutMapper.getFrequentlyCalledUrl();
    }

    /**
     * 월별 서비스 평균 응답시간
     */
    public List<GetDateServiceAvgResponeTimeVo> getMonthServiceAvgResponseTime(){
        return mainLayoutMapper.getMonthServiceAvgResponseTime();
    }

    /**
     * 일별 서비스 평균 응답시간
     */
    public List<GetDateServiceAvgResponeTimeVo> getDayServiceAvgResponseTime(@Nullable @Param("month") String month){
        return mainLayoutMapper.getDayServiceAvgResponseTime(month);
    }

    /**
     * 시간별 서비스 평균 응답시간
     */
    public List<GetDateServiceAvgResponeTimeVo> getHourServiceAvgResponseTime(@Nullable @Param("day") String day){
        return mainLayoutMapper.getHourServiceAvgResponseTime(day);
    }

    /**
     * 분당 서비스 평균 응답시간
     */
    public List<GetDateServiceAvgResponeTimeVo> getMinServiceAvgResponseTime(@Nullable @Param("hour") String hour){
        return mainLayoutMapper.getMinServiceAvgResponseTime(hour);
    }

    /**
     * 월별 서비스 지연시간
     */
    public List<GetDateServiceLateTimeVo> getMonthServiceLateTime(){
        return mainLayoutMapper.getMonthServiceLateTime();
    }

    /**
     * 일별 서비스 지연시간
     */
    public List<GetDateServiceLateTimeVo> getDayServiceLateTime(@Nullable @Param("month") String month){
        return mainLayoutMapper.getDayServiceLateTime(month);
    }

    /**
     * 시간별 서비스 지연시간
     */
    public List<GetDateServiceLateTimeVo> getHourServiceLateTime(@Nullable @Param("day") String day){
        return mainLayoutMapper.getHourServiceLateTime(day);
    }

    /**
     * 분당 서비스 지연시간
     */
    public List<GetDateServiceLateTimeVo> getMinServiceLateTime(@Nullable @Param("hour") String hour){
        return mainLayoutMapper.getMinServiceLateTime(hour);
    }

    /**
     * 업무별 사용량
     */
    public List<UsedTaskVo> usedTask(){
        return mainLayoutMapper.usedTask();
    }
}
