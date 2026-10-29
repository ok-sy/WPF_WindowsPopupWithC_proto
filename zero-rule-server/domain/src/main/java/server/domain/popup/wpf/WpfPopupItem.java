package server.domain.popup.wpf;

import com.fasterxml.jackson.annotation.JsonInclude;
import server.domain.popup.PopupFooterAction;
import server.domain.popup.PopupOptionDto;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupResponseDto;
import server.domain.popup.PopupWindowOptions;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * POL-09-02 : 조회 응답
 * POL-01-01 : 공통 옵션의 위치
 * ■ WPF 조회 응답 popup 항목(1건)
 * - in : 공용 DTO(PopupResponseDto)에서 변환한 표시 값·공통 옵션·문항·content
 * - out: WPF 조회 API(POST /p/api/wpf/popups)의 응답 popup 항목 JSON(값 없는 필드 생략)
 *
 * <p>추가 이유: 노출 판단은 서버가 끝내고 WPF는 단순한 계약만 받도록, 기존 {@link PopupResponseDto}와 같은 평면 구조를 유지해 WPF DTO 변경을 최소화하되,
 * WPF에 불필요하거나 노출하면 안 되는 필드를 뺀다.</p>
 * <ul>
 *   <li>제외: {@code questionTemplateId}(서버 내부 키)</li>
 *   <li>POL-11-01 : 노출 판단 소유 — 제외: 노출 기간·반복 판정 값({@code displayStartAt}/{@code displayEndAt}/{@code periodMode}/
 *       {@code repeatInterval}/{@code repeatDayOfWeek}/{@code repeatDayOfMonth}). 노출 판정은 서버가 끝내고
 *       최종 목록만 내려주므로 WPF 계약에 두지 않는다. 관리자 API({@link PopupResponseDto})에는 그대로 있다.</li>
 *   <li>POL-02-03 : 푸터 역할 — Footer 버튼 표시는 {@code showFooterButton} 하나로 내려준다(관리자 API·DB의 showCloseButton 값).</li>
 *   <li>POL-02-03 : 푸터 역할 — Footer 동작은 content가 아니라 최상위 {@code footerAction}(CLOSE / LINK_AND_CLOSE / SUBMIT)과
 *       {@code footerLinkUrl}(LINK_AND_CLOSE일 때만)로 내려준다. SURVEY/QUIZ는 저장 값과 무관하게 SUBMIT이다.
 *       content에서는 두 키를 뺀다({@link PopupFooterAction}).</li>
 *   <li>POL-01-01 : 공통 옵션의 위치 — PopupWindow 공통 UI 옵션(useBackgroundOverlay·backgroundOverlayOpacity·popupPosition·
 *       header/body/footerFontSize)도 content가 아니라 최상위로 내려준다. Overlay·위치는 기본값을 채워 항상 보내고
 *       폰트 크기는 설정된 경우만 보낸다. content에서는 해당 키를 뺀다({@link PopupWindowOptions}).</li>
 *   <li>POL-01-01 : 공통 옵션의 위치 — 문항은 최상위 {@code questions}에만 둔다. content에 문항·통과 점수·완료 비율 등 파생 키를
 *       싣지 않는 것은 PopupContentAssembler가 보장하므로 여기서 따로 제거하지 않는다.</li>
 *   <li>POL-10-01 : 전달과 제출 식별 — 단건 순차 전달: 조회 API가 발급한 전달 건 ID {@code deliveryId}를 맨 앞에 둔다(결과 수신 시 그대로 반환).
 *       표시 순서는 서버가 정해 1건씩 내려주므로 {@code displayOrder}는 WPF 계약에서 뺐다.</li>
 *   <li>POL-02-03 : 푸터 역할 — {@code showLater}: Footer "나중에 보기" 버튼 표시(기본 false). 누르면 결과 LATER(완료 없이 다음 조회 주기까지 유예).</li>
 * </ul>
 *
 * <p>POL-06-02 : 선택·제출 — QUIZ 점수·통과 판정은 WPF 로컬 책임이다(예전에는 서버 채점이라 내려주지 않았다).
 * 그래서 <b>QUIZ 팝업에 한해</b> 최상위 {@code passingScore}와
 * 문항 정답 키(options[].isCorrect / correctAnswer / answerMatchMode)를 포함한다. QUIZ가 아니면 둘 다 없다(null → 생략).</p>
 */
// POL-09-02 : 조회 응답 — 값 없는 필드는 생략한다. 전역 ObjectMapper 설정(BasicConfig NON_NULL)과 무관하게 WPF 계약을 고정한다.
@JsonInclude(JsonInclude.Include.NON_NULL)
public record WpfPopupItem(
        String deliveryId,
        String popupId,
        String popupType,
        String title,
        String displayMode,
        String sizeMode,
        Double width,
        Double height,
        double widthRatio,
        double heightRatio,
        double minimumWidth,
        double minimumHeight,
        double maximumWidth,
        double maximumHeight,
        boolean showHeader,
        boolean showFooterButton,
        boolean showFooter,
        String footerAction,
        String footerLinkUrl,
        boolean useBackgroundOverlay,
        double backgroundOverlayOpacity,
        String popupPosition,
        Double headerFontSize,
        Double bodyFontSize,
        Double footerFontSize,
        boolean showDoNotShowAgain,
        boolean showLater,
        Integer hideDays,
        Double completionRatio,
        Double passingScore,
        List<PopupQuestionDto> questions,
        Map<String, Object> content
) {
    /**
     * POL-09-02 : 조회 응답
     * ■ 공용 DTO → WPF 항목 변환
     * - in : dto(PopupResponseDto) 공용 팝업 · includeGradingInfo(boolean) QUIZ 채점 정보 포함 여부
     * - out: WpfPopupItem(deliveryId 없음). footer·공통 UI 옵션은 최상위로 옮기고 content에서 뺀다
     *
     * @param includeGradingInfo POL-06-02 : 선택·제출 — true(QUIZ)면 최상위 passingScore를 포함한다. 문항의 정답 키 포함 여부는
     *                           호출자가 넘긴 {@code dto.questions()}에 이미 반영되어 있다({@link #withoutAnswerKey}).
     */
    public static WpfPopupItem from(PopupResponseDto dto, boolean includeGradingInfo) {
        Map<String, Object> content = new LinkedHashMap<>(dto.content());
        String footerAction = PopupFooterAction.effective(dto.popupType(), content.get(PopupFooterAction.ACTION_KEY));
        String footerLinkUrl = PopupFooterAction.effectiveLink(dto.popupType(), content);
        content.remove(PopupFooterAction.ACTION_KEY);
        content.remove(PopupFooterAction.LINK_KEY);
        boolean useOverlay = PopupWindowOptions.useBackgroundOverlay(content);
        double overlayOpacity = PopupWindowOptions.backgroundOverlayOpacity(content);
        String position = PopupWindowOptions.popupPosition(content);
        Double headerFontSize = PopupWindowOptions.fontSize(content, PopupWindowOptions.HEADER_FONT_SIZE_KEY);
        Double bodyFontSize = PopupWindowOptions.fontSize(content, PopupWindowOptions.BODY_FONT_SIZE_KEY);
        Double footerFontSize = PopupWindowOptions.fontSize(content, PopupWindowOptions.FOOTER_FONT_SIZE_KEY);
        PopupWindowOptions.KEYS.forEach(content::remove);
        return new WpfPopupItem(
                null, dto.popupId(), dto.popupType(), dto.title(),
                dto.displayMode(), dto.sizeMode(),
                dto.width(), dto.height(), dto.widthRatio(), dto.heightRatio(),
                dto.minimumWidth(), dto.minimumHeight(), dto.maximumWidth(), dto.maximumHeight(),
                dto.showHeader(), dto.showCloseButton(), dto.showFooter(), footerAction, footerLinkUrl,
                useOverlay, overlayOpacity, position, headerFontSize, bodyFontSize, footerFontSize,
                dto.showDoNotShowAgain(), dto.showLater(),
                dto.hideDays(), dto.completionRatio(),
                includeGradingInfo ? dto.passingScore() : null,
                dto.questions(), content);
    }

    /** POL-10-01 : 전달과 제출 식별 — 조회 API가 정한 전달 건 ID를 붙인 사본. */
    public WpfPopupItem withDeliveryId(String id) {
        return new WpfPopupItem(id, popupId, popupType, title, displayMode, sizeMode, width, height,
                widthRatio, heightRatio, minimumWidth, minimumHeight, maximumWidth, maximumHeight,
                showHeader, showFooterButton, showFooter, footerAction, footerLinkUrl,
                useBackgroundOverlay, backgroundOverlayOpacity, popupPosition, headerFontSize, bodyFontSize, footerFontSize,
                showDoNotShowAgain, showLater, hideDays, completionRatio, passingScore, questions, content);
    }

    /**
     * POL-06-02 : 선택·제출
     * ■ 문항 정답 키 제거
     * - in : questions(List<PopupQuestionDto>) 정답 키가 포함된 문항(null 허용)
     * - out: 정답 정보를 null로 비운 문항 목록(입력이 비면 빈 목록)
     * - 정답 키가 포함된 문항 목록에서 정답 정보(isCorrect / correctAnswer / answerMatchMode)를 제거한다.
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
                                        option.optionId(), option.value(), option.text(), option.sortOrder(), null,
                                        option.textBlocks()))
                                .toList(),
                        null, null, question.optionLayout(), question.titleBlocks(), question.descriptionBlocks(),
                        question.minSelections(), question.maxSelections()))
                .toList();
    }
}
