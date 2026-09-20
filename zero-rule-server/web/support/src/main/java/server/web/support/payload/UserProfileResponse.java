package server.web.support.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import server.domain.vo.UserProfile;

@Schema(description = "사용자 프로필 응답 컨테이너")
@Data
@Builder
public class UserProfileResponse {
    @Schema(description = "사용자 프로필")
    private UserProfile profile;
}
