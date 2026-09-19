package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.springframework.lang.Nullable;
import server.domain.vo.TeamForUserVo;
import server.domain.vo.TeamVo;

import java.util.List;

public class TeamPayloads {

    @Schema(description = "Team 목록 조회 요청 - 페이징")
    @Data
    public static class TeamListRequest {

        @Nullable
        @Schema(description = "팀명", nullable = true)
        private String teamNm;
    }

    @Schema(description = "Team 조회 응답 리스트")
    @Data
    @Builder
    public static class TeamListResponse {
        @Schema(description = "팀 조회 리스트")
        private List<TeamVo> teamList;

    }

    @Schema(description = "Team 신규 등록 요청")
    @Data
    public static class TeamRegRequest {

        @Nullable
        @Schema(description = "팀명")
        private String teamNm;

        @Nullable
        @Schema(description = "팀설명")
        private String teamExpl;

        @Schema(description = "개인설정허용여부")
        private String psnlStupAcceYn;

        @Nullable
        @Schema(description = "팀공통 설정 내용")
        private String teamCmmnStupCn;

        @Schema(description = "팀상태")
        private long teamStat;

        @Schema(description = "TEAM 업무 구분")
        private long teamTskClsf;

        @Schema(description = "등록자ID", nullable = true)
        private long regrId;

        @Schema(description = "수정자ID", nullable = true)
        private long chgrId;

    }

    @Schema(description = "Team 등록 처리 응답")
    @Data
    @Builder
    public static class TeamRegResponse {

        @Nullable
        @Schema(description = "등록건수")
        private int instCnt;
    }

    @Schema(description = "Team 정보 수정")
    @Data
    public static class TeamUpdateRequest {

        @Schema(description = "팀ID")
        private String teamId;

        @Nullable
        @Schema(description = "팀명")
        private String teamNm;

        @Nullable
        @Schema(description = "팀설명")
        private String teamExpl;

        @Schema(description = "TEAM 업무 구분")
        private long teamTskClsf;

    }

    @Schema(description = "Team 수정 처리 응답")
    @Data
    @Builder
    public static class TeamUpdateResponse {

        @Nullable
        @Schema(description = "수정건수", nullable = true)
        private int uptCnt;
    }

    @Schema(description = "Team 정보 응답")
    @Data
    @Builder
    public static class TeamInfoResponse {
        @Schema(description = "Team 데이터")
        private TeamVo team;
    }

    @Schema(description = "Team 정보 응답")
    @Data
    @Builder
    public static class FindUserForTeamResponse {
        @Schema(description = "Team 데이터")
        private List<TeamForUserVo> teamForUser;
    }
}
