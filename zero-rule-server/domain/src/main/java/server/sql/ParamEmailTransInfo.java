package server.sql;

import org.springframework.lang.Nullable;

public abstract class ParamEmailTransInfo {
    @lombok.Data
    @lombok.Builder
    public static class EmailTransInfoList {
        /**
         * 한 페이지당 데이터수
         */
//        private int rowsPerPage;

        /**
         * 페이지 번호
         */
//        private int pageNumber;

        /**
         * 사번
         */
        @Nullable
        private String empId;

        /**
         * 송수신타입
         */
        @Nullable
        private String emailTransceiveTypeCd;

        /**
         * 시작일
         */
        private String fromDt;

        /**
         * 종료일
         */
        private String toDt;
    }
}
