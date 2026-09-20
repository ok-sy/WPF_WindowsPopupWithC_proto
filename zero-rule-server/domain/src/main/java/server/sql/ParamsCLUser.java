package server.sql;

import cl.cloverframework.log.CLUserState;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

/**
 * CLUserMapper에서 사용하는 SQL 파라미터들
 * Mapper의 SQL ID별로 INNER 클래스를 만든다.
 * 가급적 @Nullable, @NonNull을 명시한다.
 * 단, primitive, collection 타입은 제외
 */
abstract public class ParamsCLUser {

    /**
     * 파라미터: 사용자 목록 조회 - 페이지
     */
    @lombok.Data
    @lombok.Builder
    public static class FindPage {
        /**
         * 한 페이지당 데이터수
         */
        private int rowsPerPage;

        /**
         * 페이지 번호
         */
        private int pageNumber;

        /**
         * 사용자 이름
         */
        @Nullable
        private String userNm;

        /**
         * 사용자 아이디
         */
        @Nullable
        private String lgonId;
        /**
         * 사용자 아이디 또는 이름
         */
        @Nullable
        private String keyword;
    }

    /**
     * 파라미터: 사용자 최종 로그인 시간 업데이트
     */
    @lombok.Data
    @lombok.Builder
    public static class UpdateLastLoginTime {
        /**
         * 사용자 ID
         */
        private long userId;

        /**
         * 변경 사용자 ID
         */
        @Nullable
        private String chgrId;
    }

    /**
     * 파라미터: 사용자 변경 업데이트
     */
    @lombok.Data
    @lombok.Builder
    public static class Update {
        /**
         * 사용자 ID
         */
        private long userId;

        /**
         * 변경 사용자 ID
         */
        @Nullable
        private String chgrId;

        /**
         * 사용자이름
         */
        @Nullable
        private String userNm;

        /**
         * 사용자상태
         */
        @NonNull
        private CLUserState userState;

        /**
         * 비밀번호 초기화여부
         */
        @NonNull
        private String pswdInitYn;

        /**
         * 생년월일
         */
        @Nullable
        private String bryyMndy;

        /**
         * 사용자핸드폰번호
         */
        @Nullable
        private String userTno;

        /**
         * 사용자내선번호
         */
        @Nullable
        private String userExno;

        /**
         * 사용자등급
         */
        @NonNull
        private String userGd;

        /**
         * CTI사용자고유번호
         */
        @Nullable
        private String ctiUserNtno;

        /**
         * 프린트가능여부
         */
        @NonNull
        private String prtPosbYn;

        /**
         * 다운로드가능여부
         */
        @NonNull
        private String dwnlPosbYn;

        /**
         * 야간여부
         */
        @NonNull
        private String atntYn;

        /**
         * 메모
         */
        @Nullable
        private String memo;

        /**
         * 팀아이디
         */
        @Nullable
        private String teamId;
    }

    /**
     * 파라미터: 사용자 최종 로그인 시간 업데이트
     */
    @lombok.Data
    @lombok.Builder
    public static class UpdatePswdByAdmin {
        /**
         * 사용자 ID
         */
        private long userId;

        /**
         * 변경 사용자 ID
         */
        @Nullable
        private String chgrId;
        /**
         * 변경될 비밀번호
         */
        @Nullable
        private String pswd;
    }

    /**
     * 파라미터: 사용자 비밀번호 변경
     */
    @lombok.Data
    @lombok.Builder
    public static class UpdatePswd {
        /**
         * 사용자 ID
         */
        private long userId;

        /**
         * 변경될 비밀번호
         */
        @Nullable
        private String pswd;
    }

    /**
     * 파라미터: 사용자 최종 로그인 시간 업데이트
     */
    @lombok.Data
    @lombok.Builder
    public static class UpdateLoginFailCnt {
        /**
         * 사용자 ID
         */
        private long userId;

        /**
         * 변경 사용자 ID
         */
        @Nullable
        private String chgrId;
    }
}

