package server.sql;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.util.Date;

abstract public class ParamsItemMgmt {

    @lombok.Data
    @lombok.Builder
    public static class ItemMgmtInsert {

        /**
         *
         */
        @Nullable
        private String itemId;

        /**
         *
         */
        @Nullable
        private String itemNm;

        /**
         *
         */
        @NonNull
        private String itemAliasNm;

        /**
         *
         */
        @NonNull
        private String itemExplanDesc;

        /**
         *
         */
        @Nullable
        private String dataTypeCd;

        /**
         *
         */
        @Nullable
        private String updateUserID;

        /**
         *
         */
        @Nullable
        private String itemUseYn;

        /**
         *
         */
        @Nullable
        private String firstRegUserId;

        @Nullable
        private String firstregDatetime;

        @Nullable
        private String ifid;

    }

    @lombok.Data
    @lombok.Builder
    public static class ItemMgmtSelect {
        @Nullable
        private  String itemNm;
        @Nullable
        private  String itemAliasNm;
        @Nullable
        private  String itemUseYn;
        @Nullable
        private  String ifid;
    }

    @lombok.Data
    @lombok.Builder
    public static class ItemRefInsert {

        @Nullable
        private  String itemid;
        @Nullable
        private  String itemrefCd;
        @Nullable
        private  String itemrefNm;
        @Nullable
        private  String itemrefaliasNm;
        @Nullable
        private  String itemrefexprDesc;
        @Nullable
        private String updateUserid;
    }


    @lombok.Data
    @lombok.Builder
    public static class ItemRefModify {

        @Nullable
        private  String itemId;
        @Nullable
        private  String itemrefCd;
        @Nullable
        private  String itemrefNm;
        @Nullable
        private  String itemrefaliasNm;
        @Nullable
        private  String itemrefexprDesc;
        @Nullable
        private String updateUserid;
        @Nullable
        private String asisInputItemrefCd;
    }


}
