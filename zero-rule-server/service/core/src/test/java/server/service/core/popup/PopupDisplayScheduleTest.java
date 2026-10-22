package server.service.core.popup;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupDisplayTimeDto;
import server.domain.popup.PopupResponseDto;

/**
 * POL-11-02 : 반복의 의미
 * POL-11-03 : 시간 경계
 * ■ 노출 일정(기간 모드·요일·시간대) 정규화와 검증 테스트
 */
class PopupDisplayScheduleTest {

    private static PopupResponseDto popup(String mode, String days, List<PopupDisplayTimeDto> times) {
        return new PopupResponseDto("P", "TEXT", "t", OffsetDateTime.now(), OffsetDateTime.now().plusDays(1), "SEQUENTIAL", 100,
                "FIXED", 560.0, 420.0, .7, .75, 480, 320, 1200, 900, true, true, true, false, false, null, mode,
                3, days, 15, null, null, null, List.of(), null, times);
    }

    private static PopupDisplayTimeDto t(String start, String end) {
        return new PopupDisplayTimeDto(start, end);
    }

    /** FIXED는 요일·시간대·매월 반복 값을 비운다. */
    @Test void fixedClearsDaysTimesAndMonthlyRepeat() {
        var normalized = PopupDisplaySchedule.normalize(popup(" fixed ", "1,3", List.of(t("09:00", "10:00"))));
        assertEquals("FIXED", normalized.periodMode());
        assertNull(normalized.repeatDayOfWeek());
        assertTrue(normalized.displayTimes().isEmpty());
        assertNull(normalized.repeatInterval());
        assertNull(normalized.repeatDayOfMonth());
    }

    /** SCHEDULE은 요일을 정렬·중복 제거하고 자정 초과를 포함한 시간대를 개수 제한 없이 유지한다. */
    @Test void scheduleNormalizesDaysAndKeepsAnyNumberOfWindowsIncludingMidnight() {
        var normalized = PopupDisplaySchedule.normalize(popup("schedule", " 5,1, 3,1 ",
                List.of(t("09:00", "12:00"), t("22:00", "02:00"), t("14:00", "18:00"), t("00:00", "23:59"))));
        assertEquals("SCHEDULE", normalized.periodMode());
        assertEquals("1,3,5", normalized.repeatDayOfWeek());
        assertEquals(List.of(t("09:00", "12:00"), t("22:00", "02:00"), t("14:00", "18:00"), t("00:00", "23:59")), normalized.displayTimes());
        assertNull(normalized.repeatInterval());
        assertNull(normalized.repeatDayOfMonth());
    }

    /** 요일이 비거나 7일 전부면 매일, 시간대가 없으면 종일이다. */
    @Test void emptyOrAllDaysMeanEveryDayAndNoWindowsMeansAllDay() {
        assertNull(PopupDisplaySchedule.normalize(popup("SCHEDULE", null, List.of())).repeatDayOfWeek());
        assertNull(PopupDisplaySchedule.normalize(popup("SCHEDULE", "", null)).repeatDayOfWeek());
        assertNull(PopupDisplaySchedule.normalize(popup("SCHEDULE", "7,6,5,4,3,2,1", List.of())).repeatDayOfWeek());
        assertTrue(PopupDisplaySchedule.normalize(popup("SCHEDULE", "2", null)).displayTimes().isEmpty());
    }

    /** 잘못된 모드·요일·시간 형식, 시작=종료, 같은 시간대 중복을 거부한다. */
    @Test void rejectsInvalidModeDaysTimesSameStartEndAndDuplicates() {
        for (String mode : new String[]{null, " ", "DAILY"}) {
            assertThrows(IllegalArgumentException.class, () -> PopupDisplaySchedule.normalize(popup(mode, null, List.of())), String.valueOf(mode));
        }
        for (String days : new String[]{"0", "8", "MON", "1,,2", "1;2"}) {
            assertThrows(IllegalArgumentException.class, () -> PopupDisplaySchedule.normalize(popup("SCHEDULE", days, List.of())), days);
        }
        for (var bad : List.of(t("24:00", "01:00"), t("9:00", "10:00"), t("09:60", "10:00"), t("09:00", null), t("10:00", "10:00"))) {
            assertThrows(IllegalArgumentException.class, () -> PopupDisplaySchedule.normalize(popup("SCHEDULE", null, List.of(bad))), bad.toString());
        }
        assertThrows(IllegalArgumentException.class,
                () -> PopupDisplaySchedule.normalize(popup("SCHEDULE", null, List.of(t("09:00", "10:00"), t("09:00", "10:00")))));
        // 겹치는(같지 않은) 시간대는 허용한다.
        assertEquals(2, PopupDisplaySchedule.normalize(popup("SCHEDULE", null, List.of(t("09:00", "11:00"), t("10:00", "12:00")))).displayTimes().size());
    }

    /** HH:mm ↔ 분 변환이 왕복 일치한다. */
    @Test void minuteConversionRoundTrips() {
        assertEquals(0, PopupDisplaySchedule.toMinute("00:00"));
        assertEquals(1439, PopupDisplaySchedule.toMinute("23:59"));
        assertEquals("13:05", PopupDisplaySchedule.toTime(PopupDisplaySchedule.toMinute("13:05")));
    }
}
