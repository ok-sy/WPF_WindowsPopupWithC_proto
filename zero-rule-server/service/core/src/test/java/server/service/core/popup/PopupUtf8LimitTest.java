package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupEntity;
import server.domain.popup.PopupOptionDto;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupQuestionEntity;
import server.domain.popup.PopupSubmissionContext;
import server.domain.popup.PopupSubmitAnswer;
import server.repo.core.mapper.popup.PopupMapper;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * POL-06-02 : 선택·제출
 * ■ UTF-8 바이트 상한 테스트(TODO73-38)
 * - 선택지(QUIZ·SURVEY, 설문은 2026-11-11 확대)는 300 Byte, 주관식 응답(trim 후)은 1000 Byte까지 저장한다. 넘으면 저장 전에 IllegalArgumentException으로 거부한다
 *   (관리자 API는 PopupAdminExceptionHandler, WPF API는 WpfApiExceptionHandler가 400으로 응답).
 * - 문항 제목(CLOB)에는 300 Byte 제한이 없다. 서식 선택지는 서식에서 파생한 일반 문자열로 센다.
 */
class PopupUtf8LimitTest {

    private static String repeat(String s, int n) {
        return s.repeat(n);
    }

    private PopupQuestionDto choice(String first, boolean quiz) {
        var options = List.of(new PopupOptionDto(1L, "1", first, 1, quiz ? Boolean.TRUE : null),
                new PopupOptionDto(2L, "2", "B", 2, quiz ? Boolean.FALSE : null));
        return new PopupQuestionDto(1L, "문항", null, "SINGLE_CHOICE", true, quiz, quiz ? BigDecimal.ONE : null, 1,
                options, null, null, "VERTICAL");
    }

    @Test void utf8LengthCountsBytesNotChars() {
        assertEquals(1, PopupUtf8Limits.utf8Length("a"));
        assertEquals(3, PopupUtf8Limits.utf8Length("가"));
        assertEquals(4, PopupUtf8Limits.utf8Length("😀"));
        assertEquals(0, PopupUtf8Limits.utf8Length(null));
    }

    /** 300 Byte(한글 100자·영문+이모지 경계)는 저장, 301 Byte는 현재 Byte를 담은 메시지로 거부한다. */
    @Test void quizOptionAllowsUpTo300Bytes() {
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(choice(repeat("가", 100), true)), true, 0.0));
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(choice(repeat("a", 296) + "😀", true)), true, 0.0));
        var error = assertThrows(IllegalArgumentException.class,
                () -> PopupQuestionRules.validate(List.of(choice(repeat("가", 100) + "a", true)), true, 0.0));
        assertTrue(error.getMessage().contains("300 Byte") && error.getMessage().contains("301 Byte"), error.getMessage());
        assertThrows(IllegalArgumentException.class,
                () -> PopupQuestionRules.validate(List.of(choice(repeat("a", 297) + "😀", true)), true, 0.0));
    }

    /** 설문 선택지도 같은 컬럼이라 300 Byte까지(2026-11-11). 문항 제목(CLOB)은 300 Byte 제한 대상이 아니다(글자 수 1000자 규칙만). */
    @Test void surveyOptionIsByteLimitedButTitleIsNot() {
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(choice(repeat("가", 100), false)), false, null));
        var error = assertThrows(IllegalArgumentException.class,
                () -> PopupQuestionRules.validate(List.of(choice(repeat("가", 100) + "a", false)), false, null));
        assertTrue(error.getMessage().contains("300 Byte") && error.getMessage().contains("301 Byte"), error.getMessage());
        var surveyTitle = new PopupQuestionDto(1L, repeat("가", 200), null, "SINGLE_CHOICE", true, false, null, 1,
                choice("A", false).options(), null, null, "VERTICAL");
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(surveyTitle), false, null));
        var longTitle = new PopupQuestionDto(1L, repeat("가", 200), null, "SINGLE_CHOICE", true, true, BigDecimal.ONE, 1,
                choice("A", true).options(), null, null, "VERTICAL");
        assertDoesNotThrow(() -> PopupQuestionRules.validate(List.of(longTitle), true, 0.0));
    }

    /** 서식 선택지는 서식에서 파생한 일반 문자열(OPTION_TEXT 저장값)로 센다. */
    @Test void richQuizOptionIsCheckedOnDerivedPlainText() {
        List<Object> blocks = List.of(Map.of("alignment", "LEFT", "runs", List.of(Map.of("text", repeat("가", 101), "bold", true))));
        var rich = new PopupQuestionDto(1L, "문항", null, "SINGLE_CHOICE", true, true, BigDecimal.ONE, 1,
                List.of(new PopupOptionDto(1L, "1", "짧음", 1, true, blocks), new PopupOptionDto(2L, "2", "B", 2, false)),
                null, null, "VERTICAL");
        var normalized = PopupSurveyRichText.normalizeQuestion(rich);
        assertEquals(repeat("가", 101), normalized.options().get(0).text());
        assertThrows(IllegalArgumentException.class, () -> PopupQuestionRules.validate(List.of(normalized), true, 0.0));
    }

    // ---------- 주관식 응답 ----------

    private PopupMapper mapper;
    private PopupService service;

    private void textQuestion(String popupType) {
        mapper = mock(PopupMapper.class);
        service = new PopupService(mapper, new ObjectMapper());
        PopupEntity popup = mock(PopupEntity.class);
        when(popup.popupId()).thenReturn("Q1");
        when(mapper.selectAvailablePopups("E1001")).thenReturn(List.of(popup));
        when(mapper.selectSubmissionContext("E1001", "Q1", true))
                .thenReturn(new PopupSubmissionContext("Q1", popupType, 20L, "QUIZ".equals(popupType) ? BigDecimal.ONE : null));
        when(mapper.selectQuestionsByTemplateIds(List.of(20L))).thenReturn(List.of(new PopupQuestionEntity(
                1L, 20L, "TEXT", "의견", null, "Y", "QUIZ".equals(popupType) ? "Y" : "N", BigDecimal.ONE, 1, "정답", "EXACT", "VERTICAL")));
        when(mapper.selectOptionsByQuestionIds(List.of(1L))).thenReturn(List.of());
        when(mapper.upsertPopupResponse(any(), any(), any(), any(), any(), any())).thenReturn(5001L);
        when(mapper.insertResponseAnswer(any(), any(), any(), any(), any(), any())).thenReturn(7001L);
    }

    /** 1000 Byte는 그대로 저장, 1001 Byte는 저장 전에 거부한다(SURVEY·QUIZ 공통). */
    @Test void textAnswerAllowsUpTo1000Bytes() {
        for (String type : List.of("SURVEY", "QUIZ")) {
            textQuestion(type);
            String ok = repeat("가", 333) + "a";
            Double score = "QUIZ".equals(type) ? 1.0 : null;
            Boolean passed = "QUIZ".equals(type) ? Boolean.TRUE : null;
            assertDoesNotThrow(() -> service.submitResponse("Q1", "r-1", "E1001", List.of(new PopupSubmitAnswer(1L, ok, List.of())), score, passed));
            verify(mapper).insertResponseAnswer(5001L, 1L, ok, null, null, "E1001");

            textQuestion(type);
            var error = assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001",
                    List.of(new PopupSubmitAnswer(1L, ok + "b", List.of())), score, passed));
            assertTrue(error.getMessage().contains("1000 Byte") && error.getMessage().contains("1001 Byte"), error.getMessage());
            verify(mapper, never()).upsertPopupResponse(any(), any(), any(), any(), any(), any());
        }
    }

    /** 저장값은 앞뒤 공백을 뺀 값이므로 바이트도 trim 후로 센다(WPF도 Trim 후 전송). */
    @Test void textAnswerBytesAreCountedAfterTrim() {
        textQuestion("SURVEY");
        String padded = "  " + repeat("a", 1000) + "  ";
        assertDoesNotThrow(() -> service.submitResponse("Q1", "r-1", "E1001", List.of(new PopupSubmitAnswer(1L, padded, List.of())), null, null));
        verify(mapper).insertResponseAnswer(5001L, 1L, repeat("a", 1000), null, null, "E1001");
    }
}
