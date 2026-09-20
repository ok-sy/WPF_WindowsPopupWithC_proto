package server.domain.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import server.domain.vo.UsedRuleInfoVo;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemMgmt {

    /**
     * 항목ID
     * PK
     */
    @NonNull
    private String itemid;

    /**
     * 항목명
     */
    private String itemNm;

    /**
     * 항목별칭명
     */
    private String itemAliasNm;

    /**
     * 항목설명내용
     */
    private String itemExplanDesc;

    /**
     * 항목데이터타입코드
     */
    private String dataTypeCd;

    /**
     * 항목데이터타입코드명
     */
    private String dataTypeNm;

    /**
     * 변경사용자ID
     */
    private String updateUserID;

    /**
     * 삭제여부(사용여부)
     */
    private String itemUseYn;

    /**
     * 최초등록사용자ID
     */
    private String firstRegUserId;

    /**
     * 변경일시
     */
    private String updateDateTime;

    /**
     * 최초등록일시
     */
    private String firstRegDateTime;

    /**
     * 인터페이스 아이디
     */
    private String ifid;

    private int usedCnt;




}
