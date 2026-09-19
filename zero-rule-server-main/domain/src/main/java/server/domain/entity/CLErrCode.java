package server.domain.entity;

import lombok.Data;

// setter,getter,toString(),equals() 등 생성자를 만들어줍니다
@Data
public class CLErrCode {
    /**
     * 일련번호 PK
     */
    private int errKey;

    /**
     * 메세지 ID
     */
    private String msgId;

    /**
     * 메세지
     */
    private String msg;

    /**
     * 타입
     */
    private String type;
}
