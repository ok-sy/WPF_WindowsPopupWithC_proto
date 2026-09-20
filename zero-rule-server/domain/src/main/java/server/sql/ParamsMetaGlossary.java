package server.sql;

import org.springframework.lang.Nullable;


/**
 * MetaGlossaryMapper에서 사용하는 SQL 파라미터들
 * Mapper의 SQL ID별로 INNER 클래스를 만든다.
 * 가급적 @Nullable, @NonNull을 명시한다.
 * 단, primitive, collection 타입은 제외
 */
abstract public class ParamsMetaGlossary {

    /**
     * MeataGlosary의 검색 파라미터
     */
    @lombok.Data
    @lombok.Builder
    public static class Search {
        /**
         * 한글명
         */
        @Nullable
        private String glsyKorNm;

        /**
         * 물리명
         */
        @Nullable
        private String glsyPhyNm;


        /**
         * 영어명
         */
        @Nullable
        private String engFullNm;

        /**
         * 데이터 타입
         */
        @Nullable
        private String dataType;


        /**
         * 설명
         */
        @Nullable
        private String glsyExpl;

        /**
         * 최대 조회 건수
         */
        private int maxCount;
    }

}
