package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.hibernate.validator.constraints.Length;
import server.domain.entity.ItemMgmt;
import server.domain.vo.*;

import java.util.List;

public class RulePayloads {

    @Schema(description = "룰 정보 응답 데이터")
    @Builder
    @Data
    public static class RuleTreeListResponse {
        @Schema(description = "룰 테이블 목록")
        private List<TreeIfRuleVo> treeIfRules;
    }

    @Schema(description = "룰 테이블 요청 데이터")
    @Data
    public static class RuleTreeListRequest {
//        @Length(max = 100)
//        @Schema(description = "메타 단어 이름", nullable = true)
//        private String name;
//
//        @Length(max = 100)
//        @Schema(description = "풀네임", nullable = true)
//        private String fullName;


    }


    @Schema(description = "룰 이름의 응답 데이터")
    @Builder
    @Data
    public static class RuleNameListResponse {
        @Schema(description = "룰 이름 테이블 목록")
        private List<RuleNameVo> ruleNames;
    }


    @Schema(description = "룰 단건 응답 데이터")
    @Builder
    @Data
    public static class RuleInfoResponse {
        @Schema(description = "룰 단건 인포")
        private RuleVo rule;

        @Schema(description = "룰 단건 인포")
        private List<RuleReturnItemAndItemInfoVo> ruleReturnItem;

        @Schema(description = "룰 단건 입력항목 목록")
        private List<String> inputItems;
    }

    @Schema(description = "룰 단건 요청 데이터")
    @Data
    public static class RuleInfoRequest {

        @Length(max = 100)
        @Schema(description = "룰 아이디", nullable = true)
        private String ruleid;


        @Length(max = 100)
        @Schema(description = "룰 별칭", nullable = true)
        private String ruleAlias;

    }

    @Schema(description = "룰 단건 응답 데이터")
    @Builder
    @Data
    public static class RuleDetailInfoResponse {

        @Schema(description = "룰 단건 인포")
        private RuleVo ruleInfo;

        @Schema(description = "룰 단건 인포")
        private List<ItemMgmt> ruleInfoRuleReturn;

        @Schema(description = "룰 단건 인포")
        private List<RuleInfoConditionVo> ruleInfoCondition;

        @Schema(description = "해당 사용자가 해당 룰의 락을 편집중인지 데이터값")
        private String ruleUseType;    
        
        @Schema(description = "히스토리")
        private List<RuleVerstionVo> ruleHistory;
    }

    @Schema(description = "룰 수정 요청 데이터")
    @Data
    public static class RuleUpdateCreateRequest {

        @Length(max = 100)
        @Schema(description = "룰 아이디", nullable = true)
        private String ruleid;

        @Schema(description = "업데이트 룰 정보", nullable = true)
        private RuleVo ruleInfo;

        @Schema(description = "업데이트 반환 리스트", nullable = true)
        private List<RuleInfoRuleReturnVo> ruleInfoRuleReturn;

        @Schema(description = "업데이트 조건식 리스트", nullable = true)
        private List<RuleInfoConditionVo> ruleInfoCondition;



    }

    @Schema(description = "룰 수정 응답 데이터")
    @Builder
    @Data
    public static class RuleUpdateCreateResponse {
        @Schema(description = "룰 수정 응답")
        private String updateRuleId;

    }


    @Schema(description = "룰 단건 응답 데이터")
    @Builder
    @Data
    public static class RuleReturnConditonValiResponse {
        @Schema(description = "룰 단건 인포")
        private String result;
    }

    @Schema(description = "룰 수정 요청 데이터")
    @Data
    public static class RuleReturnConditonValiRequest {
        @Schema(description = "벨리 리퀘스트", nullable = true)
        private List<RuleReturnItemValidation> ruleInfoCondition;

    }

    @Schema(description = "룰 활성/비활성 상태 업데이트 응답")
    @Builder
    @Data
    public static class RuleActiveUpdateResponse {
        @Schema(description = "업데이트 완료 카운트")
        private int uptCnt;
    }

    @Schema(description = "룰 활성/비활성 상태 업데이트 요청")
    @Data
    public static class RuleActiveUpdateRequest {
        @Schema(description = "룰아이디")
        private String ruleid;
        @Schema(description = "활성/비활성상태")
        private String activeYn;

    }

    @Schema(description = "룰 삭제 응답")
    @Builder
    @Data
    public static class RuleDeleteResponse {
        @Schema(description = "삭제 완료 카운트")
        private int delCnt;
    }



    @Schema(description = "룰 테스트 완료 ")
    @Builder
    @Data
    public static class RuleTestSubmitResponse {
        @Schema(description = "테스트 완료 카운트")
        private int delCnt;
    }
    @Schema(description = "룰 테스트 완료 ")
    @Builder
    @Data
    public static class RuleApplyResponse {
        @Schema(description = "테스트 완료 카운트")
        private int applyYn;
    }

    @Schema(description = "룰 적용건수 카운트 ")
    @Builder
    @Data
    public static class RuleApplyCntResponse {
        @Schema(description = "적용건수 카운트")
        private int applyCnt;
    }

    @Schema(description = "룰 적용건수 카운트 ")
    @Builder
    @Data
    public static class RuleDeployWaitResponse {
        @Schema(description = "적용건수 카운트")
        private List<RuleDeployWaitVo> waitList;
        private String recentDeploy;
    }

//    List<RuleConditionInfixDescVo>
    @Schema(description = "룰 적용건수 카운트 ")
    @Builder
    @Data
    public static class RuleConditionInfixDescResponse {
        @Schema(description = "중위식조건 룰 반환항목테이터 타입")
        private List<RuleConditionInfixDescVo> ruleConditionInfixDescVo;
    }


    @Builder
    @Data
    public static class RuleProgressHstResponse {
        private List<RuleProgressHistoryVo> ruleProgressHistoryVo;
    }


    @Builder
    @Data
    public static class UsedItem {
        private List<UsedItemInfo> usedItem;
    }


    @Builder
    @Data
    public static class UsedRule {
        private List<UsedRuleDetailInfo> usedRule;
    }


    @Schema(description = "룰 적용건수 카운트 ")
    @Data
    public static class RuleDeployRequest {
        private List<RuleDeployWaitVo> waitList;
    }


    @Data
    public static class RuleDeployHisRequest {
        private String ifid;
        private String ruleNm;
        private String deployUserid;
        private String fromDt;
        private String toDt;

    }


    @Schema(description = "룰 적용건수 카운트 ")
    @Data
    @Builder
    public static class RuleDeployHisResponse {
        private List<RuleDeployHistoryVo> deployHis;
    }
}
