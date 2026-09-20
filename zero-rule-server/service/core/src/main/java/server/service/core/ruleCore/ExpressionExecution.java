package server.service.core.ruleCore;

import lombok.Getter;
import lombok.Setter;
import org.apache.commons.lang3.StringUtils;

import org.json.simple.JSONObject;
import server.domain.vo.ruleEngine.PostfixExpressionVo;
import server.domain.vo.ruleEngine.RuleOutputDataVo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Stack;

public class ExpressionExecution {

//    private final static Logger log = Logger.getLogger(ExpressionExecution.class);

    @Setter
    @Getter
    private JSONObject jsonData;
    @Setter
    private ArrayList<PostfixExpressionVo> expressionObject;
    @Setter
    private String ruleData;
    @Setter
    @Getter
    private String conditionResult;
    @Setter
    @Getter
    private ArrayList<RuleOutputDataVo> returnResult;  //반환식 수행 결과
    @Setter
    private ArrayList<RuleOutputDataVo> ruleReturnDataInfoList; //룰반환정보
    @Setter
    @Getter
    private RuleOutputDataVo ruleReturnDataInfo;
    @Setter
    @Getter
    private int returnItemNo;
    @Setter
    @Getter
    private HashMap<String, Object> ruleInfo;

    Util util = new Util();
    /**
     * 내부에서 불리는 계산 함수
     * @throws Exception 익셉션
     */
    @SuppressWarnings({ "null", "unchecked" })
    public void runCondExpression() throws Exception {
        List<Object> tokenStack2 = new ArrayList<>();
        for (PostfixExpressionVo postfixExpressionVo : expressionObject) {

            String dataTypeCd;
            if (postfixExpressionVo.getDatatypeCd() == null) {
                dataTypeCd = "9";
            } else {
                dataTypeCd = postfixExpressionVo.getDatatypeCd();
            }

            String expressionObject = (String) postfixExpressionVo.getObjectData();
            if (dataTypeCd.equals(RuleManageConstants.RULE_DATA_TYPE_ITEM)) {
                postfixExpressionVo.setObjectData(util.getReplaceFromItemToInputData(jsonData, expressionObject));
            } else if (dataTypeCd.equals(RuleManageConstants.RULE_DATA_TYPE_SUBRULE)) {
                RuleExecution ruleExecution = new RuleExecution();
                ruleInfo.put("paramRuleId", util.getRuleIdFromSubRuleExpression(postfixExpressionVo.getObjectData().toString()));
                ruleInfo.put("mainRuleYN", "N");
                ruleExecution.setRuleInfo(ruleInfo);
                ruleExecution.ExecRule();

                ArrayList<RuleOutputDataVo> ruleOutputDataVoList;

                ruleOutputDataVoList = (ArrayList<RuleOutputDataVo>) ruleExecution.getRuleInfo().get("result");


                if (!ruleOutputDataVoList.isEmpty()) {
                    RuleOutputDataVo ruleOutputDataVo = ruleOutputDataVoList.get(0);
                    postfixExpressionVo.setObjectData(ruleOutputDataVo.getOutputDataList().get(0));
                }

            }
            //tokenStack2.add(expressionObject.get(i).getObjectData());
        }

        boolean b = tokenStack2.addAll(expressionObject);

        List<Object> tokenStack = new ArrayList<>(tokenStack2);
        Stack< Object > calcStack = new Stack<>();
        for (Object token : tokenStack) {
            calcStack.push(token);
            calcStack = calcPostOrder(calcStack);
        }
        //스택에 값이 없으면 에러
        if (calcStack.size() != 1) {
            throw new RuntimeException("Calculator Error");
        }

        PostfixExpressionVo pfExVoPop = (PostfixExpressionVo) calcStack.pop();
        if (pfExVoPop.getObjectData().equals(RuleManageConstants.RESULT_TRUE)){
            conditionResult = RuleManageConstants.RESULT_TRUE;
        } else {
            conditionResult = RuleManageConstants.RESULT_FALSE;
        }
//        if (log.isDebugEnabled()){
//            System.out.println("룰표현식결과:"+conditionResult);
//        }
    }

    /**
     * 중위식에서 후위식으로 변환 후 식 계산     *
     */
    @SuppressWarnings("unchecked")
    public void runReturnExpression() {

        int returnItemNo = this.getReturnItemNo();

        List<Object> tokenStack = new ArrayList<>(expressionObject);

        Stack< Object > calcStack = new Stack<>();

        for (Object token : tokenStack) {
            calcStack.push(token);
//            System.out.println("#####################################################");
//            System.out.println("token :"+token.toString());
//            System.out.println("계산전 calcStack :"+calcStack);
            calcStack = calcPostOrder(calcStack);
//            System.out.println("계산후 calcStack :"+calcStack.toString());
//            System.out.println("#####################################################");
        }
        //스택에 값이 없으면 에러
        if (calcStack.size() == 2) {
            //병합연산자의 op1, op2가 calcStack 있음.
            ArrayList<RuleOutputDataVo> ruleOutputDataVoList = new ArrayList<>();
            int stackSize = calcStack.size();
            for (int i = stackSize-1; i >= 0; i--) {
                RuleOutputDataVo ruleOutputDataVo = new RuleOutputDataVo();
                ArrayList<String> arrayList = new ArrayList<>();
                PostfixExpressionVo pfExVoPop = (PostfixExpressionVo) calcStack.pop();
                if (pfExVoPop.getObjectData() instanceof String) {
                    arrayList.add((String) pfExVoPop.getObjectData());
                } else {
                    ArrayList<RuleOutputDataVo> arr = (ArrayList<RuleOutputDataVo>) pfExVoPop.getObjectData();
                    arrayList = arr.get(0).getOutputDataList();
                }

                ruleOutputDataVo.setItemAliasNm(ruleReturnDataInfoList.get(i).getItemAliasNm());
                ruleOutputDataVo.setDataType(ruleReturnDataInfoList.get(i).getDataType());
                ruleOutputDataVo.setItemId(ruleReturnDataInfoList.get(i).getItemId());
                ruleOutputDataVo.setOutputData(ruleReturnDataInfoList.get(i).getOutputData());
                ruleOutputDataVo.setOutputDataList(arrayList);
                ruleOutputDataVoList.add(ruleOutputDataVo);
            }
            returnResult =  util.getCalReturnItem(ruleOutputDataVoList);
        } else if (calcStack.size() ==1) {
            ArrayList<RuleOutputDataVo> ruleOutputDataVoList = new ArrayList<>();
            RuleOutputDataVo ruleOutputDataVo = new RuleOutputDataVo();
            ArrayList<String> arrayList = new ArrayList<>();

            PostfixExpressionVo pfExVoPop = (PostfixExpressionVo) calcStack.pop();
            if (pfExVoPop.getObjectData() instanceof String ) {
                arrayList.add((String) pfExVoPop.getObjectData());
                ruleOutputDataVo.setItemAliasNm(ruleReturnDataInfoList.get(returnItemNo-1).getItemAliasNm());
                ruleOutputDataVo.setDataType(ruleReturnDataInfoList.get(returnItemNo-1).getDataType());
                ruleOutputDataVo.setItemId(ruleReturnDataInfoList.get(returnItemNo-1).getItemId());
                ruleOutputDataVo.setOutputData(ruleReturnDataInfoList.get(returnItemNo-1).getOutputData());
                ruleOutputDataVo.setOutputDataList(arrayList);
                ruleOutputDataVoList.add(ruleOutputDataVo);
            } else {
                ruleOutputDataVoList = (ArrayList<RuleOutputDataVo>) pfExVoPop.getObjectData();
            }

            returnResult =  ruleOutputDataVoList;
        } else {
            throw new RuntimeException("Calculator Error-stack empty");
        }
    }

    /**
     * 후위 표기식 계산
     * @param calcStack 스택에 담겨져 있는 값
     * @return Stack<Object>
     */
    public Stack< Object > calcPostOrder(Stack< Object > calcStack) {
        //스택의 가장 위의 값이 수면 계산 안함
//		System.out.println("calcStack.lastElement().getClass() : "+calcStack.lastElement().getClass());
//		System.out.println("calcStack.lastElement().toString() : "+calcStack.lastElement().toString());
        PostfixExpressionVo pfExVo = (PostfixExpressionVo) calcStack.lastElement();

//		if (isNumeric(calcStack.lastElement().toString())){
//			return calcStack;
//		}
        if (pfExVo.getDatatypeCd() != null) {
            return calcStack;
        }

//		if (calcStack.lastElement().toString().indexOf("\"") == 0) {
//			return calcStack;
//		}

        BigDecimal bigDecOp1;
        BigDecimal bigDecOp2 = null;

        String strOp1;
        String strOp2 = null;
        String strOp3;
        String opcode;
        String opType = null;
        boolean opcodeCheck = false;
        //연산자 포함 스택에 최소 2개 이상
        if (calcStack.size() >= 2) {
            //스택의 가장 위는 연산자
            PostfixExpressionVo pfExVoPop = (PostfixExpressionVo) calcStack.pop();
            opcode = (String) pfExVoPop.getObjectData();
//			opcode = (String) calcStack.pop();
//			System.out.println("OPERATION2 :"+opcode);
            //연산자비교
            if ("|".equals(opcode)) {
                return calcStack;
            }
            for (int i = 0; i < OperationConstants.OPERATION2.length; i++){
                if (opcode.equals(OperationConstants.OPERATION2[i])) {
                    opcodeCheck = true;
                    opType = "OPERATION2";
                    break;
                }
            }
            for (int i = 0; i < OperationConstants.OPERATION3.length; i++){
                if (opcode.equals(OperationConstants.OPERATION3[i])) {
                    opcodeCheck = true;
                    opType = "OPERATION3";
                    break;
                }
            }
            for (int i = 0; i < OperationConstants.OPERATION4.length; i++){
                if (opcode.equals(OperationConstants.OPERATION4[i])) {
                    opcodeCheck = true;
                    opType = "OPERATION4";
                    break;
                }
            }
            for (int i = 0; i < OperationConstants.WORD_OPERATION2.length; i++){
                if (opcode.equals(OperationConstants.WORD_OPERATION2[i])) {
                    opcodeCheck = true;
                    opType = "WORD_OPERATION2";
                    break;
                }
            }
            for (int i = 0; i < OperationConstants.WORD_OPERATION4.length; i++){
                if (opcode.equals(OperationConstants.WORD_OPERATION4[i])) {
                    opcodeCheck = true;
                    opType = "WORD_OPERATION4";
                    break;
                }
            }
//            for (int i = 0; i < OperationConstants.OPERATION6.length; i++){
//                if (opcode.equals(OperationConstants.OPERATION6[i])){
//                    return calcStack;
//                }
//            }

            PostfixExpressionVo pfExVoPop1 = (PostfixExpressionVo) calcStack.pop();
            strOp1 = (String) pfExVoPop1.getObjectData();
//			strOp1 = calcStack.pop().toString();
            //존재하는 연산자고 연산자 수1이 문자  아니면...
            if ( opcodeCheck && isNumeric(strOp1) ){
                //계산
                PostfixExpressionVo pfExVoResult = new PostfixExpressionVo();
                //다음 밑은 수
                bigDecOp1 = new BigDecimal(strOp1);
                //연산자가 수를 1개 필요한지 2개 필요한지 체크
                if (opCodeCheck(opcode)) {
                    PostfixExpressionVo pfExVoPop2 = (PostfixExpressionVo) calcStack.pop();
                    bigDecOp2 = new BigDecimal (pfExVoPop2.getObjectData().toString());
                }
                if ("OPERATION2".equals(opType)||"WORD_OPERATION2".equals(opType)){
                    BigDecimal result = calculateBigDecimalByOpCode(bigDecOp1, bigDecOp2, opcode);
                    //계산
                    pfExVoResult.setDatatypeCd("0");
                    pfExVoResult.setObjectData(result);
                    pfExVoResult.setOperatorYn("N");
                    calcStack.push(pfExVoResult);
                } else if ("WORD_OPERATION4".equals(opType)){
//					strOp3 = calcStack.pop().toString();
                    PostfixExpressionVo pfExVoPop3 = (PostfixExpressionVo) calcStack.pop();
                    strOp3 = (String) pfExVoPop3.getObjectData();
                    String result = calculateStringByOpCode(bigDecOp1, bigDecOp2, strOp3,  opcode);
                    //계산

                    pfExVoResult.setDatatypeCd("1");
                    pfExVoResult.setObjectData(result);
                    pfExVoResult.setOperatorYn("N");
                    calcStack.push(pfExVoResult);
                } else {
                    String result = calculateBigDecimalByLogicOpCode(bigDecOp1, bigDecOp2, opcode);
                    //계산
                    pfExVoResult.setDatatypeCd("1");
                    pfExVoResult.setObjectData(result);
                    pfExVoResult.setOperatorYn("N");
                    calcStack.push(pfExVoResult);
                }
            } else {

                //연산자가 수를 1개 필요한지 2개 필요한지 체`크
                if (opCodeCheck(opcode)) {
                    PostfixExpressionVo pfExVoPop2 = (PostfixExpressionVo) calcStack.pop();
                    strOp2 = (String) pfExVoPop2.getObjectData();
//					strOp2 = calcStack.pop().toString();
                }
                String result = calculateBigDecimalByLogicOpCode(strOp1, strOp2, opcode);
                //계산
                PostfixExpressionVo pfExVoResult = new PostfixExpressionVo();
                pfExVoResult.setDatatypeCd("1");
                pfExVoResult.setObjectData(result);
                pfExVoResult.setOperatorYn("N");
                calcStack.push(pfExVoResult);
//				calcStack.push(result);
            }
        }
        return calcStack;
    }
    /**
     * 연산자가 필요한 수의 개수
     * @param opcode 연산자
     * @return 연산자가 수를 1개 필요하면 true, 연산자가 수를 2개 필요하면 false
     */
    private boolean opCodeCheck(String opcode) {
        return !containWord(opcode, OperationConstants.WORD_OPERATION2) && !containWord(opcode, OperationConstants.OPERATION1);
    }
    /**
     * 각 연산자의 계산 함수
     * @param op1 수1
     * @param op2 수2
     * @param opcode 연산자
     * @return BigDecimal
     */
    private BigDecimal calculateBigDecimalByOpCode(BigDecimal op1, BigDecimal op2, String opcode) {
        if (OperationConstants.OPERATION2[0].equals(opcode)) {
            //더하기
            return op1.add(op2);
        } else if (OperationConstants.OPERATION2[1].equals(opcode)) {
            //빼기
            return op2.subtract(op1);
        } else if (OperationConstants.OPERATION2[2].equals(opcode)) {
            //곱하기
            return op1.multiply(op2);
        } else if (OperationConstants.OPERATION2[3].equals(opcode)) {
            //나누기, 반올림은 지정된 수
            return op2.divide(op1, RuleManageConstants.HARF_ROUND_UP, RoundingMode.HALF_UP);
        } else if (OperationConstants.OPERATION2[4].equals(opcode)) {
            //제곱
            return op2.pow(op1.intValue());
        } else if (OperationConstants.OPERATION2[5].equals(opcode)) {
            //나머지
            return op2.remainder(op1);
//        } else if (OperationConstants.OPERATION6[0].equals(opcode)) {
//            //병합연산자
//            return null;
        } else if (OperationConstants.OPERATION1[0].equals(opcode)) {
            //팩토리얼
            return Factorial(op1);
        } else if (OperationConstants.WORD_OPERATION2[0].equals(opcode)) {
            return BigDecimal.valueOf(Math.sin(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[1].equals(opcode)) {
            return BigDecimal.valueOf(Math.sinh(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[2].equals(opcode)) {
            return BigDecimal.valueOf(Math.asin(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[3].equals(opcode)) {
            return BigDecimal.valueOf(Math.cos(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[4].equals(opcode)) {
            return BigDecimal.valueOf(Math.cosh(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[5].equals(opcode)) {
            return BigDecimal.valueOf(Math.acos(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[6].equals(opcode)) {
            return BigDecimal.valueOf(Math.tan(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[7].equals(opcode)) {
            return BigDecimal.valueOf(Math.tanh(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[8].equals(opcode)) {
            return BigDecimal.valueOf(Math.atan(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[9].equals(opcode)) {
            return BigDecimal.valueOf(Math.sqrt(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[10].equals(opcode)) {
            return BigDecimal.valueOf(Math.exp(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[11].equals(opcode)) {
            return BigDecimal.valueOf(Math.abs(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[12].equals(opcode)) {
            return BigDecimal.valueOf(Math.log(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[13].equals(opcode)) {
            return BigDecimal.valueOf(Math.ceil(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[14].equals(opcode)) {
            return BigDecimal.valueOf(Math.floor(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION2[15].equals(opcode)) {
            return BigDecimal.valueOf(Math.round(op1.doubleValue()));
        } else if (OperationConstants.WORD_OPERATION3[0].equals(opcode)) {
            return op2.pow(op1.intValue());
        }
        throw new RuntimeException("Operation Error");
    }
    /**
     * 각 연산자의 계산 함수
     * @param op1 수1
     * @param op2 수2
     * @param opcode 연산자
     * @return String
     */
    private String calculateBigDecimalByLogicOpCode(BigDecimal op1, BigDecimal op2, String opcode) {
        String bResult;
        if (OperationConstants.OPERATION3[0].equals(opcode)) {
            //Greater Than
            if (op2.doubleValue() < op1.doubleValue()){
                bResult = RuleManageConstants.RESULT_TRUE;
            } else {
                bResult = RuleManageConstants.RESULT_FALSE;
            }
            return bResult;
        } else if (OperationConstants.OPERATION3[1].equals(opcode)) {
            //Less Than
            if (op2.doubleValue() > op1.doubleValue()){
                bResult = RuleManageConstants.RESULT_TRUE;
            } else {
                bResult = RuleManageConstants.RESULT_FALSE;
            }
            return bResult;
        } else if (OperationConstants.OPERATION4[0].equals(opcode)) {
            //Less Than Equals
            if (op2.doubleValue() <= op1.doubleValue()){
                bResult = RuleManageConstants.RESULT_TRUE;
            } else {
                bResult = RuleManageConstants.RESULT_FALSE;
            }
            return bResult;
        } else if (OperationConstants.OPERATION4[1].equals(opcode)) {
            //Greater Than Equals
            if (op2.doubleValue() >= op1.doubleValue()){
                bResult = RuleManageConstants.RESULT_TRUE;
            } else {
                bResult = RuleManageConstants.RESULT_FALSE;
            }
            return bResult;
        } else if (OperationConstants.OPERATION4[2].equals(opcode)) {
            //Equals
            if (op2.doubleValue() == op1.doubleValue()){
                bResult = RuleManageConstants.RESULT_TRUE;
            } else {
                bResult = RuleManageConstants.RESULT_FALSE;
            }
            return bResult;
        } else if (OperationConstants.OPERATION4[3].equals(opcode)) {
            //Not Equals
            if (op2.doubleValue() != op1.doubleValue()){
                bResult = RuleManageConstants.RESULT_TRUE;
            } else {
                bResult = RuleManageConstants.RESULT_FALSE;
            }
            return bResult;
        }

        throw new RuntimeException("Operation Error");
    }
    /**
     * 각 연산자의 계산 함수
     * @param op1 수1
     * @param op2 수2
     * @param opcode 연산자
     * @return String
     */
    private String calculateBigDecimalByLogicOpCode(String op1, String op2, String opcode) {
        String bResult;
        if (OperationConstants.OPERATION4[2].equals(opcode)) {
            //Equals
            if (op2.equals(op1)){
                bResult = RuleManageConstants.RESULT_TRUE;
            } else {
                bResult = RuleManageConstants.RESULT_FALSE;
            }
            return bResult;
        } else if (OperationConstants.OPERATION5[0].equals(opcode)) {
            //OR
            if (op2.equals(op1)){
                if (op2.equals(RuleManageConstants.RESULT_FALSE)){
                    bResult = RuleManageConstants.RESULT_FALSE;
                } else {
                    bResult = RuleManageConstants.RESULT_TRUE;
                }
            } else {
                bResult = RuleManageConstants.RESULT_TRUE;
            }
            return bResult;
        } else if (OperationConstants.OPERATION5[1].equals(opcode)) {
            //AND
            if (op2.equals(op1)){
                if (op2.equals(RuleManageConstants.RESULT_FALSE)){
                    bResult = RuleManageConstants.RESULT_FALSE;
                } else {
                    bResult = RuleManageConstants.RESULT_TRUE;
                }
            } else {
                bResult = RuleManageConstants.RESULT_FALSE;
            }
            return bResult;
        } else if (OperationConstants.OPERATION4[3].equals(opcode)) {
            //!=
            if (op2.equals(op1)){
                bResult = RuleManageConstants.RESULT_FALSE;

            } else {
                bResult = RuleManageConstants.RESULT_TRUE;
            }
            return bResult;
        }
        throw new RuntimeException("Operation Error");
    }
    /**
     * op3.substring(op2,op1)
     * @param op1 수1
     * @param op2 수2
     * @param op3 문자1
     * @param opcode 연산자
     * @return String
     */
    private String calculateStringByOpCode(BigDecimal op1, BigDecimal op2, String op3, String opcode) {
        String bResult;
        if (OperationConstants.WORD_OPERATION4[0].equals(opcode)) {
            //SUBSTR "때문에 index 순서에 +1 해야함
            bResult = "\""+op3.substring(op2.intValue()+1, op1.intValue()+1)+"\"";
            //String 결과값에 ""를 add 해야함
            return bResult;
        }
        throw new RuntimeException("Operation Error");
    }

    /**
     * 팩토리얼 알고리즘(재귀로 구현)
     * @param input
     * @return
     */
    private BigDecimal Factorial(BigDecimal input) {
        if (BigDecimal.ONE.equals(input)) {
            return BigDecimal.ONE;
        }
        return Factorial(input.subtract(BigDecimal.ONE)).multiply(input);
    }


    /**
     * 후위표기식으로 변환 함수
     * @param tokenList 토큰 리스트
     * @return
     */
    public List< Object > convertPostOrder(List< Object > tokenList) {
        List< Object > postOrderList = new ArrayList<>();
        Stack<String> exprStack = new Stack<>();
        Stack<String> wordStack = new Stack<>();
        for (Object token : tokenList) {

            if (isNumeric(token.toString()) || token.toString().indexOf("\"") == 0 || token.toString().indexOf("{") == 0 || token.toString().indexOf("[") == 0) {
                //수면 그대로 입력
                postOrderList.add(token);
            } else {
                //연산자 처리
                exprAppend((String) token, exprStack, wordStack, postOrderList);
            }
        }
        String item;
        //남은 연산자 넣기
        while (!exprStack.isEmpty()) {
            item = exprStack.pop();
            postOrderList.add(item);
        }
        return postOrderList;
    }
    /**
     * 후위 계산법의 연산자 순서처리
     * @param token 토큰
     * @param exprStack 연산자 스택(기호형)
     * @param wordStack 연산자 스택(문자형)
     * @param postOrderList 후위 계산 리스트(참초형)
     */
    private void exprAppend(String token, Stack<String> exprStack, Stack<String> wordStack,
                            List< Object > postOrderList) {
        //토큰이 문자일 경우처리
        if (isWordOperation(token)) {
            //PI, E의 값
            BigDecimal wordValue = ConverterWordResult(token);
            if (wordValue != null) {
                postOrderList.add(wordValue);
            } else {
                wordStack.push(token);
            }
        } else if (OperationConstants.OPERATION0[0].equals(token)) {
            //왼쪽 괄호(
            exprStack.push(token);
        } else if (OperationConstants.OPERATION0[1].equals(token)) {
            //오른쪽 괄호)
            String opcode = null;
            while (true) {
                //문자 스택이 없을 때 까지
                if (!wordStack.isEmpty()) {
                    //기호를 스택에서 가져온다.
                    opcode = exprStack.pop();
                    //왼쪽 괄호(를 만나면 작성 끝
                    if (OperationConstants.OPERATION0[0].equals(opcode)) {
                        opcode = wordStack.pop();
                        postOrderList.add(opcode);
                        break;
                    }
                    //스택 순서로 후위 계산 리스트에 값을 넣는다.
                    postOrderList.add(opcode);
                } else {
                    //연산 스택이 없으면 종료
                    if (exprStack.isEmpty()) {
                        break;
                    }
                    opcode = exprStack.pop();
                    //왼쪽 괄호(를 만나면 작성 끝
                    if (OperationConstants.OPERATION0[0].equals(opcode)) {
                        break;
                    }
                    postOrderList.add(opcode);
                }
            }
        } else if (OperationConstants.OPERATION0[2].equals(token)) {
            //콤마 처리
            //콤마는 문자 연산자와 같이 사용하므로 콤마 연산자가 나왔는데 문자 연산자가 없으면 에러
            if (exprStack.isEmpty()) {
                throw new RuntimeException("data error");
            }
            String opcode = null;
            while (true) {
                //연산 스택이 없으면 종료
                if (exprStack.isEmpty()) {
                    break;
                }
                //왼쪽 괄호면 종료
                if (OperationConstants.OPERATION0[0].equals(exprStack.lastElement())) {
                    break;
                }
                opcode = exprStack.pop();
                postOrderList.add(opcode);
            }
        } else if (isOperation(token)) {
            //연산자 처리
            String opcode = null;
            while (true) {
                //연산자가 없으면 입력
                if (exprStack.isEmpty()) {
                    exprStack.push(token);
                    break;
                }
                //연산자가 있으면
                opcode = exprStack.pop();
                //연산자 우선순위 체크 + * 가 만나면 *계산 먼저(스택에 늦게 들어가는 게 FIFO 법칙으로 먼저 계산됨)
                if (exprOrder(opcode) <= exprOrder(token)) {
                    exprStack.push(opcode);
                    exprStack.push(token);
                    break;
                }
                postOrderList.add(opcode);
            }
        }
    }



    /**
     * 토큰 만드는 함수
     * @return List<Object>
     */
    public List< Object > makeTokens () {
        List< Object > tokenStack = new ArrayList<>();
        //StringBuffer numberTokenBuffer = new StringBuffer();
        StringBuffer valueTokenBuffer = new StringBuffer();
        StringBuffer wordTokenBuffer = new StringBuffer();
        boolean toggleIn = false;
        boolean toggleNotIn = false;
        String strInValue = null;
        int argSize = ruleData.length();
        char token;
        for (int i = 0; i < argSize; i++) {
            //char 형식으로 분할
            token = ruleData.charAt(i);
//            System.out.println("-------------------");
//            System.out.println("token :"+token);
//            System.out.println("-------------------");
//            System.out.println("valueTokenBuffer :"+valueTokenBuffer.toString());
//            System.out.println("wordTokenBuffer :"+wordTokenBuffer.toString());
//            System.out.println("tokenStack :"+tokenStack.toString());


            if (wordTokenBuffer.toString().equals("in")){
                toggleIn = true;
                wordTokenBuffer.setLength(0);
                strInValue = tokenStack.get(tokenStack.size()-1).toString();
            }
            //in 처리
            if (toggleIn){
                if (("(").equals(Character.toString(token))){
                    strInValue = tokenStack.get(tokenStack.size()-1).toString();
                    tokenStack.remove(tokenStack.size()-1);
                    tokenStack.add("(");
                    continue;
                } else if ((",").equals(Character.toString(token))){
                    wordTokenBuffer.setLength(0);
                    tokenStack.add(strInValue);
                    tokenStack.add("==");
                    tokenStack.add(valueTokenBuffer.toString());
                    tokenStack.add("||");
                    valueTokenBuffer.setLength(0);
                    continue;
                } else if ((")").equals(Character.toString(token))){
                    toggleIn = false;
                    wordTokenBuffer.setLength(0);
                    tokenStack.add(strInValue);
                    tokenStack.add("==");
                    tokenStack.add(valueTokenBuffer.toString());
                    valueTokenBuffer.setLength(0);
                    tokenStack.add(")");
                    continue;
                }
            }

            if (wordTokenBuffer.toString().equals("notin")){
                toggleNotIn = true;
                wordTokenBuffer.setLength(0);
                strInValue = tokenStack.get(tokenStack.size()-1).toString();
            }
            //not in 처리
            if (toggleNotIn == true){
                if (("(").equals(Character.toString(token))){
                    strInValue = tokenStack.get(tokenStack.size()-1).toString();
                    tokenStack.remove(tokenStack.size()-1);
                    tokenStack.add("(");
                    continue;
                } else if ((",").equals(Character.toString(token))){
                    wordTokenBuffer.setLength(0);
                    tokenStack.add(strInValue);
                    tokenStack.add("!=");
                    tokenStack.add(valueTokenBuffer.toString());
                    tokenStack.add("&&");
                    valueTokenBuffer.setLength(0);
                    continue;
                } else if ((")").equals(Character.toString(token))){
                    toggleNotIn = false;
                    wordTokenBuffer.setLength(0);
                    tokenStack.add(strInValue);
                    tokenStack.add("!=");
                    tokenStack.add(valueTokenBuffer.toString());
                    valueTokenBuffer.setLength(0);
                    tokenStack.add(")");
                    continue;
                }
            }

            //수 토큰
            if (	(StringUtils.countMatches(valueTokenBuffer.toString(), "\"") == 1)
                    ||(StringUtils.countMatches(valueTokenBuffer.toString(), "{")  == 1)
                    ||(StringUtils.countMatches(valueTokenBuffer.toString(), "[")  == 1) )
            {
                //if (valueTokenBuffer.toString().equals("\"")){
                setOperation(tokenStack, wordTokenBuffer);
                valueTokenBuffer.append(token);

                if (i == argSize - 1) {
                    //					setNumber(tokenStack, numberTokenBuffer);
                    setString(tokenStack, valueTokenBuffer);
                }

                if (  (valueTokenBuffer.toString().contains("}")))  {
                    setString(tokenStack, valueTokenBuffer);
                }
                if (  (valueTokenBuffer.toString().contains("]")))  {
                    setString(tokenStack, valueTokenBuffer);
                }
            } else if(!isOperation(token)) { //숫자인 경우
                //문자열이 있으면 넣는다.
//				setWordOperation(tokenStack, wordTokenBuffer);
                setOperation(tokenStack, wordTokenBuffer);
                //				numberTokenBuffer.append(token);
                valueTokenBuffer.append(token);
                if (i == argSize - 1) {
//					setNumber(tokenStack, numberTokenBuffer);
                    if (  (valueTokenBuffer.toString().contains("\"")))  {
                        setString(tokenStack, valueTokenBuffer);
                    } else {
                        setNumber(tokenStack, valueTokenBuffer);
                    }
                }



            } else {
                //연산자면 기존의 수를 입력
                setValue(tokenStack, valueTokenBuffer);
                if (isTwoDigitOperation(wordTokenBuffer.toString())){  //word 버퍼에 두자리연산자가 있으면 토큰스택에 입력
                    setOperation(tokenStack, wordTokenBuffer);
                }
                if (isWordOperation(wordTokenBuffer.toString())){  //word 버퍼에 두자리연산자가 있으면 토큰스택에 입력
                    setWordOperation(tokenStack, wordTokenBuffer);
                }
                if (setOperation(tokenStack, token)) {
//					System.out.println("#################################");
//					System.out.println("token :"+token);
//					System.out.println("numberTokenBuffer :"+numberTokenBuffer.toString());
//					System.out.println("wordTokenBuffer :"+wordTokenBuffer.toString());
//					System.out.println("tokenStack :"+tokenStack.toString());
                    continue;
                }
                wordTokenBuffer.append(token);
            }
//            System.out.println("#################################");
//            System.out.println("token :"+token);
//            System.out.println("valueTokenBuffer :"+valueTokenBuffer);
//            System.out.println("wordTokenBuffer :"+wordTokenBuffer);
//            System.out.println("tokenStack :"+tokenStack);
        }
        return tokenStack;
    }
    /**
     * 기호 연산자 입력
     * @param tokenStack 토큰스택
     * @param token 토큰
     * @return boolean
     */
    private boolean setOperation(List< Object > tokenStack, char token) {
        String tokenBuffer = Character.toString(token);
        if ( containWord(tokenBuffer, OperationConstants.TWO_DIGIT_OPERATION) ||
                containWord(tokenBuffer, OperationConstants.OPERATION2) ||
//                containWord(tokenBuffer, OperationConstants.OPERATION2) ||containWord(tokenBuffer, OperationConstants.OPERATION6) ||
                containWord(tokenBuffer, OperationConstants.OPERATION0)) {
            tokenStack.add(tokenBuffer);
            return true;
        }
        return false;
    }
    /**
     * 문자 연산자 입력
     * @param tokenStack 토큰스택
     * @param tokenBuffer 토큰버퍼
     */
    private void setOperation(List< Object > tokenStack, StringBuffer tokenBuffer) {
        if ( containWord(tokenBuffer.toString(), OperationConstants.TWO_DIGIT_OPERATION) || containWord(tokenBuffer.toString(), OperationConstants.OPERATION3) ||
                containWord(tokenBuffer.toString(), OperationConstants.OPERATION2) || //containWord(tokenBuffer.toString(), OperationConstants.OPERATION6) ||
                containWord(tokenBuffer.toString(), OperationConstants.OPERATION1) || containWord(tokenBuffer.toString(), OperationConstants.OPERATION0)) {
            tokenStack.add(tokenBuffer.toString());
            tokenBuffer.setLength(0);
        }
    }
    /**
     * 문자 연산자 입력
     * @param tokenStack 토큰스택
     * @param tokenBuffer 토큰버퍼
     */
    private void setWordOperation(List< Object > tokenStack, StringBuffer tokenBuffer) {
        if (isWordOperation(tokenBuffer)) {
            tokenStack.add(tokenBuffer.toString());
            tokenBuffer.setLength(0);
        }
    }
    /**
     * 숫자 입력
     * @param tokenStack 토큰스택
     * @param tokenBuffer 토큰버퍼
     */
    private void setNumber(List< Object > tokenStack, StringBuffer tokenBuffer) {
        if (tokenBuffer.length() > 0) {
            BigDecimal number = new BigDecimal(tokenBuffer.toString());
            tokenStack.add(number);
            tokenBuffer.setLength(0);
        }
    }

    /**
     * 문자 입력
     * @param tokenStack 토큰스택
     * @param tokenBuffer 토큰버퍼
     */
    private void setString(List< Object > tokenStack, StringBuffer tokenBuffer) {
        if (tokenBuffer.length() > 0) {
            String str = tokenBuffer.toString();
            tokenStack.add(str);
            tokenBuffer.setLength(0);
        }
    }

    /**
     * 값 입력
     * @param tokenStack 토큰스택
     * @param tokenBuffer 토큰버퍼
     */
    private void setValue(List< Object > tokenStack, StringBuffer tokenBuffer) {
        if (tokenBuffer.length() > 0) {
            //BigDecimal number = new BigDecimal(tokenBuffer.toString());
            tokenStack.add(tokenBuffer.toString());
            tokenBuffer.setLength(0);
        }
    }
    /**
     * 연산자 체크 함수
     * @param token 토큰
     * @param check 체크
     * @return boolean
     */
    private boolean containWord(String token, String[] check) {
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
    /**
     * 글자 연산자 여부 체크
     * @param wordTokenBuffer 워드토큰버퍼
     * @return boolean
     */
    private boolean isWordOperation(StringBuffer wordTokenBuffer) {
        String wordToken = wordTokenBuffer.toString();
        return isWordOperation(wordToken);
    }
    /**
     * 글자 연산자 여부 체크
     * @param wordToken wordTokenBuffer
     * @return boolean
     */
    private boolean isWordOperation(String wordToken) {
        return containWord(wordToken, OperationConstants.WORD_OPERATION4) || containWord(wordToken, OperationConstants.WORD_OPERATION3) || containWord(wordToken, OperationConstants.WORD_OPERATION2)
                || containWord(wordToken, OperationConstants.WORD_OPERATION1);
    }
    /**
     * 수가 필요없는 연산자일 경우는 값을 내놓는다.(PI, E)
     * @param wordToken 워드토큰
     * @return BigDecimal
     */
    private BigDecimal ConverterWordResult(String wordToken) {
        if (containWord(wordToken, OperationConstants.WORD_OPERATION1)) {
            if (OperationConstants.WORD_OPERATION1[0].equals(wordToken.toLowerCase())) {
                return BigDecimal.valueOf(Math.PI);
            } else if (OperationConstants.WORD_OPERATION1[1].equals(wordToken.toLowerCase())) {
                return BigDecimal.valueOf(Math.E);
            }
        }
        return null;
    }
    /**
     * 기호 연산자인지 체크
     * @param token 토큰
     * @return boolean
     */
    private boolean isOperation(String token) {
        return containWord(token, OperationConstants.TWO_DIGIT_OPERATION) || containWord(token, OperationConstants.OPERATION3) ||
                containWord(token, OperationConstants.OPERATION2) || //containWord(token, OperationConstants.OPERATION6) ||
                containWord(token, OperationConstants.OPERATION1);
    }
    /**
     * 기호 연산자인지 체크
     * @param token 토큰
     * @return boolean
     */
    private boolean isOperation(char token) {
        if ((token >= 48 && token <= 57) || token == 46 || token == 34 || token == 123 || token == 125|| token == 91 || token == 93) {
            return false;
        } else {
            return true;
        }
    }

    /**
     * 두자리 기호인지 체크
     * @param token 토큰
     * @return boolean
     */
    private boolean isTwoDigitOperation(String token) {
        return containWord(token, OperationConstants.TWO_DIGIT_OPERATION);
    }

    /**
     * 기호 우선순위 비교
     * @param s 연산자
     * @return int
     */
    private int exprOrder(String s) {
        if (s == null)
            throw new NullPointerException();
        int order = -1;
        switch (s) {
            case "||":
                order = 0;
                break;
            case "&&":
                order = 1;
                break;
            case "==":
            case ">":
            case ">=":
            case "<":
            case "<=":
            case "!=":
                order = 2;
                break;
            case "|":
                order = 3;
                break;
            case "-":
            case "+":
                order = 4;
                break;
            case "*":
            case "/":
            case "%":
                order = 5;
                break;
            case "^":
            case "!":
                order = 6;
                break;
        }
        return order;
    }


    /**
     * 숫자체크
     * @param s String
     * @return boolean
     */
    public static boolean isNumeric(String s) {
        try {
            Double.parseDouble(s);
            return true;
        } catch(NumberFormatException e) {
            return false;
        }
    }
}
