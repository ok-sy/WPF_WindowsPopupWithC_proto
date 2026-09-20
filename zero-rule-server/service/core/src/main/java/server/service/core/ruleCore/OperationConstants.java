package server.service.core.ruleCore;

public class OperationConstants {
    //연산자가 아닌 기호
    static public String[] OPERATION0 = { "(", ")", "," };
    //수 한 개가 필요한 연산기호(수는 왼쪽에 배치)
    static public String[] OPERATION1 = { "!" };
    //수 두 개가 필요한 연산기호(수는 양옆에 배치) - 왼쪽에서 오른쪽으로 계산한다.
    //예) 1 + 2 = 3, 6 / 3 = 2, 2 ^ 3 = 8..
    static public String[] OPERATION2 = { "+", "-", "*", "/", "^", "%" };
    static public String[] OPERATION3 = { "<", ">" };
    static public String[] OPERATION4 = { "<=", ">=", "==", "!="};
    static public String[] OPERATION5 = { "||", "&&" };
    static public String[] OPERATION6 = { "|"};
    //수가 필요없는 문자 연산기호
    static public String[] WORD_OPERATION1 = { "pi", "e" };
    //수 한 개가 필요한 문자 연산기호(괄호로 구분한다.)
    static public String[] WORD_OPERATION2 = { "SIN", "SINH", "ASIN", "COS", "COSH", "ACOS", "TAN", "TANH", "ATAN",
            "SQRT", "EXP", "ABS", "LOG", "CELL", "FLOOR", "ROUND" };
    //수 두 개가 필요한 문자 연산기호(괄호, 콤마로 구분한다.)
    static public String[] WORD_OPERATION3 = { "POW" };

    //문자 하나, 수 두 개가 필요한 문자 연산기호(괄호, 콤마로 구분한다.)
    static public String[] WORD_OPERATION4 = { "SUBSTR" };

    //한자리 기호
    static public String[] ONE_DIGIT_OPERATION = { "(", ")", ",", "!", "+", "-", "*", "/", "^", "%", "<", ">", "|" };
    static public String[] TWO_DIGIT_OPERATION = { "<=", ">=", "==", "!=", "||", "&&"};
}
