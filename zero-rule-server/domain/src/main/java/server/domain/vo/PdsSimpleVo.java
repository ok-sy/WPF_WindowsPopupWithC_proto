package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.Instant;

/**
 * 내용 부분이 없는 Pds
 * 게시물 목록 조회시 사용
 */
@Data
public class PdsSimpleVo {
    @Schema(description = "자료 ID")
    private long pdsId;

    @Schema(description = "제목")
    private String title;

    @Schema(description = "첨부파일수")
    private int attachFileCount;

    @Schema(description = "생성 사용자 ID")
    private String createUserId;

    @Schema(description = "등록 일시")
    private Instant createdAt;

    @Schema(description = "변경 일시")
    private Instant changedAt;
}
