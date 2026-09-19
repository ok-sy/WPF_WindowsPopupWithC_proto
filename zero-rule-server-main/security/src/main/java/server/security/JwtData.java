package server.security;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class JwtData {
    Long authId;
    String token;
    boolean isAdmin;
}
