package server.web.api;

import cl.cloverframework.CLException;
import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.base.logger.IAppLogger;
import server.domain.vo.TeamForUserVo;
import server.domain.vo.TeamVo;
import server.service.core.CmmnService;
import server.service.core.TeamService;
import server.sql.ParamsTeam;
import server.web.api.payload.TeamPayloads;
import server.web.support.ApiBaseController;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Tag(name = DocTags.TEAM)
@RestController
@Slf4j
@SuppressWarnings("unused")
public class TeamController extends ApiBaseController {

    @Autowired
    TeamService teamService;

    @Autowired
    CmmnService cmmnService;

    /**
     * App 로거
     */
    @Autowired
    private IAppLogger appLogger;

    @Operation(
            summary = "팀 리스트 다건조회 ",
            description = "팀 리스트 다건 조회<br/>" +
                    "<b>[에러코드]</b><br/>" +
                    "E1_NO_SUCH_DATA: 해당 자료가 없습니다.<br/>"

    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, User 목록 다건 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TeamPayloads.TeamListResponse.class)
            )
    )
    @PostMapping(value = "/apis/team/list")
    public CLNewApiResponse<TeamPayloads.TeamListResponse> teamList(
            @RequestBody TeamPayloads.TeamListRequest payload
    ) {

        List<TeamVo> teamList = teamService.findTeamBySearchParams(
                ParamsTeam.FindTeamVoByParam.builder()
                        .teadNm(payload.getTeamNm())
                        .build()
        );

        if (teamList.isEmpty()) {
            return resultMsg("BE00000013");
        }

        return resultMsg("BE00000001",
                TeamPayloads.TeamListResponse.builder()
                        .teamList(teamList)
                        .build()
        );
    }

    @Operation(
            summary = "팀 신규 등록",
            description = "팀 신규로 등록한다." +
                    "<b>[에러코드]</b><br/>" +
                    "E1_NO_INSERT_ERR: 등록 중 오류 발생하였습니다.<br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TeamPayloads.TeamRegResponse.class)
            )
    )
    @PostMapping(value = "/apis/team/create")
    public CLNewApiResponse<TeamPayloads.TeamRegResponse> create(
            @RequestBody TeamPayloads.TeamRegRequest payload
    ) {
        int regCnt = 0;

        try {

            byte[] stupCn = payload.getTeamCmmnStupCn().getBytes(StandardCharsets.UTF_16LE);

            regCnt = teamService.create(
                    ParamsTeam.Create.builder()
                            .teamNm(payload.getTeamNm())
                            .teamExpl(payload.getTeamExpl())
                            .psnlStupAcceYn(payload.getPsnlStupAcceYn())
                            .teamCmmnStupCn(stupCn)
                            .teamStat(payload.getTeamStat())
                            .teamTskClsf(payload.getTeamTskClsf())
                            .build()
            );

            if (regCnt == 0) {
                return resultMsg("BE00000057");
            }
        } catch (DuplicateKeyException e) {
            appLogger.devWarning("ERRMSG:" + e.getMessage(), "");
            return resultMsg("BE00000030");
        } catch (Exception e) {
            appLogger.devWarning("ERRMSG:" + e.getMessage(), "");
            return resultMsg("BE00000007");
        }

        return resultMsg("BE00000001",
                TeamPayloads.TeamRegResponse.builder()
                        .instCnt(regCnt)
                        .build()
        );

    }

    @Operation(
            summary = "팀 정보 수정",
            description = "팀 정보 수정한다." +
                    "<b>[에러코드]</b><br/>" +
                    "E1_NO_INSERT_ERR: 등록 중 오류 발생하였습니다.<br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TeamPayloads.TeamUpdateResponse.class)
            )
    )
    @PostMapping(value = "/apis/team/update")
    public CLNewApiResponse<TeamPayloads.TeamUpdateResponse> update(
            @RequestBody TeamPayloads.TeamUpdateRequest payload
    ) {
        int uptCnt = 0;

        try {
            uptCnt = teamService.update(
                    ParamsTeam.Update.builder()
                            .teamId(payload.getTeamId())
                            .teamNm(payload.getTeamNm())
                            .teamExpl(payload.getTeamExpl())
                            .teamTskClsf(payload.getTeamTskClsf())
                            .build()
            );

            if (uptCnt != 1) {
                return resultMsg("BE00000058");
            }
        } catch (CLException e) {
            appLogger.devWarning(e.getMsg(), "");
            return resultMsg("BE00000007");
        }

        return resultMsg("BE00000001",
                TeamPayloads.TeamUpdateResponse.builder()
                        .uptCnt(uptCnt)
                        .build()
        );
    }

    @Operation(
            summary = "팀 정보 단건 조회",
            description = "팀 정보 단건 조회한다." +
                    "<b>[에러코드]</b><br/>" +
                    "E1_NO_SUCH_DATA: 해당 자료가 없습니다.<br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TeamPayloads.TeamInfoResponse.class)
            )
    )
    @PostMapping(value = "/apis/team/info")
    public CLNewApiResponse<TeamPayloads.TeamInfoResponse> info(
            @RequestParam("teamId") Long teamId
    ) {
        TeamVo team = teamService.findTeamVoByTeamId(teamId);
        if (team == null) {
            // 해당 자료가 없습니다.
            return resultMsg("BE00000013");
        }

        return resultMsg("BE00000001",
                TeamPayloads.TeamInfoResponse.builder()
                        .team(team)
                        .build()
        );
    }

    @Operation(
            summary = "팀별 사용자 조회",
            description = "팀별 사용자 조회한다."
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TeamPayloads.FindUserForTeamResponse.class)
            )
    )
    @PostMapping(value = "/apis/team/user-list")
    public CLNewApiResponse<TeamPayloads.FindUserForTeamResponse> teamForUserList(
            @RequestParam("teamId") Long teamId
    ){
        List<TeamForUserVo> teamForUser = teamService.findUserForTeam(teamId);
        return resultMsg("BE00000001",
                TeamPayloads.FindUserForTeamResponse.builder()
                        .teamForUser(teamForUser)
                        .build()
        );
    }

}
