package server.domain.entity;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.Instant;

/**
 * DB랑 컬럼명 다름
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetaGlossary {
    /**
     * PK, 단어 순번
     */
    private long glsySqno;

    /**
     * 한글명
     */
    @NonNull
    private String glsyKorNm;

    /**
     * 물리명
     */
    @Nullable
    private String glsyPhyNm;

    /**
     * 영어명
     */
    @Nullable
    private String engFullNm;


    /**
     * 데이터 타입
     */
    @NonNull
    private String dataType;

    /**
     * 설명
     */
    @NonNull
    private String glsyExpl;

    /**
     * 등록 일시
     */
    private Instant fstUpdtDttm;

    /**
     * 변경 일시
     */
    private Instant lastUpdtDttm;

}
