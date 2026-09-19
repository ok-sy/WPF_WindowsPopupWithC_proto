package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.Instant;

/**
 * FDS 메타 용어
 */
@Data
public class MetaGlossaryVo {
    @Schema(description ="단어 순번")
    private long glsySqno;

    @Schema(description ="한글명")
    private String glsyKorNm;

    @Schema(description ="물리명")
    private String glsyPhyNm;

    @Schema(description ="영어명")
    private String engFullNm;

    @Schema(description ="데이터 타입")
    private String dataType;

    @Schema(description ="설명")
    private String glsyExpl;

    @Schema(description ="등록일시")
    private Instant fstUpdtDttm;

    @Schema(description ="변경일시")
    private Instant lastUpdtDttm;

}
