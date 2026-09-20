package server.domain.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.Nullable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CloverCode {
    /**
     * PK
     * 코드유형
     */
    private String codeType;

    /**
     * PK
     * 코드
     */
    private String code;

    /**
     * 코드이름
     */
    private String codeNm;

    /**
     * 세부설명
     */
    @Nullable
    private String dtlExpl;

}
