package server.util;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public class CDateUtils {
    private static final String DATE_DEFAULT_FORMAT = "yyyy.MM.dd HH:mm:ss";

    /**
     * 오늘 날짜를 기본 형식에 맞게 가져오기
     * @return 텍스트 날짜
     */
    public static String getToday() {
        return getToday(DATE_DEFAULT_FORMAT);
    }

    /**
     * 오늘 날짜를 format에 맞게 가져오기
     * @param format 날짜 형식
     * @return 텍스트 날짜
     */
    public static String getToday(String format) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format).withZone(ZoneId.systemDefault());
        return formatter.format(Instant.now());
    }
}
