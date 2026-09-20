package server.domain.vo;

import lombok.Data;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.Instant;

/**
 * 삭제 마킹 가능한 파일
 */
@Data
public class CommonFileVo {

    /**
     * 파일 ID (64 byte)
     * PK
     */
    @NonNull
    private String fileId;


    @Nullable
    private String fileName;

    /**
     * 변경 일시
     */
    private Instant changedAt;
}
