package server.web.support.payload;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;
import server.domain.vo.UploadedFile;

@Schema(description = "파일 업로드 정보 응답")
@Data
@Builder
public class FileUploadResponse {
    private UploadedFile file;
}
