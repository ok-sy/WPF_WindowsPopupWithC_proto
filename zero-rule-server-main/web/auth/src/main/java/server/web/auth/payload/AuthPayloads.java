package server.web.auth.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;



public class AuthPayloads {
    @Schema(description = "회원가입 요청 데이터")
    @Data
    public static class SignUpRequest {
        @Schema(description = "로그인 ID")
        private String lgonId;

        @Schema(description = "사용자 이름")
        private String userNm;

        @Schema(description = "비밀번호")
        private String passwd;
    }

    @Schema(description = "로그인 요청 데이터")
    @Data
    public static class LoginRequest {
        @Schema(description = "로그인 ID")
        private String lgonId;

        @Schema(description = "비밀번호")
        private String passwd;
    }
}
