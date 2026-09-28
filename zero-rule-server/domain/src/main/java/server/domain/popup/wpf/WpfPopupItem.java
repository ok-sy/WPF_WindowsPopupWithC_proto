package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import server.domain.popup.PopupOptionDto;
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
 *   <li>제외: {@code questionTemplateId}(서버 내부 키)</li>
 *   <li>문항은 최상위 {@code questions}에만 둔다. [설계 18 L-3] content에 문항·통과 점수·완료 비율 등 파생 키를
 *       싣지 않는 것은 PopupContentAssembler가 보장하므로 여기서 따로 제거하지 않는다.</li>
 *   <li>날짜는 ISO 8601 문자열</li>
 * </ul>
 *
 * <p>[설계 12 §4 — 변경] 기준 3에서는 채점이 서버 책임이라 {@code passingScore}와 정답 키를 WPF에 내려주지 않았다.
 * 설계 12로 QUIZ 점수·통과 판정이 WPF 로컬 책임이 되어, <b>QUIZ 팝업에 한해</b> 최상위 {@code passingScore}와
 * 문항 정답 키(options[].isCorrect / correctAnswer / answerMatchMode)를 포함한다. QUIZ가 아니면 둘 다 없다(null → 생략).</p>
 */
// [기준 3] 값 없는 필드는 생략한다. 전역 ObjectMapper 설정(BasicConfig NON_NULL)과 무관하게 WPF 계약을 고정한다.
@JsonInclude(JsonInclude.Include.NON_NULL)
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
        Double passingScore,
        String periodMode,
        Integer repeatInterval,
        String repeatDayOfWeek,
        Integer repeatDayOfMonth,
        List<PopupQuestionDto> questions,
        Map<String, Object> content
) {
    /**
     * 공용 DTO에서 WPF 항목을 만든다. [설계 18 L-0] 호출자가 없던 1인자 오버로드 from(dto)는 삭제했다.
     *
     * @param includeGradingInfo [설계 12] true(QUIZ)면 최상위 passingScore를 포함한다. 문항의 정답 키 포함 여부는
     *                           호출자가 넘긴 {@code dto.questions()}에 이미 반영되어 있다({@link #withoutAnswerKey}).
     */
    public static WpfPopupItem from(PopupResponseDto dto, boolean includeGradingInfo) {
        Map<String, Object> content = new LinkedHashMap<>(dto.content());
        return new WpfPopupItem(
                dto.popupId(), dto.popupType(), dto.title(),
                dto.displayStartAt(), dto.displayEndAt(),
                dto.displayMode(), dto.displayOrder(), dto.sizeMode(),
                dto.width(), dto.height(), dto.widthRatio(), dto.heightRatio(),
                dto.minimumWidth(), dto.minimumHeight(), dto.maximumWidth(), dto.maximumHeight(),
                dto.showHeader(), dto.showCloseButton(), dto.showFooter(), dto.showDoNotShowAgain(),
                dto.hideDays(), dto.allowCloseBeforeComplete(), dto.completionRatio(),
                includeGradingInfo ? dto.passingScore() : null,
                dto.periodMode(), dto.repeatInterval(), dto.repeatDayOfWeek(), dto.repeatDayOfMonth(),
                dto.questions(), content);
    }

    /**
     * [설계 12] 정답 키가 포함된 문항 목록에서 정답 정보(isCorrect / correctAnswer / answerMatchMode)를 제거한다.
     * QUIZ가 아닌 팝업(SURVEY)에 정답이 새어 나가지 않도록 WpfPopupService가 사용한다.
     */
    public static List<PopupQuestionDto> withoutAnswerKey(List<PopupQuestionDto> questions) {
        if (questions == null || questions.isEmpty()) {
            return List.of();
        }
        return questions.stream()
                .map(question -> new PopupQuestionDto(
                        question.questionId(), question.title(), question.description(), question.questionType(),
                        question.isRequired(), question.isScored(), question.questionScore(), question.sortOrder(),
                        question.options().stream()
                                .map(option -> new PopupOptionDto(
                                        option.optionId(), option.value(), option.text(), option.sortOrder(), null))
                                .toList(),
                        null, null, question.optionLayout()))
                .toList();
    }
}
