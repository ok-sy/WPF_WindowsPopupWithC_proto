package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.springframework.lang.Nullable;
import server.domain.entity.GridColumn;
import server.domain.entity.GridFilter;
import server.sql.ParamCLGrid;

import java.util.List;

@Mapper
public interface CLGridMapper {
    /**
     * 필터시퀀스 채번
     */
    long seqGridFilter();
    /**
     * 필터정보 등록
     */
    int insertFilter(ParamCLGrid.InsertFilter params);

    /**
     * 컬럼정보 등록
     */
    int insertColumn(ParamCLGrid.InsertColumn params);

    /**
     * 필터정보 조회
     */
    List<GridFilter> filterList(
            @Param("userId") long userId,
            @Param("pageCode") String pageCode,
            @Nullable @Param("filterNm") String filterNm);

    /**
     * 컬럼정보 조회
     */
    List<GridColumn> columnList(long filterId);

    /**
     * DEFAULT_YN 전체 N 변경
     */
    int updateDefaultYnAllN(
            @Param("pageCode") String pageCode,
            @Param("userId") long userId);

    /**
     * DEFAULT_YN Y 변경
     */
    int updateDefaultYnY(@Param("filterNm") String filterNm,
                         @Param("pageCode") String pageCode,
                         @Param("userId") long userId);

    /**
     * 그리드 컬럼 삭제
     */
    int delColumn(long filterId);

    /**
     * 그리드 필터 삭제
     */
    int delFilter(long filterId);
}
