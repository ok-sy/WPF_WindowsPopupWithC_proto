package server.sql;

import org.springframework.lang.Nullable;

/**
 * PdsMapper에서 사용하는 SQL 파라미터들
 * Mapper의 SQL ID별로 INNER 클래스를 만든다.
 * 가급적 @Nullable, @NonNull을 명시한다.
 * 단, primitive, collection 타입은 제외
 */
abstract public class ParamsPds {


    /**
     * Pds 페이지 조회
     */
    @lombok.Data
    @lombok.Builder
    public static class FindPageSearch {
        /**
         * 한 페이지당 데이터수
         */
        private int rowsPerPage;

        /**
         * 페이지 번호
         */
        private int pageNumber;

        /**
         * 제목
         */
        @Nullable
        private String title;
    }

}
