package server.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class CustomTokenProvider {

    @Autowired
    private UserTokenProvider userTokenProvider;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    public boolean validateToken(JwtData jwtData, HttpServletRequest request) {
        return this.userTokenProvider.validateToken(request, jwtData.getAuthId(),
                jwtData.getToken());
    }

    public JwtData extractDataFromJwt(String jwtToken) {
        return this.jwtTokenUtil.getDataFromToken(jwtToken);
    }
}
