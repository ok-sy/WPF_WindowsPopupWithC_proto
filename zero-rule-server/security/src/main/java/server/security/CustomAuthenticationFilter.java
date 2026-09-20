package server.security;

import cl.cloverframework.CLException;
import jakarta.annotation.Nullable;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import server.base.BuildVars;
import server.base.props.AuthHeaderProps;
import server.domain.CustomUserDetails;
import server.service.core.CmmnService;

import java.io.IOException;


@Slf4j
public class CustomAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private AuthHeaderProps authHeaderProps;

    @Autowired
    private CustomTokenProvider customTokenProvider;

    @Autowired
    private CustomUserDetailsService customUserDetailsService;

    @Autowired
    private CmmnService cmmnService;

    /**
     * 비밀번호 변경을 체크해야 하는 URL 체크
     */
    public boolean isIgnorePwdMustReset(HttpServletRequest request) {
        // ex) /fds-server/api/user/update-pwd
        // String requestURI = request.getRequestURI();   // /fds-server/api/user/update-pwd
        String servletPath = request.getServletPath(); // /api/user/update-pwd

        // 만약 사용자가 비밀번호 변경이 필요하다면, 에러 응답을 보낸다
        // ex) 일단, 비밀번호 바꾸세요
        return servletPath.startsWith(BuildVars.ApiUrls.pwChange) ||
            servletPath.startsWith(BuildVars.ApiUrls.profileMe) ||
            servletPath.startsWith(BuildVars.ApiUrls.pswdMustChangeError) ||
            servletPath.startsWith("/p/");
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            CustomUserDetails userDetails = processJwt(request, response);

            if (!isIgnorePwdMustReset(request)) {
                // 비밀번호 변경 필요 체크
                if (userDetails != null && "Y".equals(userDetails.getPwdInitYn())) {
                    request.getRequestDispatcher(BuildVars.ApiUrls.pswdMustChangeError)
                        .forward(request, response);
                    return;
                }
            }
        } catch (Throwable ignore) {
            String getUri = request.getRequestURI().replaceAll("/zero-rule-server","");
            if(!getUri.contains("/v3/") && !getUri.contains("/p/")) {
                request.setAttribute("errorType","E1_ANOTHER_LOGIN_RETRY");
                request.getRequestDispatcher(BuildVars.ApiUrls.logoutError).forward(request, response);
         //       System.out.println("");
                throw new CLException("FW00000003","인증이 만료되었습니다");
            }
        }
        filterChain.doFilter(request, response);
    }

    @Nullable
    private CustomUserDetails processJwt(HttpServletRequest request, HttpServletResponse response) throws IOException, ServletException {
        String jwt = getJwtFromRequest(request);
        if (!StringUtils.hasText(jwt)) {
//            return null;
            String getUri = request.getRequestURI().replaceAll("/zero-rule-server","");
            if(!getUri.contains("/p/")) {
                request.setAttribute("__auth_error", "인증 토큰 존재하지 않습니다");
                throw new CLException("FW00000003","인증 토큰 존재하지 않습니다");
            }
            return null;
        }

        JwtData data = customTokenProvider.extractDataFromJwt(jwt);

        boolean validated = customTokenProvider.validateToken(data, request);
        if (validated) {
            CustomUserDetails userDetails = customUserDetailsService.loadUserByAuthId(data.getAuthId());
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());

            /**
             * 권한설정 추가
             * uri에 "/apis/" , "/cloverframework/"  포함된경우 권한 체크
             */
            String getUri = request.getRequestURI().replaceAll("/zero-rule-server","");
            if (!getUri.contains("/p/") && getUri.contains("/apis/") ) {

                boolean granted = cmmnService.hasPerm(userDetails.getUserId(), getUri);
                if (!granted) {
                    request.getRequestDispatcher(BuildVars.ApiUrls.permissionDenied).forward(request, response);
                    return null;
                }
            }

            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authentication);

            // 인증 성공
            return userDetails;
        } else {
            log.info("validation fail");
            request.setAttribute("errorType","E1_EXPIRY_TOKEN_RETRY_LOGIN");
            request.getRequestDispatcher(BuildVars.ApiUrls.permissionDenied).forward(request, response);

        }
        return null;
    }

    @Nullable
    private String getJwtFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
