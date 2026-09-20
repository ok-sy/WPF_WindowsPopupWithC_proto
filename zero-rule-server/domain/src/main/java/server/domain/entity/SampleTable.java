package server.domain.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

// @Data : getter, setter, toString(), equals()
//         hashCode() 자동으로 생성
@Data
public class SampleTable {

    // @Schema : swagger 문서에 정보를
    //           정의하기 위해 사용
    @Schema(description = "팀 ID")
    private long teamId;

    @Schema(description = "팀 이름")
    private String teaNm;

    @Schema(description = "팀 인원")
    private String teaNum;
}
