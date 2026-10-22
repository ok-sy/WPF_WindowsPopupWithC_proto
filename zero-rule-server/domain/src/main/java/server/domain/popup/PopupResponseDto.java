package server.domain.popup;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * POL-07-03 : 저장 경계
 * POL-01-01 : 공통 옵션의 위치
 * ■ 팝업 1건 공용 DTO
 * - in : 팝업 기본·기간·크기·표시 옵션·반복·완료 기준·문항·content·노출 시간대
 * - out: 팝업(record). questions·content·displayTimes는 null이면 빈 값으로 바꾼다
 * - 팝업 1건 공용 DTO. 관리자 상세 조회 응답·저장 요청에 쓰고, WPF 단건 조회 응답은 이 DTO를 {@code WpfPopupItem.from}으로 변환해 만든다.
 */
public record PopupResponseDto(
        String popupId,
        String popupType,
        String title,
        OffsetDateTime displayStartAt,
        OffsetDateTime displayEndAt,
        String displayMode,
        Integer displayOrder,
        String sizeMode,
        @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL) Double width,
        @com.fasterxml.jackson.annotation.JsonInclude(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL) Double height,
        double widthRatio,
        double heightRatio,
        double minimumWidth,
        double minimumHeight,
        double maximumWidth,
        double maximumHeight,
        boolean showHeader,
        boolean showCloseButton,
        boolean showFooter,
        boolean showDoNotShowAgain,
        // POL-02-03 : 푸터 역할 — Footer "나중에 보기" 버튼 표시. 요청에 없으면 false
        boolean showLater,
        Long questionTemplateId,
        String periodMode,
        Integer repeatInterval,
        String repeatDayOfWeek,
        Integer repeatDayOfMonth,
        Integer hideDays,
        Double completionRatio,
        Double passingScore,
        // POL-02-02 : 종료 제어 — allowCloseBeforeComplete는 쓰지 않는다: 화면 버튼은 completionRatio, 외부 닫기는 useBackgroundOverlay, 연기는 showLater.
        // 구 관리자 웹이 보내는 같은 이름 필드는 알 수 없는 속성으로 무시된다. DB 컬럼(ALLOW_CLOSE_BEFORE_COMPLETE_YN)은 존치·미사용.
        List<PopupQuestionDto> questions,
        Map<String, Object> content,
        // POL-11-03 : 시간 경계 — PERIOD_MODE=SCHEDULE의 노출 시간대(없으면 하루 종일). 관리자 상세·저장에만 쓰며 WPF 응답(WpfPopupItem)에는 없다.
        List<PopupDisplayTimeDto> displayTimes
) {
    public PopupResponseDto {
        questions = questions == null ? List.of() : List.copyOf(questions);
        content = content == null ? Map.of() : content;
        displayTimes = displayTimes == null ? List.of() : List.copyOf(displayTimes);
    }

    /** POL-11-03 : 시간 경계 — 노출 시간대 도입 전 생성자. 시간대 없음(빈 목록)으로 만든다. */
    public PopupResponseDto(String popupId, String popupType, String title, OffsetDateTime displayStartAt,
            OffsetDateTime displayEndAt, String displayMode, Integer displayOrder, String sizeMode, Double width,
            Double height, double widthRatio, double heightRatio, double minimumWidth, double minimumHeight,
            double maximumWidth, double maximumHeight, boolean showHeader, boolean showCloseButton, boolean showFooter,
            boolean showDoNotShowAgain, boolean showLater, Long questionTemplateId, String periodMode,
            Integer repeatInterval, String repeatDayOfWeek, Integer repeatDayOfMonth, Integer hideDays,
            Double completionRatio, Double passingScore, List<PopupQuestionDto> questions, Map<String, Object> content) {
        this(popupId, popupType, title, displayStartAt, displayEndAt, displayMode, displayOrder, sizeMode, width, height,
                widthRatio, heightRatio, minimumWidth, minimumHeight, maximumWidth, maximumHeight, showHeader,
                showCloseButton, showFooter, showDoNotShowAgain, showLater, questionTemplateId, periodMode,
                repeatInterval, repeatDayOfWeek, repeatDayOfMonth, hideDays, completionRatio, passingScore,
                questions, content, List.of());
    }

    /** POL-06-01 : 문항·서식 — 문항·콘텐츠만 바꾼 사본(저장 전 서식 정규화용). */
    public PopupResponseDto withQuestionsAndContent(List<PopupQuestionDto> newQuestions, Map<String, Object> newContent) {
        return new PopupResponseDto(popupId, popupType, title, displayStartAt, displayEndAt, displayMode, displayOrder,
                sizeMode, width, height, widthRatio, heightRatio, minimumWidth, minimumHeight, maximumWidth, maximumHeight,
                showHeader, showCloseButton, showFooter, showDoNotShowAgain, showLater, questionTemplateId, periodMode,
                repeatInterval, repeatDayOfWeek, repeatDayOfMonth, hideDays, completionRatio, passingScore,
                newQuestions, newContent, displayTimes);
    }

    /** POL-11-03 : 시간 경계 — 기간 모드·요일·시간대만 바꾼 사본(저장 전 일정 정규화·조회 시 시간대 첨부용). 매월·간격 반복 값은 비운다. */
    public PopupResponseDto withSchedule(String newPeriodMode, String newRepeatDayOfWeek, List<PopupDisplayTimeDto> newDisplayTimes) {
        return new PopupResponseDto(popupId, popupType, title, displayStartAt, displayEndAt, displayMode, displayOrder,
                sizeMode, width, height, widthRatio, heightRatio, minimumWidth, minimumHeight, maximumWidth, maximumHeight,
                showHeader, showCloseButton, showFooter, showDoNotShowAgain, showLater, questionTemplateId, newPeriodMode,
                null, newRepeatDayOfWeek, null, hideDays, completionRatio, passingScore,
                questions, content, newDisplayTimes);
    }
}
