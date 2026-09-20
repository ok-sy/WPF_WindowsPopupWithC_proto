package server.web.auth;

import cl.cloverframework.api.CLApiResponse;
import cl.cloverframework.api.CLNewApiResponse;
import cl.cloverframework.impl.code.CLLoginFailReason;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.headers.Header;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import server.base.AppError;
import server.base.DocTags;
import server.base.logger.IAppLogger;
import server.base.logger.IAuditLogger;
import server.base.props.AuthHeaderProps;
import server.base.props.UserSecurityProps;
import server.domain.CustomUserDetails;
import server.domain.entity.CLUser;
import server.security.CustomUserDetailsService;
import server.security.TokenData;
import server.security.UserTokenProvider;
import server.service.core.CmmnService;
import server.service.core.SequenceService;
import server.service.core.UserSecurityService;
import server.service.core.UserService;
import server.web.auth.payload.AuthPayloads;
import server.web.support.ApiBaseController;
import server.web.support.payload.LoginProfileResponse;
import server.web.support.payload.UserProfileResponse;

@Tag(name = DocTags.AUTH)
@RestController
@Slf4j
public class UserLoginController extends ApiBaseController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserSecurityService userSecurityService;

    @Autowired
    private SequenceService sequenceService;

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

    @Autowired
    private CmmnService cmmnService;

    /**
     * App 로거
     */
    @Autowired
    private IAppLogger appLogger;


    private <T> CLApiResponse<T> fixError(AppError error) {
        // 보안지침: 운영중에는 구체적인 로그인 에러를 응답하면 안되고, 모든 에러는 하나로 통일해야 한다.
        // 개발중에는 불편하므로 에러 메시지를 그대로 리턴한다
        if (userSecurityProps.isDebugLoginFail()) {
            return errorResult(error);
        }

        // 통일된 로그인 실패 에러
        return errorResult(AppError.E1_LOGIN_FAIL);
    }

    @Operation(summary = "로그인 하기", description = "로그인후에 인증토큰을 발급합니다.")
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "성공 응답",
            headers = {
                @Header(name = "x-custom-authorization", description = "로그인이 성공한 경우 인증 토큰이 포함됩니다")
            },
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = UserProfileResponse.class))
        )
    })
    @PostMapping(value = "/p/api/auth/login")
    public CLNewApiResponse<LoginProfileResponse> login(
        @RequestBody AuthPayloads.LoginRequest payload,
        HttpServletResponse response,
        HttpServletRequest request
    ) {
        String getUri = request.getRequestURI().replaceAll("/zero-rule-server","");
        // 임시로막음
        String clientIp = "";
//        String clientIp = requestMeta().getClientPublicIpOrNull();
//        if (StringUtils.hasText(clientIp)) {
//            // 로그인이 차단된 IP입니다
//            if (userSecurityService.isLoginBlockedIp(clientIp)) {
//                appLogger.userLoginBlocked(clientIp);
//                return errorResult(AppError.E1_LOGIN_BLOCKED_IP);
//            }
//        }

        CLUser user = userService.findUserByLgonId(payload.getLgonId());

        if (user == null) {
            // 해당 사용자가 없습니다.
            auditLogger.userLoginNoSuchUser(payload.getLgonId());

            if (StringUtils.hasText(clientIp)) {
                // 사용자 로그인 실패 저장
                userSecurityService.saveLoginFail(
                    sequenceService.nextCommonSeq(),
                    payload.getLgonId(),
                    CLLoginFailReason.NO_SUCH_USER,
                    clientIp
                );
            } else {
                // 임시로막음
                //appLogger.devWarning("공인 IP가 아니라서, 로그인 실패를 저장할 수 없습니다", requestMeta().getClientIp());
            }
            return resultMsg("BE00000014");
        }

        boolean granted = cmmnService.hasPerm(user.getUserId(), "/apis/cloverframework/nav/items");
        if(!granted){
            return resultMsg("FW00000011");
        }

        // 비밀번호 초기화 대상일 경우 패스워드 재설정
        boolean needPwdChange = "Y".equals(user.getPswdInitYn());

        // 비밀번호 파라미터가 없습니다
        if (!StringUtils.hasText(payload.getPasswd())) {
            auditLogger.userLoginNoPasswdParam(payload.getLgonId());
        }

        // 비밀번호가 일치하지 않습니다
        if (!StringUtils.hasText(payload.getPasswd()) ||
            !userService.matchPasswd(payload.getPasswd(), user.getPswd())
        ) {
            auditLogger.userLoginPasswdMismatch(payload.getLgonId());

            // 사용자 로그인 실패 저장
            if (StringUtils.hasText(clientIp)) {
                userSecurityService.saveLoginFail(
                    sequenceService.nextCommonSeq(),
                    payload.getLgonId(),
                    CLLoginFailReason.PW_FAIL,
                    clientIp
                );
            } else {
                // 임시로막음
                //appLogger.devWarning("공인 IP가 아니라서, 로그인 실패를 저장할 수 없습니다", requestMeta().getClientIp());
            }

            // 사용자 비밀번호 실패 횟수 증가
            int incPswdCnt = userService.updateLoginFailCnt(user.getUserId());
            if (incPswdCnt == 0) {
                log.warn("패스워드 실패 건수 업데이트 실패");
                String msg = String.format("패스워드 실패 건수 업데이트 실패, userId=%d, lgonI=%s", user.getUserId(), user.getLgonId());
                appLogger.devWarning(msg, clientIp);
            }

            return resultMsg("FW00000009");
        }

        // 로그인
        authenticateManual(user);

        TokenData tokenData = userTokenProvider.createToken();
        userService.saveAuth(
            tokenData.getAuthId(),
            user.getUserId(),
            tokenData.getToken(),
            tokenData.getExpiryTimestamp()
        );

        // 로그인시 세션정보 셋팅
        //super.setSession(user);

        // 최종 로그인 시간 업데이트
        int changedRows = userService.updateLastLoginTime(user.getUserId());
        if (changedRows == 0) {
            log.warn("최종 로그인 시간 업데이트 실패");
            String msg = String.format("최종 로그인 시간 업데이트 실패, userId=%d, lgonI=%s", user.getUserId(), user.getLgonId());
            appLogger.devWarning(msg, clientIp);
        }

        // 로그인이 성공하면 로그인 실패이력을 삭제해야 하나?

        // 응답헤더에 토큰 추가
        response.addHeader(authHeaderProps.getUserRefreshTokenHeader(), tokenData.getToken());

        // Audit 로깅
        auditLogger.userLoginSuccess(user.getLgonId());

        return resultMsg("BE00000006",
            LoginProfileResponse.builder()
                .profile(userService.findUserProfileByUserId(user.getUserId()))
                .needPwdChange(needPwdChange)
                .build()
        );
    }


    /**
     * 수동으로 인증
     */
    private void authenticateManual(CLUser user) {
        CustomUserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getLgonId());
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
