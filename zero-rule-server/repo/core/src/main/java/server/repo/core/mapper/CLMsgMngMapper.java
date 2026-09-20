package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import server.domain.entity.CLMsgMng;
import server.sql.ParamsCLMsgMng;

import java.util.List;

@Mapper
public interface CLMsgMngMapper {

    /**
     * 메시지 목록 조회 - 페이징
     */
    List<CLMsgMng> findMsgPage(ParamsCLMsgMng.FindPage params);

    /**
     * 데이터 건수 조회
     */
    long countForMsgPage(ParamsCLMsgMng.FindPage params);

    /**
     * 메시지 등록
     */
    // 임시
    int insert(ParamsCLMsgMng.Insert params);

    /**
     * 메시지 수정
     */
    int update(ParamsCLMsgMng.Update params);

    /**
     * 사용여부 수정
     */
    int updateUseYn(ParamsCLMsgMng.UpdateUseYn params);
}
