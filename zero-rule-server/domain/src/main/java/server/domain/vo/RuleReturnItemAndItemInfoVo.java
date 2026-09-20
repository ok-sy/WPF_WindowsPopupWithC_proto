package server.domain.vo;

import lombok.Data;

/**
 * 룰 항목
 */
@Data
public class RuleReturnItemAndItemInfoVo {
    private String ruleid;
    private String returnItemid;
    private Long returnitemNo;
    private String updateUserid;
    private String updateDatetime;
    private String itemid;
    private String itemNm;
    private String itemaliasNm;
    private String itemexplanDesc;
    private String datatypeCd;

}
