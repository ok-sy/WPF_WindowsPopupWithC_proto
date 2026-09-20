package server.base;

import cl.cloverframework.ICLMsg;

public enum AppMsg implements ICLMsg {

    ER_NO_SUCH_CODE_TYPE("존재하지 않는 코드 유형입니다","ER","1","FW00000001"),
    ER_NO_SUCH_CODE("존재하지 않는 코드입니다","ER","1","FW00000002"),
    ER_INVALID_PARAMS("올바르지 않은 파라미터입니다","ER","1","FW00000003"),
    ER_AUTH_INVALID_TOKEN("인증 토큰이 유효하지 않습니다","ER","1","FW00000004"),
    ER_AUTH_EXPIRED("인증이 만료되었습니다","ER","1","FW00000005"),
    ER_BLOCKED_USER("접근이 차단된 사용자입니다","ER","1","FW00000006"),
    ER_LOGIN_BLOCKED_IP("로그인이 차단되었습니다.","ER","1","FW00000007"),
    ER_INVALID_ACCESS("비정상적인 접근입니다","ER","1","FW00000008"),
    ER_PW_MISMATCH("비밀번호가 일치하지 않습니다","ER","1","FW00000009"),
    ER_ACCESS_DENIED("접근이 차단되었습니다","ER","1","FW00000010"),
    ER_PERM_DENIED("접근 권한이 없습니다.","ER","1","FW00000011"),

    NM_REQUEST_SUCCESS("정상 조회 되었습니다.(ENUM)","NM","1","BE00000001"),
    NM_MSG_REG_SUCCESS("메시지가 등록되었습니다.","NM","1","BE00000002"),
    NM_MSG_UPT_SUCCESS("메시지가 등록되었습니다.","NM","1","BE00000003"),
    NM_LOGIN_SUCCESS("정상 로그인 되었습니다","NM","1","BE00000006"),
    ER_UNKNOWN("오류가 발생했습니다","ER","1","BE00000007"),
    ER_DELETED_USER("탈퇴한 사용자입니다","ER","1","BE00000008"),
    ER_STOPPED_USER("계정 사용이 중지된 사용자입니다","ER","1","BE00000009"),
    ER_DORMANT_USER("휴면 상태의 사용자입니다","ER","1","BE00000010"),
    E1_LOCKED_USER("계정 잠금 상태의 사용자입니다","ER","1","BE00000011"),
    ER_DUP_USER_ID("사용자 ID가 중복됩니다","ER","1","BE00000012"),
    ER_NO_SUCH_DATA("해당 자료가 없습니다","ER","1","BE00000013"),
    ER_NO_SUCH_USER("해당 사용자가 없습니다","ER","1","BE00000014"),
    ER_WEAK_PW("취약한 비밀번호입니다","ER","1","BE00000015"),
    ER_OLD_PW_MISMATCH("기존 비밀번호가 일치하지 않습니다","ER","1","BE00000016"),
    ER_LOGIN_FAIL("로그인 정보가 올바르지 않습니다","ER","1","BE00000017"),

    // meta
    NM_NO_SUCH_META_WORD("해당 메타 단어가 없습니다","NM","1","BE00000018"),
    ER_DUP_META_WORD("메타 단어가 중복됩니다","ER","1","BE00000019"),

      // pds
    ER_BLOCKED_ATTACH_FILE("허용되지 않는 첨부파일입니다","ER","1","BE00000020"),

    //glossary
    NM_NO_SUCH_META_GlOSSARY("해당 용어가 없습니다.","NM","1","BE00000021"),
    ER_DUP_META_GLOSSARY("이미 존재하는 단어입니다.","ER","1","BE00000022"),

    //rule
    NM_NO_SUCH_RULE_TEMPLATE("존재하지 않는 템플릿 파일입니다.","NM","1","BE00000023"),
    NM_NO_SUCH_RULE_LIST("RULE 목록 정보를 찾을 수 없습니다.","NM","1","BE00000024"),

    NM_NO_SUCH_RULE_DETAIL_INFO("Rule 상세정보를 찾을 수 없습니다.","NM","1","BE00000025"),
    ER_NO_INSERT_ERR("등록 중 오류 발생 하였습니다.","ER","1","BE00000026"),
    ER_NO_INIT_PWD_USER("패스워드 재등록 후 로그인 가능합니다.","ER","1","BE00000027"),
    NM_PSWD_MUST_CHANGE("비밀번호 변경 후에 서비스 이용할 수 있습니다.","NM","1","BE00000028"),
    NM_NO_UPDATE_ERR("수정 된 정보가 존재하지 않습니다.","NM","1","BE00000029"),
    ER_DUP_TEAM_ID("팀 ID가 중복됩니다","ER","1","BE00000030"),
    NM_NO_DELETE_ERR("삭제 된 정보가 존재하지 않습니다.","NM","1","BE00000031"),
    NM_DUP_TRX_ID("거래 ID가 중복됩니다","NM","1","BE00000032"),
    NM_DUP_TMPL_ID("템플릿 ID가 중복됩니다","NM","1","BE00000033"),
    ER_DUP_INSERT_ERR("등록 중 키중복 오류 발생 하였습니다","ER","1","BE00000034");

    private final String msgCn;
    private final String msgClsf;

    private final String msgPrntCd;

    private final String msgId;


    AppMsg(String msgCn, String msgClsf, String msgPrntCd, String msgId) {
        this.msgCn = msgCn;
        this.msgClsf = msgClsf;
        this.msgPrntCd = msgPrntCd;
        this.msgId = msgId;
    }

    @Override
    public String getMsgId() { return this.msgId; }

    @Override
    public String getMsgCn() {
        return this.msgCn;
    }

    @Override
    public String getMsgClsf() {
        return this.msgClsf;
    }

    @Override
    public String getMsgPrntCd() {
        return this.msgPrntCd;
    }
}
