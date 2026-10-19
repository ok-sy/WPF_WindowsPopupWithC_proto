package server.service.core.popup;

import server.domain.popup.PopupOptionDto;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupResponseDto;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * [TODO55-4] SURVEY·QUIZ 서식(FONT EDIT) 필드의 저장 전 검증과 일반 문자열 파생.
 *
 * <p>필드(55-1 계약): 콘텐츠 {@code surveyTitleBlocks}·{@code descriptionBlocks}, 문항 {@code titleBlocks}·
 * {@code descriptionBlocks}, 선택지 {@code textBlocks}. 구조와 허용 값은 TEXT 본문({@link PopupRichText})과 같다.</p>
 *
 * <ul>
 *   <li>서식이 있으면 일반 문자열(surveyTitle·description·title·text)은 요청 값이 아니라 서식에서 파생한다(독립 편집 금지).</li>
 *   <li>{@code null}·빈 배열·글자가 하나도 없는 문단만 있으면 서식 없음으로 보고 서식을 지운 뒤 요청의 일반 문자열을 그대로 쓴다.</li>
 *   <li>파생 문자열 길이는 필드별 저장 상한(아래 상수)을 따른다. 빈 값 허용 여부는 기존 규칙(PopupQuestionRules 등)이 판단한다.</li>
 *   <li>서식 필드는 SURVEY·QUIZ에서만 받는다. 다른 유형의 콘텐츠 서식 키는 거부한다(TEXT는 textBlocks만 사용).</li>
 * </ul>
 * 정규화 결과는 문항 템플릿 재사용 비교(saveAdminQuestions)에도 그대로 쓰이므로 저장·재조회 값과 같은 형태여야 한다.
 */
final class PopupSurveyRichText {

    static final String SURVEY_TITLE_BLOCKS = "surveyTitleBlocks";
    static final String DESCRIPTION_BLOCKS = "descriptionBlocks";
    static final int SURVEY_TITLE_MAX = 200;
    static final int DESCRIPTION_MAX = 2000;
    static final int QUESTION_TITLE_MAX = 1000;
    static final int QUESTION_DESCRIPTION_MAX = 2000;
    static final int OPTION_TEXT_MAX = 1000;
    private static final Set<String> SURVEY_TYPES = Set.of("SURVEY", "QUIZ");

    private PopupSurveyRichText() {
    }

    /** 요청 팝업의 콘텐츠·문항 서식을 검증하고 일반 문자열을 서식에서 파생한 사본을 돌려준다. */
    static PopupResponseDto normalize(PopupResponseDto popup) {
        if (popup == null) {
            return null;
        }
        String type = popup.popupType() == null ? "" : popup.popupType().trim().toUpperCase(java.util.Locale.ROOT);
        Map<String, Object> content = popup.content();
        boolean survey = SURVEY_TYPES.contains(type);
        if (!survey) {
            for (String key : List.of(SURVEY_TITLE_BLOCKS, DESCRIPTION_BLOCKS)) {
                if (content.get(key) != null) {
                    throw new IllegalArgumentException("서식(" + key + ")은 SURVEY·QUIZ 팝업에서만 사용할 수 있습니다.");
                }
            }
            return popup;
        }
        Map<String, Object> normalized = new LinkedHashMap<>(content);
        applyContentField(normalized, SURVEY_TITLE_BLOCKS, "surveyTitle", "콘텐츠 제목", SURVEY_TITLE_MAX);
        applyContentField(normalized, DESCRIPTION_BLOCKS, "description", "콘텐츠 설명", DESCRIPTION_MAX);
        List<PopupQuestionDto> questions = popup.questions().stream()
                .map(PopupSurveyRichText::normalizeQuestion)
                .toList();
        return popup.withQuestionsAndContent(questions, normalized);
    }

    static PopupQuestionDto normalizeQuestion(PopupQuestionDto question) {
        if (question == null) {
            return null;
        }
        Field title = field(question.titleBlocks(), question.title(), "문항 제목", QUESTION_TITLE_MAX);
        Field description = field(question.descriptionBlocks(), question.description(), "문항 설명", QUESTION_DESCRIPTION_MAX);
        List<PopupOptionDto> options = question.options().stream()
                .map(option -> {
                    if (option == null) {
                        return null;
                    }
                    Field text = field(option.textBlocks(), option.text(), "선택지 내용", OPTION_TEXT_MAX);
                    return new PopupOptionDto(option.optionId(), option.value(), text.plain(), option.sortOrder(),
                            option.isCorrect(), text.blocks());
                })
                .toList();
        return new PopupQuestionDto(question.questionId(), title.plain(), description.plain(), question.questionType(),
                question.isRequired(), question.isScored(), question.questionScore(), question.sortOrder(), options,
                question.correctAnswer(), question.answerMatchMode(), question.optionLayout(),
                title.blocks(), description.blocks());
    }

    private static void applyContentField(Map<String, Object> content, String key, String plainKey, String label, int max) {
        Object plainValue = content.get(plainKey);
        Field field = field(content.get(key), plainValue == null ? null : String.valueOf(plainValue), label, max);
        if (field.blocks() == null) {
            content.remove(key);
        } else {
            content.put(key, field.blocks());
            content.put(plainKey, field.plain());
        }
    }

    /** 서식과 일반 문자열 한 쌍. blocks가 null이면 서식 없음이다. */
    private record Field(List<Object> blocks, String plain) {
    }

    private static Field field(Object blocks, String plain, String label, int max) {
        String derived;
        try {
            derived = PopupRichText.validateAndDerivePlainText(blocks);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(label + " 서식: " + e.getMessage(), e);
        }
        if (derived == null || !hasText(blocks)) {
            return new Field(null, plain);
        }
        if (derived.length() > max) {
            throw new IllegalArgumentException(label + "은(는) " + max + "자 이하여야 합니다.");
        }
        @SuppressWarnings("unchecked")
        List<Object> list = (List<Object>) blocks;
        return new Field(list, derived);
    }

    /** 문단 중 하나라도 구간(글자)이 있어야 서식으로 본다. 빈 문단만 있으면 서식 없음이다. */
    private static boolean hasText(Object blocks) {
        if (!(blocks instanceof List<?> list)) {
            return false;
        }
        for (Object block : list) {
            if (block instanceof Map<?, ?> map && map.get("runs") instanceof List<?> runs && !runs.isEmpty()) {
                return true;
            }
        }
        return false;
    }
}
