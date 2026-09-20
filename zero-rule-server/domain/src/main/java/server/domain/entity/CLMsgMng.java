package server.domain.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.lang.Nullable;

import java.time.Instant;

@Data
public class CLMsgMng {

    @Schema(description = "메시지 아이디")
    private String msgId;

    @Schema(description = "메시지 타입")
    private String msgClsf;

    @Schema(description = "업무구분코드")
    private String tskClsfCd;

    @Schema(description = "팀 아이디")
    private int teamId;

    @Schema(description = "팀 이름")
    private String teamNm;

    @Schema(description = "발생구분코드")
    private String occrClsfCd;

    @Schema(description = "메시지출력코드")
    private String msgPrntCd;

    @Schema(description = "메시지 내용")
    private String msgCn;

    @Schema(description = "메시지사용여부")
    private String useYn;

    @Schema(description = "등록 일시")
    private Instant regDttm;

    @Schema(description = "등록자 ID")
    private String regrId;

    @Nullable
    @Schema(description = "변경 일시")
    private Instant chngDttm;

    @Nullable
    @Schema(description = "변경자 ID")
    private String chgrId;
}
