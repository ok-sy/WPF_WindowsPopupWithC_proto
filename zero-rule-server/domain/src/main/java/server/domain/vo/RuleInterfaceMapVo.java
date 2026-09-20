package server.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 메타 단어
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RuleInterfaceMapVo {
    private String ifid;
    private String fieldEngNm;
    private String fieldKorNm;
    private int fieldOrder;
    private int fieldLength;
    private int fieldStartNo;
    private String fieldCodeType;
    private String datatypeCd;
    private int fieldScale;
    private String trimYn;
    private String characterset;
    private int firstregUserid;
    private String firstregDatetime;
    private int updateUserid;
    private String updateDatetime;



    private String ifNm;


}
