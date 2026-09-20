package server.sql;

import org.springframework.lang.NonNull;

/**
 * PdsFileMapper에서 사용하는 SQL 파라미터들
 * Mapper의 SQL ID별로 INNER 클래스를 만든다.
 * 가급적 @Nullable, @NonNull을 명시한다.
 * 단, primitive, collection 타입은 제외
 */
abstract public class ParamsPdsFile {


    /**
     * PdsFile의 파일명 업데이트
     */
    @lombok.Data
    @lombok.Builder
    public static class UpdateFileNameById {
        @NonNull
        private String fileId;

        @NonNull
        private String fileName;
    }


    /**
     * PdsFile의 pdsId 업데이트
     */
    @lombok.Data
    @lombok.Builder
    public static class UpdatePdsIdById {
        private long pdsId;

        private String fileId;

        private long sortNumber;
    }
}

