package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

@Data
public class RuleReturnItemValidation {

    private String itemNm;
    private String returnItemid;
    private String returnitemExprDesc;
    private String datatypeCd;
    private Long ruleconditionno;

}
