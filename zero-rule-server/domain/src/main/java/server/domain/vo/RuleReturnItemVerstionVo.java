package server.domain.vo;

import lombok.Data;

/**
 */
@Data
public class RuleReturnItemVerstionVo {
    private String ruleid;
    private String returnItemid;
    private int returnitemNo;
    private int updateUserid;
    private String updateDatetime;
    private String itemNm;
    private String itemaliasNm;
    private String datatypeNm;

    private int ruleVerno;
}
