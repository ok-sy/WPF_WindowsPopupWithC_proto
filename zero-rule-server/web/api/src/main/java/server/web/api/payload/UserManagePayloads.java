package server.web.api.payload;

import cl.cloverframework.impl.domain.vo.CLPagerData;
import cl.cloverframework.log.CLUserState;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;
import org.hibernate.validator.constraints.Length;
import server.domain.vo.CLUserVo;

public class UserManagePayloads {

    @Schema(description = "User 정보 응답")
    @Data
    @Builder
    public static class UserInfoResponse {
        @Schema(description = "User 데이터")
        private CLUserVo user;
    }

    @Schema(description = "User 목록 조회 요청 - 페이징")
    @Data
    public static class UserPageRequest {

        @Schema(description = "페이지 번호, 첫번째 페이지가 0번")
        private int pageNumber;

        @Schema(description = "페이지당 데이터 건수")
        private int rowsPerPage;

        @Length(max = 30)
        @Schema(description = "검색할 이름, 없으면 null", nullable = true)
        private String userName;

        @Length(max = 30)
        @Schema(description = "검색할 이름, 없으면 null", nullable = true)
        private String lgonId;

        @Size(max = 100)
        private String keyword;

    }

    @Schema(description = "User 목록 조회 응답 - 페이징")
    @Data
    @Builder
    public static class UserPageResponse {
        @Schema(description = "페이지 데이터")
        private CLPagerData<CLUserVo> pagerData;
    }

    @Schema(description = "사용자 신규 등록 요청 데이터")
    @Data
    public static class UserRegRequest {

        @Schema(description = "로그인ID")
        private String lgonId;

        @Schema(description = "비밀번호")
        private String pswd;

        @Schema(description = "사용자성명")
        private String userName;

        @Schema(description = "사용자상태")
        private String userState;

        @Schema(description = "등록자ID")
        private String regrId;

        @Schema(description = "생년월일")
        private String bryyMndy;

        @Schema(description = "사용자핸드폰번호")
        private String userTno;

        @Schema(description = "사용자내선번호")
        private String userExno;

        @Schema(description = "사용자등급")
        private String userGd;

        @Schema(description = "CTI사용자고유번호")
        private String ctiUserNtno;

        @Schema(description = "프린트가능여부")
        private String prtPosbYn;

        @Schema(description = "다운로드가능여부")
        private String dwnlPosbYn;

        @Schema(description = "야간여부")
        private String atntYn;

        @Schema(description = "메모")
        private String memo;

        @Schema(description = "팀아이디")
        private String teamId;
    }

    @Schema(description = "사용자 기본정보 업데이트")
    @Data
    public static class UserUpdateRequest {

        @Schema(description = "사용자ID")
        private long userId;

        @Schema(description = "사용자이름")
        private String userName;

        @Schema(description = "사용자상태")
        private CLUserState userState;

        @Schema(description = "비밀번호초기화여부")
        private String pswdInitYn;

        @Schema(description = "생년월일")
        private String bryyMndy;

        @Schema(description = "사용자핸드폰번호")
        private String userTno;

        @Schema(description = "사용자내선번호")
        private String userExno;

        @Schema(description = "사용자등급")
        private String userGd;

        @Schema(description = "CTI사용자고유번호")
        private String ctiUserNtno;

        @Schema(description = "프린트가능여부")
        private String prtPosbYn;

        @Schema(description = "다운로드가능여부")
        private String dwnlPosbYn;

        @Schema(description = "야간여부")
        private String atntYn;

        @Schema(description = "메모")
        private String memo;

        @Schema(description = "팀아이디")
        private String teamId;
    }

    @Schema(description = "사용자 비밀번호 초기화 상태로 변경")
    @Data
    public static class UserInitPswdRequest {

        @Schema(description = "사용자ID")
        private long userId;

        @Schema(description = "변경할 비밀번호")
        private String pswd;
    }

    @Schema(description = "사용자 비밀번호 초기화 상태로 변경")
    @Data
    public static class UserPswdRequest {

        @Schema(description = "이전 비밀번호")
        private String oldPswd;

        @Schema(description = "변경할 비밀번호")
        private String pswd;
    }
}
