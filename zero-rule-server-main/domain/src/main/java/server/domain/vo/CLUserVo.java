package server.domain.vo;

import cl.cloverframework.log.CLUserState;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.lang.Nullable;

import java.time.Instant;

/**
 * 사용자 목록
 */
@Data
public class CLUserVo {

    @Schema(description = "사용자 ID")
    private long userId;

    @Schema(description = "로그인 ID")
    private String lgonId;

    @Schema(description = "사용자 이름")
    private String userNm;

    @Nullable
    @Schema(description = "생년월일")
    private String bryyMndy;

    @Nullable
    @Schema(description = "사용자핸드폰번호")
    private String userTno;

    @Nullable
    @Schema(description = "사용자내선번호")
    private String userExno;

    @Nullable
    @Schema(description = "CTI사용자고유번호")
    private String ctiUserNtno;

    @Nullable
    @Schema(description = "프린트가능여부")
    private String prtPosbYn;

    @Nullable
    @Schema(description = "다운로드가능여부")
    private String dwnlPosbYn;

    @Nullable
    @Schema(description = "야간여부")
    private String atntYn;

    @Nullable
    @Schema(description = "팀아이디")
    private String teamId;

    @Nullable
    @Schema(description = "사용자등급")
    private String userGd;

    @Schema(description = "사용자 상태")
    private CLUserState userState;

    @Schema(description = "로그인실패건수")
    private long lgonFailCnt;

    @Nullable
    @Schema(description = "비밀번호 초기화여부")
    private String pswdInitYn;

    @Nullable
    @Schema(description = "최종비밀번호변경일시")
    private Instant lastPswdChngDttm;

    @Nullable
    @Schema(description = "최종 로그인 일시")
    private Instant lastLgonDttm;

    @Nullable
    @Schema(description = "메모")
    private String memo;

    @Schema(description = "등록일시")
    private Instant regDttm;

    @Nullable
    @Schema(description = "등록자ID")
    private String regrId;

    @Schema(description = "변경일시")
    private Instant chngDttm;

    @Nullable
    @Schema(description = "변경자ID")
    private String chgrId;

    @Nullable
    @Schema(description = "팀명")
    private String teamNm;
}
