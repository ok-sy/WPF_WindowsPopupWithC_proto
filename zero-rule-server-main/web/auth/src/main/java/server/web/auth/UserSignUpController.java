package server.web.auth;

import cl.cloverframework.api.CLApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.base.props.AuthHeaderProps;
import server.base.props.ServerSecurityProps;
import server.domain.entity.CLUser;
import server.security.UserTokenProvider;
import server.service.core.SequenceService;
import server.service.core.UserService;
import server.web.support.ApiBaseController;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = DocTags.AUTH)
@RestController
public class UserSignUpController extends ApiBaseController {
    @Autowired
    private UserService userService;

    @Autowired
    private SequenceService sequenceService;

    @Autowired
    private UserTokenProvider userTokenProvider;

    @Autowired
    private AuthHeaderProps authHeaderProps;

    @Autowired
    private ServerSecurityProps serverSecurityProps;

    /**
     * 수동으로 인증
     */
    private void authenticateManual(CLUser user) {
        List<GrantedAuthority> authorities =
            userService.findRoleAndPrivilegeNamesByUserId(user.getUserId())
                .stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        Authentication authentication =
            new UsernamePasswordAuthenticationToken(user, null, authorities);
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Operation(
        summary = "사용자 ID로 회원가입이 가능한지 체크",
        description = "사용자 ID로 회원가입이 가능한지 체크합니다."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 회원가입이 가능하면 true를 리턴, 불가능하면 false를 리턴합니다",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Boolean.class)
            )
        )
    })
    @PostMapping(value = "/p/api/auth/is-available-user-id")
    public CLApiResponse<Boolean> checkUserIdDup(
        @RequestParam("lgonId") String lgonId
    ) {
        if (userService.existsUserByLgonId(lgonId)) {
            return successResult(false);
        }

        // TODO: ID 유효성 체크(ex: 욕설ID 등을 필터링)
        return successResult(true);
    }
}
