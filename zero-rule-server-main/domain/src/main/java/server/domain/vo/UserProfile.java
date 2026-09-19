package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 클라이언트에 보내는 사용자 프로필 정보
 * 기본적인 정보만 포함한다
 */
@Data
public class UserProfile {

    @Schema(description = "사용자 ID")
    private long userId;

    @Schema(description = "로그인 ID")
    private String lgonId;

    @Schema(description = "사용자 이름")
    private String userNm;

    @Schema(description = "권한 ID")
    private String roleId;

    @Schema(description = "메뉴 ID")
    private String navId;
}
