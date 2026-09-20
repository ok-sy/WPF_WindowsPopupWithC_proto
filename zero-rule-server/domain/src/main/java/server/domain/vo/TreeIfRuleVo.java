package server.domain.vo;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * 메타 단어
 */
@Data
@Builder
public class TreeIfRuleVo {
    private String ifid;
    private String ifNm;
    private String iftypeCd;
    private String sourceHostNm;
    private String targetTableNm;
    private List<RuleVo> rules;
}
