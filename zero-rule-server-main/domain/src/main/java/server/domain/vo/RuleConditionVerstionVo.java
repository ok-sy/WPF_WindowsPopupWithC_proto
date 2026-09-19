package server.domain.vo;

import lombok.Data;

/**
 */
@Data
public class RuleConditionVerstionVo {
    private String ruleid;
    private int ruleconditionno;
    private String conditionInfixDesc;
    private String conditionPostfixDesc;
    private String conditionDesc;
    private int firstregUserid;
    private String firstregDatetime;
    private int updateUserid;
    private String updateDatetime;
    private String resultValue;

    private int ruleVerno;

}
