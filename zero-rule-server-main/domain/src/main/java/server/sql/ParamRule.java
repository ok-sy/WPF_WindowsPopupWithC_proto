package server.sql;

import org.springframework.lang.Nullable;

import java.time.Instant;

abstract public class ParamRule {

    @lombok.Data
    @lombok.Builder
    public static class InsertRuleInfo {
        private String ruleid;
        private String ruleNm;
        private String rulealiasNm;
        private String ruleDesc;
        private String rulereturnType;
        private String rulesortCd;
        private String ruleusageCd;
        private String allreturnYn;
        private String useYn;
        private double ruleVerno;

        private String activateYn;
        private Instant activateDatetime;

        private String ruleState;

//        private Instant deployDatetime;
        private String deployUserid;

        private String ifid;

        private long firstregUserid;
//        private String firstregDatetime;

        private long updateUserid;
//        private String updateDatetime;

        private String ruleApplyYn;
        private String deployWaitStateAppyYn;
    }

    @lombok.Data
    @lombok.Builder
    public static class InsertRuleReturn {
        private String ruleid;
        private String returnItemid;
        private Long returnitemNo;
        private long updateUserid;

    }

    @lombok.Data
    @lombok.Builder
    public static class InsertRuleCondition {

        private String ruleid;
        private Long ruleconditionno;
        private String conditionInfixDesc;
        private String conditionPostfixDesc;
        private String conditionDesc;
        private long firstregUserid;
//        private String firstregDatetime;
        private long updateUserid;
//        private String updateDatetime;
    }
    @lombok.Data
    @lombok.Builder
    public static class InsertRuleconditionreturnitem {
        private String returnItemid;
        private String ruleid;
        private Long ruleconditionno;
        private String returnitemExprDesc;
        private String returnitemPostfixDesc;
        private long firstregUserid;
//        private String firstregDatetime;
        private long updateUserid;
//        private String updateDatetime;

    }

    @lombok.Data
    @lombok.Builder
    public static class InsertRuleconditionPostfixobject {
        private String ruleid;
        private Long postfixobjectno;
        private Long ruleconditionno;
        private String datatypeCd;
        private String operatorYn;
        private String objectData;
    }

    @lombok.Data
    @lombok.Builder
    public static class InsertRuleconditionReturnPostfixobject {
        private String returnItemid;
        private String ruleid;
        private Long ruleconditionno;
        private Long postfixobjectno;
        private String datatypeCd;
        private String operatorYn;
        private String objectData;
    }

    @lombok.Data
    @lombok.Builder
    public static class SelectRuleObjType {
        private String ruleid;
        private Long postfixobjectno;
        private Long ruleconditionno;
        private String datatypeCd;
    }

    @lombok.Data
    @lombok.Builder
    public static class RuleActiveUpdate {
        private String ruleid;
        private String activeYn;
    }

    @lombok.Data
    @lombok.Builder
    public static class FindRuleForLock {
        private String ruleid;
        private long userid;
    }

    @lombok.Data
    @lombok.Builder
    public static class RuleTreeSearch {
        @Nullable
        private String value;
        @Nullable
        private String keyword;
    }

    @lombok.Data
    @lombok.Builder
    public static class InsertRuleProgress {
        private String ruleid;
        private double ruleVerno;
        private String ruleState;
        private String currentRuleApplyYn;
        private String deployWaitStateApplyYn;
        private int updateUserid;
//        private String UPDATE_DATETIME;

    }

    @lombok.Data
    @lombok.Builder
    public static class InsertRuleDeploy {
        private String deployDatetime;
        private String ruleid;
        private double ruleVerno;
        private String ruleUpdateYn;
        private String beforeDeployApplyYn;
        private String afterDeployApplyYn;
        private String ruleUpdateUserid;
        private String ruleUpdateDatetime;
        private Long regUserid;
//        private String regDatetime;

    }

    @lombok.Data
    @lombok.Builder
    public static class FindRuleDeployHis {
        private String ifid;
        private String ruleNm;
        private String deployUserid;
        private String fromDt;
        private String toDt;
    }

}
