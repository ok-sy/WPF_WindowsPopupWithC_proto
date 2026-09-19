package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.hibernate.validator.constraints.Length;
import org.springframework.lang.Nullable;
import server.domain.entity.UserPageRolePrivList;
import server.domain.vo.CodeVo;

import java.util.List;

public class CmmnPayloads {
    @Schema(description = "테이블 검색 요청 데이터")
    @Data
    public static class CmmnCdSearchRequest {
        @Length(max = 30)
        @Nullable
        @Schema(description = "테이블명")
        private String tableName;

        @Length(max = 30)
        @Nullable
        @Schema(description = "컬럼명")
        private String columnName;

        @Length(max = 4000)
        @Nullable
        @Schema(description = "컬럼설명")
        private String comments;
    }

    @Schema(description = "테이블 목록 응답 데이터")
    @Builder
    @Data
    public static class CmmnCdListResponse {
        @Schema(description = "코드 목록")
        private List<CodeVo> codeList;
    }

    @Schema(description = "테이블 목록 응답 데이터")
    @Builder
    @Data
    public static class CmmnCdListResponse2 {
        @Schema(description = "코드유형")
        private String codeType;

        @Schema(description = "코드")
        private String code;

        @Schema(description = "코드명")
        private String codeNm;

        @Schema(description = "코드설명")
        private String dtlExpl;
    }

    @Schema(description = "사용자페이지롤권한유형 여부 목록 응답 데이터")
    @Builder
    @Data
    public static class UserPageRolePrivListResponse {
        @Schema(description = "권한유형 목록")
        private List<UserPageRolePrivList> privList;
    }
}
