package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.hibernate.validator.constraints.Length;
import server.domain.vo.LockVo;

import java.util.List;

public class LockPayloads {

    @Schema(description = "락 정보 응답 데이터")
    @Builder
    @Data
    public static class LockListResponse {
        @Schema(description = "락 테이블 목록")
        private List<LockVo> locks;
    }

    @Schema(description = "락 테이블 요청 데이터")
    @Data
    public static class LockListRequest {
        @Length(max = 100)
        @Schema(description = "Lock 종류", nullable = true)
        private String lockcode;

        @Length(max = 100)
        @Schema(description = "아이디", nullable = true)
        private String userid;

        @Length(max = 100)
        @Schema(description = "이름", nullable = true)
        private String userNm;


    }

    @Schema(description = "삭제된 개수")
    @Builder
    @Data
    public static class LockDeleteResponse {
        @Schema(description = "삭제된 개수")
        private Long result;
    }

    @Schema(description = "삭제할 키 목록리스트")
    @Data
    public static class LockDeleteRequest {

        @Schema(description = "삭제목록", nullable = true)
        private List<String> delList;

    }


    @Schema(description = "등록된 개수")
    @Builder
    @Data
    public static class LockInsertResponse {
        @Schema(description = "등록된 개수")
        private Long result;
    }

    @Schema(description = "등록정보")
    @Data
    public static class LockInsertRequest {

        private String lockcode;

        private String lockkey;

        private String locktypecode;

        private String locknote;

    }

    @Schema(description = "해당사용자에 대한 락 상태 응답")
    @Builder
    @Data
    public static class RuleForUserLockResponse {
        @Schema(description = "해당사용자에 대한 락 상태 응답데이터")
        private int result;
    }

    @Schema(description = "삭제된 개수")
    @Builder
    @Data
    public static class DepLockDeleteResponse {
        @Schema(description = "삭제된 개수")
        private int result;
    }

    @Schema(description = "삭제할 키 목록리스트")
    @Data
    public static class DepLockDeleteRequest {

        @Schema(description = "삭제목록", nullable = true)
        private String delKey;
    }

    @Schema(description = "삭제된 개수")
    @Builder
    @Data
    public static class RuleDeplockCheckResponse {
        @Schema(description = "")
        private int result;
    }
}
