package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class TeamForUserVo {

    @Schema(description = "사용자 아이디")
    private long userId;

    @Schema(description = "로그인 아이디")
    private String lgonId;

    @Schema(description = "사용자 이름")
    private String userNm;
}
