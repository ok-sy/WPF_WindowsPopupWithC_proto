package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import server.sql.ParamsCommonFile;
import server.domain.vo.CommonFileVo;

import java.util.List;

/**
 * 파일 테이블의 공통 삭제 로직을 처리하기 위한 Mapper
 * 삭제 마킹을 처리
 * 테이블명을 파라미터로 받는다.
 * 테이블에 file_id, del_yn, changed_at 컬럼이 존재해야 한다
 */
@Mapper
public interface CommonFileMapper {
    /**
     * 삭제 마킹된 파일 목록 조회
     */
    List<String> findDeleteMarkedFileIds(@NonNull ParamsCommonFile.FindDeleteMarkedFiles params);

    /**
     * 파라미터에 지정한 파일ID를 삭제
     */
    int deleteByFileIdIn(@NonNull ParamsCommonFile.DeleteByFileIdIn params);

    @Nullable
    CommonFileVo findByFileId(@NonNull ParamsCommonFile.FindByFileId params);
}
