package server.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 메타 단어
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleInterfaceInfoVo {
    private String ifid;
    private String ifNm;
    private String ifDesc;
    private String ifProcessTypeCd;
    private String ifConnectionTypeCd;
    private String ruleUseYn;
    private int docLength;
    private String characterset;
    private String eaiid;
    private String firstregUserid;
    private String firstregDatetime;
    private String updateUserid;
    private String updateDatetime;


}
