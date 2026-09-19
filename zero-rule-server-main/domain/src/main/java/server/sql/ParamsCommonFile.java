package server.sql;

import java.time.Instant;
import java.util.Collection;

/**
 * CommonFileMapper에서 사용하는 SQL 파라미터들
 * Mapper의 SQL ID별로 INNER 클래스를 만든다.
 * 가급적 @Nullable, @NonNull을 명시한다.
 * 단, primitive, collection 타입은 제외
 */
abstract public class ParamsCommonFile {
    /**
     * 파라미터로 전달된 파일 ID의 파일 삭제
     */
    @lombok.Data
    @lombok.Builder
    public static class DeleteByFileIdIn {

        /**
         * 테이블명
         */
        private String tableName;


        /**
         * 삭제할 파일 ID
         */
        private Collection<String> fileIds;
    }

    /**
     * 주어진 테이블의 파일 조회
     */
    @lombok.Data
    @lombok.Builder
    public static class FindByFileId {

        /**
         * 테이블명
         */
        private String tableName;


        /**
         * 파일 ID
         */
        private String fileId;
    }

    /**
     * 삭제 마킹된 파일 목록 조회
     */
    @lombok.Data
    @lombok.Builder
    public static class FindDeleteMarkedFiles {

        /**
         * 테이블명
         */
        private String tableName;

        /**
         * 기준 시간,
         * 기준 시간 이전의 데이터만 조회
         */
        private Instant maxTimestamp;

        /**
         * 최대 조회 건수
         */
        private int maxCount;
    }

}
