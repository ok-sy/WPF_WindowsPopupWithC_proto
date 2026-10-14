package server.service.core.popup.wpf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import server.base.props.WpfPopupProps;
import server.domain.popup.PopupHideResponseDto;
import server.domain.popup.PopupSubmissionContext;
import server.domain.popup.PopupSubmitAnswer;
import server.domain.popup.PopupSubmitResponseDto;
import server.domain.popup.VideoProgressResponseDto;
import server.domain.popup.wpf.WpfPopupDelivery;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultType;
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
 * [설계 35] 전달 건 검증·종료(재노출 유예)와 일반 안내(TEXT·IMAGE) 닫기 완료 처리도 확인한다.
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
        WpfPopupProps props = new WpfPopupProps();
        props.setPollingIntervalSeconds(2700);
        processor = new WpfResultProcessor(popupService, popupMapper, wpfMapper, props);
        delivery("VIDEO");
        when(wpfMapper.countReceipt(anyString())).thenReturn(0);
        when(wpfMapper.lockActiveUser(anyString())).thenAnswer(inv -> inv.getArgument(0));
        when(wpfMapper.mergeDisplayAndClose(anyString(), anyString(), any(), any())).thenReturn(1);
        when(popupMapper.countActiveUserAndPopup(anyString(), anyString())).thenReturn(1);
    }

    private void delivery(String popupType) {
        when(wpfMapper.selectDeliveryForUpdate("D-1")).thenReturn(new WpfPopupDelivery("D-1", "E1001", "P1", "OPEN", popupType));
    }

    private WpfResultCommand item(WpfResultType type, Integer hideDays, List<PopupSubmitAnswer> answers,
                                  WpfVideoProgress video) {
        return new WpfResultCommand("r-1", "D-1", "P1", type, DISPLAYED, CLOSED, hideDays, answers, video, null, null);
    }

    @Test void duplicateResultIdIsNotProcessed() {
        when(wpfMapper.countReceipt("r-1")).thenReturn(1);
        var res = processor.processOne("E1001", item(WpfResultType.CLOSED, null, null, null));
        assertEquals(WpfResultItemResponse.Status.DUPLICATE, res.status());
        verify(wpfMapper, never()).mergeDisplayAndClose(any(), any(), any(), any());
        verify(wpfMapper, never()).insertReceipt(any(), any(), any(), any(), any(), any());
        verify(wpfMapper, never()).selectDeliveryForUpdate(any());
        verify(wpfMapper, never()).completeDelivery(any(), any(), any(), anyInt());
    }

    @Test void closedRecordsDisplayAndCloseAndReceipt() {
        var res = processor.processOne("E1001", item(WpfResultType.CLOSED, null, null, null));
        assertEquals(WpfResultItemResponse.Status.ACCEPTED, res.status());
        verify(wpfMapper).mergeDisplayAndClose("E1001", "P1", DISPLAYED, CLOSED);
        verify(wpfMapper).insertReceipt("r-1", "E1001", "P1", "CLOSED", "ACCEPTED", null);
        verify(wpfMapper).completeDelivery("D-1", "r-1", "CLOSED", 2700);
        verify(popupMapper, never()).markPopupCompleted(any(), any(), any());   // [설계 35] 영상 미완료 닫기는 완료가 아님(유예만)
        verifyNoInteractions(popupService);
        verify(wpfMapper, never()).selectStatus(any(), any());   // [설계 34-03] 응답에 상태를 싣지 않아 조회하지 않는다
    }

    @Test void hiddenDelegatesToExistingHidePopup() {
        when(popupService.hidePopup("P1", "E1001", 7))
                .thenReturn(new PopupHideResponseDto("E1001", "P1", "UNTIL", CLOSED.plusDays(7)));
        var res = processor.processOne("E1001", item(WpfResultType.HIDDEN, 7, null, null));
        assertEquals(WpfResultItemResponse.Status.ACCEPTED, res.status());
        // [설계 34-05] 숨김 만료 시각은 저장하지만 응답에는 없다.
        verify(popupService).hidePopup("P1", "E1001", 7);
    }

    @Test void hiddenWithoutHideDaysIsRejectedBeforeAnyWrite() {
        assertThrows(IllegalArgumentException.class,
                () -> processor.processOne("E1001", item(WpfResultType.HIDDEN, null, null, null)));
        verify(wpfMapper, never()).mergeDisplayAndClose(any(), any(), any(), any());
    }

    /** [설계 33] WPF score/passed를 저장 계층에 넘기고, 응답에는 점수·통과 여부 없이 처리 상태만 담는다. */
    @Test void submittedPassesWpfScoreAndResponseOmitsScore() {
        var answers = List.of(new PopupSubmitAnswer(1L, null, List.of(10L)));
        when(popupService.submitDeliveredResponse(eq("P1"), eq("r-1"), eq("E1001"), eq(answers), any(), any()))
                .thenReturn(new PopupSubmitResponseDto(5001L, "r-1", "E1001", "P1", "SUBMITTED", 10, true, CLOSED));

        var quizItem = new WpfResultCommand("r-1", "D-1", "P1", WpfResultType.SUBMITTED, DISPLAYED, CLOSED, null,
                answers, null, 80.0, true);
        var quiz = processor.processOne("E1001", quizItem);
        assertEquals(WpfResultItemResponse.Status.ACCEPTED, quiz.status());
        // 제출은 resultId를 clientRequestId로, WPF 판정값을 그대로 전달한다 (POPUP_RESPONSE.CLIENT_REQUEST_ID·TOTAL_SCORE·PASSED_YN)
        verify(popupService).submitDeliveredResponse("P1", "r-1", "E1001", answers, 80.0, true);
        // [설계 33·34-03·34-05] 확정 삭제 응답 필드는 응답 계약에 없다.
        var names = java.util.Arrays.stream(WpfResultItemResponse.class.getRecordComponents()).map(c -> c.getName()).toList();
        for (String removed : List.of("totalScore", "passed", "hiddenUntil", "watchedRatio", "requiredRatio",
                "popupStatus", "completed", "completedAt", "responseId")) {
            assertFalse(names.contains(removed), removed);
        }
    }

    @Test void videoDelegatesToExistingSaveVideoProgress() {
        var video = new WpfVideoProgress(new BigDecimal("540"), new BigDecimal("540"),
                new BigDecimal("540"), new BigDecimal("531.5"));
        when(popupService.saveDeliveredVideoProgress("P1", "E1001", video.durationSeconds(), video.positionSeconds(),
                video.maximumPositionSeconds(), video.watchedSeconds()))
                .thenReturn(new VideoProgressResponseDto("E1001", "P1", 0.9842, 0.9, true, CLOSED));
        var res = processor.processOne("E1001", item(WpfResultType.VIDEO_WATCHED, null, null, video));
        // [설계 34-05] 시청 비율은 저장 계층(saveVideoProgress)에서 계산하고 응답에는 없다.
        assertEquals(WpfResultItemResponse.Status.ACCEPTED, res.status());
        verify(wpfMapper).insertReceipt("r-1", "E1001", "P1", "VIDEO_WATCHED", "ACCEPTED", null);
    }

    @Test void videoQuizRequiresWatchThresholdBeforeSubmission() {
        when(popupMapper.selectVideoPopupContext("E1001", "P1", false))
                .thenReturn(new server.domain.popup.VideoPopupContext("P1", "QUIZ", new BigDecimal("0.8")));
        var answers = List.of(new PopupSubmitAnswer(1L, "answer", null));
        assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001",
                item(WpfResultType.SUBMITTED, null, answers, null)));
        var video = new WpfVideoProgress(BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.ONE);
        when(popupService.saveDeliveredVideoProgress(any(), any(), any(), any(), any(), any()))
                .thenReturn(new VideoProgressResponseDto("E1001", "P1", 0.1, 0.8, false, null));
        assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001",
                item(WpfResultType.SUBMITTED, null, answers, video)));
        verify(popupService, never()).submitDeliveredResponse(any(), any(), any(), any(), any(), any());
        verify(wpfMapper, never()).insertReceipt(any(), any(), any(), any(), any(), any());

        when(popupService.saveDeliveredVideoProgress(any(), any(), any(), any(), any(), any()))
                .thenReturn(new VideoProgressResponseDto("E1001", "P1", 0.8, 0.8, true, CLOSED));
        when(popupService.submitDeliveredResponse(any(), any(), any(), any(), any(), any()))
                .thenReturn(new PopupSubmitResponseDto(5001L, "r-1", "E1001", "P1", "SUBMITTED", 10, true, CLOSED));
        var result = processor.processOne("E1001", item(WpfResultType.SUBMITTED, null, answers, video));
        assertEquals(WpfResultItemResponse.Status.ACCEPTED, result.status());
        verify(popupService).submitDeliveredResponse("P1", "r-1", "E1001", answers, null, null);
    }

    /** [설계 35] 일반 안내(TEXT·IMAGE)의 닫기(Footer 닫기·바로가기 포함)는 완료로 처리해 이후 조회에서 제외한다. */
    @Test void closingGeneralNoticeCompletesIt() {
        for (String type : List.of("TEXT", "IMAGE")) {
            reset(popupMapper);
            when(popupMapper.countActiveUserAndPopup(anyString(), anyString())).thenReturn(1);
            delivery(type);
            assertEquals(WpfResultItemResponse.Status.ACCEPTED,
                    processor.processOne("E1001", item(WpfResultType.CLOSED, null, null, null)).status());
            verify(popupMapper).markPopupCompleted("E1001", "P1", "Y");
        }
    }

    @Test void deliveryMustBelongToUserMatchPopupAndBeOpen() {
        when(wpfMapper.selectDeliveryForUpdate("D-1")).thenReturn(null);
        assertTrue(assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001",
                item(WpfResultType.CLOSED, null, null, null))).getMessage().contains("유효한 전달 건"));
        when(wpfMapper.selectDeliveryForUpdate("D-1")).thenReturn(new WpfPopupDelivery("D-1", "E2002", "P1", "OPEN", "TEXT"));
        assertTrue(assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001",
                item(WpfResultType.CLOSED, null, null, null))).getMessage().contains("유효한 전달 건"), "다른 사용자의 전달 건");
        when(wpfMapper.selectDeliveryForUpdate("D-1")).thenReturn(new WpfPopupDelivery("D-1", "E1001", "P9", "OPEN", "TEXT"));
        assertTrue(assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001",
                item(WpfResultType.CLOSED, null, null, null))).getMessage().contains("팝업과 일치"));
        when(wpfMapper.selectDeliveryForUpdate("D-1")).thenReturn(new WpfPopupDelivery("D-1", "E1001", "P1", "DONE", "TEXT"));
        assertTrue(assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001",
                item(WpfResultType.CLOSED, null, null, null))).getMessage().contains("이미 결과가 저장된"));
        verify(wpfMapper, never()).mergeDisplayAndClose(any(), any(), any(), any());
        verify(wpfMapper, never()).completeDelivery(any(), any(), any(), anyInt());

        // 재조회로 EXPIRED가 된 건(표시 중 게시 중단 등)의 결과는 받는다
        when(wpfMapper.selectDeliveryForUpdate("D-1")).thenReturn(new WpfPopupDelivery("D-1", "E1001", "P1", "EXPIRED", "VIDEO"));
        assertEquals(WpfResultItemResponse.Status.ACCEPTED,
                processor.processOne("E1001", item(WpfResultType.CLOSED, null, null, null)).status());
    }

    /**
     * [설계 47-4] 게시중단(활성 해제·기간 종료·대상 변경) 뒤 재조회로 EXPIRED가 된 전달 건의 결과는 유형과 관계없이 받는다.
     * 결과 처리는 신규 조회의 게시 조건을 다시 보지 않는다: 노출 후보 조회를 호출하지 않고, 제출·시청은 게시 조건 없는
     * 전달 건 경로(submitDeliveredResponse·saveDeliveredVideoProgress, 영상 문맥 requirePublished=false)로 위임한다.
     */
    @Test void expiredDeliveryResultsAreAcceptedForEveryResultType() {
        var answers = List.of(new PopupSubmitAnswer(1L, null, List.of(10L)));
        var video = new WpfVideoProgress(BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
        when(popupService.hidePopup("P1", "E1001", 7))
                .thenReturn(new PopupHideResponseDto("E1001", "P1", "UNTIL", CLOSED.plusDays(7)));
        when(popupService.submitDeliveredResponse(any(), any(), any(), any(), any(), any()))
                .thenReturn(new PopupSubmitResponseDto(5001L, "r-1", "E1001", "P1", "SUBMITTED", 10, true, CLOSED));
        when(popupService.saveDeliveredVideoProgress(any(), any(), any(), any(), any(), any()))
                .thenReturn(new VideoProgressResponseDto("E1001", "P1", 1.0, 1.0, true, CLOSED));
        record Case(String popupType, WpfResultCommand item) { }
        for (Case c : List.of(
                new Case("TEXT", item(WpfResultType.CLOSED, null, null, null)),
                new Case("VIDEO", item(WpfResultType.CLOSED, null, null, null)),
                new Case("TEXT", item(WpfResultType.HIDDEN, 7, null, null)),
                new Case("SURVEY", item(WpfResultType.SUBMITTED, null, answers, null)),
                new Case("QUIZ", new WpfResultCommand("r-1", "D-1", "P1", WpfResultType.SUBMITTED, DISPLAYED, CLOSED,
                        null, answers, null, 10.0, true)),
                new Case("VIDEO", item(WpfResultType.VIDEO_WATCHED, null, null, video)))) {
            when(wpfMapper.selectDeliveryForUpdate("D-1"))
                    .thenReturn(new WpfPopupDelivery("D-1", "E1001", "P1", "EXPIRED", c.popupType()));
            var res = processor.processOne("E1001", c.item());
            assertEquals(WpfResultItemResponse.Status.ACCEPTED, res.status(), c.popupType() + " " + c.item().resultType());
        }
        verify(wpfMapper, times(6)).completeDelivery(eq("D-1"), eq("r-1"), anyString(), eq(2700));
        verify(popupService, times(2)).submitDeliveredResponse(any(), any(), any(), any(), any(), any());
        verify(popupService).saveDeliveredVideoProgress(any(), any(), any(), any(), any(), any());
        verify(popupMapper, times(2)).selectVideoPopupContext("E1001", "P1", false);
        verify(popupMapper, never()).selectVideoPopupContext(any(), any(), eq(true));
        // 게시 조건을 다시 따지는 신규 조회 경로는 결과 처리에서 쓰지 않는다
        verify(popupService, never()).submitResponse(any(), any(), any(), any(), any(), any());
        verify(popupService, never()).saveVideoProgress(any(), any(), any(), any(), any(), any());
        verify(popupMapper, never()).selectAvailablePopups(anyString(), anyBoolean());
        verify(popupMapper, never()).countAvailablePopups(anyString(), anyBoolean());
    }

    /**
     * [설계 47-4] 게시중단 뒤에도 유지하는 거절: 다른 사용자의 전달 건, popupId 불일치, 이미 결과가 저장된 전달 건은
     * 결과 유형과 관계없이 거절하고 아무것도 쓰지 않는다.
     */
    @Test void invalidDeliveryIsRejectedForEveryResultType() {
        var answers = List.of(new PopupSubmitAnswer(1L, null, List.of(10L)));
        var video = new WpfVideoProgress(BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN);
        List<WpfResultCommand> items = List.of(item(WpfResultType.CLOSED, null, null, null),
                item(WpfResultType.HIDDEN, 7, null, null), item(WpfResultType.SUBMITTED, null, answers, null),
                item(WpfResultType.VIDEO_WATCHED, null, null, video));
        for (var delivery : List.of(new WpfPopupDelivery("D-1", "E2002", "P1", "EXPIRED", "TEXT"),
                new WpfPopupDelivery("D-1", "E1001", "P9", "EXPIRED", "TEXT"),
                new WpfPopupDelivery("D-1", "E1001", "P1", "DONE", "TEXT"))) {
            when(wpfMapper.selectDeliveryForUpdate("D-1")).thenReturn(delivery);
            for (WpfResultCommand it : items) {
                assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001", it),
                        delivery + " " + it.resultType());
            }
        }
        verifyNoInteractions(popupService);
        verify(wpfMapper, never()).mergeDisplayAndClose(any(), any(), any(), any());
        verify(wpfMapper, never()).completeDelivery(any(), any(), any(), anyInt());
        verify(wpfMapper, never()).insertReceipt(any(), any(), any(), any(), any(), any());
    }

    /**
     * [설계 47-4] 팝업 행이 삭제됐으면 유효한 전달 건이어도 거절한다. CLOSED·HIDDEN은 팝업 존재 확인(0건),
     * SUBMITTED·VIDEO_WATCHED는 popupId 문맥이 없어 저장 계층이 거절한다.
     */
    @Test void deletedPopupIsRejectedEvenWithValidDelivery() {
        when(wpfMapper.selectDeliveryForUpdate("D-1")).thenReturn(new WpfPopupDelivery("D-1", "E1001", "P1", "EXPIRED", null));
        when(popupMapper.countActiveUserAndPopup("E1001", "P1")).thenReturn(0);
        for (var it : List.of(item(WpfResultType.CLOSED, null, null, null), item(WpfResultType.HIDDEN, 7, null, null))) {
            assertTrue(assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001", it))
                    .getMessage().contains("유효한 사용자 또는 팝업이 아닙니다"), it.resultType().name());
        }
        verify(popupService, never()).hidePopup(any(), any(), any());

        when(popupService.submitDeliveredResponse(any(), any(), any(), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("현재 사용자에게 제출 가능한 팝업이 아닙니다."));
        when(popupService.saveDeliveredVideoProgress(any(), any(), any(), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("현재 사용자에게 유효한 영상 팝업이 아닙니다."));
        assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001",
                item(WpfResultType.SUBMITTED, null, List.of(new PopupSubmitAnswer(1L, "x", null)), null)));
        assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001", item(WpfResultType.VIDEO_WATCHED,
                null, null, new WpfVideoProgress(BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN))));
        verify(wpfMapper, never()).completeDelivery(any(), any(), any(), anyInt());
        verify(wpfMapper, never()).insertReceipt(any(), any(), any(), any(), any(), any());
    }

    /** [설계 39-4·39-5] 사용자 행 잠금 후 영수증을 확인한다. 잠금 대기 뒤 앞 요청이 저장했으면 DUPLICATE. */
    @Test void userLockPrecedesReceiptCheck() {
        when(wpfMapper.countReceipt("r-1")).thenReturn(1);   // 잠금을 기다리는 동안 앞 요청이 커밋한 상황
        assertEquals(WpfResultItemResponse.Status.DUPLICATE,
                processor.processOne("E1001", item(WpfResultType.CLOSED, null, null, null)).status());
        var order = inOrder(wpfMapper);
        order.verify(wpfMapper).lockActiveUser("E1001");
        order.verify(wpfMapper).countReceipt("r-1");
        verify(wpfMapper, never()).selectDeliveryForUpdate(any());

        when(wpfMapper.lockActiveUser("E9999")).thenReturn(null);
        assertThrows(IllegalArgumentException.class, () -> processor.processOne("E9999", item(WpfResultType.CLOSED, null, null, null)));
    }

    @Test void businessRejectionPropagatesWithoutReceipt() {
        when(popupService.submitDeliveredResponse(any(), any(), any(), any(), any(), any()))
                .thenThrow(new IllegalArgumentException("현재 사용자에게 제출 가능한 팝업이 아닙니다."));
        assertThrows(IllegalArgumentException.class, () -> processor.processOne("E1001",
                item(WpfResultType.SUBMITTED, null, List.of(new PopupSubmitAnswer(1L, "x", null)), null)));
        verify(wpfMapper, never()).insertReceipt(any(), any(), any(), any(), any(), any());
        verify(wpfMapper, never()).completeDelivery(any(), any(), any(), anyInt());
    }
}
