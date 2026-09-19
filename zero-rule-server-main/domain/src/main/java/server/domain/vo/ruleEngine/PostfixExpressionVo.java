package server.domain.vo.ruleEngine;

import lombok.Data;

/**
 * 후위식표현식Vo
 */
@Data
public class PostfixExpressionVo implements Cloneable{
    private String ruleId;
    private int ruleConditionNo;
    private String returnItemId;
    private int postFixObjectNo;
    private int returnItemNo;
    private String datatypeCd;
    private String operatorYn;
    private Object objectData;

    @Override
    public PostfixExpressionVo clone() {
        try {
            // TODO: 이 복제본이 원본의 내부를 변경할 수 없도록 여기에 가변 상태를 복사합니다
            return (PostfixExpressionVo) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}
