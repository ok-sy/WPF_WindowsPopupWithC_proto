package server.web.support.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import server.domain.vo.UserProfile;

@Schema(description = "사용자 프로필 응답 컨테이너")
@Data
@Builder
public class LoginProfileResponse {
    @Schema(description = "사용자 프로필")
    private UserProfile profile;

    @Schema(description = "비밀번호 변경 필요여부")
    private boolean needPwdChange;
}
