package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.Instant;

/**
 * 메타 단어
 */
@Data
public class InterfaceVo {
    private String ifid;
    private String ifNm;
}
