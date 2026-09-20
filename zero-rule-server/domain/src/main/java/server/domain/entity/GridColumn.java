package server.domain.entity;

import lombok.Data;

@Data
public class GridColumn {
    /**
     * 	컬럼ID
     */
    private String columnId;
    /**
     * 	그리드 필터 ID
     */
    private long filterId;
    /**
     * 	컬럼표시여부
     */
    private String visiableYn;
    /**
     * 	컬럼문자
     */
    private String filteringText;
    /**
     * 	필터링 연산자
     */
    private String filteringOperCode;
    /**
     * 	컬럼순번
     */
    private long columnSeq;
    /**
     * 	컬럼타입코드
     */
    private String columnTypeCode;
    /**
     * 	데이터정렬방식
     */
    private String sortingInfo;
}
