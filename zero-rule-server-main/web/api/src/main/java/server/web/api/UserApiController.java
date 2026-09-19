package server.web.api;

import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.base.logger.IAuditLogger;
import server.service.PasswordValidator;
import server.service.core.UserService;
import server.sql.ParamsCLUser;
import server.web.api.payload.UserPayloads;
import server.web.support.ApiBaseController;
import server.web.support.payload.UserProfileResponse;

import static server.service.UserSecurityUtils.currentUserId;

@Tag(name = DocTags.USER)
@RestController
@SuppressWarnings("unused")
public class UserApiController extends ApiBaseController {

    @Autowired
    UserService userService;

    @Autowired
    IAuditLogger auditLogger;
    /**
     * 사용자 정보 조회
     */
    private UserProfileResponse userInfoResponse(long userId) {
        return UserProfileResponse.builder()
            .profile(userService.findUserProfileByUserId(userId))
            .build();
    }

    @Operation(
        summary = "사용자 비밀번호 변경",
        description = "사용자의 비밀번호가 초기화되어있으면 비밀번호를 변경한다"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답 아이디 응답",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = UserProfileResponse.class)
        )
    )
    @PostMapping(value = "/api/user/update-pwd")
    public CLNewApiResponse<UserProfileResponse> updatePwd(
        @RequestBody UserPayloads.UserPswdRequest payload
    ) {
        long userId = currentUserId();

        if (!StringUtils.hasText(payload.getOldPswd())) {
            return resultMsg("FW00000003");
        }

        // 비밀번호가 일치하지 않습니다
        if (!userService.matchPasswdByUserId(userId, payload.getOldPswd())) {
            return resultMsg("BE00000016");
        }

        // TODO 신규 비밀번호의 유효성 체크
        if (!PasswordValidator.isValidPassword(payload.getPswd())) {
            return resultMsg("BE00000015");
        }

        userService.updateMyPswd(
            ParamsCLUser.UpdatePswd.builder()
                .userId(userId)
                .pswd(payload.getPswd())
                .build()
        );
        auditLogger.userUpdatePswd();
        return resultMsg("BE00000001",
            userInfoResponse(userId)
        );
    }

}
