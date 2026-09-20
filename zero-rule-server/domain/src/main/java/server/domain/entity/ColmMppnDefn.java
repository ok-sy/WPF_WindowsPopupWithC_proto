package server.domain.entity;

import jakarta.annotation.Nullable;
import lombok.*;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColmMppnDefn {

    /**
     * 컬럼 순번
     */
    private long colmSeq;

    /**
     * To Be 테이블 물리명
     */
    @NonNull
    private String tobeTblPhyNm;

    /**
     * To Be 테이블 한글명
     */
    @NonNull
    private String tobeTblKorNm;

    /**
     * To Be 컬럼 물리명
     */
    @NonNull
    private String tobeColmPhyNm;

    /**
     * To Be 컬럼 한글명
     */
    @NonNull
    private String tobeColmKorNm;

    /**
     * To Be 컬럼 타입
     */
    @Nullable
    private String tobeColmType;

    /**
     * To Be 컬럼 PK 여부
     */
    @NonNull
    private String tobeColmPkYn;

    /**
     * To Be 컬럼 Null 여부
     */
    @NonNull
    private String tobeColmNullYn;

    /**
     * To Be 컬럼 순서
     */
    @Nullable
    private long tobeColmId;

    /**
     * As Is 테이블 물리명
     */
    @Nullable
    private String asisTblPhyNm;

    /**
     * As Is 테이블 한글명
     */
    @Nullable
    private String asisTblKorNm;

    /**
     * As Is 컬럼 물리명
     */
    @Nullable
    private String asisColmPhyNm;

    /**
     * As Is 컬럼 한글명
     */
    @Nullable
    private String asisColmKorNm;

    /**
     * As Is 컬럼 타입
     */
    @Nullable
    private String asisColmType;

    /**
     * As Is 컬럼 PK 여부
     */
    @NonNull
    private String asisColmPkYn;

    /**
     * As Is 컬럼 NULL 여부
     */
    @NonNull
    private String asisColmNullYn;

    /**
     * 비고
     */
    @Nullable
    private String rmrk;

    /**
     * 최초 등록 일시
     */
    private Instant fstUpdtDttm;

    /**
     * 최초 변경 일시
     */
    private Instant lastUpdtDttm;
}
