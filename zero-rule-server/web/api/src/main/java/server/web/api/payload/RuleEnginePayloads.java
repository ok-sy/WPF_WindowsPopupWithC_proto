package server.web.api.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import org.hibernate.validator.constraints.Length;
import server.domain.vo.ruleEngine.CallRuleParamVo;
import server.domain.vo.ruleEngine.CallRuleResultVo;

public class RuleEnginePayloads {


    @Schema(description = "룰테스트 Json형식 단건 응답 데이터")
    @Builder
    @Data
    public static class RuleTestResponse {
        @Schema(description = "룰테스트 단건 인포")
        private CallRuleResultVo ruleTestResult;
    }

    @Schema(description = "룰테스트 Json형식 단건 요청 데이터")
    @Data
    public static class RuleTestRequest {

        @Length(max = 500)
        @Schema(description = "룰테스트 요청 인포")
        private CallRuleParamVo ruleTestParam;

    }

    @Schema(description = "룰 Json형식 단건 응답 데이터")
    @Builder
    @Data
    public static class CallRuleResponse {
        @Schema(description = "룰 단건 인포")
        private CallRuleResultVo callRuleResult;
    }

    @Schema(description = "룰테스트 Json형식 단건 요청 데이터")
    @Data
    public static class CallRuleRequest {

        @Length(max = 500)
        @Schema(description = "룰 요청 인포")
        private CallRuleParamVo callRuleParam;

    }

}
