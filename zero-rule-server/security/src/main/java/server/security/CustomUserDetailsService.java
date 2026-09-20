package server.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import server.base.exception.ResourceNotFoundException;
import server.domain.CustomUserDetails;
import server.domain.entity.CLUser;
import server.repo.core.mapper.CLUserMapper;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;

@Component("userDetailsService")
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired
    private CLUserMapper userMapper;

    @Override
    public CustomUserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (!StringUtils.hasText(username)) {
            throw new UsernameNotFoundException("user not found with userId null");
        }

        CLUser user = userMapper.findByLgonId(username);
        if (user == null) {
            throw new UsernameNotFoundException("user not found with userId null");
        }

        return toUserDetails(user);
    }

    private Collection<? extends GrantedAuthority> getAuthorities(long userId) {
        return getGrantedAuthorities(getPrivileges(userId));
    }

    private List<String> getPrivileges(long accountId) {
        // return userAccountMapper.findRoleAndPrivilegeNamesByAccountId(accountId);
        // return Collections.emptyList();
        return Arrays.asList("ROLE_USER","ROLE_ADMIN","ROLE_MASTER");
    }

    private List<GrantedAuthority> getGrantedAuthorities(final List<String> privileges) {
        final List<GrantedAuthority> authorities = new ArrayList<>();
        for (final String privilege : privileges) {
            authorities.add(new SimpleGrantedAuthority(privilege));
        }
        return authorities;
    }

    private CustomUserDetails toUserDetails(CLUser user) {
        return CustomUserDetails.builder()
            .userId(user.getUserId())
            .lgonId(user.getLgonId())
            .password(user.getPswd())
            .accountState(user.getUserState())
            .pwdInitYn(user.getPswdInitYn())
            .authorities(getAuthorities(user.getUserId()))
            .build();
    }

    public CustomUserDetails loadUserByAuthId(long authId) {
        CLUser user = userMapper.findByAuthId(authId);
        if (user == null) {
            throw new ResourceNotFoundException("User", "authId", authId);
        }

        return toUserDetails(user);
    }
}
