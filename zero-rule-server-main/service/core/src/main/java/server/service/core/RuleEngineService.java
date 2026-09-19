package server.service.core;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import server.domain.vo.ruleEngine.*;
import server.repo.core.mapper.RuleEngineMapper;
import server.service.core.ruleCore.RuleExecution;
import server.sql.ParamsRuleEngine;

import java.io.IOException;
import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;


@SuppressWarnings({"unchecked", "MismatchedQueryAndUpdateOfCollection"})
@Service
public class RuleEngineService{

    @Autowired
    RuleEngineMapper ruleEngineMapper;

    @Setter
    @Getter
    private ArrayList<HashMap<String, Object>> ruleServiceInfo;

    @Setter
    @Getter
    private ArrayList<HashMap<String, Object>> ruleTestServiceInfo;

    @Setter
    @Getter
    private ArrayList<RuleItemVo> ruleItemInfo;

    @PostConstruct
    public void initRuleInfo() {
        try {
            setRuleServiceInfo(RuleDbReader("N"));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @PostConstruct
    public void initRuleTestInfo() {
        try {
            setRuleTestServiceInfo(RuleDbReader("Y"));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * 라인별 파일 읽는 메소드
     * @param param : 항목값, testYN : test룰 여부
     *
     * @return
     * 			ArrayList<HashMap<String, Object>>
     * 			 - key, value
     *           - "rulename", (String) 룰명
     *           - "returnCountType", (String) 룰갯수타입 (0:단건, 1:다건)
     *           - "returnItemCount", (Int) 리턴항목갯수
     *           - "ruleCondition",	 ArrayList<String[][]> 룰조건식정보
     *                               String[0][0]:조건식
     *                               String[2][returnItemCount-1]:반환항목alias명
     *                               String[3][returnItemCount-1]:데이타타입
     *                               String[4][returnItemCount-1]:반환식
     */
    @SuppressWarnings({ "null"})
    public CallRuleResultVo callRule(CallRuleParamVo param, String testYN) throws Exception {

        Calendar before = Calendar.getInstance();
        Timestamp timestamp = new Timestamp(System.currentTimeMillis());
        SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmssSSS");
        String logStartTime = sdf.format(timestamp);
        System.out.println("logServiceStartTime:" + logStartTime);
//        final Logger log = Logger.getLogger(RuleEngineService.class);
        String ruleId = null;
        float ruleVerNo = 0;
        ArrayList<HashMap<String, Object>> arrayHashRule;

        if (testYN.equals("Y")) {
            arrayHashRule = ruleTestServiceInfo;
        } else {
            arrayHashRule = ruleServiceInfo;
        }

        ArrayList<HashMap<String, Object>> arrayHashRuleTemp = new ArrayList<>();
        for(int i=0; i<arrayHashRule.size(); i++){
            HashMap<String, Object> cloneMap1 = (HashMap<String, Object>)arrayHashRule.get(i).clone();
            cloneMap1.remove("conditionInfo");
            ArrayList<HashMap<String, Object>> conditionInfo = (ArrayList<HashMap<String, Object>>)arrayHashRule.get(i).get("conditionInfo");
            ArrayList<HashMap<String, Object>> conditionInfoTemp = new ArrayList<>();
            for (HashMap<String, Object> objectHashMap : conditionInfo) {
                HashMap<String, Object> cloneMap2 = (HashMap<String, Object>) objectHashMap.clone();
                cloneMap2.remove("conditionPostfixObjectInfo");
                cloneMap2.remove("returnItemInfo");
                ArrayList<PostfixExpressionVo> conditionPostfixObjectInfo = (ArrayList<PostfixExpressionVo>) objectHashMap.get("conditionPostfixObjectInfo");
                ArrayList<HashMap<String, Object>> returnItemInfo = (ArrayList<HashMap<String, Object>>) objectHashMap.get("returnItemInfo");
                ArrayList<PostfixExpressionVo> conditionPostfixObjectInfoTemp = new ArrayList<>();
                ArrayList<HashMap<String, Object>> returnItemInfoTemp = new ArrayList<>();
                for (PostfixExpressionVo expressionVo : conditionPostfixObjectInfo) {
                    PostfixExpressionVo cloneVo = expressionVo.clone();
                    conditionPostfixObjectInfoTemp.add(cloneVo);
                }
                for (HashMap<String, Object> stringObjectHashMap : returnItemInfo) {
                    HashMap<String, Object> cloneMap3 = (HashMap<String, Object>) stringObjectHashMap.clone();
                    cloneMap3.remove("returnItemPostfixObjectInfo");
                    ArrayList<PostfixExpressionVo> returnItemPostfixObjectInfo = (ArrayList<PostfixExpressionVo>) stringObjectHashMap.get("returnItemPostfixObjectInfo");
                    ArrayList<PostfixExpressionVo> returnItemPostfixObjectInfoTemp = new ArrayList<>();
                    for (PostfixExpressionVo postfixExpressionVo : returnItemPostfixObjectInfo) {
                        PostfixExpressionVo cloneVo = postfixExpressionVo.clone();
                        returnItemPostfixObjectInfoTemp.add(cloneVo);
                    }
                    cloneMap3.put("returnItemPostfixObjectInfo", returnItemPostfixObjectInfoTemp);
                    returnItemInfoTemp.add(cloneMap3);

                }
                cloneMap2.put("returnItemInfo", returnItemInfoTemp);
                cloneMap2.put("conditionPostfixObjectInfo", conditionPostfixObjectInfoTemp);
                conditionInfoTemp.add(cloneMap2);
            }
            cloneMap1.put("conditionInfo",conditionInfoTemp);
            arrayHashRuleTemp.add(i,cloneMap1);
        }



        HashMap<String, Object> ruleInfo = new HashMap<>();

        CallRuleResultVo callRuleResultVo = new CallRuleResultVo();
        JSONObject input = new JSONObject();
        // 각각 키 값 출력
        ArrayList<RuleItemVo> arrayListItemVo = this.RuleItemReader();
        for (CallRuleItemVo callRuleItemVo : param.getRuleItemList()) {
            String keyName = callRuleItemVo.getItemNm();
            String keyValue = callRuleItemVo.getItemValue();

            for (RuleItemVo ruleItemVo : arrayListItemVo) {
                if (keyName.equals("[" + ruleItemVo.getItemNm() + "]")) {
                    input.remove(keyName);
                    if ("0".equals(ruleItemVo.getDataTypeCd())) { // 데이타타입이 숫자인 경우
                        input.put("[" + ruleItemVo.getItemId() + "]", keyValue);
                    } else { // 데이타타입이 문자인 경우
                        input.put("[" + ruleItemVo.getItemId() + "]", "\"" + keyValue + "\"");
                    }
                }
            }
        }

        String paramRuleValue = param.getRuleInfo().getRuleValue();
        ArrayList<HashMap<String, Object>> ruleReturnItemInfo = new ArrayList<>();
        for (HashMap<String, Object> stringObjectHashMap : arrayHashRuleTemp) {
            if (stringObjectHashMap.get("ruleName").toString().equals(paramRuleValue)) {
                ruleId = stringObjectHashMap.get("ruleId").toString();
                ruleVerNo = (float) stringObjectHashMap.get("ruleVerNo");
                ruleReturnItemInfo = (ArrayList<HashMap<String, Object>>) stringObjectHashMap.get("ruleReturnItemInfo");

            }
        }

        if (null == ruleId) {
            callRuleResultVo.setResCode("9001");
            callRuleResultVo.setInspectionYn("E");
            return callRuleResultVo;
        }
        ruleInfo.put("paramRuleId", ruleId);
        ruleInfo.put("mainRuleYN", "Y");
        ruleInfo.put("arrayHashRule", arrayHashRuleTemp);
        ruleInfo.put("ruleReturnItemInfo", ruleReturnItemInfo);
        ruleInfo.put("inputParam", input);
        RuleExecution ruleExecution = new RuleExecution();
        ruleExecution.setRuleInfo(ruleInfo);
        ruleExecution.runIFRule();
        ruleInfo = ruleExecution.getRuleInfo();

        callRuleResultVo = (CallRuleResultVo) ruleInfo.get("result");
        callRuleResultVo.setRuleId(ruleId);
        callRuleResultVo.setRuleVerNo(ruleVerNo);
        if (callRuleResultVo.getRuleReturnList() == null) {
            callRuleResultVo.setResCode("1000");
            callRuleResultVo.setInspectionYn("N");
            //RuleReturnList가 없을 경우 ruleReturnItem을 가져와서 넣어준다.
            List<CallRuleReturnItemVo> callRuleReturnItemVoList = new ArrayList<>();
            ArrayList<HashMap<String, Object>> ruleReturnItemInfoList = (ArrayList<HashMap<String, Object>>) ruleInfo.get("ruleReturnItemInfo");
            for (HashMap<String, Object> stringObjectHashMap : ruleReturnItemInfoList) {
                CallRuleReturnItemVo callRuleReturnItemVo = new CallRuleReturnItemVo();
                callRuleReturnItemVo.setReturnItemNm(stringObjectHashMap.get("returnItemAliasNm").toString());
                callRuleReturnItemVoList.add(callRuleReturnItemVo);
            }
            callRuleResultVo.setRuleReturnList(callRuleReturnItemVoList);
            //return callRuleResultVo;
        } else {
            if (!callRuleResultVo.getRuleReturnList().isEmpty()) {
                callRuleResultVo.setResCode("1000");
                if (callRuleResultVo.getRuleReturnList().get(0).getReturnItemValue().isEmpty()) {
                    callRuleResultVo.setInspectionYn("N");
                    //return callRuleResultVo;
                } else {
                    for (CallRuleReturnItemVo callRuleReturnItemVo : callRuleResultVo.getRuleReturnList()) {
                        callRuleReturnItemVo.setReturnItemValue(callRuleReturnItemVo.getReturnItemValue().replace("\"", ""));
                    }
                    callRuleResultVo.setInspectionYn("Y");
                    //return callRuleResultVo;
                }
            } else {
                callRuleResultVo.setResCode("1000");
                callRuleResultVo.setInspectionYn("N");
                //return callRuleResultVo;
            }
        }
        Calendar after = Calendar.getInstance();
        int diffHour = after.get(Calendar.HOUR_OF_DAY) - before.get(Calendar.HOUR_OF_DAY);
        int diffMinute = after.get(Calendar.MINUTE) - before.get(Calendar.MINUTE);
        int diffSecond = after.get(Calendar.SECOND) - before.get(Calendar.SECOND);
        int diffMillisecond = after.get(Calendar.MILLISECOND) - before.get(Calendar.MILLISECOND);
        System.out.println("시 : " + diffHour);
        System.out.println("분 : " + diffMinute);
        System.out.println("초 : " + diffSecond);
        System.out.println("밀리세컨드 : " + diffMillisecond);
        return callRuleResultVo;
    }

    private ArrayList<RuleItemVo> RuleItemReader() {

        ArrayList <RuleItemVo> arrayListItemVo;
        arrayListItemVo = (ArrayList<RuleItemVo>) ruleEngineMapper.ruleItemList();
        return arrayListItemVo;
    }


    private ArrayList<HashMap<String, Object>> RuleDbReader(String testYN) throws IOException {

        ArrayList<HashMap<String, Object>> ruleInfo = new ArrayList<>();
        ArrayList <RuleVo> arrayRuleVoList = new ArrayList<>();
        ArrayList <RuleConditionVo> arrayRuleConditionVoList = new ArrayList<>();
        ArrayList <RuleConditionReturnItemVo> arrayRuleConditionReturnItemVoList = new ArrayList<>();
        ArrayList <PostfixExpressionVo> arrayPostfixExpressionVoList = new ArrayList<>();
        ArrayList<RuleReturnItemVo> arrayRuleReturnItemVoList = new ArrayList<>();

        List<RuleInfoVo> ruleInfoVoList;
        if ("Y".equals(testYN)) {
            ruleInfoVoList = ruleEngineMapper.ruleTestInfoList();
        } else {
            ruleInfoVoList = ruleEngineMapper.ruleInfoList();
        }
        for (RuleInfoVo vo : ruleInfoVoList) {
            if ("0".equals(vo.getRuleConfigType())) {
                RuleVo ruleVo = new RuleVo();
                ruleVo.setRuleId(vo.getRuleId());
                ruleVo.setRuleNm(vo.getRuleNm());
                ruleVo.setRuleAliasNm(vo.getRuleAliasNm());
                ruleVo.setRuleSortCd(vo.getRuleSortCd());
                ruleVo.setRuleReturnType(vo.getRuleReturnType());
                ruleVo.setReturnItemCount(vo.getReturnItemCount());
                ruleVo.setAllReturnYn(vo.getAllReturnYn());
                ruleVo.setUseYn(vo.getUseYn());
                ruleVo.setRuleVerNo(vo.getRuleVerNo());
                arrayRuleVoList.add(ruleVo);
            } else if ("1".equals(vo.getRuleConfigType())){
                RuleConditionVo ruleConditionVo = new RuleConditionVo();
                ruleConditionVo.setRuleId(vo.getRuleId());
                ruleConditionVo.setRuleConditionNo(vo.getRuleConditionNo());
                ruleConditionVo.setConditionInfixDesc(vo.getConditionInfixDesc());
                ruleConditionVo.setConditionPostfixDesc(vo.getConditionPostfixDesc());
                arrayRuleConditionVoList.add(ruleConditionVo);
            } else if ("2".equals(vo.getRuleConfigType())) {
                RuleConditionReturnItemVo ruleConditionReturnItemVo = getRuleConditionReturnItemVo(vo);
                arrayRuleConditionReturnItemVoList.add(ruleConditionReturnItemVo);
            } else if ("3".equals(vo.getRuleConfigType())) {
                RuleReturnItemVo ruleReturnItemVo = new RuleReturnItemVo();
                ruleReturnItemVo.setReturnItemNm(vo.getItemNm());
                ruleReturnItemVo.setRuleId(vo.getRuleId());
                ruleReturnItemVo.setReturnItemNo(vo.getReturnItemNo());
                ruleReturnItemVo.setReturnItemId(vo.getItemId());
                ruleReturnItemVo.setRuleReturnDataType(vo.getReturnDataType());
                ruleReturnItemVo.setReturnItemAliasNm(vo.getItemAliasNm());
                arrayRuleReturnItemVoList.add(ruleReturnItemVo);
            }
        }

        List<PostfixExpressionVo> ruleConditionPostfixExpressionList = ruleEngineMapper.ruleConditionPostfixExpressionList();
        for (PostfixExpressionVo vo : ruleConditionPostfixExpressionList) {
            PostfixExpressionVo postfixExpressionVo = new PostfixExpressionVo();
            postfixExpressionVo.setRuleId(vo.getRuleId());
            postfixExpressionVo.setRuleConditionNo(vo.getRuleConditionNo());
            postfixExpressionVo.setPostFixObjectNo(vo.getPostFixObjectNo());
            postfixExpressionVo.setOperatorYn(vo.getOperatorYn());
            postfixExpressionVo.setDatatypeCd(vo.getDatatypeCd());
            postfixExpressionVo.setObjectData(vo.getObjectData());
            arrayPostfixExpressionVoList.add(postfixExpressionVo);
        }

        List<PostfixExpressionVo> ruleConditionPostfixExpressionList2 = ruleEngineMapper.ruleConditionReturnPostfixExpressionList();
        for (PostfixExpressionVo vo : ruleConditionPostfixExpressionList2) {
            PostfixExpressionVo postfixExpressionVo = new PostfixExpressionVo();
            postfixExpressionVo.setRuleId(vo.getRuleId());
            postfixExpressionVo.setRuleConditionNo(vo.getRuleConditionNo());
            postfixExpressionVo.setReturnItemId(vo.getReturnItemId());
            postfixExpressionVo.setPostFixObjectNo(vo.getPostFixObjectNo());
            postfixExpressionVo.setOperatorYn(vo.getOperatorYn());
            postfixExpressionVo.setDatatypeCd(vo.getDatatypeCd());
            postfixExpressionVo.setObjectData(vo.getObjectData());
            postfixExpressionVo.setReturnItemNo(vo.getReturnItemNo());
            arrayPostfixExpressionVoList.add(postfixExpressionVo);
        }

        //arrayList에 적재된 룰정보를 ruleInfo객체에 적재
        for (RuleVo ruleVo : arrayRuleVoList) {
            HashMap<String, Object> ruleMap = new HashMap<>();
            ruleMap.put("ruleId", ruleVo.getRuleId());
            ruleMap.put("ruleName", ruleVo.getRuleNm());
            ruleMap.put("ruleAliasNm", ruleVo.getRuleAliasNm());
            ruleMap.put("ruleSortCd", ruleVo.getRuleSortCd());
            ruleMap.put("rowDataType", ruleVo.getRuleReturnType());
            ruleMap.put("returnItemCount", ruleVo.getReturnItemCount());
            ruleMap.put("allReturnYN", ruleVo.getAllReturnYn());
            ruleMap.put("ruleVerNo", ruleVo.getRuleVerNo());

            ArrayList<HashMap<String, Object>> conditionInfo = new ArrayList<>();
            ArrayList<HashMap<String, Object>> ruleReturnItemInfo = new ArrayList<>();
            //룰의 조건식만큼 loop
            for (RuleConditionVo ruleConditionVo : arrayRuleConditionVoList) {
                HashMap<String, Object> ruleConditionMap = new HashMap<>();
                ArrayList<PostfixExpressionVo> conditionPostfixObjectInfo = new ArrayList<>();
                ArrayList<HashMap<String, Object>> returnItemInfo = new ArrayList<>();
                if (ruleVo.getRuleId().equals(ruleConditionVo.getRuleId())) {
                    int m = 0;
                    int ruleConditionNo = ruleConditionVo.getRuleConditionNo();
                    for (PostfixExpressionVo postfixExpressionVo : arrayPostfixExpressionVoList) {
                        if (ruleVo.getRuleId().equals(postfixExpressionVo.getRuleId())
                                && ruleConditionNo == postfixExpressionVo.getRuleConditionNo()
                                && postfixExpressionVo.getReturnItemId() == null) {
                            m = m + 1;
                            PostfixExpressionVo postfixExpressionVo2 = getPostfixExpressionVo(postfixExpressionVo);
                            conditionPostfixObjectInfo.add(postfixExpressionVo2);
                        }
                    }
                    m = 0;
                    for (RuleConditionReturnItemVo ruleConditionReturnItemVo : arrayRuleConditionReturnItemVoList) {
                        HashMap<String, Object> returnItemMap = new HashMap<>();
                        if (ruleVo.getRuleId().equals(ruleConditionReturnItemVo.getRuleId())
                                && ruleConditionNo == ruleConditionReturnItemVo.getRuleConditionNo()) {
                            returnItemMap.put("returnItemId", ruleConditionReturnItemVo.getReturnItemId());
                            returnItemMap.put("returnItemAliasNm", ruleConditionReturnItemVo.getItemAliasNm());
                            returnItemMap.put("returnDataType", ruleConditionReturnItemVo.getReturnDataType());
                            returnItemMap.put("returnItemNo", ruleConditionReturnItemVo.getReturnItemNo());
                            String returnItemId = ruleConditionReturnItemVo.getReturnItemId();
                            m = m + 1;
                            ArrayList<PostfixExpressionVo> returnItemPostfixObjectInfo = new ArrayList<>();
                            for (PostfixExpressionVo postfixExpressionVo : arrayPostfixExpressionVoList) {
                                if (ruleVo.getRuleId().equals(postfixExpressionVo.getRuleId())
                                        && ruleConditionNo == postfixExpressionVo.getRuleConditionNo()
                                        && returnItemId.equals(postfixExpressionVo.getReturnItemId())) {
                                    PostfixExpressionVo postfixExpressionVo2 = getExpressionVo(postfixExpressionVo);
                                    returnItemPostfixObjectInfo.add(postfixExpressionVo2);

                                }
                            }
                            returnItemMap.put("returnItemPostfixObjectInfo", returnItemPostfixObjectInfo);
                            returnItemInfo.add(returnItemMap);
                        }
                    }
                    ruleConditionMap.put("returnItemInfo", returnItemInfo);
                    ruleConditionMap.put("conditionPostfixObjectInfo", conditionPostfixObjectInfo);
                    conditionInfo.add(ruleConditionMap);
                }
            }

            for (RuleReturnItemVo ruleReturnItemVo : arrayRuleReturnItemVoList) {
                HashMap<String, Object> ruleReturnItemMap = new HashMap<>();
                if (ruleVo.getRuleId().equals(ruleReturnItemVo.getRuleId())) {
                    ruleReturnItemMap.put("returnItemId", ruleReturnItemVo.getReturnItemId());
                    ruleReturnItemMap.put("returnItemAliasNm", ruleReturnItemVo.getReturnItemAliasNm());
                    ruleReturnItemMap.put("returnDataType", ruleReturnItemVo.getRuleReturnDataType());
                    ruleReturnItemMap.put("returnItemNo", ruleReturnItemVo.getReturnItemNo());
                    ruleReturnItemInfo.add(ruleReturnItemMap);
                }
            }
            ruleMap.put("conditionInfo", conditionInfo);
            ruleMap.put("ruleReturnItemInfo", ruleReturnItemInfo);
            ruleInfo.add(ruleMap);
        }
        return ruleInfo;
    }

    private static PostfixExpressionVo getExpressionVo(PostfixExpressionVo postfixExpressionVo) {
        PostfixExpressionVo postfixExpressionVo2 = new PostfixExpressionVo();
        postfixExpressionVo2.setPostFixObjectNo(postfixExpressionVo.getPostFixObjectNo());
        postfixExpressionVo2.setOperatorYn(postfixExpressionVo.getOperatorYn());
        postfixExpressionVo2.setDatatypeCd(postfixExpressionVo.getDatatypeCd());
        postfixExpressionVo2.setObjectData(postfixExpressionVo.getObjectData());
        postfixExpressionVo2.setReturnItemId(postfixExpressionVo.getReturnItemId());
        postfixExpressionVo2.setReturnItemNo(postfixExpressionVo.getReturnItemNo());
        return postfixExpressionVo2;
    }

    private static PostfixExpressionVo getPostfixExpressionVo(PostfixExpressionVo postfixExpressionVo) {
        PostfixExpressionVo postfixExpressionVo2 = new PostfixExpressionVo();
        postfixExpressionVo2.setPostFixObjectNo(postfixExpressionVo.getPostFixObjectNo());
        postfixExpressionVo2.setOperatorYn(postfixExpressionVo.getOperatorYn());
        postfixExpressionVo2.setDatatypeCd(postfixExpressionVo.getDatatypeCd());
        postfixExpressionVo2.setObjectData(postfixExpressionVo.getObjectData());
        postfixExpressionVo2.setRuleConditionNo(postfixExpressionVo.getRuleConditionNo());
        return postfixExpressionVo2;
    }

    private static RuleConditionReturnItemVo getRuleConditionReturnItemVo(RuleInfoVo vo) {
        RuleConditionReturnItemVo ruleConditionReturnItemVo = new RuleConditionReturnItemVo();
        ruleConditionReturnItemVo.setRuleId(vo.getRuleId());
        ruleConditionReturnItemVo.setRuleConditionNo(vo.getRuleConditionNo());
        ruleConditionReturnItemVo.setItemAliasNm(vo.getItemAliasNm());
        ruleConditionReturnItemVo.setItemNm(vo.getItemNm());
        ruleConditionReturnItemVo.setReturnItemExprDesc(vo.getReturnItemExprDesc());
        ruleConditionReturnItemVo.setReturnDataType(vo.getReturnDataType());
        ruleConditionReturnItemVo.setReturnItemId(vo.getItemId());
        ruleConditionReturnItemVo.setReturnItemNo(vo.getReturnItemNo());
        return ruleConditionReturnItemVo;
    }

    public void insertLog(ParamsRuleEngine.InsertLog param) {
        ruleEngineMapper.insertLog(param);
    }
}
