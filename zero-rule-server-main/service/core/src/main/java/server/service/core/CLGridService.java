package server.service.core;

import cl.cloverframework.CLException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.domain.entity.GridColumn;
import server.domain.entity.GridFilter;
import server.domain.vo.GridListVo;
import server.repo.core.mapper.CLGridMapper;
import server.sql.ParamCLGrid;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class CLGridService {
    @Autowired
    CLGridMapper clGridMapper;

    /**
     * 필터정보 등록
     */
    @Transactional
    public int gridInsert(ParamCLGrid.InsertFilter filter, List<ParamCLGrid.InsertColumn> column,long userId){
        int filterCnt=0;
        long seq = clGridMapper.seqGridFilter();
        // 필터 목록 조회
        List<GridFilter> filterList = clGridMapper.filterList(userId,filter.getPageCode(),null);

        // 필터명 중복체크
        boolean filterNameExists = filterList.stream()
                .anyMatch(el -> filter.getFilterNm().equals(el.getFilterNm()));
        if(filterNameExists){
            throw new CLException("BE00000087","중복된 필터명입니다.");
        }
        // 필터정보 등록
        filterCnt=clGridMapper.insertFilter(
                ParamCLGrid.InsertFilter.builder()
                        .filterId(seq)
                        .filterNm(filter.getFilterNm())
                        .userId(userId)
                        .pageCode(filter.getPageCode())
                        .filterModeYn(filter.getFilterModeYn())
                        .defaultYn(filter.getDefaultYn())
                        .build());
        if(filterCnt == 0){
            throw new CLException("BE00000026","등록 중 오류가 발생하였습니다");
        }
        // 컬럼 정보 등록
        column.forEach(el -> {

            clGridMapper.insertColumn(
                    ParamCLGrid.InsertColumn.builder()
                            .columnId(el.getColumnId())
                            .filterId(seq)
                            .visiableYn(el.getVisiableYn())
                            .filteringText(el.getFilteringText())
                            .filteringOperCode(el.getFilteringOperCode())
                            .columnSeq(el.getColumnSeq())
                            .columnTypeCode(el.getColumnTypeCode())
                            .sortingInfo(el.getSortingInfo())
                            .build()
            );
        });
        return filterCnt;
    }

    /**
     * 그리드 조회
     */
    public List<GridListVo> gridList(long userId,String pageCode) {
        // 필터 목록 조회
        List<GridFilter> filterList = clGridMapper.filterList(userId,pageCode,null);

        return filterList.stream().map(filter -> {
            // 컬럼 목록 조회
            List<GridColumn> columnList = clGridMapper.columnList(filter.getFilterId());
            return GridListVo.builder()
                    .filterId(filter.getFilterId())
                    .filterNm(filter.getFilterNm())
                    .userId(filter.getUserId())
                    .pageCode(filter.getPageCode())
                    .filterModeYn(filter.getFilterModeYn())
                    .defaultYn(filter.getDefaultYn())
                    .columns(columnList)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * default_yn 변경
     */
    @Transactional
    public int updateDefaultYn(ParamCLGrid.UpdateDefaultYn params, String yN) {
        if(yN.equals("N")){
            clGridMapper.updateDefaultYnAllN(params.getPageCode(),params.getUserId());
            return 0;
        }else{
            clGridMapper.updateDefaultYnAllN(params.getPageCode(),params.getUserId());
            clGridMapper.updateDefaultYnY(params.getFilterNm(),params.getPageCode(),params.getUserId());
            return 1;
        }
    }

    /**
     * 그리드 삭제
     */
    @Transactional
    public int deleteGrid(ParamCLGrid.DelGridFilter params){
        List<GridFilter> filterList = clGridMapper.filterList(params.getUserId(),params.getPageCode(),params.getFilterNm());
        long filterId = filterList.get(0).getFilterId();

        clGridMapper.delColumn(filterId);
        clGridMapper.delFilter(filterId);
        return 1;
    }
}
