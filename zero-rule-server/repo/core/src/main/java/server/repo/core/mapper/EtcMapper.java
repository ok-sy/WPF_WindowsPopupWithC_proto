package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;

import java.time.Instant;

/**
 * UserAccount MyBatis 매퍼 인터페이스.
 */
@Mapper
public interface EtcMapper {

    
    /**
     * 오래된 로그인 실패 이력 삭제
     */
    int deleteOldLoginFailByMaxRegDttmBefore(Instant maxRegDttm);
}
