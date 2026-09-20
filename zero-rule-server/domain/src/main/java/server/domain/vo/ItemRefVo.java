package server.domain.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemRefVo {

    private String itemid;

    private String itemrefCd;

    private String itemrefNm;

    private String itemrefaliasNm;

    private String itemrefexprDesc;

    private String updateUserid;

    private String updateDatetime;

}
