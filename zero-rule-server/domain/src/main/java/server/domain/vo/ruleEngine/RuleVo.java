package server.domain.vo.ruleEngine;

import lombok.Data;
import org.apache.ibatis.type.Alias;

import java.util.ArrayList;

/**
 * 룰vo
 */
@Data
@Alias("RuleEngineRuleVo")
public class RuleVo implements Cloneable{

    private String ruleNm;
    private String ruleId;
    private String ruleAliasNm;
    private String ruleDesc;
    private String ruleSortCd;
    private String ruleReturnType;
    private String allReturnYn;
    private int returnItemCount;
    private String useYn;
    private float ruleVerNo;

    private ArrayList<RuleConditionVo> arrayRuleConditionVoList;
    private ArrayList<RuleReturnItemVo> arrayRuleRuleReturnItemVoList;

    @Override
    public RuleVo clone() {
        try {
            // TODO: 이 복제본이 원본의 내부를 변경할 수 없도록 여기에 가변 상태를 복사합니다
            return (RuleVo) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}
