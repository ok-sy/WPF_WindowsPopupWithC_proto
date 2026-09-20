package server.sql;

import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

/**
 * CLErrCodeMapper 에 SQL 파라미터들
 */
abstract public class ParamsCLErrCode {

    /**
     * 에러 코드 목록 조회 - 페이징
     */
    @lombok.Data // setter,getter,toString(),equals() 등 생성자를 만들어줍니다
    @lombok.Builder // 빌더패턴을 구현하는 어노테이션
    public static class FindPage {
        /**
         * 한 페이지당 데이터수
         */
        private int rowsPerPage;

        /**
         * 페이지 번호
         */
        @NonNull // null 값이 존재할수 없습니다
        private int pageNumber;

        /**
         * 메세지 ID
         */
        @Nullable // null 값이 존재할수 있습니다.
        private String msgId;

        /**
         * 메세지
         */
        @Nullable
        private String msg;

        /**
         * 타입
         */
        @Nullable
        private String type;
    }

    /**
     * 에러 코드 등록
     */
    @lombok.Data
    @lombok.Builder
    public static class Insert {
        /**
         * 메세지 ID
         */
        private String msgId;

        /**
         * 메세지
         */
        private String msg;

        /**
         * 타입
         */
        private String type;
    }

    /**
     * 에러 코드 수정
     */
    @lombok.Data
    @lombok.Builder
    public static class Update {
        /**
         * 메세지 ID
         */
        private String msgId;

        /**
         * 메세지
         */
        private String msg;

        /**
         * 타입
         */
        private String type;

        /**
         * 일련번호
         */
        private long errKey;
    }
}
