package server.service.core.ruleCore;

import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.json.simple.parser.ParseException;
import server.domain.vo.ruleEngine.RuleOutputDataVo;

import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


public class Util {


    @SuppressWarnings("unchecked")
    public ArrayList<HashMap<String, Object>> getRuleCondition(String ruleId, ArrayList<HashMap<String, Object>> ruleHashMap){
        ArrayList<HashMap<String, Object>> result = null;

//      룰구조체 print
        for (HashMap<String, Object> stringObjectHashMap : ruleHashMap) {
            //arraylist 사이즈 만큼 for 문을 실행합니다.
//        	if (log.isDebugEnabled()){
//                System.out.println("ruleName :" + ruleHashMap.get(i).get("ruleName").toString() );
//                System.out.println("rowDataType :" + ruleHashMap.get(i).get("rowDataType").toString() );
//        	}

            if (ruleId.equals(stringObjectHashMap.get("ruleId").toString())) {
                for (Map.Entry<String, Object> elem : stringObjectHashMap.entrySet()) {
                    if (elem.getKey().equals("conditionInfo")) {
                        // list 각각 hashmap받아서 출력합니다.
                        result = (ArrayList<HashMap<String, Object>>) elem.getValue();
                    }
                }
            }
        }
        return result;
    }

    public HashMap<String,String> getRuleInfo(String ruleId, ArrayList<HashMap<String, Object>> ruleHashMap){
        ArrayList<String[]> returnValue = null;
        HashMap<String, String> ruleInfoHashMap = new HashMap<>();

//      룰구조체 print
        for (HashMap<String, Object> stringObjectHashMap : ruleHashMap) {
//        	if (log.isDebugEnabled()){
            //arraylist 사이즈 만큼 for 문을 실행합니다.
//        		System.out.println("ruleId :" + ruleHashMap.get(i).get("ruleId").toString() );
//	            System.out.println("ruleName :" + ruleHashMap.get(i).get("ruleName").toString() );
//	            System.out.println("ruleAliasNm :" + ruleHashMap.get(i).get("ruleAliasNm").toString() );
//	            System.out.println("rowDataType :" + ruleHashMap.get(i).get("rowDataType").toString() );
//        	}
            if (ruleId.equals(stringObjectHashMap.get("ruleId").toString())) {
                ruleInfoHashMap.put("ruleId", stringObjectHashMap.get("ruleId").toString());
                ruleInfoHashMap.put("ruleName", stringObjectHashMap.get("ruleName").toString());
                ruleInfoHashMap.put("ruleAliasNm", stringObjectHashMap.get("ruleAliasNm").toString());
                ruleInfoHashMap.put("rowDataType", stringObjectHashMap.get("rowDataType").toString());
                ruleInfoHashMap.put("returnItemCount", stringObjectHashMap.get("returnItemCount").toString());
                ruleInfoHashMap.put("allReturnYN", stringObjectHashMap.get("allReturnYN").toString());
                //ruleInfoHashMap.put("returnType", ruleHashMap.get(i).get("returnType").toString());
            }
        }

        return ruleInfoHashMap;
    }

    /**
     * 표현식의 항목을 입력값으로 변환
     * @param jsonData 입력항목
     *        String ruleCondition 표현식
     * @return String result 입력값으로 치환된 표현식
     */
    @SuppressWarnings("rawtypes")
    public String getReplaceFromItemToInputData(JSONObject jsonData, String ruleCondition ) {


        JSONParser parser = new JSONParser();
        JSONObject obj = null;
        try {
            obj = (JSONObject)parser.parse(jsonData.toString());
        } catch (ParseException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        // 몇개의 오브젝트가 들어있는가?
        //System.out.println("오브젝트의 갯수 : "+obj.size());
        // key set 받아오기
        Set key;
        key = Objects.requireNonNull(obj).keySet();
        // Iterator 설정
        // 각각 키 값 출력
//		            replaceRule = arrayHashRule.get(i);
        for (Object keyName : key) {
            String keyValue = (String) jsonData.get(keyName);

            ruleCondition = ruleCondition.replace(keyName.toString(), keyValue);
        }


        return ruleCondition;
    }

    /**
     * 중위식을 후위식으로 변환하는 메소드
     * @param param 중위식 문자열
     *
     * @return String result 후위식 문자열
     */
    public String convertFromInfixToPostfix(String param) {
        String result = null;
        String ruleData = param;
        //계산 식 안의 빈칸을 없앤다.
        ruleData = ruleData.replace(" ", "");
        //data = data.replace("\"", "");
        ruleData = ruleData.replace("or", "||");
        ruleData = ruleData.replace("and", "&&");
        // 토큰으로 구분,즉 구분되는 수, 구분을 모두 분할
        // 예) (10+2)*(3+4)의 경우는 (, 10, +, 2, ), *, (, 3, +, 4, )로 분할 된다.
        ExpressionExecution expressionExecution = new ExpressionExecution();
        expressionExecution.setRuleData(ruleData);
        List<Object> tokenStack = expressionExecution.makeTokens();
        // 후위 표기식으로 변환한다.
        // 예) (, 10, +, 2, ), *, (, 3, +, 4, )의 경우는 10 2 + 3 4 + * 로 변경

//		System.out.println("중위식으로 변환:"+tokenStack.toString());
        tokenStack = expressionExecution.convertPostOrder(tokenStack);
//		System.out.println("후위식으로 변환:"+tokenStack.toString());

        result = tokenStack.toString();
        result = result.substring(1,result.length()-1);

        return result;
    }

    /**
     * 룰표현식에 룰호출기호가 있는지 체크
     * @param Doc
     *        - RULE_EXPRESSION(룰표현식)
     *        - SUBRULE_INDENT_START(구분시작자)
     *        - RULE_CALL_INDENT(룰호출기호)
     * @return boolean result(true/false)
     */
    public boolean checkTableRuleInRuleCondition(HashMap<String,Object> Doc) {
        String ruleExpression = Doc.get("RULE_EXPRESSION").toString();
        String ruleIndentStart = Doc.get("SUBRULE_INDENT_START").toString();
        String ruleCallWord = Doc.get("RULE_CALL_INDENT").toString();
        @SuppressWarnings("unused")
        String result = ruleExpression.substring(ruleExpression.indexOf(ruleIndentStart) + 1, ruleExpression.indexOf(ruleIndentStart) + 2);
        return (ruleExpression.substring(ruleExpression.indexOf(ruleIndentStart)+1,ruleExpression.indexOf(ruleIndentStart)+2)).equals(ruleCallWord);
    }

    /**
     * 룰표현식에서 RuleId get
     * @param Param
     *        - RULE_EXPRESSION(룰표현식)
     *        - SUBRULE_INDENT_START(구분시작문자)
     *        - RULEID_LENGTH(룰길이)
     * @return String result(ruleId)
     * @throws IOException
     */
    public String getRuleIdFromSubRuleExpression(String Param) {
        String result = "";
        result = Param.substring(Param.indexOf(RuleManageConstants.ID_START_CHAR), Param.length() - 1);
        return result;
    }

    /**
     * 룰표현식에서 RuleId get
     * @param Doc
     *        - RULE_EXPRESSION(룰표현식)
     *        - SUBRULE_INDENT_START(구분시작문자)
     *        - RULEID_LENGTH(룰길이)
     * @return String result(ruleId)
     */
    public String getSubRuleId(HashMap<String,Object> Doc) {
        String ruleExpression = Doc.get("RULE_EXPRESSION").toString();
        String ruleIndentStart = Doc.get("SUBRULE_INDENT_START").toString();
        int ruleIdLength = (Integer)Doc.get("RULEID_LENGTH");
        String result = "";
        result = ruleExpression.substring(ruleExpression.indexOf(ruleIndentStart) + 2, ruleExpression.indexOf(ruleIndentStart) + 2 + ruleIdLength);
        return result;
    }

    /**
     * 룰표현식에서 룰문장 get
     * @param Doc
     *        - RULE_EXPRESSION(룰표현식)
     *        - SUBRULE_INDENT_START(구분시작문자)
     *        - SUBRULE_INDENT_END(구분종료문자)
     * @return String result(ruleId)
     */
    public String getSubRuleSentence(HashMap<String,Object> Doc) {
        String ruleExpression = Doc.get("RULE_EXPRESSION").toString();
        String ruleIndentStart = Doc.get("SUBRULE_INDENT_START").toString();
        String ruleIndentEnd = Doc.get("SUBRULE_INDENT_END").toString();
        String result = "";
        result = ruleExpression.substring(ruleExpression.indexOf(ruleIndentStart), ruleExpression.indexOf(ruleIndentEnd) + 1);
        return result;
    }

    /**
     * 룰표현식에서 서브룰의 리턴항목ID get
     * @param Doc
     *        - SUBRULE_SENTENCE(서브룰문장)
     *        - SUBRULE_INDENT_RETURN_ITEM(서브룰리턴항목구분자)
     *        - ITEM_LENGTH(항목길이)
     * @return String result(subRuleReturnItemId)
     */
    public String getSubRuleReturnItemId(HashMap<String,Object> Doc) {
        String subRuleSentence = Doc.get("SUBRULE_SENTENCE").toString();
        String subRuleIndentReturnItem = Doc.get("SUBRULE_INDENT_RETURN_ITEM").toString();
        int itemLength = (Integer)Doc.get("ITEM_LENGTH");
        String result = "";
        result = subRuleSentence.substring(subRuleSentence.indexOf(subRuleIndentReturnItem) + 2, subRuleSentence.indexOf(subRuleIndentReturnItem) + itemLength + 2);
        return result;
    }

    /**
     * 룰표현식에서 파라미터항목입력 있는 경우 JSON파라미터 추가
     * @param Doc
     *        - INPUTPARAM_STRING(서브룰문장)
     *        - KEYVALUE_INDENT(서브룰리턴항목구분자)
     * @return String result(subRuleReturnItemId)
     */
    @SuppressWarnings("unchecked")
    public JSONObject addSubRuleInputParam(HashMap<String,Object> Doc) {
        String subRuleSentence = Doc.get("SUBRULE_SENTENCE").toString();
        String subRuleIndentInputItem = Doc.get("SUBRULE_INDENT_INPUT_ITEM").toString();
        String ruleIndentEnd = Doc.get("SUBRULE_INDENT_END").toString();
        JSONObject jsonData = (JSONObject) Doc.get("JSON_DATA");
        String jsonDataSentence = subRuleSentence.substring(subRuleSentence.indexOf(subRuleIndentInputItem)+subRuleIndentInputItem.length(),subRuleSentence.indexOf(ruleIndentEnd));
        String[] jsonDataArr = jsonDataSentence.split(",");
        for (int i = 0; i < jsonDataArr.length; i++) {
            String jsonKey = jsonDataArr[i].substring(0, jsonDataSentence.indexOf("="));
            String jsonValue = jsonDataArr[i].substring(jsonDataSentence.indexOf("=") + 1, jsonDataSentence.length());
            jsonData.put(jsonKey, jsonValue);
        }
        return jsonData;
    }

    /**
     * 연산자 체크 함수
     * @param token
     * @param check
     * @return
     */
    public boolean containWord(String token, String[] check) {
        if (token == null) {
            return false;
        }
        for (String word : check) {
            if (word.equals(token)) {
                return true;
            }
        }
        return false;
    }


    public ArrayList<RuleOutputDataVo> columnAddReturnResultList(ArrayList<RuleOutputDataVo> sumReturnResultList, ArrayList<RuleOutputDataVo> returnResultList){
//        int size = sumReturnResultList.size();
        //for(int i=0; i<size; i++) {
        sumReturnResultList.addAll(returnResultList);
        //}
        return sumReturnResultList;
    }

    public ArrayList<RuleOutputDataVo> rowAppendReturnResultList(ArrayList<RuleOutputDataVo> sumReturnResultList, ArrayList<RuleOutputDataVo> returnResultList){
        int returnItemCount = sumReturnResultList.size();
        //sumReturnResultList returnItemCount++
        for (RuleOutputDataVo sumRuleOutputDataVo : sumReturnResultList) {
            String sumResultReturnItemId = sumRuleOutputDataVo.getItemId();
            //returnResultList returnItemCount++
            for (RuleOutputDataVo returnRuleOutputDataVo : returnResultList) {
                String returnResultReturnItemId = returnRuleOutputDataVo.getItemId();
                if (sumResultReturnItemId.equals(returnResultReturnItemId)) {
                    ArrayList<String> sumReturnResultListOutputDataList = sumRuleOutputDataVo.getOutputDataList();
                    sumReturnResultListOutputDataList.addAll(returnRuleOutputDataVo.getOutputDataList());
                    sumRuleOutputDataVo.setOutputDataList(sumReturnResultListOutputDataList);
                }
            }
        }
        return sumReturnResultList;
    }

    /**
     * 룰표현식에서 파라미터항목입력 있는 경우 JSON파라미터 추가
     * @param Doc
     *        - INPUTPARAM_STRING(서브룰문장)
     *        - KEYVALUE_INDENT(서브룰리턴항목구분자)
     * @return String result(subRuleReturnItemId)
     */
    @SuppressWarnings("unchecked")
    public JSONObject outputDataListToJSONObject(ArrayList<RuleOutputDataVo> Doc) {
        JSONObject jsonObject = new JSONObject();
        for (RuleOutputDataVo ruleOutputDataVo : Doc) {
            jsonObject.put(ruleOutputDataVo.getItemAliasNm(), ruleOutputDataVo.getOutputDataList());
        }
        return jsonObject;
    }

    /**
     * 룰반환값에서 병합연산자 병합
     * @param param 룰결과값
     * @return ArrayList<RuleOutputDataVo>
     */
    public ArrayList<RuleOutputDataVo> getCalReturnItem(ArrayList<RuleOutputDataVo> param){
        RuleOutputDataVo op1 = param.get(0);
        RuleOutputDataVo op2 = param.get(1);
        ArrayList<RuleOutputDataVo> returnParam = new ArrayList<>();
        int op1arrSize = op1.getOutputDataList().size();
        int op2arrSize = op2.getOutputDataList().size();


        if (op1arrSize == op2arrSize) {
            returnParam = param;
        } else {
            String returnVal = null;
            ArrayList<String> outputDataList;
            outputDataList = new ArrayList<>();
            if (op1arrSize == 1) {
                for(int i = 0; i < op2arrSize; i++ ) {
                    if (i == 0) {
                        returnVal = op1.getOutputDataList().get(i);
                        outputDataList.add(returnVal);
                    } else {
                        outputDataList.add(returnVal);
                    }
                    op1.setOutputDataList(outputDataList);;
                }
            }else if(op2arrSize == 1) {
                for(int i = 0; i < op2arrSize; i++ ) {
                    returnVal = op2.getOutputDataList().get(i);
                    outputDataList.add(returnVal);
                    op2.setOutputDataList(outputDataList);
                }
            }else {
                return null;
            }
            returnParam.add(op1);
            returnParam.add(op2);
        }
        //
        return returnParam;
    }

    /**
     * 룰 테스트에서 조건식 내 룰아이디값 리스트로 반환
     * @param String 조건식
     * @return ArrayList<String>
     */
    public static List<String> getRuleInTheRule(StringBuilder concatPostFixStr) {
        // TODO :: 정규표현식으로 {@ 시작  } 끝 단어 추출
        List<String> ruleInputList = new ArrayList<>();
        Pattern rulePattern = Pattern.compile( "\\{@([^}]+)\\}");
        Matcher ruleMacher = rulePattern.matcher(concatPostFixStr);
        while (ruleMacher.find()) {
            String word = ruleMacher.group(1); // 괄호 안의 단어 추출
            ruleInputList.add(word);
        }
        return ruleInputList;
    }





}
