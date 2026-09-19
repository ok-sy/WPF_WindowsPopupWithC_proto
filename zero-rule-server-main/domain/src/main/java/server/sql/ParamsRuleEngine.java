package server.sql;

abstract public class ParamsRuleEngine {

    @lombok.Data
    @lombok.Builder
    public static class InsertLog {
        private String logTitle;
        private String logStartTime;
        private String logEndTime;
        private long timeGap;
        private String logRequest;
        private String logResponse;
        private String ruleAliasNm;
        private String ruleId;
        private float ruleVerNo;
        private String inspectionYn;
        private String resCode;
    }
}
