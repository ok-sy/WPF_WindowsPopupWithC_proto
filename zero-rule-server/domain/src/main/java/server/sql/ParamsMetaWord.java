package server.sql;

import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.util.List;

/**
 * MetaWordMapper에서 사용하는 SQL 파라미터들
 * Mapper의 SQL ID별로 INNER 클래스를 만든다.
 * 가급적 @Nullable, @NonNull을 명시한다.
 * 단, primitive, collection 타입은 제외
 */
abstract public class ParamsMetaWord {

    /**
     * SQL 파라미터 객체
     * MetaWord의 검색 파라미터
     */
    @lombok.Data
    @lombok.Builder
    public static class Search {
        /**
         * 단어 이름
         */
        @Nullable
        private String name;

        /**
         * 단어 영문명
         */
        @Nullable
        private String fullName;


        /**
         * 단어 한글명
         */
        @Nullable
        private String korName;

        /**
         * 엔티티 여부
         */
        @Nullable
        private String entityYn;


        /**
         * 속성 여부
         */
        @Nullable
        private String attrYn;

        /**
         * 동의어
         */
        @Nullable
        private String synm;

        /**
         * 설명
         */
        @Nullable
        private String expl;

        /**
         * 설명 공백없음
         */
        @Nullable
        private String explNoSpace;

        /**
         * 최대 조회 건수
         */
        private int maxCount;

        /**
         * 정렬키 - 테이블 컬럼명
         */
        @NonNull
        private List<String> sortKeys;
    }

}
