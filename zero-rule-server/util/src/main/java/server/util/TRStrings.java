package server.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.Nullable;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;

@Slf4j
abstract public class TRStrings {
    /**
     * 문자열의 앞뒤 Whitespace를 제거한다.
     * Whitespace를 제거한 결과가 빈문자열이면 null을 리턴한다.
     *
     * @param str 대상 문자열
     * @return Whitespace가 제거된 문자열 또는 null
     */
    @Nullable
    public static String trimToNull(@Nullable String str) {
        if (str == null) {
            return null;
        }

        String value = StringUtils.trimWhitespace(str);
        if (StringUtils.hasText(value)) {
            return value;
        }
        return null;
    }

    /**
     * 주어진 문자열를 대문자로 변경한다.
     *
     * @param str 대상 문자열
     * @return 대문자로 변경된 문자열 또는 null
     */
    @Nullable
    public static String uppercaseOrNull(@Nullable String str) {
        if (str == null) {
            return null;
        }

        return str.toUpperCase();
    }


    /**
     * 주어진 문자열를 소문자로 변경한다.
     *
     * @param str 대상 문자열
     * @return 소문자로 변경된 문자열 또는 null
     */
    @Nullable
    public static String lowercaseOrNull(@Nullable String str) {
        if (str == null) {
            return null;
        }

        return str.toLowerCase();
    }

    /**
     * 모든 Whitespace 문자를 제거한다.
     * 문자열의 중간에 포함된 Whtiespace도 제거한다.
     * Whitespace를 제거한 결과가 빈문자열이면 null을 리턴한다.
     *
     * @param str 대상 문자열
     * @return Whitespace가 제거된 문자열 또는 null
     */
    @Nullable
    public static String deleteWhitespaceToNull(@Nullable String str) {
        if (str == null) {
            return null;
        }
        String value = StringUtils.trimAllWhitespace(str);
        if (StringUtils.hasText(value)) {
            return value;
        }
        return null;
    }

    /**
     * 주어진 문자열이 Y 또는 y인 경우 Y를 리턴하고,
     * N 또는 n인 경우 N을 리턴한다.
     * 그 이외의 경우는 null을 리턴한다.
     *
     * @param str 대상 문자열
     * @return 문자열 Y 또는 N 또는 null
     */
    public static String ynOrNull(@Nullable String str) {
        if (str == null) {
            return null;
        }
        String value = str.toUpperCase();
        if (value.equals("Y") || value.equals("N")) return value;
        return null;
    }


    /**
     * 주어진 문자열이 Y,y,N,n인 경우 true를 리턴한다.
     *
     * @param str 대상 문자열
     * @return Y, y, N, n인 경우 true를 리턴
     */
    public static boolean isYn(@Nullable String str) {
        return ynOrNull(str) != null;
    }

    /**
     * 데이터베이스에서 읽어온 BLOB을 String으로 변경한다.
     * 변경이 실패하면 null을 리턴
     *
     * @param bytes DB에서 읽어온 blob의 byte array
     * @return 변경된 문자열 또는 null
     */
    @Nullable
    public static String ruleBlobToStringOrNull(@Nullable byte[] bytes) {
        if (bytes == null) return null;
        if (bytes.length == 0) return "";

        try {
            return new String(bytes, StandardCharsets.UTF_16LE);
        } catch (Exception e) {
            log.warn("blob to string fail:", e);
        }
        return null;
    }
}
