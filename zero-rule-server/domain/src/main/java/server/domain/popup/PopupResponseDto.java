package server.domain.popup;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * 팝업 1건 공용 DTO. 관리자 상세 조회 응답·저장 요청에 쓰고, WPF 단건 조회 응답은 이 DTO를 {@code WpfPopupItem.from}으로 변환해 만든다.
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
        // [TODO52-2] Footer "나중에 보기" 버튼 표시. 요청에 없으면 false
        boolean showLater,
        Long questionTemplateId,
        String periodMode,
        Integer repeatInterval,
        String repeatDayOfWeek,
        Integer repeatDayOfMonth,
        Integer hideDays,
        Double completionRatio,
        Double passingScore,
        // [TODO57] allowCloseBeforeComplete 폐기: 화면 버튼은 completionRatio, 외부 닫기는 useBackgroundOverlay, 연기는 showLater.
        // 구 관리자 웹이 보내는 같은 이름 필드는 알 수 없는 속성으로 무시된다. DB 컬럼(ALLOW_CLOSE_BEFORE_COMPLETE_YN)은 존치·미사용.
        List<PopupQuestionDto> questions,
        Map<String, Object> content
) {
    public PopupResponseDto {
        questions = questions == null ? List.of() : List.copyOf(questions);
        content = content == null ? Map.of() : content;
    }

    /** [TODO55] 문항·콘텐츠만 바꾼 사본(저장 전 서식 정규화용). */
    public PopupResponseDto withQuestionsAndContent(List<PopupQuestionDto> newQuestions, Map<String, Object> newContent) {
        return new PopupResponseDto(popupId, popupType, title, displayStartAt, displayEndAt, displayMode, displayOrder,
                sizeMode, width, height, widthRatio, heightRatio, minimumWidth, minimumHeight, maximumWidth, maximumHeight,
                showHeader, showCloseButton, showFooter, showDoNotShowAgain, showLater, questionTemplateId, periodMode,
                repeatInterval, repeatDayOfWeek, repeatDayOfMonth, hideDays, completionRatio, passingScore,
                newQuestions, newContent);
    }
}
