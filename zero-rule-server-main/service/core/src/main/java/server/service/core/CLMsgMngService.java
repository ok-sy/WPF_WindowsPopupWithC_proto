package server.service.core;

import cl.cloverframework.CLException;
import cl.cloverframework.impl.domain.vo.CLPagerData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.entity.CLMsgMng;
import server.repo.core.mapper.CLMsgMngMapper;
import server.sql.ParamsCLMsgMng;

import java.util.List;

@Service
public class CLMsgMngService {
    @Autowired
    CLMsgMngMapper clMsgMngMapper;

    /**
     * 메시지 목록 조회 - 페이징
     */
    @NonNull
     public CLPagerData<CLMsgMng> findMsgPage(
         int rowsPerPage,
         int pageNumber,
         @Nullable String msgClsf,
         @Nullable String tskClsfCd,
         @Nullable String occrClsfCd,
         @Nullable long teamId,
         @Nullable String msgId,
         @Nullable String msgCn
     ) {
//         ThreadLocal threadLocal = new ThreadLocal<>();
//         threadLocal.get();

         ParamsCLMsgMng.FindPage params = ParamsCLMsgMng.FindPage.builder()
             .rowsPerPage(rowsPerPage)
             .pageNumber(pageNumber)
             .msgClsf(msgClsf)
             .tskClsfCd(tskClsfCd)
             .occrClsfCd(occrClsfCd)
             .teamId(teamId)
             .msgId(msgId)
             .msgCn(msgCn)
             .build();

         List<CLMsgMng> elements = clMsgMngMapper.findMsgPage(params); // 목록 조회
         long totalElements = clMsgMngMapper.countForMsgPage(params); // 전체 건수 조회

         return new CLPagerData<>(
             elements,
             totalElements,
             pageNumber,
             rowsPerPage
         );
     }

    /**
     * 메시지 등록
     */
    @Transactional
    public int insert(ParamsCLMsgMng.Insert params) {
        // 임시
//        lock.lock(); // 잠금
        int insertCnt=0;

        insertCnt = clMsgMngMapper.insert(params);
        // 등록된 데이터가 없을경우
        if (insertCnt <= 0) {
            // BE00000026:등록 중 오류가 발생하였습니다
            throw new CLException("BE00000026","등록 처리된 데이터가 없습니다.");
        }

//        lock.unlock(); // 잠금헤제
        return insertCnt;
    }

    /**
     * 메시지 수정
     */
    @Transactional
    public int update(ParamsCLMsgMng.Update params) {
        int uptCnt = clMsgMngMapper.update(params);

        if (uptCnt <= 0) {
            throw new CLException("BE00000007","수정된 데이터가 없습니다.");
        }
        return uptCnt;
    }

    /**
     * 사용여부 수정
     */
    @Transactional
    public int updateUseYn(ParamsCLMsgMng.UpdateUseYn params) {
        return clMsgMngMapper.updateUseYn(params);
    }
}
