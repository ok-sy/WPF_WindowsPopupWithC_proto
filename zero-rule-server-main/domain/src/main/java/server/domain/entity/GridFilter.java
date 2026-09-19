package server.domain.entity;

import lombok.Data;

@Data
public class GridFilter {
    /**
     * 	그리드 필터 ID
     */
    private long filterId;
    /**
     * 	필터명
     */
    private String filterNm;
    /**
     * 	사용자ID
     */
    private long userId;
    /**
     * 	화면 코드
     */
    private String pageCode;
    /**
     * 	텍스트필터모드여부
     */
    private String filterModeYn;
    /**
     * 	기본필터 설정여부
     */
    private String defaultYn;
}
