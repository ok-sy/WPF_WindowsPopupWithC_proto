package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupEntity;
import server.domain.popup.PopupOptionEntity;
import server.domain.popup.PopupQuestionEntity;
import server.domain.popup.PopupSubmissionContext;
import server.domain.popup.PopupSubmitAnswer;
import server.repo.core.mapper.popup.PopupMapper;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** [설계 33] QUIZ 제출은 WPF가 판정한 score/passed를 저장·완료 판정에 쓰고, SURVEY는 기존 저장을 유지한다. */
class PopupSubmitScoreTest {
    private PopupMapper mapper;
    private PopupService service;
    private final List<PopupSubmitAnswer> answers = List.of(new PopupSubmitAnswer(1L, null, List.of(10L)));

    @BeforeEach void setup() {
        mapper = mock(PopupMapper.class);
        service = new PopupService(mapper, new ObjectMapper());
        PopupEntity popup = mock(PopupEntity.class);
        when(popup.popupId()).thenReturn("Q1");
        when(mapper.selectAvailablePopups("E1001")).thenReturn(List.of(popup));
        when(mapper.selectQuestionsByTemplateIds(List.of(20L))).thenReturn(List.of(new PopupQuestionEntity(
                1L, 20L, "SINGLE_CHOICE", "문항", null, "Y", "Y", BigDecimal.TEN, 1, null, null, "VERTICAL")));
        when(mapper.selectOptionsByQuestionIds(List.of(1L))).thenReturn(List.of(
                new PopupOptionEntity(10L, 1L, "A", "정답", "Y", 1),
                new PopupOptionEntity(11L, 1L, "B", "오답", "N", 2)));
        when(mapper.upsertPopupResponse(any(), any(), any(), any(), any(), any())).thenReturn(5001L);
        when(mapper.insertResponseAnswer(any(), any(), any(), any(), any(), any())).thenReturn(7001L);
    }

    private void context(String type, BigDecimal passingScore) {
        when(mapper.selectSubmissionContext("E1001", "Q1"))
                .thenReturn(new PopupSubmissionContext("Q1", type, 20L, passingScore));
    }

    @Test void quizStoresWpfScoreAndPassedEvenWhenServerCalculationDiffers() {
        context("QUIZ", BigDecimal.TEN);
        // 서버 계산은 10점·통과지만 WPF 판정(4점·불합격)을 그대로 저장한다(불일치는 로그만).
        var result = service.submitResponse("Q1", "r-1", "E1001", answers, 4.0, false);
        assertEquals(4.0, result.totalScore());
        assertFalse(result.passed());
        verify(mapper).upsertPopupResponse("r-1", "E1001", "Q1", 20L, new BigDecimal("4.00"), "N");
        verify(mapper).markPopupCompleted("E1001", "Q1", "N");
    }

    @Test void quizWithoutWpfScoreIsRejectedBeforeSave() {
        context("QUIZ", BigDecimal.TEN);
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001", answers, null, true));
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001", answers, 10.0, null));
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001", answers, -1.0, true));
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001", answers, Double.NaN, true));
        verify(mapper, never()).upsertPopupResponse(any(), any(), any(), any(), any(), any());
    }

    @Test void surveyIgnoresClientValuesAndCompletesAsBefore() {
        context("SURVEY", null);
        var result = service.submitResponse("Q1", "r-1", "E1001", answers, 99.0, false);
        assertTrue(result.passed());
        verify(mapper).upsertPopupResponse(eq("r-1"), eq("E1001"), eq("Q1"), eq(20L), any(), eq("Y"));
        verify(mapper).markPopupCompleted("E1001", "Q1", "Y");
    }
}
