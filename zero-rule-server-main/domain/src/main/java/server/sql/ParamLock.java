package server.sql;

import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.Instant;
import java.util.Date;

abstract public class ParamLock {

    @lombok.Data
    @lombok.Builder
    public static class LockSearch {
        /**
         * PK
         *
         */
        @Nullable
        private String lockcode;

        /**
         *
         */
        @Nullable
        private String userid;

        /**
         *
         */
        @Nullable
        private String userNm;


    }

    @lombok.Data
    @lombok.Builder
    public static class InsertLock {

        @Nullable
        private String lockcode;

        @Nullable
        private String lockkey;

        @Nullable
        private String userid;

        @Nullable
        private String locktypecode;

        @Nullable
        private String locknote;

        @Nullable
        private Instant insertTime;

    }

    @lombok.Data
    @lombok.Builder
    public static class FindRuleUptMode {

        private String lockkey;
    }
}
