package server.web.auth;

import cl.cloverframework.ICLUserDetails;
import cl.cloverframework.api.CLApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.base.logger.IAppLogger;
import server.base.logger.IAuditLogger;
import server.base.props.AuthHeaderProps;
import server.base.props.UserSecurityProps;
import server.security.CustomUserDetailsService;
import server.security.UserTokenProvider;
import server.service.core.UserService;
import server.web.support.ApiBaseController;

import static server.service.UserSecurityUtils.currentUserDetails;

@Tag(name = DocTags.AUTH)
@RestController
@Slf4j
public class UserLogoutController extends ApiBaseController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserTokenProvider userTokenProvider;

    @Autowired
    private AuthHeaderProps authHeaderProps;

    @Autowired
    private UserSecurityProps userSecurityProps;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    /**
     * Audit 로거
     */
    @Autowired
    private IAuditLogger auditLogger;

    /**
     * App Logger
     */
    @Autowired
    private IAppLogger appLogger;

    @Operation(summary = "로그 아웃", description = "로그인 된 사용자를 로그 아웃합니다.")
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "성공 응답",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = Boolean.class))
        )
    })
    @PostMapping(value = "/api/auth/logout")
    public CLApiResponse<Object> logout(
        @RequestHeader(HttpHeaders.AUTHORIZATION) String authorizationHeader,
        HttpServletRequest request,
        HttpServletResponse response
    ) {
        ICLUserDetails userDetails = currentUserDetails();
        String userId = userDetails != null ? userDetails.getLgonId() : null;
        boolean deleted = false;

        if (StringUtils.hasText(authorizationHeader)) {
            if (authorizationHeader.startsWith("Bearer ")) {
                deleted = userService.removeAuth(authorizationHeader.substring("Bearer ".length()));
            } else {
                log.warn("invalid authorization header: {}", authorizationHeader);
            }
        } else {
            log.warn("authorization header empty");
        }

        if (deleted) {
            appLogger.userAuthTokenDeleteSuccess(userId, authorizationHeader.substring(0, 30) + "...");
        } else {
            appLogger.userAuthTokenDeleteFail(userId, authorizationHeader);
        }

        // audit logging
        if (StringUtils.hasText(userId)) {
            auditLogger.userLogout(userId);
        }

        // 응답헤더에 토큰 추가
        response.addHeader(authHeaderProps.getUserClearHeader(), "1");

        return successResult();
    }
}
