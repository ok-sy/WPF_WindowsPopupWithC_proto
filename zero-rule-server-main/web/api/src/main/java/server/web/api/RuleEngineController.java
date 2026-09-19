package server.web.api;

import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import server.base.DocTags;
import server.domain.vo.ruleEngine.CallRuleResultVo;
import server.service.core.RuleEngineService;
import server.sql.ParamsRuleEngine;
import server.web.api.payload.RuleEnginePayloads;
import server.web.support.ApiBaseController;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;

@Tag(name = DocTags.RUEL_ENGINE)
@RestController
@Slf4j
@SuppressWarnings("unused")
public class RuleEngineController extends ApiBaseController {
    @Autowired
    RuleEngineService ruleEngineService;


    @Operation(
            summary = "룰테스트",
            description = "룰테스트용 api" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 룰,key:항목,value:항목값 파라미터의 리턴값을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RuleEnginePayloads.RuleTestResponse.class)
            )
    )
    @PostMapping("/apis/rule/ruleTest")
    public CLNewApiResponse<RuleEnginePayloads.RuleTestResponse> ruleTest(
            @Parameter(description = "룰테스트 Json 형식 단건 결과응답")
            @RequestBody RuleEnginePayloads.RuleTestRequest payload
    ) throws Exception {
        ruleEngineService.initRuleTestInfo();

        return resultMsg("BE00000001",
                RuleEnginePayloads.RuleTestResponse.builder()
                        .ruleTestResult(ruleEngineService.callRule(payload.getRuleTestParam(), "Y"))
                        .build()
        );
    }


    @Operation(
            summary = "룰호출",
            description = "룰호출 api" +
                    "<b>[에러코드]</b><br/>"
    )
    @ApiResponse(
            responseCode = "200",
            description = "성공 응답, 룰,key:항목,value:항목값 파라미터의 리턴값을 응답한다",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = RuleEnginePayloads.CallRuleResponse.class)
            )
    )

    @PostMapping("/api/rule/callRule")
    public RuleEnginePayloads.CallRuleResponse callRule(
            @Parameter(description = "룰 Json 형식 단건 결과응답")
            @RequestBody RuleEnginePayloads.CallRuleRequest payload
    ) {
        CallRuleResultVo callRuleResultVo;
        try {
            Timestamp timestamp = new Timestamp(System.currentTimeMillis());
            SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmssSSS");
            String logStartTime = sdf.format(timestamp);
            callRuleResultVo = ruleEngineService.callRule(payload.getCallRuleParam(), "N");
            Timestamp timestamp1 = new Timestamp(System.currentTimeMillis());
            String logEndTime = sdf.format(timestamp1);
            ruleEngineService.insertLog(ParamsRuleEngine.InsertLog.builder()
                    .logTitle("룰호출")
                    .logStartTime(logStartTime)
                    .logEndTime(logEndTime)
                    .timeGap(Long.parseLong(logEndTime) - Long.parseLong(logStartTime))
                    .logRequest(String.valueOf(payload))
                    .logResponse(callRuleResultVo.toString())
                    .ruleVerNo(callRuleResultVo.getRuleVerNo())
                    .ruleId(callRuleResultVo.getRuleId())
                    .resCode(callRuleResultVo.getResCode())
                    .inspectionYn(callRuleResultVo.getInspectionYn())
                    .ruleAliasNm(String.valueOf(payload.getCallRuleParam().getRuleInfo().getRuleValue()))
                    .build());
            return RuleEnginePayloads.CallRuleResponse.builder()
                    .callRuleResult(callRuleResultVo)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }




    @PostMapping("/apis/rule/ruleInfoUpdate")
    public CLNewApiResponse<RuleEnginePayloads.RuleTestResponse> ruleInfoUpdate(
            @Parameter(description = "룰테스트 Json 형식 단건 결과응답")
            @RequestBody RuleEnginePayloads.RuleTestRequest payload
    ) throws Exception {

        ruleEngineService.initRuleInfo();
        CallRuleResultVo callRuleResultVo = new CallRuleResultVo();
        return resultMsg("BE00000001",
                RuleEnginePayloads.RuleTestResponse.builder()
                        .ruleTestResult(callRuleResultVo)
                        .build()
        );
    }
}
