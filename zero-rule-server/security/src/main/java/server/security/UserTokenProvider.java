package server.security;

import cl.cloverframework.CLException;
import cl.cloverframework.impl.domain.entity.CLUserAuth;
import cl.cloverframework.impl.repo.CLUserAuthMapper;
import cl.cloverframework.impl.sql.ParamsUserAuth;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import server.base.AppError;
import server.base.props.UserJwtProps;
import server.service.core.SequenceService;

import java.time.Instant;
import java.util.Date;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class UserTokenProvider {
    @Autowired
    private UserJwtProps userJwtProps;

    @Autowired
    private SequenceService sequenceService;

    @Autowired
    private CLUserAuthMapper userAuthMapper;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    public TokenData createToken() {
        Instant now = Instant.now();
        long authSeq = sequenceService.nextAuthSeq();
        Instant expireAt = now.plusMillis(userJwtProps.getTokenExpirationLong().toMillis());
        return jwtTokenUtil.generateToken(
                authSeq,
                false,
                new Date(expireAt.toEpochMilli())
        );
    }

    public boolean validateToken(HttpServletRequest request, Long authId, String authToken) {
        try {
            CLUserAuth userAuth = userAuthMapper.findByAuthToken(authToken);
            if (userAuth == null) {
                return false;
            }
            if (userAuth.getAuthId() != authId) {
                log.warn("authId not matched, authIdInToken={}, accountIdInDb={}", authId, userAuth.getAuthId());
                request.setAttribute("__auth_error", AppError.E1_AUTH_INVALID_TOKEN.name());
                return false;
            }

            if (Instant.now().isAfter(userAuth.getExpiryDttm())) {
                if (log.isDebugEnabled()) {
                    log.debug("token expired");
                }
                request.setAttribute("__auth_error", AppError.E1_AUTH_EXPIRED.name());
            }
            long startAt = userAuth.getExpiryDttm().toEpochMilli() - userJwtProps.getTokenExpiration().toMillis();
            long pastTime = Instant.now().toEpochMilli() - startAt;
            long remainThreshold = TimeUnit.MINUTES.toMillis(2);
            if (pastTime > remainThreshold) {
                updateTokenExpiration(userAuth.getAuthId());
            }
            return true;
        } catch (SignatureException ex) {
            log.warn("Invalid JWT signature");
        } catch (MalformedJwtException ex) {
            log.warn("Invalid JWT token");
        } catch (ExpiredJwtException ex) {
            log.warn("Expired JWT token");
        } catch (UnsupportedJwtException ex) {
            log.warn("Unsupported JWT token");
        } catch (IllegalArgumentException ex) {
            log.warn("JWT claims string is empty");
        } catch (CLException ex) {
            log.warn("Auth invalid: {}", ex.getMessage());
        }
        return false;
    }

    @Transactional
    public void updateTokenExpiration(long authId) {
        Instant newExpire = Instant.now().plusMillis(userJwtProps.getTokenExpiration().toMillis());
        userAuthMapper.updateExpiryDttmById(
                ParamsUserAuth.UpdateExpiryDttm.builder()
                        .authId(authId)
                        .expiryDttm(newExpire)
                        .build()
        );
    }
}
