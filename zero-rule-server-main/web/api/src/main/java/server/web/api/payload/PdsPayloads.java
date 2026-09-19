package server.web.api.payload;

import cl.cloverframework.impl.domain.vo.CLPagerData;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.hibernate.validator.constraints.Length;
import server.domain.vo.PdsSimpleVo;
import server.domain.vo.PdsVo;

import java.util.Collections;
import java.util.List;


public class PdsPayloads {
    @Schema(description = "Pds 등록 요청")
    @Data
    public static class PdsCreateRequest {

        @Length(min = 1, max = 100)
        @Schema(description = "제목")
        private String title;

        @Length(min = 1)
        @Schema(description = "내용")
        private String substance;

        @Schema(description = "첨부파일ID 목록")
        private List<String> fileIds = Collections.emptyList();
    }

    @Schema(description = "Pds 수정 요청")
    @Data
    public static class PdsUpdateRequest {
        @Schema(description = "PDS ID")
        private long pdsId;

        @Length(min = 1, max = 100)
        @Schema(description = "제목")
        private String title;

        @Length(min = 1)
        @Schema(description = "내용")
        private String substance;

        @Schema(description = "첨부파일ID 목록")
        private List<String> fileIds = Collections.emptyList();
    }

    @Schema(description = "Pds 목록 조회 요청 - 페이징")
    @Data
    public static class PdsPageRequest {

        @Schema(description = "페이지 번호, 첫번째 페이지가 0번")
        private int pageNumber;

        @Schema(description = "페이지당 데이터 건수")
        private int rowsPerPage;

        @Length(max = 10)
        @Schema(description = "검색할 제목, 없으면 null", nullable = true)
        private String title;
    }

    @Schema(description = "Pds 목록 조회 응답 - 페이징")
    @Data
    @Builder
    public static class PdsPageResponse {
        @Schema(description = "페이지 데이터")
        private CLPagerData<PdsSimpleVo> pagerData;
    }

    @Schema(description = "Pds Simple 데이터 응답")
    @Data
    @Builder
    public static class PdsSimpleInfoResponse {
        @Schema(description = "Pds Simple 데이터")
        private PdsSimpleVo pds;
    }


    @Schema(description = "Pds 데이터 응답")
    @Data
    @Builder
    public static class PdsInfoResponse {
        @Schema(description = "Pds 데이터")
        private PdsVo pds;
    }

}
