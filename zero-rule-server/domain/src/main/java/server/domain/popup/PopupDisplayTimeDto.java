package server.domain.popup;

/**
 * POL-11-03 : 시간 경계
 * ■ 노출 시간대 1건
 * - in : startTime·endTime(String, HH:mm, KST)
 * - out: 노출 시간대(record)
 * - 게시 기간 안 노출 시간대 1건(KST, {@code HH:mm}). 시작은 포함, 종료는 미포함이다.
 * 종료가 시작보다 이르면 자정을 넘는 시간대이며 요일은 시작 시각 기준이다. 시작과 종료가 같으면 저장을 거부한다.
 * DB에는 분 단위(0~1439)로 저장한다(POPUP_DISPLAY_TIME). WPF 조회 응답에는 싣지 않는다.
 */
public record PopupDisplayTimeDto(String startTime, String endTime) {
}
