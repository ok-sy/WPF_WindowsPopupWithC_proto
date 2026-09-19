package server.sql;

import org.springframework.lang.Nullable;

/**
 * TeamMapper에서 사용하는 SQL 파라미터들
 * Mapper의 SQL ID별로 INNER 클래스를 만든다.
 * 가급적 @Nullable, @NonNull을 명시한다.
 * 단, primitive, collection 타입은 제외
 */
abstract public class ParamsTeam {

    /**
     * 파라미터: 팀 목록 조회 - 페이지
     */
    @lombok.Data
    @lombok.Builder
    public static class FindTeamVoByParam {

        /**
         * 팀명
         */
        private String teadNm;
    }

    @lombok.Data
    @lombok.Builder
    public static class Create {
        /**
         * 팀 ID
         */
        @Nullable
        private String teamId;

        /**
         * 팀명
         */
        @Nullable
        private String teamNm;
        /**
         * 팀설명
         */
        @Nullable
        private String teamExpl;
        /**
         * 개인설정허용여부
         */
        private String psnlStupAcceYn;
        /**
         * 팀공통 설정 내용
         */
        @Nullable
        private byte[] teamCmmnStupCn;
        /**
         * 팀상태
         */
        private long teamStat;
        /**
         * TEAM 업무 구분
         */
        private long teamTskClsf;
        /**
         * 등록자_ID
         */
        @Nullable
        private String regrId;
        /**
         * 변경자_ID
         */
        @Nullable
        private String chgrId;
    }

    @lombok.Data
    @lombok.Builder
    public static class Update {
        /**
         * 팀 ID
         */
        @Nullable
        private String teamId;

        /**
         * 팀명
         */
        @Nullable
        private String teamNm;
        /**
         * 팀설명
         */
        @Nullable
        private String teamExpl;
        /**
         * 개인설정허용여부
         */
        private String psnlStupAcceYn;
        /**
         * 팀공통 설정 내용
         */
        @Nullable
        private byte[] teamCmmnStupCn;
        /**
         * 팀상태
         */
        private long teamStat;
        /**
         * TEAM 업무 구분
         */
        private long teamTskClsf;
        /**
         * 등록자_ID
         */
        @Nullable
        private String regrId;
        /**
         * 변경자_ID
         */
        @Nullable
        private String chgrId;
    }

}

