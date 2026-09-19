package server.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

/**
 * 자료 게시판 첨부 파일
 * 테이블 엔티티
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class PdsFile extends FileBase {
    /**
     * PDS ID
     * 삭제된 파일인 경우 0
     */
    private long pdsId;
}
