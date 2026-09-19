package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.lang.Nullable;
import server.sql.ParamsPds;
import server.domain.entity.Pds;
import server.domain.vo.PdsSimpleVo;
import server.domain.vo.PdsVo;

import java.util.List;

/**
 * Pds MyBatis 매퍼 인터페이스.
 */
@Mapper
public interface PdsMapper {

    /**
     * Pds 등록
     */
    void insert(Pds pds);

    /**
     * Pds 업데이트
     */
    int update(Pds pds);

    /**
     * 첨부파일 개수 업데이트
     */
    int updateAttachFileCount(long pdsId);

    /**
     * Pds 단건 조회
     */
    @Nullable
    Pds findById(long pdsId);


    /**
     * PdsSimpleVo 단건 조회
     */
    @Nullable
    PdsSimpleVo findSimpleVoById(long pdsId);

    /**
     * PdsVo 단건 조회
     */
    @Nullable
    PdsVo findVoById(@Param("pdsId") long pdsId);

    /**
     * PDS 페이지 조회
     */
    List<PdsSimpleVo> findPage(ParamsPds.FindPageSearch params);

    /**
     * PDS 페이지 조회 - 전체 데이터 건수
     */
    long countForPage(ParamsPds.FindPageSearch params);


    /**
     * 게시물 존재 여부 체크
     */
    boolean existsById(long pdsId);

    /**
     * PdsId로 게시물 삭제
     *
     * @param pdsId PDS ID
     * @return 삭제 건수
     */
    int deleteById(long pdsId);

    /**
     * PDS 페이지 조회
     */
    List<PdsSimpleVo> findDocPage(ParamsPds.FindPageSearch params);

    /**
     * PDS 페이지 조회 - 전체 데이터 건수
     */
    long countForDocPage(ParamsPds.FindPageSearch params);
}
