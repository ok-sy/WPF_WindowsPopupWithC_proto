package server.domain.entity;

import cl.cloverframework.ICLUser;
import cl.cloverframework.log.CLUserState;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.Instant;

/**
 * CL 사용자
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CLUser implements ICLUser {

	/**
	 * PK
	 * 사용자ID
	 */
    @NonNull
	private long userId;

	/**
	 * 로그인 ID
	 */
	@NonNull
	private String lgonId;

	/**
	 * 비밀번호
	 */
	@NonNull
	private String pswd;

	/**
	 * 사용자 이름
	 */
	@Nullable
	private String userNm;

    /**
     * 생년월일
     */
    @Nullable
    private String bryyMndy;

    /**
     * 사용자핸드폰번호
     */
    @Nullable
    private String userTno;

    /**
     * 사용자내선번호
     */
    @Nullable
    private String userExno;

    /**
     * CTI사용자고유번호
     */
    @Nullable
    private String ctiUserNtno;

    /**
     * 프린트가능여부
     */
    @Nullable
    private String prtPosbYn;

    /**
     * 다운로드가능여부
     */
    @Nullable
    private String dwnlPosbYn;

    /**
     * 야간여부
     */
    @Nullable
    private String atntYn;

    /**
     * 팀아이디
     */
    @Nullable
    private String teamId;

    /**
     * 사용자등급
     * ex) 0, 1, 2
     */
    @NonNull
    private String userGd;

	/**
	 * 사용자 상태
	 */
	@NonNull
	private CLUserState userState;

    /**
     * 로그인실패건수
     */
    @NonNull
    private long lgonFailCnt;

    /**
     * 비밀번호 초기화여부
     */
    @Nullable
    private String pswdInitYn;

    /**
     * 최종비밀번호변경일시
     */
    @Nullable
    private Instant lastPswdChngDttm;

	/**
	 * 최종 로그인일시
	 */
	@Nullable
	private Instant lastLgonDttm;

    /**
     * 메모
     */
    @Nullable
    private String memo;

    /**
     * 등록일시
     */
    @NonNull
    private Instant regDttm;

	/**
	 * 등록 사용자ID
	 */
	@Nullable
	private String regrId;

    /**
     * 변경일시
     */
    @NonNull
    private Instant chngDttm;

	/**
	 * 변경 사용자ID
	 */
	@Nullable
	private String chgrId;
}
