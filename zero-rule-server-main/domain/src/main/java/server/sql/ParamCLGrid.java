package server.sql;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.Nullable;

abstract public class ParamCLGrid {
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InsertFilter {
        /**
         *  그리드 필터 ID
         */
        @Nullable
        private long filterId;
        /**
         *  필터명
         */
        private String filterNm;
        /**
         *  사용자ID
         */
        @Nullable
        private long userId;
        /**
         *  화면 코드
         */
        private String pageCode;
        /**
         *  텍스트필터모드여부
         */
        private String filterModeYn;
        /**
         *  기본필터 설정여부
         */
        private String defaultYn;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InsertColumn {
        /**
         * 	컬럼ID
         */
        private String columnId;
        /**
         * 	그리드 필터 ID
         */
        @Nullable
        private long filterId;
        /**
         * 	컬럼표시여부
         */
        @Nullable
        private String visiableYn;
        /**
         * 	컬럼문자
         */
        @Nullable
        private String filteringText;
        /**
         * 	필터링 연산자
         */
        @Nullable
        private String filteringOperCode;
        /**
         * 	컬럼순번
         */
        @Nullable
        private long columnSeq;
        /**
         * 	컬럼타입코드
         */
        @Nullable
        private String columnTypeCode;
        /**
         * 	데이터정렬방식
         */
        @Nullable
        private String sortingInfo;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateDefaultYn {
        private String pageCode;

        private long userId;

        @Nullable
        private String filterNm;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DelGridFilter {
        private String pageCode;

        private long userId;

        private String filterNm;
    }
}
