package server.web.auth;

import cl.cloverframework.api.CLApiResponse;
import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import server.base.BuildVars;
import server.base.DocTags;
import server.service.core.UserService;
import server.web.support.ApiBaseController;
import server.web.support.payload.UserProfileResponse;

import static server.service.UserSecurityUtils.currentUserId;

@Tag(name = DocTags.AUTH)
@RestController
public class ProfileMeController extends ApiBaseController {

    @Autowired
    private UserService userService;

    @Operation(
        summary = "로그인 사용자 프로필 조회",
        description = "로그인 사용자의 프로필을 조회합니다"
    )
    @ApiResponse(
        responseCode = "200",
        description = "성공 응답, 로그인한 사용자의 프로필을 응답한다",
        content = @Content(
            mediaType = "application/json",
            schema = @Schema(implementation = UserProfileResponse.class)
        )
    )
    @PostMapping(value = BuildVars.ApiUrls.profileMe)
    public CLNewApiResponse<UserProfileResponse> profileMe(
    ) {
        long userId = currentUserId();
        return resultMsg("BE00000001",
            UserProfileResponse.builder()
                .profile(
                    userService.findUserProfileByUserId(userId)
                )
                .build()
        );
    }
}
