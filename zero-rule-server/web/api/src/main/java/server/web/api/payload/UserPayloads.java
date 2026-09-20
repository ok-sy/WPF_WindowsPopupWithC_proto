package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

public class UserPayloads {

    @Schema(description = "사용자 비밀번호 초기화 상태로 변경")
    @Data
    public static class UserPswdRequest {

        @Schema(description = "이전 비밀번호")
        private String oldPswd;

        @Schema(description = "변경할 비밀번호")
        private String pswd;
    }
}
