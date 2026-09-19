package server.service;

import cl.cloverframework.util.CLValidatorUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;

@Slf4j
abstract public class PasswordValidator {

    /**
     * 비밀번호가 유효한지 체크한다
     *
     * @param pw 체크할 문자열
     * @return 유효한 경우 true
     */
    public static boolean isValidPassword(@NonNull String pw) {
        // 1. 길이는 8~40글자
        if (pw.length() < 8 || pw.length() > 40) {
            return false;
        }

        // 2. 특수문자,대문자,숫자가 포함되어야 한다.
        boolean valid = CLValidatorUtils.containsNumber(pw) &&
            CLValidatorUtils.containsUppercase(pw) &&
            CLValidatorUtils.containsSpecialChars(pw);

        if (!valid) {
            return false;
        }

        // 3. 연속 숫자 체크하기
        // 연속된 숫자가 n글자 이상 포함되지 않아야 한다
        // 예를 들어, 123이나 789는 유효하지 않다.
        // 주의) 890은 연속된 숫자가 아니고, 012는 연속된 숫자다.
        if (CLValidatorUtils.containsSequentialNumber(pw, 3)) {
            return false;
        }

        // 4. 반복 문자 체크하기
        // 같은 글자가 n번 반복할 수 없다(숫자 또는 알파벳)
        // 예를 들어, aaa, BBB, 111 등은 3회 반복된 문자를 사용하고 있으므로 유효하지 않다.
        if (CLValidatorUtils.containsRepeatedAlphaNumeric(pw, 3)) {
            return false;
        }

        // 위의 과정을 모두 통과했으면 유효한 비밀번호다
        return true;
    }
}
