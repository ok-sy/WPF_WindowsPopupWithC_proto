package server.domain.vo.ruleEngine;

import lombok.Data;

import java.util.ArrayList;

/**
 * 룰호출결과데이타Vo
 */
@Data
public class RuleOutputDataVo {
    private String dataType;//0:숫자, 1:문자, 2:논리형
    private String itemId;
    private String itemAliasNm;
    private int returnItemNo;
    private String outputData;
    private ArrayList<String> outputDataList;
    private ArrayList<PostfixExpressionVo> returnItemPostfixObjectInfo;
}
