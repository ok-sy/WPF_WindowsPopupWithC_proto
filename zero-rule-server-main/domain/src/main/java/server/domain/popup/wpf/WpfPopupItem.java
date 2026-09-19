package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonFormat;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupResponseDto;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * WPF 목록 API(GET /p/api/wpf/popups)의 팝업 항목.
 *
 * <p>[추가 이유 — 기준 2·3] 기존 {@link PopupResponseDto}와 같은 평면 구조를 유지해 WPF DTO 변경을 최소화하되,
 * WPF에 불필요하거나 노출하면 안 되는 필드를 뺀다.</p>
 * <ul>
 *   <li>제외: {@code questionTemplateId}(서버 내부 키), {@code passingScore}(채점은 서버, 통과 기준 노출 방지)</li>
 *   <li>문항은 최상위 {@code questions}에만 둔다. 기존 응답의 {@code content.questions} 중복 제거</li>
 *   <li>content에서 {@code passingScore}, {@code validateRequiredQuestions}도 제거 (SURVEY/QUIZ 내부 값)</li>
 *   <li>날짜는 ISO 8601 문자열</li>
 * </ul>
 */
public record WpfPopupItem(
        String popupId,
        String popupType,
        String title,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = WpfJson.DATE_TIME) OffsetDateTime displayStartAt,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = WpfJson.DATE_TIME) OffsetDateTime displayEndAt,
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
        Integer hideDays,
        boolean allowCloseBeforeComplete,
        Double completionRatio,
        String periodMode,
        Integer repeatInterval,
        String repeatDayOfWeek,
        Integer repeatDayOfMonth,
        List<PopupQuestionDto> questions,
        Map<String, Object> content
) {
    private static final List<String> CONTENT_KEYS_HIDDEN_FROM_WPF =
            List.of("questions", "passingScore", "validateRequiredQuestions");

    /** 기존 서비스가 만든 공용 DTO(정답 제외 문항 포함)에서 WPF 항목을 만든다. */
    public static WpfPopupItem from(PopupResponseDto dto) {
        Map<String, Object> content = new LinkedHashMap<>(dto.content());
        CONTENT_KEYS_HIDDEN_FROM_WPF.forEach(content::remove);
        return new WpfPopupItem(
                dto.popupId(), dto.popupType(), dto.title(),
                dto.displayStartAt(), dto.displayEndAt(),
                dto.displayMode(), dto.displayOrder(), dto.sizeMode(),
                dto.width(), dto.height(), dto.widthRatio(), dto.heightRatio(),
                dto.minimumWidth(), dto.minimumHeight(), dto.maximumWidth(), dto.maximumHeight(),
                dto.showHeader(), dto.showCloseButton(), dto.showFooter(), dto.showDoNotShowAgain(),
                dto.hideDays(), dto.allowCloseBeforeComplete(), dto.completionRatio(),
                dto.periodMode(), dto.repeatInterval(), dto.repeatDayOfWeek(), dto.repeatDayOfMonth(),
                dto.questions(), content);
    }
}
