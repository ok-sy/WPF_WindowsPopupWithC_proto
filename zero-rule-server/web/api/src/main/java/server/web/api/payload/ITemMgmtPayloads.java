package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import server.domain.entity.ItemMgmt;
import server.domain.vo.ItemRefVo;
import server.domain.vo.UsedRuleInfoVo;

import java.util.List;

public class ITemMgmtPayloads {

    @Schema(description = "항목 정보 응답 데이터")
    @Builder
    @Data
    public static class ItemMgmtInsertResponse {
        @Schema(description = "항목등록응답")
        private int insertCnt;
    }

    @Schema(description = "항목 등록 Request")
    @Data // 생성자 어노테이션
    public static class ItemMgmtInsertRequest {

        @Schema(description = "항목이름")
        private  String itemNm;
                @Schema(description = "항목별칭")
        private  String itemAliasNm;
                @Schema(description = "항목설명")
        private  String itemExplanDesc;
                @Schema(description = "데이터타입")
        private  String dataTypeCd;
                @Schema(description = "사용여부")
        private  String itemUseYn;
                @Schema(description = "사용여부")
        private  String ifid;

    }

    @Schema(description = "항목 조회 응답 데이터")
    @Builder
    @Data
    public static class ItemMgmtSelectResponse {
        @Schema(description = "테스트페이지-정서 코드찾기 데이터 응답")
        List<ItemMgmt> itemMgmt;

    }

    @Schema(description = "항목 조회 Request")
    @Data // 생성자 어노테이션
    public static class ItemMgmtSelectRequest {

        @Schema(description = "항목이름")
        private  String itemNm;
        @Schema(description = "항목별칭")
        private  String itemAliasNm;
        @Schema(description = "사용여부")
        private  String itemUseYn;
        @Schema(description = "인터페이스아이디")
        private  String ifid;


    }


    @Schema(description = "항목 등록 Request")
    @Data // 생성자 어노테이션
    public static class ItemMgmtModifyRequest {

        @Schema(description = "항목 ID")
        private String itemid;
        @Schema(description = "항목이름")
        private String itemNm;
        @Schema(description = "항목별칭")
        private String itemAliasNm;
        @Schema(description = "항목설명")
        private String itemExplanDesc;
        @Schema(description = "데이터타입")
        private String dataTypeCd;
        @Schema(description = "사용여부")
        private String itemUseYn;
        @Schema(description = "인터페이스")
        private String ifid;
    }



    @Schema(description = "항목 참조 리스트 응답")
    @Builder
    @Data
    public static class ItemRefListResponse {
        @Schema(description = "항목등록응답")
        private List<ItemRefVo> itemRefs;
    }

    @Schema(description = "항목 참조 리스트 요청")
    @Data // 생성자 어노테이션
    public static class ItemRefListRequest {
        @Schema(description = "아이템 아이디")
        private  String itemid;

    }


    @Schema(description = "항목 참조 신규등록 응답")
    @Builder
    @Data
    public static class ItemRefCrudResponse {
        private int insertCnt;
    }

    @Schema(description = "항목 참조 신규 요청")
    @Data // 생성자 어노테이션
    public static class ItemRefInsertRequest {
        private String itemid;
        private String itemrefCd;
        private String itemrefNm;
        private String itemrefaliasNm;
        private String itemrefexprDesc;
    }


    @Schema(description = "항목 참조 신규 요청")
    @Data // 생성자 어노테이션
    public static class ItemRefModifyRequest {
        private String itemid;
        private String itemrefCd;
        private String itemrefNm;
        private String itemrefaliasNm;
        private String itemrefexprDesc;
        private String asisInputItemrefCd;
    }

    @Schema(description = "항목 참조 신규 요청")
    @Data // 생성자 어노테이션
    public static class ItemRefDelRequest {
        private String itemid;
        private String itemrefCd;
    }


    @Schema(description = "항목 조회 응답 데이터")
    @Builder
    @Data
    public static class UsedRuleInfoResponse {

        private List<UsedRuleInfoVo> usedRuleInfo;

    }

    @Schema(description = "항목 조회 Request")
    @Data // 생성자 어노테이션
    public static class UsedRuleInfoRequest {
        @Schema(description = "항목이름")
        private  String itemid;

    }



}
