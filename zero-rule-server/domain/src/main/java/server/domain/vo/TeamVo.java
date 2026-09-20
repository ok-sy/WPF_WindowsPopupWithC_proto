package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.lang.Nullable;

import java.time.Instant;

@Data
public class TeamVo {

    @Schema(description = "팀 ID")
    private long teamId;

    @Nullable
    @Schema(description = "팀명")
    private String teamNm;

    @Nullable
    @Schema(description = "팀설명")
    private String teamExpl;

    @Schema(description = "개인설정허용여부")
    private String psnlStupAcceYn;

    @Nullable
    @Schema(description = "팀공통 설정 내용")
    private byte[] teamCmmnStupCn;

    @Nullable
    @Schema(description = "팀상태")
    private String teamStat;

    @Nullable
    @Schema(description = "TEAM 업무 구분")
    private String teamTskClsf;

    @Schema(description = "등록일시")
    private Instant regDttm;

    @Schema(description = "등록자_ID")
    private String regrId;

    @Nullable
    @Schema(description = "변경일시")
    private Instant chngDttm;

    @Nullable
    @Schema(description = "변경자_ID")
    private String chgrId;

    @Nullable
    @Schema(description = "사용자 건수")
    private String userCnt;
}
