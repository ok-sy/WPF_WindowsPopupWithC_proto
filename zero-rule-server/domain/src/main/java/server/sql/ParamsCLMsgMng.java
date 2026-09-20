package server.sql;

import org.springframework.lang.Nullable;

abstract public class ParamsCLMsgMng {

    /**
     * 파라미터: 메시지 목록 조회 - 페이지
     */
    @lombok.Data
    @lombok.Builder
    public static class FindPage {
        /**
         * 한 페이지당 데이터수
         */
        @Nullable
        private int rowsPerPage;

        /**
         * 페이지 번호
         */
        @Nullable
        private int pageNumber;

        /**
         * 메시지 타입
         */
        @Nullable
        private String msgClsf;

        /**
         * 업무구분코드
         */
        @Nullable
        private String tskClsfCd;

        /**
         * 발생구분코드
         */
        @Nullable
        private String occrClsfCd;

        /**
         * 팀 이름
         */
        @Nullable
        private long teamId;

        /**
         * 메시지 ID
         */
        @Nullable
        private String msgId;

        /**
         * 메시지
         */
        @Nullable
        private String msgCn;
    }

    /**
     * 파라미터: 등록
     */
    @lombok.Data
    @lombok.Builder
    public static class Insert {
        /**
         * 메시지 아이디
         */
        private String msgId;

        /**
         * 메시지 타입
         */
        private String msgClsf;

        /**
         * 업무구분코드
         */
        private String tskClsfCd;

        /**
         * 팀 아이디
         */
        private String teamId;

        /**
         * 발생구분코드
         */
        private String occrClsfCd;

        /**
         * 메시지출력코드
         */
        private String msgPrntCd;

        /**
         * 메시지내용
         */
        private String msgCn;

        /**
         * 등록자 아이디
         */
        private String regrId;

        /**
         * 변경자 아이디
         */
        private String chgrId;
    }

    /**
     * 파라미터: 등록
     */
    @lombok.Data
    public static class InsertArr {


        /**
         * 메시지 타입 11
         */
        private String msgClsf;

        /**
         * 업무구분코드
         */
        private String tskClsfCd;

        /**
         * 팀 아이디
         */
        private String teamId;

        /**
         * 발생구분코드
         */
        private String occrClsfCd;

        /**
         * 메시지출력코드
         */
        private String msgPrntCd;

        /**
         * 메시지내용
         */
        private String msgCn;
    }

    /**
     * 파라미터: 메시지 아이디 자돟생성 일련번호
     */
    @lombok.Data
    @lombok.Builder
    public static class MakeForMsgId {
        /**
         * 발생구분코드
         */
        private String occrClsfCd;

        /**
         * 업무구분코드
         */
        private String tskClsfCd;
    }

    /**
     * 파라미터: 수정
     */
    @lombok.Data
    @lombok.Builder
    public static class Update {
        /**
         * 팀 아이디
         */
        private int teamId;

        /**
         * 메시지 구분
         */
        private String msgClsf;

        /**
         * 발생구분코드
         */
        private String occrClsfCd;

        /**
         * 메시지출력코드
         */
        private String msgPrntCd;

        /**
         * 메시지내용
         */
        private String msgCn;

        /**
         * 변경자 아이디
         */
        private String chgrId;

        /**
         * 메시지 아이디
         */
        private String msgId;
    }

    /**
     * 파라미터: 수정
     */
    @lombok.Data
    @lombok.Builder
    public static class UpdateUseYn {
        /**
         * 사용여부
         */
        private String useYn;

        /**
         * 메시지 아이디
         */
        private String msgId;
    }
}
