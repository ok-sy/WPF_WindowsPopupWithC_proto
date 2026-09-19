package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import server.domain.vo.RuleInterfaceInfoVo;
import server.domain.vo.RuleInterfaceMapSave;
import server.domain.vo.RuleInterfaceMapVo;

import java.util.List;

public class RuleInterfacePayloads {

    @Schema(description = "인터페이스 단건 응답 데이터")
    @Builder
    @Data
    public static class InterfaceInfoResponse {
        private List<RuleInterfaceInfoVo> interfaceInfos;
    }

    @Schema(description = "인터페이스 단건 요청 데이터")
    @Data
    public static class InterfaceInfoRequest {
        private String ifid;

        private String ifNm;

    }

    @Schema(description = "인터페이스 신규 응답 데이터")
    @Builder
    @Data
    public static class InterfaceInsertResponse {
        private int result;
    }

    @Schema(description = "인터페이스 신규 요청 데이터")
    @Data
    public static class InterfaceInsertRequest {
//        private String ifid;
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

//        private int updateUserid;
//        private String updateDatetime;

    }

    @Schema(description = "인터페이스 업데이트 요청 데이터")
    @Data
    public static class InterfaceUpdtaeRequest {
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

//        private int updateUserid;
//        private String updateDatetime;

    }

    @Schema(description = "인터페이스  데이터")
    @Builder
    @Data
    public static class InterfaceMapResponse {
        private List<RuleInterfaceMapVo> interfaceMaps;
    }

    @Schema(description = "인터페이스  데이터")
    @Data
    public static class InterfaceMapRequest {
        private String ifid;
        private String ifNm;

    }


    @Schema(description = "인터페이스  데이터")
    @Builder
    @Data
    public static class InterfaceMapSaveResponse {
        private int result;
    }

    @Schema(description = "인터페이스  데이터")
    @Data
    public static class InterfaceMapSaveRequest {
        private List<RuleInterfaceMapSave> interfaceMaps;
    }


    @Schema(description = "인터페이스 신규 요청 데이터")
    @Data
    public static class InterfaceDelRequest {
        private List<String> delInterfaceList;

    }



}
