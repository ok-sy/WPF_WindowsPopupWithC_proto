package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.Instant;

/**
 * 메타 단어
 */
@Data
public class MetaWordVo {
    @Schema(description = "단어 ID")
    private long id;

    @Schema(description = "단어")
    private String name;

    @Schema(description = "단어 풀네임", nullable = true)
    private String fullName;

    @Schema(description = "단어 한글명")
    private String korName;

    @Schema(description = "엔티티 여부")
    private String entityYn;

    @Schema(description = "속성 여부")
    private String attrYn;

    @Schema(description = "동의어,콤마로 구분됨", nullable = true)
    private String synm;

    @Schema(description = "설명", nullable = true)
    private String expl;

    @Schema(description = "등록 일시")
    private Instant createdAt;

    @Schema(description = "변경 일시")
    private Instant changedAt;
}
