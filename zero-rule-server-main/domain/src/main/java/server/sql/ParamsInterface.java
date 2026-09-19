package server.sql;

import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.util.List;

/**
 */
abstract public class ParamsInterface {

    /**
     * SQL 파라미터 객체
     * MetaWord의 검색 파라미터
     */
    @lombok.Data
    @lombok.Builder
    public static class InterfaceInfos {
        private String ifid;

        private String ifNm;
    }

    @lombok.Data
    @lombok.Builder
    public static class InterfaceInsert {
        private String ifid;
        private String ifNm;
        private String ifDesc;
        private String ifProcessTypeCd;
        private String ifConnectionTypeCd;
        private String ruleUseYn;
        private int docLength;
        private String characterset;
        private String eaiid;
        private int firstregUserid;
        private String firstregDatetime;

//        private int updateUserid;
//        private String updateDatetime;
    }

    @lombok.Data
    @lombok.Builder
    public static class InterfaceUpdate {
        private String ifid;
        private String ifNm;
        private String ifDesc;
        private String ifProcessTypeCd;
        private String ifConnectionTypeCd;
        private String ruleUseYn;
        private int docLength;
        private String characterset;
        private String eaiid;
//        private int firstregUserid;
//        private String firstregDatetime;

        private int updateUserid;
        private String updateDatetime;
    }


    @lombok.Data
    @lombok.Builder
    public static class InterfaceMapInsert {
        private String ifid;
        private String fieldEngNm;
        private String fieldKorNm;
        private int fieldOrder;
        private int fieldLength;
        private int fieldStartNo;
        private String fieldCodeType;
        private String datatypeCd;
        private int fieldScale;
        private String trimYn;
        private String characterset;
        private int firstregUserid;
//        private String firstregDatetime;
//        private int updateUserid;
//        private String updateDatetime;
    }

    @lombok.Data
    @lombok.Builder
    public static class InterfaceMapUpdate {
        private String ifid;
        private String fieldEngNm;
        private String fieldKorNm;
        private int fieldOrder;
        private int fieldLength;
        private int fieldStartNo;
        private String fieldCodeType;
        private String datatypeCd;
        private int fieldScale;
        private String trimYn;
        private String characterset;
        private int updateUserid;
//        private int firstregUserid;
//        private String firstregDatetime;

//        private String updateDatetime;
    }


}
