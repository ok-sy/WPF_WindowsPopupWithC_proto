package server.repo.core.mapper;

import cl.cloverframework.filemanager.ICLFileMapper;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.lang.Nullable;
import server.sql.ParamsPdsFile;
import server.domain.entity.PdsFile;

import java.util.Collection;
import java.util.List;

/**
 * PdsFile MyBatis 매퍼 인터페이스.
 */
@Mapper
public interface PdsFileMapper extends ICLFileMapper<PdsFile> {
    /**
     * PdsFile 등록
     */
    void insert(PdsFile pdsFile);

    /**
     * 파일의 pdsId 업데이트
     */
    int updatePdsIdById(ParamsPdsFile.UpdatePdsIdById params);

    /**
     * fileId로 단건 조회
     */
    @Nullable
    @Override
    PdsFile findById(String fileId);


    /**
     * PDS ID로 파일 목록 조회
     */
    List<PdsFile> findByPdsId(@Param("pdsId") long pdsId);

    /**
     * FILE ID 들로 카운트
     * 존재하는지 여부 체크용
     */
    int countByFileIdIn(Collection<String> fileIds);

    /**
     * FILE ID 들로 삭제 마킹
     */
    int updateDeleteMarkByFileIdIn(Collection<String> fileIds);

    /**
     * PDS ID로 삭제 마킹
     */
    int updateDeleteMarkByPdsId(long pdsId);

    /**
     * FILE ID로 삭제
     */
    int deleteById(String fileId);

    /**
     * pdsId로 fileId 목록 조회
     *
     * @param pdsId PDS ID
     * @return fileId 목록
     */
    List<String> findFileIdByPdsId(long pdsId);

    /**
     * 파일명 변경
     */
    int updateFileNameById(ParamsPdsFile.UpdateFileNameById params);

    /**
     * 존재 여부 체크
     *
     * @param fileId 파일ID
     * @return 존재하면 true를 리턴
     */
    boolean existsById(String fileId);
}
