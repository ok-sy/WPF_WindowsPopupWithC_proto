package server.service.core.popup;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Pattern;
import server.domain.popup.PopupDisplayTimeDto;
import server.domain.popup.PopupResponseDto;

/**
 * [TODO52-1] 게시 기간 안 노출 일정(요일·시간대) 정규화와 검증.
 *
 * <p>반복 설정은 미완료 팝업의 노출 가능 일정이다(반복일마다 새 응답 아님). 게시 기간은 필수이며, 그 안에서
 * {@code PERIOD_MODE=SCHEDULE}이면 요일({@code REPEAT_DAY_OF_WEEK}, ISO 번호 1=월, 비면 매일)과 시간대
 * ({@code POPUP_DISPLAY_TIME}, 없으면 하루 종일)를 함께 만족할 때만 노출한다. {@code FIXED}는 게시 기간 내 상시다.
 * 시간대 개수와 자정 초과는 제한하지 않는다(종료 &lt; 시작이면 다음 날로 넘어가며 요일은 시작 시각 기준).
 * 매월·간격 반복({@code REPEAT_DAY_OF_MONTH}·{@code REPEAT_INTERVAL})은 이번 범위가 아니라 저장 시 비운다.
 * 노출 판단은 서버 KST 기준 SQL({@code PopupMapper.xml} eligiblePopupCte)이 한다.</p>
 */
final class PopupDisplaySchedule {

    static final String FIXED = "FIXED";
    static final String SCHEDULE = "SCHEDULE";
    private static final Pattern TIME = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");

    private PopupDisplaySchedule() {
    }

    /**
     * 기간 모드를 대문자로 맞추고, FIXED면 요일·시간대를 비우고, SCHEDULE이면 요일을 정렬·중복 제거하고 시간대를 검증한다.
     *
     * @throws IllegalArgumentException 모드·요일·시간 형식이 잘못되었거나 시작=종료·같은 시간대 중복인 경우
     */
    static PopupResponseDto normalize(PopupResponseDto popup) {
        String mode = popup.periodMode() == null ? "" : popup.periodMode().trim().toUpperCase(Locale.ROOT);
        if (mode.isEmpty()) {
            throw new IllegalArgumentException("기간 모드는 필수입니다.");
        }
        if (FIXED.equals(mode)) {
            return popup.withSchedule(FIXED, null, List.of());
        }
        if (!SCHEDULE.equals(mode)) {
            throw new IllegalArgumentException("기간 모드는 FIXED 또는 SCHEDULE이어야 합니다.");
        }
        List<PopupDisplayTimeDto> times = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (PopupDisplayTimeDto time : popup.displayTimes()) {
            if (time == null) {
                throw new IllegalArgumentException("노출 시간대 형식이 올바르지 않습니다.");
            }
            int start = toMinute(time.startTime());
            int end = toMinute(time.endTime());
            if (start == end) {
                throw new IllegalArgumentException("노출 시간대의 시작과 종료가 같을 수 없습니다.");
            }
            if (!seen.add(start + "-" + end)) {
                throw new IllegalArgumentException("같은 노출 시간대가 중복되었습니다.");
            }
            times.add(new PopupDisplayTimeDto(toTime(start), toTime(end)));
        }
        return popup.withSchedule(SCHEDULE, normalizeDays(popup.repeatDayOfWeek()), times);
    }

    /** 요일 목록 'n,n' (1~7) → 정렬·중복 제거. 비었거나 7일 전부면 null(매일). */
    static String normalizeDays(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        TreeSet<Integer> days = new TreeSet<>();
        for (String part : raw.split(",")) {
            String day = part.trim();
            if (!day.matches("[1-7]")) {
                throw new IllegalArgumentException("노출 요일은 1(월)~7(일) 번호를 쉼표로 구분해야 합니다.");
            }
            days.add(Integer.parseInt(day));
        }
        if (days.size() == 7) {
            return null;
        }
        return String.join(",", days.stream().map(String::valueOf).toList());
    }

    /** {@code HH:mm} → 0~1439분. */
    static int toMinute(String time) {
        if (time == null || !TIME.matcher(time.trim()).matches()) {
            throw new IllegalArgumentException("노출 시간은 HH:mm 형식(00:00~23:59)이어야 합니다.");
        }
        String value = time.trim();
        return Integer.parseInt(value.substring(0, 2)) * 60 + Integer.parseInt(value.substring(3));
    }

    static String toTime(int minute) {
        return String.format("%02d:%02d", minute / 60, minute % 60);
    }
}
