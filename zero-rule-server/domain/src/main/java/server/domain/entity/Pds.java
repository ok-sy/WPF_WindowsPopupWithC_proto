package server.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

import java.time.Instant;

/**
 * 자료 게시판
 * 테이블 엔티티
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pds {

    /**
     * PK, 자료 ID pdsId
     */
    private long pdsId;

    /**
     * 게시물 제목
     */
    @NonNull
    private String title;

    /**
     * 검색용 게시물 제목 - 공백제거, 소문자로
     */
    @NonNull
    private String titleNoSpace;

    /**
     * 게시물 내용
     */
    @Nullable
    private String substance;

    /**
     * 첨부 파일 개수
     */
    private int attachFileCount;

    /**
     * 등록 사용자 ID
     * 탈퇴한 사용자일 수 있다.
     * 관리자인 경우 NULL
     */
    @Nullable
    private String createUserId;

    /**
     * 등록 일시
     */
    private Instant createdAt;

    /**
     * 변경 일시
     */
    private Instant changedAt;
}
