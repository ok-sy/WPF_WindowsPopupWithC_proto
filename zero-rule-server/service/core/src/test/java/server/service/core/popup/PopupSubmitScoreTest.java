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

/**
 * POL-06-02 : 선택·제출
 * ■ QUIZ·SURVEY 제출 점수 저장 테스트
 * - QUIZ 제출은 WPF가 판정한 score/passed를 그대로 저장하고 서버는 재채점하지 않는다(PU001 B-1). SURVEY는 0점·통과로 완료한다.
 * - 유효한 제출은 채점 합불과 관계없이 완료한다(PU001 §7). 참여형 기준 미달도 PASSED_YN='N'으로 저장하고 COMPLETED다.
 */
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
        when(mapper.selectSubmissionContext("E1001", "Q1", true))
                .thenReturn(new PopupSubmissionContext("Q1", type, 20L, passingScore));
    }

    /** 정답을 골라도 QUIZ는 WPF score/passed만 저장하고, 문항별 점수·정오답은 null로 저장한다. 불합격 값이어도 완료다. */
    @Test void quizStoresWpfScoreAndPassedWithoutServerGrading() {
        context("QUIZ", BigDecimal.TEN);
        // 정답 선택지(10)를 골랐지만 서버는 채점하지 않으므로 WPF 판정(4점·불합격)이 그대로 저장된다.
        var result = service.submitResponse("Q1", "r-1", "E1001", answers, 4.0, false);
        assertEquals(4.0, result.totalScore());
        assertFalse(result.passed());
        verify(mapper).upsertPopupResponse("r-1", "E1001", "Q1", 20L, new BigDecimal("4.00"), "N");
        verify(mapper).insertResponseAnswer(5001L, 1L, null, null, null, "E1001");
        verify(mapper).insertResponseValue(7001L, 10L, "A", "E1001");
        verify(mapper).markPopupCompleted("E1001", "Q1", "Y");
    }

    /** 참여형 기준 5점에서 3점: score 3·passed false를 그대로 저장하고 완료(COMPLETED) 처리한다(PU001 §7 검증 항목). */
    @Test void participationBelowThresholdStoresFailedScoreAndCompletes() {
        context("QUIZ", new BigDecimal("5"));
        var result = service.submitResponse("Q1", "r-1", "E1001", answers, 3.0, false);
        assertEquals(3.0, result.totalScore());
        assertFalse(result.passed());
        verify(mapper).upsertPopupResponse("r-1", "E1001", "Q1", 20L, new BigDecimal("3.00"), "N");
        verify(mapper).markPopupCompleted("E1001", "Q1", "Y");
        verify(mapper, never()).markPopupCompleted(any(), any(), eq("N"));
    }

    /** 컷트라인형 합격 제출은 PASSED_YN='Y'로 저장하고 완료한다. */
    @Test void cutoffPassedStoresPassedAndCompletes() {
        context("QUIZ", new BigDecimal("5"));
        var result = service.submitResponse("Q1", "r-1", "E1001", answers, 7.0, true);
        assertTrue(result.passed());
        verify(mapper).upsertPopupResponse("r-1", "E1001", "Q1", 20L, new BigDecimal("7.00"), "Y");
        verify(mapper).markPopupCompleted("E1001", "Q1", "Y");
    }

    /** 재채점을 없애도 답안 형식 검증(문항에 없는 선택지·단일 선택 복수 응답·선택형 textAnswer)은 유지한다. */
    @Test void answerFormatValidationIsKeptWithoutGrading() {
        context("QUIZ", BigDecimal.TEN);
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001",
                List.of(new PopupSubmitAnswer(1L, null, List.of(99L))), 10.0, true));
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001",
                List.of(new PopupSubmitAnswer(1L, null, List.of(10L, 11L))), 10.0, true));
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001",
                List.of(new PopupSubmitAnswer(1L, "텍스트", List.of(10L))), 10.0, true));
        verify(mapper, never()).upsertPopupResponse(any(), any(), any(), any(), any(), any());
    }

    /** WPF 채점값이 없는 QUIZ 제출은 저장 전에 거부한다. */
    @Test void quizWithoutWpfScoreIsRejectedBeforeSave() {
        context("QUIZ", BigDecimal.TEN);
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001", answers, null, true));
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001", answers, 10.0, null));
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001", answers, -1.0, true));
        assertThrows(IllegalArgumentException.class, () -> service.submitResponse("Q1", "r-1", "E1001", answers, Double.NaN, true));
        verify(mapper, never()).upsertPopupResponse(any(), any(), any(), any(), any(), any());
    }

    /** SURVEY는 클라이언트 점수 값을 무시하고 제출 즉시 완료한다. */
    @Test void surveyIgnoresClientValuesAndCompletesAsBefore() {
        context("SURVEY", null);
        var result = service.submitResponse("Q1", "r-1", "E1001", answers, 99.0, false);
        assertTrue(result.passed());
        verify(mapper).upsertPopupResponse("r-1", "E1001", "Q1", 20L, BigDecimal.ZERO, "Y");
        verify(mapper).markPopupCompleted("E1001", "Q1", "Y");
    }
}
