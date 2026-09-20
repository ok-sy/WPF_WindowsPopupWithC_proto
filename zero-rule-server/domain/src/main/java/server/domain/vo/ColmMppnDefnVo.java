package server.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.Instant;

@Data
public class ColmMppnDefnVo {

    @Schema(description = "컬럼 순서")
    private long colmSeq;

    @Schema(description = "To Be 테이블 물리명")
    private String tobeTblPhyNm;

    @Schema(description = "To Be 테이블 한글명")
    private String tobeTblKorNm;

    @Schema(description = "To Be 컬럼 물리명")
    private String tobeColmPhyNm;

    @Schema(description = "To Be 컬럼 한글명")
    private String tobeColmKorNm;

    @Schema(description = "To Be 컬럼 타입",nullable = true)
    private String tobeColmType;

    @Schema(description = "To Be 컬럼 PK 여부")
    private String tobeColmPkYn;

    @Schema(description = "To Be 컬럼 NULL 여부")
    private String tobeColmNullYn;

    @Schema(description = "To Be 컬럼 순서",nullable = true)
    private long tobeColmId;

    @Schema(description = "As Is 테이블 물리명",nullable = true)
    private String asisTblPhyNm;

    @Schema(description = "As Is 테이블 한글명",nullable = true)
    private String asisTblKorNm;

    @Schema(description = "As Is 컬럼 물리명",nullable = true)
    private String asisColmPhyNm;

    @Schema(description = "As Is 컬럼 한글명",nullable = true)
    private String asisColmKorNm;

    @Schema(description = "As Is 컬럼 타입",nullable = true)
    private String asisColmType;

    @Schema(description = "As Is 컬럼 PK 여부")
    private String asisColmPkYn;

    @Schema(description = "As Is 컬럼 NULL 여부")
    private String asisColmNullYn;

    @Schema(description = "비고",nullable = true)
    private String rmrk;

    @Schema(description = "최초 등록 일시",nullable = true)
    private Instant fstUpdtDtm;

    @Schema(description = "최초 변경 일시",nullable = true)
    private Instant lastUpdtDtm;
}
