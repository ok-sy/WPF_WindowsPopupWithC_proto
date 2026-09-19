package server.web.api;

import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.base.logger.IAuditLogger;
import server.domain.vo.CLUserVo;
import server.service.UserSecurityUtils;
import server.service.core.CmmnService;
import server.service.core.SequenceService;
import server.service.core.UserService;
import server.sql.ParamsCLUser;
import server.web.api.payload.UserManagePayloads;
import server.web.support.ApiBaseController;

import java.time.Instant;


@Tag(name = DocTags.USER)
@RestController
@SuppressWarnings("unused")
public class UserManageApiController extends ApiBaseController {

    @Autowired
    UserService userService;

    @Autowired
    SequenceService sequenceService;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    CmmnService cmmnService;

    @Autowired
    IAuditLogger auditLogger;

    /**
     * 사용자 정보 조회
     */
    private UserManagePayloads.UserInfoResponse userInfoResponse(long userId) {
        return UserManagePayloads.UserInfoResponse.builder()
            .user(userService.findUserVoByUserId(userId))
            .build();
    }

    @Operation(
        summary = "User 목록 조회 - 페이징",
        description = "User 목록을 페이지 형태로 조회합니다"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, User 목록을 페이지 형태로 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = UserManagePayloads.UserPageResponse.class)
        )
    )
    @PostMapping(value = "/apis/user-manage/list")
    public CLNewApiResponse<UserManagePayloads.UserPageResponse> list(
        @RequestBody UserManagePayloads.UserPageRequest payload
    ) {

        return resultMsg("BE00000001",
            UserManagePayloads.UserPageResponse.builder()
                .pagerData(
                    userService.findPage(
                        payload.getPageNumber(),
                        payload.getRowsPerPage(),
                        payload.getUserName(),
                        payload.getLgonId(),
                        payload.getKeyword()
                    )
                )
                .build()
        );
    }

    @Operation(
        summary = "사용자 신규 등록",
        description = "사용자 신규로 등록한다."
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = UserManagePayloads.UserInfoResponse.class)
        )
    )
    @PostMapping(value = "/apis/user-manage/create")
    public CLNewApiResponse<UserManagePayloads.UserInfoResponse> create(
        @RequestBody UserManagePayloads.UserRegRequest payload
    ) {

        // 시퀀스채번방식
        long userId = sequenceService.nextUserId();

        // test용
        String pswd = "1111";

        // 세션정보 가져오기
//        String regId = "";
//        CLUser user = super.getSession();
//        if(user == null) {
//            regId = " ";
//        } else {
//            regId = user.getLgonId();
//        }

        userService.regUser(
            userId,
            payload.getLgonId(),
            pswd,
            payload.getUserName(),
            payload.getUserState(),
            Instant.now(),
            //" ",
            payload.getBryyMndy(),
            payload.getUserTno(),
            payload.getUserExno(),
            payload.getUserGd(),
            payload.getCtiUserNtno(),
            payload.getPrtPosbYn(),
            payload.getDwnlPosbYn(),
            payload.getAtntYn(),
            payload.getMemo(),
            payload.getTeamId()
        );

        return resultMsg("BE00000001",
            userInfoResponse(userId)
        );

    }

    @Operation(
        summary = "사용자 기본 정보 업데이트",
        description = "사용자의 기본 정보를 업데이트한다."
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, CLUserVo를 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = UserManagePayloads.UserInfoResponse.class)
        )
    )
    @PostMapping(value = "/apis/user-manage/update")
    public CLNewApiResponse<UserManagePayloads.UserInfoResponse> update(
        @RequestBody UserManagePayloads.UserUpdateRequest payload
    ) {


        //권한체크
//        boolean userPriv = cmmnService.findUserPriv(payload.getUserId(), 0016,"U");
//        if(userPriv){
//            // 해당 서비스 권한이 없습니다.
//            return errorResult(AppError.E1_PAGE_PRIV_ERR);
//        }

        long userId = payload.getUserId();

        // TODO validation

        userService.updateUser(
            ParamsCLUser.Update.builder()
                .userId(payload.getUserId())
                .userNm(payload.getUserName())
                .userState(payload.getUserState())
                .pswdInitYn(payload.getPswdInitYn())
                .bryyMndy(payload.getBryyMndy())
                .userTno(payload.getUserTno())
                .userExno(payload.getUserExno())
                .userGd(payload.getUserGd())
                .ctiUserNtno(payload.getCtiUserNtno())
                .prtPosbYn(payload.getPrtPosbYn())
                .dwnlPosbYn(payload.getDwnlPosbYn())
                .atntYn(payload.getAtntYn())
                .memo(payload.getMemo())
                .teamId(payload.getTeamId())
                .chgrId(UserSecurityUtils.currentLgonIdOrNull())
                .build()
        );

        return resultMsg("BE00000001",
            userInfoResponse(userId)
        );

    }

    @Operation(
        summary = "사용자 기본 정보 단건 조회",
        description = "사용자의 기본 정보 단건 조회한다."
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, CLUserVo를 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = UserManagePayloads.UserInfoResponse.class)
        )
    )
    @PostMapping(value = "/apis/user-manage/info")
    public CLNewApiResponse<UserManagePayloads.UserInfoResponse> info(
        @RequestParam("userId") Long userId
    ) {
        CLUserVo user = userService.findUserVoByUserId(userId);
        if (user == null) {
            // 해당 사용자가 없습니다
            return resultMsg("BE00000014");
        }

        return resultMsg("BE00000001",
            UserManagePayloads.UserInfoResponse.builder()
                .user(user)
                .build()
        );
    }

    @Operation(
        summary = "사용자 비밀번호 초기화 상태로 변경",
        description = "사용자의 비밀번호 초기화 상태로 변경 한다."
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, CLUserVo를 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = UserManagePayloads.UserInfoResponse.class)
        )
    )
    @PostMapping(value = "/apis/user-manage/initpw")
    public CLNewApiResponse<UserManagePayloads.UserInfoResponse> initPswd(
        @RequestBody UserManagePayloads.UserInitPswdRequest payload
    ) {

        userService.updatePswdByAdmin(
            ParamsCLUser.UpdatePswdByAdmin.builder()
                .userId(payload.getUserId())
                .pswd(passwordEncoder.encode(payload.getPswd()))
                .chgrId(UserSecurityUtils.currentLgonIdOrNull())
                .build()
        );
        auditLogger.userInitPswd(payload.getUserId());
        return resultMsg("BE00000001",
            userInfoResponse(payload.getUserId())
        );
    }
}
