package server.service.core.ruleCore;

public class RuleManageConstants {
    //나누기할 때 반올림 자릿수
    static public int HARF_ROUND_UP = 6;
    //논리결과
    static public String RESULT_TRUE = "T";
    static public String RESULT_FALSE = "F";
    static public String SUBRULE_INDENT_START = "{";
    static public String SUBRULE_INDENT_END = "}";
    static public String SUBRULE_CALL_INDENT = "@";
    static public String SUBRULE_INDENT_RETURN_ITEM = "::";
    static public String SUBRULE_INDENT_INPUT_ITEM = ";;";
    static public String JSON_INDENT = ",";
    static public String RULE_DATA_TYPE_NUMBER = "0";
    static public String RULE_DATA_TYPE_TEXT = "1";
    static public String RULE_DATA_TYPE_LOGIC = "2";
    static public String RULE_DATA_TYPE_ITEM = "3";
    static public String RULE_DATA_TYPE_SUBRULE = "4";
    static public int RULEID_LENTH = 10;
    static public int ITEM_LENGTH = 10;
    static public String ID_START_CHAR = "#";


    /**
     * 룰 히스토리 버전 체인지 코드값
     */
    static public String RULE_NEW = "0";
    static public String RULE_INFO_UPDATE = "1";
    static public String RULE_RETURN_ITEM_UPDATE = "2";
    static public String RULE_CONDITON_UPDATE = "3";
    static public String RULE_USE_TO_UNUSED = "4";
    static public String RULE_UNUSED_TO_USED = "5";

}
