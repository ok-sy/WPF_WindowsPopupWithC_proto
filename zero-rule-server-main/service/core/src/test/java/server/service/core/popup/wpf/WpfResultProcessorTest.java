package server.service.core.popup.wpf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupHideResponseDto;
import server.domain.popup.PopupSubmissionContext;
import server.domain.popup.PopupSubmitAnswer;
import server.domain.popup.PopupSubmitResponseDto;
import server.domain.popup.VideoProgressResponseDto;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultType;
import server.domain.popup.wpf.WpfUserPopupStatus;
import server.domain.popup.wpf.WpfVideoProgress;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.WpfPopupMapper;
import server.service.core.popup.PopupService;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * [WPF 결과 API — 기준 3·4] 결과 항목 유형별 분배와 멱등 처리를 DB 없이 검증한다.
 * 기존 PopupService의 hide/submit/video 메서드에 정확히 위임하는지, 표시·닫기 MERGE와 영수증이 기록되는지 확인한다.
 */
class WpfResultProcessorTest {

    private PopupService popupService;
    private PopupMapper popupMapper;
    private WpfPopupMapper wpfMapper;
    private WpfResultProcessor processor;

    private static final OffsetDateTime DISPLAYED = OffsetDateTime.parse("2026-09-19T09:00:05+09:00");
    private static final OffsetDateTime CLOSED = OffsetDateTime.parse("2026-09-19T09:00:40+09:00");

    @BeforeEach void setup() {
        popupService = mock(PopupService.class);
        popupMapper = mock(PopupMapper.class);
        wpfMapper = mock(WpfPopupMapper.class);
        processor = new WpfResultProcessor(popupService, popupMapper, wpfMapper);
        when(wpfMapper.countReceipt(anyString())).thenReturn(0);
        when(wpfMapper.mergeDisplayAndClose(anyString(), anyString(), any(), any())).thenReturn(1);
        when(popupMapper.countActiveUserAndPopup(anyString(), anyString())).thenReturn(1);
        when(wpfMapper.selectStatus("E1001", "P1"))
                .thenReturn(new WpfUserPopupStatus("CLOSED", false, null, null));
    }

    private WpfResultCommand item(WpfResultType type, Integer hideDays, List<PopupSubmitAnswer> answers,
                                  WpfVideoProgress video) {
        return new WpfResultCommand("r-1", "P1", type, DISPLAYED, CLOSED, hideDays, null, answers, video);
    }

    @Test void duplicateResultIdIsNotProcessed() {
        when(wpfMapper.countReceipt("r-1")).thenReturn(1);
        var res = processor.processOne("E1001", item(WpfResultType.CLOSED, null, null, null));
        assertEquals(WpfResultItemResponse.Status.DUPLICATE, res.status());
        verify(wpfMapper, never()).mergeDisplayAndClose(any(), any(), any(), any());
        verify(wpfMapper, never()).insertReceipt(any(), any(), any(), any(), any(), any());
    }

    @Test void closedRecordsDisplayAndCloseAndReceipt() {
        var res = processor.processOne("E1001", item(WpfResultType.CLOSED, null, null, null));
        assertEquals(WpfResultItemResponse.Status.ACCEPTED, res.status());
        assertEquals("CLOSED", res.popupStatus());
        verify(wpfMapper).mergeDisplayAndClose("E1001", "P1", DISPLAYED, CLOSED);
        verify(wpfMapper).insertReceipt("r-1", "E1001", "P1", "CLOSED", "ACCEPTED", null);
        verifyNoInteractions(popupService);
    }

    @Test void hiddenDelegatesToExistingHidePopup() {
        when(popupService.hidePopup("P1", "E1001", 7))
                .thenReturn(new PopupHideResponseDto("E1001", "P1", "UNTIL", CLOSED.plusDays(7)));
        when(wpfMapper.selectStatus("E1001", "P1"))
                .thenReturn(new WpfUserPopupStatus("HIDDEN", false, null, CLOSED.plusDays(7)));
        var res = processor.processOne("E1001", item(WpfResultType.HIDDEN, 7, null, null));
        assertEquals(WpfResultItemResponse.Status.ACCEPTED, res.status());
        assertEquals(CLOSED.plusDays(7), res.hiddenUntil());
        verify(popupService).hidePopup("P1", "E1001", 7);
    }

    @Test void hiddenWithoutHideDaysIsRejectedBeforeAnyWrite() {
        assertThrows(IllegalArgumentException.class,
                () -> processor.processOne("E1001", item(WpfResultType.HIDDEN, null, null, null)));
        verify(wpfMapper, never()).mergeDisplayAndClose(any(), any(), any(), any());
    }

    @Test void submittedQuizReturnsScoreAndSurveyDoesNot() {
        var answers = List.of(new PopupSubmitAnswer(1L, null, List.of(10L)));
        when(popupService.submitResponse(eq("P1"), eq("r-1"), eq("E1001"), any(), eq(answers)))
                .thenReturn(new PopupSubmitResponseDto(5001L, "r-1", "E1001", "P1", "SUBMITTED", 10, true, CLOSED));
        when(wpfMapper.selectStatus("E1001", "P1"))
                .thenReturn(new WpfUserPopupStatus("COMPLETED", true, CLOSED, null));

        when(popupMapper.selectSubmissionContext("E1001", "P1"))
                .thenReturn(new PopupSubmissionContext("P1", "QUIZ", 20L, BigDecimal.TEN));
        var quiz = processor.processOne("E1001", item(WpfResultType.SUBMITTED, null, answers, null));
        assertEquals(5001L, quiz.responseId());
        assertEquals(10.0, quiz.totalScore());
        assertEquals(Boolean.TRUE, quiz.passed());
        assertEquals(Boolean.TRUE, quiz.completed());

        when(popupMapper.selectSubmissionContext("E1001", "P1"))
                .thenReturn(new PopupSubmissionContext("P1", "SURVEY", 21L, null));
        var survey = processor.processOne("E1001", item(WpfResultType.SUBMITTED, null, answers, null));
        assertEquals(5001L, survey.responseId());
        assertNull(survey.totalScore(), "SURVEY는 채점 결과를 내려주지 않는다");
        assertNull(survey.passed());
        // 제출은 resultId를 clientRequestId로 전달한다 (POPUP_RESPONSE.CLIENT_REQUEST_ID)
        verify(popupService, times(2)).submitResponse(eq("P1"), eq("r-1"), eq("E1001"), any(), eq(answers));
    }

    @Test void videoDelegatesToExistingSaveVideoProgress() {
        var video = new WpfVideoProgress(new BigDecimal("540"), new BigDecimal("540"),
                new BigDecimal("540"), new BigDecimal("531.5"));
        when(popupService.saveVideoProgress("P1", "E1001", video.durationSeconds(), video.positionSeconds(),
                video.maximumPositionSeconds(), video.watchedSeconds()))
                .thenReturn(new VideoProgressResponseDto("E1001", "P1", 0.9842, 0.9, true, CLOSED));
        when(wpfMapper.selectStatus("E1001", "P1"))
                .thenReturn(new WpfUserPopupStatus("COMPLETED", true, CLOSED, null));
        var res = processor.processOne("E1001", item(WpfResultType.VIDEO_WATCHED, null, null, video));
        assertEquals(0.9842, res.watchedRatio());
        assertEquals(0.9, res.requiredRatio());
        assertEquals(Boolean.TRUE, res.completed());
        verify(wpfMapper).insertReceipt("r-1", "E1001", "P1", "VIDEO_WATCHED", "ACCEPTED", null);
    }

    @Test void businessRejectionPropagatesWithoutReceipt() {
        when(popupService.submitResponse(any(), any(), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("현재 사용자에게 제출 가능한 팝업이 아닙니다."));
        assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001",
                item(WpfResultType.SUBMITTED, null, List.of(new PopupSubmitAnswer(1L, "x", null)), null)));
        verify(wpfMapper, never()).insertReceipt(any(), any(), any(), any(), any(), any());
    }
}
