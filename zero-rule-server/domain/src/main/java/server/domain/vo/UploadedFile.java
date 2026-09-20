package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

/**
 * 업로드한 파일 정보
 * 클라이언트측에 응답하는 용도로 사용한다.
 */
@Data
@Builder
public class UploadedFile {

    @Schema(description = "파일 ID")
    private String fileId;

    @Schema(description = "파일 이름")
    private String fileName;

    @Schema(description = "파일크기")
    private long fileSize;

    @Schema(description = "다운로드 URL")
    private String downloadUrl;
}
