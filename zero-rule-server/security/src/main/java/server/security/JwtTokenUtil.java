package server.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;
import server.base.props.UserJwtProps;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenUtil {

    private final UserJwtProps userJwtProps;

    private final SecretKey key;

    public JwtTokenUtil(UserJwtProps userJwtProps) {
        this.userJwtProps = userJwtProps;
        this.key = Keys.hmacShaKeyFor(userJwtProps.getTokenSecret().getBytes(StandardCharsets.UTF_8));
    }

    @NonNull
    public SecretKey getSignKey() {
        return this.key;
    }

    /**
     * Jwt 토큰 문자열을 생성
     */
    @NonNull
    public TokenData generateToken(Long authSeq, boolean isAdmin, Date expiryDate) {
        String subject = (isAdmin ? "a" : "u") + authSeq;
        String tokenString = Jwts.builder()
                .subject(subject)
                .issuedAt(new Date())
                .expiration(expiryDate)
                .signWith(this.key)
                .compact();

        return new TokenData(authSeq, tokenString, expiryDate.toInstant());
    }

    /**
     * Jwt 토큰 문자열을 파싱하여 JwtData로 생성
     */
    @Nullable
    public JwtData getDataFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(this.key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            boolean isAdmin = claims.getSubject().startsWith("a");
            Long authId = Long.parseLong(claims.getSubject().substring(1));
            return JwtData.builder()
                    .token(token)
                    .authId(authId)
                    .isAdmin(isAdmin)
                    .build();
        } catch (Exception ignore) {
            return null;
        }
    }

}
