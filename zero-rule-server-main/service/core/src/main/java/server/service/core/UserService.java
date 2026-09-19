package server.service.core;

import cl.cloverframework.impl.domain.entity.CLUserAuth;
import cl.cloverframework.impl.domain.vo.CLPagerData;
import cl.cloverframework.impl.repo.CLUserAuthMapper;
import cl.cloverframework.log.CLUserState;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import server.base.props.UserSecurityProps;
import server.domain.entity.CLUser;
import server.domain.vo.CLUserVo;
import server.domain.vo.UserProfile;
import server.repo.core.mapper.CLUserMapper;
import server.service.UserSecurityUtils;
import server.sql.ParamsCLUser;

import java.time.Instant;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class UserService {

    @Autowired
    CLUserMapper userMapper;

    @Autowired
    CLUserAuthMapper userAuthMapper;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    UserSecurityProps userSecurityProps;

    /**
     * 사용자 ID로 사용자 계정 조회
     *
     * @param lgonId 로그인 ID
     * @return 사용자 계정
     */
    @Nullable
    public CLUser findUserByLgonId(String lgonId) {
        return userMapper.findByLgonId(lgonId);
    }

    /**
     * 사용자 조회 by userId
     *
     * @param userId 사용자 ID
     * @return 사용자 계정
     */
    @Nullable
    public CLUser findUserByUserId(long userId) {
        return userMapper.findByUserId(userId);
    }

    /**
     * UserProfile 조회 by userId
     */
    @Nullable
    public UserProfile findUserProfileByUserId(long userId) {
        return userMapper.findUserProfileByUserId(userId);
    }

    /**
     * CLUserVo 단건 조회 by userId
     */
    @Nullable
    public CLUserVo findUserVoByUserId(long userId) {
        return userMapper.findUserVoByUserId(userId);
    }

    /**
     * 사용자 ID로 사용자 계정이 존재하는지 체크
     *
     * @param lgonId 로그인 ID
     * @return 존재하면 true
     */
    public boolean existsUserByLgonId(String lgonId) {
        return userMapper.existsByLgonId(lgonId);
    }

    /**
     * 비밀번호 일치 체크
     */
    public boolean matchPasswdByUserId(long userId, String plainPasswd) {
        // TODO 성능 개선
        CLUser user = userMapper.findByUserId(userId);
        return passwordEncoder.matches(plainPasswd, user.getPswd());
    }

    /**
     * 비밀번호 일치 체크
     */
    public boolean matchPasswd(String plainPasswd, String encodedPasswd) {
        return passwordEncoder.matches(plainPasswd, encodedPasswd);
    }

    /**
     * 사용자 인증 정보 저장
     *
     * @param authId     인증 ID
     * @param userId     accountId
     * @param authToken  인증 토큰
     * @param expiryDttm 만료일시
     */
    @Transactional
    public void saveAuth(Long authId, Long userId, String authToken, Instant expiryDttm) {
        CLUserAuth auth = CLUserAuth.builder()
                .authId(authId)
                .userId(userId)
                .authToken(authToken)
                .expiryDttm(expiryDttm)
                .regDttm(Instant.now())
                .chngDttm(Instant.now())
                .build();
        userAuthMapper.insert(auth);
    }

    /**
     * 인증 토큰 제거
     * 로그 아웃시에 호출한다
     *
     * @param authToken 인증 토큰
     * @return 삭제 여부
     */
    @Transactional
    public boolean removeAuth(String authToken) {
        int rows = userAuthMapper.deleteByAuthToken(authToken);
        if (rows <= 0) {
            log.debug("no such auth token: {}", authToken);
        }
        return rows > 0;
    }

    /**
     * TODO jjfive 재설계중
     * 특정 사용자의 역할과 권한을 조회
     */
    public List<String> findRoleAndPrivilegeNamesByUserId(Long userId) {
        // return userAccountMapper.findRoleAndPrivilegeNamesByAccountId(userId);
        return Collections.emptyList();
    }


    /**
     * user 페이지 조회
     *
     * @param pageNumber  페이지 번호 0부터 시작
     * @param rowsPerPage 페이지당 조회 건수
     * @param userNm      검색할 이름
     * @return CLUserVo 페이지 데이터
     */
    @NonNull
    public CLPagerData<CLUserVo> findPage(
            int pageNumber,
            int rowsPerPage,
            @Nullable String userNm,
            @Nullable String lgonId,
            @Nullable String keyword

    ) {
        ThreadLocal threadLocal = new ThreadLocal<>();
        threadLocal.get();

        ParamsCLUser.FindPage params = ParamsCLUser.FindPage.builder()
                .pageNumber(pageNumber)
                .rowsPerPage(rowsPerPage)
                .userNm(userNm)
                .lgonId(lgonId)
                .keyword(keyword)
                .build();

        List<CLUserVo> elements = userMapper.findPage(params); // 목록 조회
        long totalElements = userMapper.countForUserPage(params); // 전체 건수 조회

        return new CLPagerData<>(
                elements,
                totalElements,
                pageNumber,
                rowsPerPage
        );
    }

    /**
     * 오래된 인증 토큰 삭제
     *
     * @param maxExpireTimestamp 만료 기준 시간
     * @return 삭제된 Row 수
     */
    @Transactional
    public int deleteOldUserAuth(Instant maxExpireTimestamp) {
        int deletedRows = userAuthMapper.deleteByExpiryDttmBefore(maxExpireTimestamp);
        if (log.isDebugEnabled()) {
            log.warn("deleteOldUserAuth() deleted rows = {}", deletedRows);
        }
        return deletedRows;
    }

    /**
     * 오래된 사용자 비밀번호 초기화여부 Y로 변경
     *
     * @param maxExpireTimestamp 만료 기준 시간
     * @return 삭제된 Row 수
     */
    @Transactional
    public int updateByPwOverTime(Instant maxExpireTimestamp) {
        int updatedRows = userMapper.updateByPswdOverTime(maxExpireTimestamp);
        if (log.isDebugEnabled()) {
            log.warn("updateByPswOverTime() update rows = {}", updatedRows);
        }
        return updatedRows;
    }

    /**
     * 최종 로그인 시간 업데이트
     *
     * @param userId 사용자 ID
     * @return 업데이트 건수
     */
    @Transactional
    public int updateLastLoginTime(long userId) {
        return userMapper.updateLastLoginTime(
                ParamsCLUser.UpdateLastLoginTime.builder()
                        .userId(userId)
                        .chgrId(UserSecurityUtils.currentLgonIdOrNull())
                        .build()
        );
    }

    @Transactional
    @NonNull
    public CLUser regUser(
            long userId,
            @Nullable String lgonId,
            @NonNull String passwd,
            @NonNull String userName,
            @Nullable String userState,
            @Nullable Instant lastLgonDttm,
            @Nullable String bryyMndy,
            @Nullable String userTno,
            @Nullable String userExno,
            @Nullable String userGd,
            @Nullable String ctiUserNtno,
            @Nullable String prtPosbYn,
            @Nullable String dwnlPosbYn,
            @Nullable String atntYn,
            @Nullable String memo,
            @Nullable String teamId
    ) {
        CLUser user = CLUser.builder()
                .userId(userId)
                .lgonId(lgonId)
                .pswd(passwordEncoder.encode(passwd))
                .userNm(userName)
                .userState(CLUserState.ACTIVE)
                .lastLgonDttm(lastLgonDttm)
                .regrId(UserSecurityUtils.currentLgonIdOrNull())
                .chgrId(UserSecurityUtils.currentLgonIdOrNull())
                .regDttm(Instant.now())
                .chngDttm(Instant.now())
                .pswdInitYn("Y")
                .bryyMndy(bryyMndy)
                .userTno(userTno)
                .userExno(userExno)
                .userGd(userGd)
                .lastPswdChngDttm(Instant.now())
                .ctiUserNtno(ctiUserNtno)
                .prtPosbYn(prtPosbYn)
                .dwnlPosbYn(dwnlPosbYn)
                .atntYn(atntYn)
                .memo(memo)
                .teamId(teamId)
                .build();
        userMapper.insert(user);

        return user;
    }

    /**
     * 사용자 기본 정보 업데이트
     */
    @Transactional
    public int updateUser(ParamsCLUser.Update params) {
        return userMapper.update(params);
    }

    @Transactional
    @NonNull
    public long createMaxUserId() {
        return userMapper.createMaxUserId();
    }

    /**
     * 비밀번호 변경 by 관리자
     */
    @Transactional
    public int updatePswdByAdmin(ParamsCLUser.UpdatePswdByAdmin params) {
        return userMapper.updatePswdByAdmin(params);
    }

    /**
     * 비밀번호 변경 by 본인
     */
    @Transactional
    public int updateMyPswd(ParamsCLUser.UpdatePswd params) {
        params.setPswd(passwordEncoder.encode(params.getPswd()));
        return userMapper.updatePswd(params);
    }

    /**
     * 로그인 패스워드 실패 건수 업데이트
     *
     * @param userId 사용자 ID
     * @return 업데이트 건수
     */
    @Transactional
    public int updateLoginFailCnt(long userId) {
        return userMapper.updateLoginFailCnt(
                ParamsCLUser.UpdateLoginFailCnt.builder()
                        .userId(userId)
                        .chgrId(UserSecurityUtils.currentLgonIdOrNull())
                        .build()

        );
    }
}
