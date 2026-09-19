package server.sql;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.util.Date;

abstract public class ParamCmmn {
    @lombok.Data
    @lombok.Builder
    public static class Select {
        /**
         * PK
         * 조치_ID
         */
        @Nullable
        private String actnId;

        /**
         * 조치명
         */
        @Nullable
        private String actnNm;

        /**
         * 다건실행여부
         */
        @NonNull
        private String mnumExecYn;

        /**
         * 삭제여부
         */
        @NonNull
        private String delYn;

        /**
         * 변경일시
         */
        @Nullable
        private Date chngDttm;

        /**
         * 변경 사용자ID
         */
        @Nullable
        private String chgrId;
    }

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CountByGrantedUserPriv {
        /**
         * 사용자 id
         */
        @NonNull
        private long userId;

        /**
         * API_URl
         */
        @NonNull
        private String apiUrl;
    }

    @Builder
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Create {
        /**
         * 시퀀스
         */
        private long logSeq;

        /**
         * 요청일자
         */
        private Date reqDt;

        /**
         * API_URl
         */
        private String apiUrl;

        /**
         * 시작일시
         */
        private String stTm;

        /**
         * 종료일시
         */
        private String edTm;

        /**
         * 수행시간
         */
        private String procTm;

        /**
         * 사용자ID
         */
        private long userId;
    }
}
