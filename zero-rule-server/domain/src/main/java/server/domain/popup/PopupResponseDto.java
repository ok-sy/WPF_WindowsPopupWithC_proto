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
        Long questionTemplateId,
        String periodMode,
        Integer repeatInterval,
        String repeatDayOfWeek,
        Integer repeatDayOfMonth,
        Integer hideDays,
        Double completionRatio,
        Double passingScore,
        boolean allowCloseBeforeComplete,
        List<PopupQuestionDto> questions,
        Map<String, Object> content
) {
    public PopupResponseDto {
        questions = questions == null ? List.of() : List.copyOf(questions);
        content = content == null ? Map.of() : content;
    }
}
