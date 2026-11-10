package server.service.core.popup;

import java.nio.charset.StandardCharsets;

/**
 * POL-06-02 : 선택·제출
 * ■ UTF-8 바이트 길이 상한(TODO73-38)
 * - in : text(String) 검사할 문자열
 * - out: int UTF-8 바이트 수
 * - 폐쇄망 DB 컬럼이 BYTE 단위(선택지 OPTION_TEXT VARCHAR2(300 BYTE, QUIZ·SURVEY 공통 — 설문은 2026-11-11 확대), 주관식 응답 VARCHAR2(1000 BYTE))라
 *   글자 수(String.length, UTF-16)가 아니라 저장할 문자열의 UTF-8 바이트로 센다. 영문 1, 한글 3, 이모지 4바이트.
 *   관리자 웹(popupByteLimit.ts)·WPF(Utf8ByteLimit)와 같은 상한이다. 넘으면 저장 전에 400(IllegalArgumentException)으로 거부해
 *   DB 오류(ORA-12899)로 이어지지 않게 한다. 자르지 않는다. 관리자 저장은 PopupAdminExceptionHandler가 400으로 응답한다.
 */
final class PopupUtf8Limits {

    /** 선택지 문구(QUIZ·SURVEY, 서식이 있으면 서식에서 파생한 일반 문자열) 최대 바이트. */
    static final int OPTION_TEXT_MAX_BYTES = 300;
    /** SURVEY/QUIZ 주관식 응답(textAnswer, 앞뒤 공백 제거 후 저장값) 최대 바이트. */
    static final int TEXT_ANSWER_MAX_BYTES = 1000;

    private PopupUtf8Limits() {
    }

    static int utf8Length(String text) {
        return text == null ? 0 : text.getBytes(StandardCharsets.UTF_8).length;
    }
}
