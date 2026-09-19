package server.domain.popup;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/** 기존 WPF 계약을 유지하는 팝업 목록 응답 DTO다. */
public record PopupResponseDto(
        String popupId,
        String popupType,
        String title,
        OffsetDateTime displayStartAt,
        OffsetDateTime displayEndAt,
        String displayMode,
        Integer displayOrder,
        String sizeMode,
        double width,
        double height,
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
