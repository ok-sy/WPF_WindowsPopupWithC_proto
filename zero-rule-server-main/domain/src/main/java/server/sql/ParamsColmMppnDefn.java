package server.sql;

import jakarta.annotation.Nullable;

/**
 * ParamsColmMppnDefnMapper에서 사용하는 SQL 파라미터들
 * Mapper의 SQL ID별로 INNER 클래스를 만든다.
 * 가급적 @Nullable, @NonNull을 명시한다.
 * 단, primitive, collection 타입은 제외
 */
abstract public class ParamsColmMppnDefn {
    @lombok.Data
    @lombok.Builder
    public static class Search {
        /**
         * To Be 테이블명 검색
         */
        @Nullable
        private String tobeTblPhyNm;
    }

}
