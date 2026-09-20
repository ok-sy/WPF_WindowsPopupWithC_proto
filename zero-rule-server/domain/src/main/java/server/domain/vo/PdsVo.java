package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class PdsVo {
    @Schema(description = "자료ID")
    private long pdsId;

    @Schema(description = "제목")
    private String title;

    @Schema(description = "첨부파일수")
    private int attachFileCount;

    @Schema(description = "게시물내용")
    private String substance;

    @Schema(description = "생성 사용자 ID")
    private String createUserId;

    @Schema(description = "등록 일시")
    private Instant createdAt;

    @Schema(description = "변경 일시")
    private Instant changedAt;

    private List<UploadedFile> attachFiles;

}
