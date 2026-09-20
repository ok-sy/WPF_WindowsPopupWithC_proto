package server.repo.core.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.springframework.lang.Nullable;
import server.sql.ParamsCLUser;
import server.domain.entity.CLUser;
import server.domain.vo.CLUserVo;
import server.domain.vo.UserProfile;

import java.time.Instant;
import java.util.List;

/**
 * UserAccount MyBatis 매퍼 인터페이스.
 */
@Mapper
public interface CLUserMapper {

    /**
     * 사용자 등록
     *
     * @param user 등록할 사용자 정보
     */
    void insert(CLUser user);

    /**
     * 사용자 수정
     *
     * @param user 수정할 사용자 정보
     */
    int update(ParamsCLUser.Update user);


    /**
     * 사용자 프로필 조회
     *
     * @param userId 사용자 ID
     * @return 사용자 프로필 정보, 없으면 null
     */
    @Nullable
    UserProfile findUserProfileByUserId(long userId);


    /**
     * 사용자 정보 단건 조회 - vo, by userId
     *
     * @param userId 사용자 ID
     * @return 사용자 프로필 정보, 없으면 null
     */
    @Nullable
    CLUserVo findUserVoByUserId(long userId);


    /**
     * 사용자 존재 여부 체크 by lgonId
     *
     * @param lgonId 로그인 ID
     * @return 존재하면 true를 리턴
     */
    boolean existsByLgonId(String lgonId);


    /**
     * 사용자 조회 by 사용자ID
     *
     * @param userId 사용자ID
     * @return 사용자 정보, 없으면 null
     */
    @Nullable
    CLUser findByUserId(long userId);


    /**
     * 사용자 조회 by 로그인ID
     *
     * @param lgonId 로그인ID
     * @return 사용자 정보, 없으면 null
     */
    @Nullable
    CLUser findByLgonId(String lgonId);


    /**
     * 사용자 조회 by 인증ID
     *
     * @param authId 인증ID
     * @return 사용자 정보, 없으면 null
     */
    @Nullable
    CLUser findByAuthId(long authId);


    /**
     * 사용자 목록 조회 - 페이지
     *
     * @param params 조회 파라미터
     * @return 사용자 목록
     */
    List<CLUserVo> findPage(ParamsCLUser.FindPage params);

    /**
     * 데이터 건수 조회 - 페이지용
     *
     * @param params 조회 파라미터
     * @return 건수
     */
    long countForUserPage(ParamsCLUser.FindPage params);


    /**
     * 최종 로그인 시간 업데이트
     *
     * @param params 파라미터
     * @return 업데이트 건수
     */
    int updateLastLoginTime(ParamsCLUser.UpdateLastLoginTime params);

    // TODO jjfive 재설계중
    // List<String> findRoleAndPrivilegeNamesByAccountId(long accountId);

    /**
     * 사용자 id 채번
     * <p>
     * 등록할 사용자 id 채번
     */
    long createMaxUserId();

    /**
     * 오래된 사용자 비밀번호 초기화 상태로 변경
     */
    int updatePswdByAdmin(ParamsCLUser.UpdatePswdByAdmin params);

    /**
     * 사용자 비밀번호 변경
     */
    int updatePswd(ParamsCLUser.UpdatePswd params);

    /**
     * 로그인 패스워드 실패 건수 업데이트
     *
     * @param params 파라미터
     * @return 업데이트 건수
     */
    int updateLoginFailCnt(ParamsCLUser.UpdateLoginFailCnt params);

    /**
     * 사용자 계정잠김 조회 by 사용자 등급
     *
     * @param var1 등록일자
     */
    int updateByPswdOverTime(Instant var1);
}
