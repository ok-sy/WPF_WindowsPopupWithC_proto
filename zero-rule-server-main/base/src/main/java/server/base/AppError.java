package server.base;

import cl.cloverframework.ICLErrorMeta;
import jakarta.annotation.Nullable;

import java.util.Arrays;

public enum AppError implements ICLErrorMeta {

    // begin clover framework required
    E1_NO_SUCH_CODE_TYPE("존재하지 않는 코드 유형입니다"),
    E1_NO_SUCH_CODE("존재하지 않는 코드입니다"),
    E1_INVALID_PARAMS("올바르지 않은 파라미터입니다"),
    // end clover framework required

    E1_HTTP_400("HTTP Bad Request"),
    E1_HTTP_401("HTTP unauthorized"),
    E1_HTTP_403("HTTP forbidden"),
    E1_AUTH_INVALID_TOKEN("인증 토큰이 유효하지 않습니다"),
    E1_AUTH_EXPIRED("인증이 만료되었습니다"),
    E1_UNKNOWN("오류가 발생했습니다"),
    E1_BLOCKED_USER("접근이 차단된 사용자입니다"),
    E1_LOGIN_BLOCKED_IP("로그인이 차단되었습니다."),
    E1_DELETED_USER("탈퇴한 사용자입니다"),
    E1_STOPPED_USER("계정 사용이 중지된 사용자입니다"),
    E1_DORMANT_USER("휴면 상태의 사용자입니다"),
    E1_LOCKED_USER("계정 잠금 상태의 사용자입니다"),
    E1_INVALID_ACCESS("비정상적인 접근입니다"),


    E1_DUP_USER_ID("사용자 ID가 중복됩니다"),
    E1_NO_SUCH_DATA("해당 자료가 없습니다"),

    E1_NO_SUCH_USER("해당 사용자가 없습니다"),
    E1_PW_MISMATCH("비밀번호가 일치하지 않습니다"),
    E1_WEAK_PW("취약한 비밀번호입니다"),
    E1_OLD_PW_MISMATCH("기존 비밀번호가 일치하지 않습니다"),
    E1_LOGIN_FAIL("로그인 정보가 올바르지 않습니다"),
    E1_ACCESS_DENIED("접근이 차단되었습니다"),

    // meta
    E1_NO_SUCH_META_WORD("해당 메타 단어가 없습니다"),
    E1_DUP_META_WORD("메타 단어가 중복됩니다"),

    // pds
    E1_BLOCKED_ATTACH_FILE("허용되지 않는 첨부파일입니다"),

    //glossary
    E1_NO_SUCH_META_GlOSSARY("해당 용어가 없습니다."),
    E1_DUP_META_GLOSSARY("이미 존재하는 단어입니다."),
    E1_NO_SUCH_META_GLOSSARY("존재하지 않는 단어입니다."),

    //rule
    E1_NO_SUCH_RULE_TEMPLATE("존재하지 않는 템플릿 파일입니다."),

    E1_NO_SUCH_RULE_LIST("RULE 목록 정보를 찾을 수 없습니다."),

    E1_NO_SUCH_RULE_DETAIL_INFO("Rule 상세정보를 찾을 수 없습니다."),
    E1_NO_INSERT_ERR("등록 중 오류 발생 하였습니다."),
    E1_NO_INIT_PWD_USER("패스워드 재등록 후 로그인 가능합니다."),
    E1_PSWD_MUST_CHANGE("비밀번호 변경 후에 서비스 이용할 수 있습니다."),
    E1_NO_UPDATE_ERR("수정 된 정보가 존재하지 않습니다."),
    E1_DUP_TEAM_ID("팀 ID가 중복됩니다"),

    E1_NO_DELETE_ERR("삭제 된 정보가 존재하지 않습니다."),

    E1_DUP_TRX_ID("거래 ID가 중복됩니다"),

    E1_DUP_TMPL_ID("템플릿 ID가 중복됩니다"),

    E1_PERM_DENIED("접근 권한이 없습니다."),
    
    E1_MSG_TESTE("메세지추가테스트");


    private final String message;
    private final String errorNumber;

    AppError(String message) {
        this.message = message;
        this.errorNumber = String.valueOf(this.ordinal() + 1);
    }


    @Nullable
    public static AppError findByName(String name) {
        return Arrays.stream(AppError.values())
            .filter(it -> it.name().equals(name))
            .findFirst().orElse(null);
    }


    /**
     * 에러 이름
     */
    @Override
    public String getErrorName() {
        return this.name();
    }

    /**
     * 에러 번호
     * 에러 번호도 문자열로 사용
     */
    @Override
    public String getErrorKey() {
        return String.valueOf(this.ordinal() + 1);
    }

    @Override
    public String getErrorMessage() {
        return this.message;
    }
}
