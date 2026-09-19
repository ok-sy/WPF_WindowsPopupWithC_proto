package server.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MetaWord {

    /**
     * PK, 단어 ID
     */
    private long id;

    /**
     * 단어 이름
     */
    @NonNull
    private String name;

    /**
     * 단어 영문명
     */
    @Nullable
    private String fullName;

    /**
     * 단어 한글명
     */
    @Nullable
    private String korName;


    /**
     * 엔티티 여부
     */
    @NonNull
    private String entityYn;

    /**
     * 속성 여부
     */
    @NonNull
    private String attrYn;

    /**
     * 동의어
     */
    @Nullable
    private String synm;


    /**
     * 단어설명
     */
    @Nullable
    private String expl;


    /**
     * 단어설명 - 공백없음
     */
    @Nullable
    private String explNoSpace;

    /**
     * 등록 일시
     */
    private Instant createdAt;

    /**
     * 변경 일시
     */
    private Instant changedAt;
}
