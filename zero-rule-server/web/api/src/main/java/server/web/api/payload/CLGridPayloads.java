package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import server.domain.vo.GridListVo;
import server.sql.ParamCLGrid;

import java.util.List;

public class CLGridPayloads {

    @Data
    public static class GridInsertRequest {
        @Schema(description = "필터 데이터")
        private ParamCLGrid.InsertFilter filter;
        @Schema(description = "컬럼 데이터")
        private List<ParamCLGrid.InsertColumn> columns;
    }

    @Data
    @Builder
    public static class GridListResponse {
        private List<GridListVo> list;
    }

    @Data
    public static class UpdateDefaultYnRequest {
        @Schema(description = "페이지 코드")
        private String pageCode;

        @Schema(description = "필터명",nullable = true)
        private String filterNm;

        @Schema(description = "default값")
        private String defaultYn;
    }

    @Data
    public static class DeleteGridRequest {
        @Schema(description = "페이지 코드")
        private String pageCode;

        @Schema(description = "필터명")
        private String filterNm;
    }
}
