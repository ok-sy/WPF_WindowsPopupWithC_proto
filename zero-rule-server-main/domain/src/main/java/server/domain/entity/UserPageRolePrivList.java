package server.domain.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPageRolePrivList {
    /**
     * 페이지 아이디
     */
    private String pageId;
    /**
     * 권한유형
     */
    private String privId;
    /**
     * 페이지키
     */
    private String pageKey;
}
