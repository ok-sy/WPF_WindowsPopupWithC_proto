package server.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import server.domain.CustomUserDetails;

import java.util.Objects;

@Slf4j
public class UserSecurityUtils {

    /**
     * 현재 로그인 된 사용자의 UserDetails 가져오기
     * 로그인이 안되어 있으면 NULL을 리턴
     */
    @Nullable
    public static CustomUserDetails currentUserDetails() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof CustomUserDetails) {
            return (CustomUserDetails) principal;
        }

        log.debug("Authentication Principal is not CustomUserDetails: {}", principal.toString());
        return null;
    }

    /**
     * 현재 로그인되어 있는 사용자의 accountId 가져오기
     * 로그인이 안되어 있으면 NULL을 리턴
     */
    @Nullable
    public static Long currentUserIdOrNull() {
        CustomUserDetails userDetails = currentUserDetails();
        if (userDetails == null) return null;
        return userDetails.getUserId();
    }

    /**
     * 현재 로그인되어 있는 사용자의 accountId 가져오기
     * 로그인이 안되어 있으면 NPE 발생함
     */
    @NonNull
    public static Long currentUserId() {
        CustomUserDetails userDetails = currentUserDetails();
        Objects.requireNonNull(userDetails);
        return userDetails.getUserId();
    }

    @NonNull
    public static String currentLgonId() {
        CustomUserDetails userDetails = currentUserDetails();
        Objects.requireNonNull(userDetails);
        return userDetails.getLgonId();
    }

    @Nullable
    public static String currentLgonIdOrNull() {
        CustomUserDetails userDetails = currentUserDetails();
        if (userDetails == null) return null;
        return userDetails.getLgonId();
    }
}
