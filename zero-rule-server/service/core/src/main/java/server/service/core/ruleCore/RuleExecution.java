package server.service.core.ruleCore;

import lombok.Getter;
import lombok.Setter;
import org.json.simple.JSONObject;
import server.domain.vo.ruleEngine.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RuleExecution {

    @Setter
    @Getter
    private HashMap<String, Object> ruleInfo;

    @SuppressWarnings("unchecked")
    public void runIFRule() throws Exception {
        ArrayList<RuleOutputDataVo> result;
        ExecRule();
        try {
            //checkVaidtaionRuleItemReturn(ruleInfo.get(""));
            result = (ArrayList<RuleOutputDataVo>) ruleInfo.get("result");
            //1.arraylist to json
//            JSONObject jsOb = new JSONObject();
            CallRuleResultVo callRuleResultVo = new CallRuleResultVo();
            int countReturnItem = result.size();
            String[] returnItemArray = new String[countReturnItem];
            List<CallRuleReturnItemVo> callRuleItemVoList = new ArrayList<>();
            for (int i = 0; i < result.size(); i++) {
                for (int j = 0; j < result.get(i).getOutputDataList().size(); j++ ) {
                    if (returnItemArray[i] == null) {
                        returnItemArray[i] = result.get(i).getOutputDataList().get(j);
                    } else {
                        returnItemArray[i] = returnItemArray[i] + "," + result.get(i).getOutputDataList().get(j);
                    }
                    //jsOb.put(result.get(i).getItemAliasNm(),returnItemArray[i]);
                }
                CallRuleReturnItemVo callRuleReturnItemInfo = new CallRuleReturnItemVo();
                callRuleReturnItemInfo.setReturnItemNm(result.get(i).getItemAliasNm());
                callRuleReturnItemInfo.setReturnItemValue(returnItemArray[i]);
                callRuleItemVoList.add(callRuleReturnItemInfo);
                callRuleResultVo.setRuleReturnList(callRuleItemVoList);
            }
//            ruleInfo.put("result", jsOb);
            ruleInfo.put("result", callRuleResultVo);
        } catch (Exception e) {
            result = null;
            // TODO: handle exception
        }
    }
//
//	@SuppressWarnings("unchecked")
//	public void runIFRule() throws Exception {
//		String result = null;
//		ExecRule();
//		try {
//			//jsonarry,jobject
//			JSONArray jsonArray;
//			JSONObject jsonObject;
//			JSONArray jsonArray2 = new JSONArray();
//
//			jsonArray = (JSONArray) ruleInfo.get("result");
//			for(int i = 0; i < jsonArray.size(); i ++) {
//				jsonObject = (JSONObject) jsonArray.get(i);
////				jsonObject.put(key, value)
//
//				for (Object key : jsonObject.keySet()) {
//				        //based on you key types
//					String keyStr = (String)key;
//					String keyValue;
//					RuleOutputDataVo ruleOutputParam = (RuleOutputDataVo) jsonObject.get(keyStr);
//					keyValue = ruleOutputParam.getOutputData().toString();
//					jsonObject.put(keyStr, keyValue);
//				}
//				jsonArray2.add(jsonObject);
//			}
//			ruleInfo.put("result", jsonArray2);
//		} catch (Exception e) {
//			result = "";
//			// TODO: handle exception
//		}
//	}

    public void ExecRule() throws Exception {

        String ruleSortCd;
        ruleSortCd = ruleInfo.get("paramRuleId").toString().substring(2,3);

        switch (ruleSortCd) {
            case "0":      // 테이블룰인 경우
                execType0Rule();
                break;
            case "1":      // DB룰인 경우
                execType1Rule();
                break;
            default:
                //throw new RuntimeException("1001");
        }
//        result를 json 형태로 구성
    }

    @SuppressWarnings("unchecked")
    public void execType0Rule() throws Exception{

        HashMap<String,String> mainRuleInfoHashMap;
        ArrayList<HashMap<String, Object>> mainRuleConditionInfoArrayList;
        ArrayList<PostfixExpressionVo> conditionPostfixObjectInfo;
        ArrayList<PostfixExpressionVo> returnItemPostfixObjectInfo;
        returnItemPostfixObjectInfo = null;
        ArrayList<HashMap<String, Object>> returnItemInfo;
        String paramRuleId = ruleInfo.get("paramRuleId").toString();
        JSONObject inputParam = (JSONObject) ruleInfo.get("inputParam");
        String conditionResult;
        String returnData = null;
        String rowDataType;  //0: 단행, 1:다행
        String allReturnYN;  //Y: 만족하는 조건 모든 결과 반환, N: 만족하는 최초 한건 만 반환
        int countConditionTrue = 0;

        ArrayList<RuleOutputDataVo> totalReturnResult = null;

//		JSONArray jArray = new JSONArray();
        ArrayList<RuleOutputDataVo> ruleOutputDataVos;

        ArrayList<HashMap<String, Object>> arrayHashRule = (ArrayList<HashMap<String, Object>>) ruleInfo.get("arrayHashRule");
        Util util = new Util();
        mainRuleInfoHashMap = util.getRuleInfo(paramRuleId, arrayHashRule);
        rowDataType = mainRuleInfoHashMap.get("rowDataType"); //0:단행, 1:다행
        allReturnYN = mainRuleInfoHashMap.get("allReturnYN");
//		mainRuleYN = mainRuleInfoHashMap.get("mainRuleYN").toString();

        mainRuleConditionInfoArrayList = util.getRuleCondition(paramRuleId, arrayHashRule);
        ArrayList<RuleOutputDataVo> addRowReturnResult;
        addRowReturnResult = new ArrayList<>();
        for (HashMap<String, Object> stringObjectHashMap : mainRuleConditionInfoArrayList) {

            ArrayList<RuleOutputDataVo> returnResult = null;
//	    	if (log.isDebugEnabled()){
//	    		System.out.println("룰수식 "+i+":"+mainRuleConditionInfoArrayList.get(i)[1]);
//	    	}
            //{ 갯수만큼 루프
            conditionPostfixObjectInfo = (ArrayList<PostfixExpressionVo>) stringObjectHashMap.get("conditionPostfixObjectInfo");
            returnItemInfo = (ArrayList<HashMap<String, Object>>) stringObjectHashMap.get("returnItemInfo");

            ExpressionExecution expressionExecution = new ExpressionExecution();
            expressionExecution.setExpressionObject(conditionPostfixObjectInfo);
            expressionExecution.setJsonData(inputParam);
            expressionExecution.setRuleInfo(ruleInfo);
            expressionExecution.runCondExpression();
            conditionResult = expressionExecution.getConditionResult();

            // 결과가 T일 경우 리턴항목값 설정
            if (RuleManageConstants.RESULT_TRUE.equals(conditionResult)) {
                ArrayList<RuleOutputDataVo> addColumnReturnResult = new ArrayList<>();
                ArrayList<RuleOutputDataVo> ruleReturnDataInfoList;
                ruleReturnDataInfoList = new ArrayList<>();


                // 반환 항목 갯수만큼 loop
                for (int countReturnItem = 0; countReturnItem < returnItemInfo.size(); countReturnItem++) {
                    // 반환항목 순서대로 수행
                    for (HashMap<String, Object> objectHashMap : returnItemInfo) {

                        RuleOutputDataVo ruleOutputDataVo = new RuleOutputDataVo();
                        ruleOutputDataVo.setItemId(objectHashMap.get("returnItemId").toString());
                        ruleOutputDataVo.setDataType(objectHashMap.get("returnDataType").toString());
                        ruleOutputDataVo.setItemAliasNm(objectHashMap.get("returnItemAliasNm").toString());
                        ruleOutputDataVo.setReturnItemNo(Integer.parseInt(objectHashMap.get("returnItemNo").toString()));
                        returnItemPostfixObjectInfo = (ArrayList<PostfixExpressionVo>) returnItemInfo.get(countReturnItem).get("returnItemPostfixObjectInfo");
                        ruleReturnDataInfoList.add(ruleOutputDataVo);
                    }

                    // 반환항목 후위식 객체 만들기
                    for (PostfixExpressionVo postfixExpressionVo : returnItemPostfixObjectInfo) {
                        returnData = (String) postfixExpressionVo.getObjectData();
                        String dataTypeCd = postfixExpressionVo.getDatatypeCd();
                        if (RuleManageConstants.RULE_DATA_TYPE_TEXT.equals(dataTypeCd)) {
                            //returnData = "\""+returnData+"\"";
                        } else if (RuleManageConstants.RULE_DATA_TYPE_ITEM.equals(dataTypeCd)) {
                            returnData = util.getReplaceFromItemToInputData(inputParam, returnData);
                            postfixExpressionVo.setObjectData(returnData);
                            //TODO:id를 값으로 변환하는 로직 추가
                        } else if (RuleManageConstants.RULE_DATA_TYPE_SUBRULE.equals(dataTypeCd)) {
                            RuleExecution ruleExecution = new RuleExecution();
                            ruleInfo.put("paramRuleId", util.getRuleIdFromSubRuleExpression(returnData));
                            ruleInfo.put("mainRuleYN", "N");
                            ruleExecution.setRuleInfo(ruleInfo);
                            ruleExecution.ExecRule();
                            postfixExpressionVo.setObjectData(ruleInfo.get("result"));
                        }
                        //TODO:결과값을 계산하는 로직 구현
                    }
                    //expressionExecution.setRuleReturnDataInfo(ruleOutputDataVo);
                    expressionExecution.setExpressionObject(returnItemPostfixObjectInfo);
                    expressionExecution.setJsonData(inputParam);
                    expressionExecution.setRuleInfo(ruleInfo);
                    expressionExecution.setRuleReturnDataInfoList(ruleReturnDataInfoList);
                    expressionExecution.setReturnItemNo(countReturnItem + 1);
                    if (!returnItemPostfixObjectInfo.isEmpty()) {
                        expressionExecution.runReturnExpression();
                        returnResult = expressionExecution.getReturnResult();
                    } else {
                        returnResult = null;
                    }


                    if (countReturnItem == 0) {
                        addColumnReturnResult = returnResult;
                    } else {
                        if (returnResult != null) {
                            addColumnReturnResult = util.columnAddReturnResultList(addColumnReturnResult, returnResult);
                        }
                    }
                } // 리턴항목 루프


                if ("N".equals(allReturnYN)) {
                    totalReturnResult = addColumnReturnResult;
                    break;
                } else {
                    if (countConditionTrue == 0) {
                        addRowReturnResult = addColumnReturnResult;
                    } else {
                        addRowReturnResult = util.rowAppendReturnResultList(addRowReturnResult, addColumnReturnResult);
                    }
                    //기본꺼에서 row add
                }
                countConditionTrue = countConditionTrue + 1;
            } // 조건표현식 결과가 T
            totalReturnResult = addRowReturnResult;
        } //조건 표현식 루프
        ruleOutputDataVos = totalReturnResult;

//      	checkVaidtaionRuleItemReturn(rowDataType, returnItemInfo, ruleOutputDataVos);

        ruleInfo.put("result", ruleOutputDataVos);
    }

    @SuppressWarnings("unchecked")
    public void execType1Rule() throws Exception{

        ArrayList<HashMap<String, Object>> mainRuleConditionInfoArrayList;

        ArrayList<HashMap<String, Object>> returnItemInfo;
        String paramRuleId = ruleInfo.get("paramRuleId").toString();
        JSONObject inputParam = (JSONObject) ruleInfo.get("inputParam");
        String returnItemId;
        String returnDataType;
        String returnAliasNm;
//		JSONArray jArray = new JSONArray();


        ArrayList<HashMap<String, Object>> arrayHashRule = (ArrayList<HashMap<String, Object>>) ruleInfo.get("arrayHashRule");
        Util util = new Util();
        mainRuleConditionInfoArrayList = util.getRuleCondition(paramRuleId, arrayHashRule);

        DBRule dbRule = new DBRule();
        String dbRuleQuery = util.getReplaceFromItemToInputData(inputParam, dbRule.getDbRule(paramRuleId)).replace("\"","");

        //conditionPostfixObjectInfo = (ArrayList<PostfixExpressionVo>)mainRuleConditionInfoArrayList.get(0).get("conditionPostfixObjectInfo");
        returnItemInfo = (ArrayList<HashMap<String, Object>>)mainRuleConditionInfoArrayList.get(0).get("returnItemInfo");

        ArrayList<RuleOutputDataVo> ruleOutputDataVoList = new ArrayList<>();
        RuleOutputDataVo ruleOutputDataVo = new RuleOutputDataVo();
        //반환항목갯수만큼 loop
        for (HashMap<String, Object> stringObjectHashMap : returnItemInfo) {
            returnItemId = stringObjectHashMap.get("returnItemId").toString();
            returnDataType = stringObjectHashMap.get("returnDataType").toString();
            returnAliasNm = stringObjectHashMap.get("returnItemAliasNm").toString();
            //TODO:결과값을 계산하는 로직 구현
            ruleOutputDataVo.setItemId(returnItemId);
            ruleOutputDataVo.setDataType(returnDataType);
            ruleOutputDataVo.setItemAliasNm(returnAliasNm);
            ruleOutputDataVo.setReturnItemNo(Integer.parseInt(stringObjectHashMap.get("returnItemNo").toString()));
            ruleOutputDataVo.setOutputDataList(dbRule.getRuleResult(dbRuleQuery, ""));
            ruleOutputDataVoList.add(ruleOutputDataVo);
        }
//
        ruleInfo.put("result", ruleOutputDataVoList);
//  		RuleReturnItemListVo ruleReturnItemListVo = new RuleReturnItemListVo();
//  		for (int k=0; k<returnItemInfo.size(); k++) {
//  			 ArrayList<RuleReturnItemVo>




//  		}
    }

    /**
     * 룰반환결과 정합석 체크
     * @param rowDataType : 0(단행), 1(다행)
     *        ArrayList<HashMap<String, Object>> returnItemInfo : 룰 반환항목 정보
     *        ArrayList<RuleOutputDataVo> ruleOutputDataVos : 룰 실행 반환결과
     * @throws Exception
     */
    private void checkVaidtaionRuleItemReturn(String rowDataType, ArrayList<HashMap<String, Object>> returnItemInfo, ArrayList<RuleOutputDataVo> ruleOutputDataVos) throws Exception {
        //rule체크
        //rowDataType 체크
        if ("0".equals(rowDataType)) {
            if (ruleOutputDataVos == null) {
                throw new Exception("ruleId:"+ruleInfo.get("paramRuleId").toString()+" ruleOutputDataVos 결과값 null");
            } else {
                for(int i = 0; i < ruleOutputDataVos.size(); i++) {
                    if (ruleOutputDataVos.get(i).getOutputDataList().size()!=1) {
                        throw new Exception("ruleId:"+ruleInfo.get("paramRuleId").toString()+" rowDataType:"+rowDataType+", ruleOutputDataVos.get("+i+").getOutputDataList().size():"+ruleOutputDataVos.get(i).getOutputDataList().size());
                    }
                }
            }
        }
        //반환항목 갯수 체크
        if (returnItemInfo.size() != ruleOutputDataVos.size()) {
            throw new Exception("ruleId:"+ruleInfo.get("paramRuleId").toString()+" returnItemInfo.size():"+returnItemInfo.size()+" ruleOutputDataVos.size():"+ruleOutputDataVos.size());
        } else {
            // 반환항목 데이터 타입 체크
            for(int i = 0; i < ruleOutputDataVos.size(); i++) {
                //
                if (!returnItemInfo.get(i).get("returnDataType").toString().equals(ruleOutputDataVos.get(i).getDataType())){
                    throw new Exception("ruleId:"+ruleInfo.get("paramRuleId").toString()+" "+i+" returnItemInfo datatype:"+returnItemInfo.get(i).get("returnDataType").toString()+
                            ", ruleOutputDataVos datatype:"+ruleOutputDataVos.get(i).getDataType());
                }
            }
        }
    }


    /**
     * (룰 등록 ) 들어온 문자열에 대해 연산자 여부 체크
     * @param value 문자
     * @return "Y" | "N"
     */
    public static String operationCheck(String value) {
        Util util = new Util();
        String operationYN = "N";
        if (util.containWord(value.trim(), OperationConstants.OPERATION0)    || util.containWord(value.trim(), OperationConstants.OPERATION1)
                || util.containWord(value.trim(), OperationConstants.OPERATION2) || util.containWord(value.trim(), OperationConstants.OPERATION3)
                || util.containWord(value.trim(), OperationConstants.OPERATION4) || util.containWord(value.trim(), OperationConstants.OPERATION5)
                //|| util.containWord(value.trim(), OperationConstants.OPERATION6)
                || util.containWord(value.trim(), OperationConstants.WORD_OPERATION1) || util.containWord(value.trim(), OperationConstants.WORD_OPERATION2)
                || util.containWord(value.trim(), OperationConstants.WORD_OPERATION3) || util.containWord(value.trim(), OperationConstants.WORD_OPERATION4)
        ) {
            operationYN = "Y";
        }
        return operationYN;
    }

    /**
     * (룰 등록 ) 들어온 문자열에 대해 데이터 타입을 검사후 알맞는 코드값 리턴
     * @param value 문자열
     * @return 넘버 = "0" | 텍스트  = "1" | 불리언 = "2" | 아이템 = "3" | 서브룰 = "4"
     */
    public static String dataTypeCheck(String value) {
        String datatypeCd = null;
        String trimmedValue = value.trim().replaceAll("^\"|\"$", "");
        if ("Y".equals(trimmedValue) || "N".equals(trimmedValue)) {
            datatypeCd = "2";
        }  else if (value.trim().startsWith("\"")) {
            datatypeCd = RuleManageConstants.RULE_DATA_TYPE_TEXT;
        } else if (value.trim().startsWith("[")) {
            datatypeCd = RuleManageConstants.RULE_DATA_TYPE_ITEM;
        } else if (value.trim().startsWith("{")) {
            datatypeCd = RuleManageConstants.RULE_DATA_TYPE_SUBRULE;
        } else {
            datatypeCd = RuleManageConstants.RULE_DATA_TYPE_NUMBER;
        }
        return datatypeCd;
    }

    // 숫자 판별 메서드
    public static boolean isNumeric(String str) {
        return str.matches("-?\\d+(\\.\\d+)?");
    }

    public static boolean containsPattern(String input, String pattern) {
        Pattern regex = Pattern.compile(pattern);
        Matcher matcher = regex.matcher(input);
        return matcher.find();
    }

    public static List<String> findWords(String input) {
        List<String> words = new ArrayList<>();

        // {@...} 패턴 검색
        Pattern pattern1 = Pattern.compile("\\{@[^{}]*\\}");
        Matcher matcher1 = pattern1.matcher(input);
        while (matcher1.find()) {
            String word = matcher1.group();
            words.add(word);
        }

        // [...] 패턴 검색
        Pattern pattern2 = Pattern.compile("\\[[^\\[\\]]*\\]");
        Matcher matcher2 = pattern2.matcher(input);
        while (matcher2.find()) {
            String word = matcher2.group();
            words.add(word);
        }

        return words;
    }

}
