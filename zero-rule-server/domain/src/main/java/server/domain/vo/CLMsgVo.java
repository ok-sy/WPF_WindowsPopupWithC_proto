package server.domain.vo;


import lombok.Data;

@Data
public class CLMsgVo {
    /**
     * 메시지_아이디
     */
    private String msgId;

    /**
     * 메시지_타입
     */
    private String msgClsf;

    /**
     * 업무구분코드
     */
    private String tskClsfCd;

    /**
     * 팀_ID
     */
    private String teamId;

    /**
     * 발생구분코드
     */
    private String occrClsfCd;

    /**
     * 메시지출력코드
     */
    private String msgPrntCd;

    /**
     * 메시지종류
     */
    private String msgKn;

    /**
     * 메시지
     */
    private String msgCn;

    /**
     * 사용여부
     */
    private String useYn;
}
