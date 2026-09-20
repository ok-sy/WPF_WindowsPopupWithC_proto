package server.domain.vo.ruleEngine;

import lombok.Data;
import java.util.ArrayList;

/**
 * 룰조건식Vo
 */
@Data
public class RuleConditionVo implements Cloneable{
    private String ruleId;
    private int ruleConditionNo;
    private String conditionInfixDesc;
    private String conditionPostfixDesc;
    private ArrayList<RuleConditionReturnItemVo> arrayRuleConditionReturnItemList;

    @Override
    public RuleConditionVo clone() {
        try {
            // TODO: 이 복제본이 원본의 내부를 변경할 수 없도록 여기에 가변 상태를 복사합니다
            return (RuleConditionVo) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}
