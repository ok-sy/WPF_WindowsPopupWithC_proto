package server.domain;

import cl.cloverframework.ICLUserDetails;
import cl.cloverframework.log.CLUserState;
import lombok.Builder;
import lombok.Data;
import lombok.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;

@Data
@Builder
public class CustomUserDetails implements ICLUserDetails, CredentialsContainer {

    private long userId;

    @NonNull
    private String lgonId;

    @Nullable
    private String password;

    @NonNull
    private CLUserState accountState;

    @NonNull
    private String pwdInitYn;

    @NonNull
    private Collection<? extends GrantedAuthority> authorities;

    @Override
    public void eraseCredentials() {
        this.password = null;
    }

    @Override
    public String getUsername() {
        return this.lgonId;
    }

    /**
     * 계정이 만료되었는지 여부
     * false를 리턴하면 만료 상태
     */
    @Override
    public boolean isAccountNonExpired() {
        return accountState != CLUserState.DORMANT;
    }

    /**
     * 계정이 잠겼는지 여부
     * false를 리턴하면 잠김 상태
     */
    @Override
    public boolean isAccountNonLocked() {
        return accountState != CLUserState.STOPPED;
    }

    /**
     * 비밀번호가 만료되었는지 여부
     * false를 리턴하면 만료 상태
     */
    @Override
    public boolean isCredentialsNonExpired() {
        return accountState != CLUserState.PW_LOCKED;
    }


    /**
     * 삭제 또는 탈퇴 계정 여부
     * false를 리턴하면 삭제 또는 탈퇴된 계정
     */
    @Override
    public boolean isEnabled() {
        return accountState != CLUserState.DELETED;
    }
}
