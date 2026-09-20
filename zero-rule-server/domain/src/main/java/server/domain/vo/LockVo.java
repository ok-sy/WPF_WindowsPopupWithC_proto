package server.domain.vo;

import lombok.Data;

import java.time.Instant;

/**
 * 메타 단어
 */
@Data
public class LockVo {
    private String lockcode;

    private String lockkey;

    private Instant lockdatetime;

    private String userid;

    private String locktypecode;

    private String locknote;

    private String userNm;

    private String lgonId;


}
