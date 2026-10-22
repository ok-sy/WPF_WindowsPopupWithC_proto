package server.service.core.popup.wpf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import server.base.props.WpfPopupProps;
import server.domain.popup.PopupEntity;
import server.domain.popup.PopupOptionDto;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupResponseDto;
import server.domain.popup.wpf.WpfPopupDelivery;
import server.domain.popup.wpf.WpfPopupItem;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultResponse;
import server.domain.popup.wpf.WpfResultType;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.WpfPopupMapper;
import server.service.core.popup.PopupService;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * POL-11-01 : 노출 판단 소유
 * POL-09-02 : 조회 응답
 * POL-09-03 : 저장 응답
 * ■ WpfPopupService 조회·결과 처리 테스트
 * - 단건 조회(전달 건 생성·재사용·만료, WPF 비노출 필드 제거)와
 * 결과 1건 처리의 코드 매핑·후속 후보 상태(nextStatus)를 DB 없이 검증한다.
 */
class WpfPopupServiceTest {

    private PopupService popupService;
    private PopupMapper popupMapper;
    private WpfPopupMapper wpfMapper;
    private WpfResultProcessor processor;
    private WpfPopupService service;

    @BeforeEach void setup() {
        popupService = mock(PopupService.class);
        popupMapper = mock(PopupMapper.class);
        wpfMapper = mock(WpfPopupMapper.class);
        processor = mock(WpfResultProcessor.class);
        WpfPopupProps props = new WpfPopupProps();
        props.setPollingIntervalSeconds(1800);
        service = new WpfPopupService(popupService, popupMapper, wpfMapper, processor, props);
        when(wpfMapper.countActiveUser("E1001")).thenReturn(1);
        when(wpfMapper.lockActiveUser("E1001")).thenReturn("E1001");
    }

    private PopupResponseDto quizDto(List<PopupQuestionDto> questions) {
        return new PopupResponseDto("Q1", "QUIZ", "퀴즈", OffsetDateTime.now(), OffsetDateTime.now().plusDays(1),
                "SEQUENTIAL", 10, "FIXED", 600.0, 480.0, .7, .75, 480, 320, 1200, 900,
                true, true, true, false, false, 20L, "FIXED", null, null, null, null, null, 10.0, questions,
                // POL-13-01 : 콘텐츠와 관리 상태 — PopupContentAssembler는 content에 문항·통과 점수 등 파생 키를 넣지 않는다.
                Map.of("surveyTitle", "보안", "useBackgroundOverlay", true));
    }

    private static WpfResultCommand result(String resultId, String popupId, WpfResultType type) {
        return new WpfResultCommand(resultId, "D-" + resultId, popupId, type, null, null, null, null, null, null, null);
    }

    private PopupEntity entity(String popupId, String type, Long templateId) {
        PopupEntity entity = mock(PopupEntity.class);
        when(entity.popupId()).thenReturn(popupId);
        when(entity.popupType()).thenReturn(type);
        when(entity.questionTemplateId()).thenReturn(templateId);
        return entity;
    }

    /** 비활성 사용자는 403으로 거절하고 후보 조회·전달 건 생성을 하지 않는다. */
    @Test void inactiveUserIsForbidden() {
        when(wpfMapper.countActiveUser("E9999")).thenReturn(0);
        assertThrows(WpfUserInactiveException.class, () -> service.getNextPopup("E9999"));
        assertThrows(WpfUserInactiveException.class, () -> service.processResult("E9999", result("r", "P1", WpfResultType.CLOSED)));
        verify(popupMapper, never()).selectAvailablePopups(anyString(), anyBoolean());
        verify(wpfMapper, never()).insertDelivery(any(), any(), any());
    }

    /** 폴링 주기는 설정값과 무관하게 1800~3600초 범위로 응답한다. */
    @Test void pollingResponseAlwaysRespectsThirtyToSixtyMinutePolicy() {
        when(popupMapper.selectAvailablePopups("E1001", true)).thenReturn(List.of());
        int[] configured = {-1, 0, 300, 1800, 2700, 3600, 7200};
        int[] expected = {1800, 1800, 1800, 1800, 2700, 3600, 3600};
        for (int i = 0; i < configured.length; i++) {
            WpfPopupProps props = new WpfPopupProps();
            props.setPollingIntervalSeconds(configured[i]);
            var configuredService = new WpfPopupService(popupService, popupMapper, wpfMapper, processor, props);
            var response = configuredService.getNextPopup("E1001");
            assertEquals(expected[i], response.pollingIntervalSeconds());
            assertNull(response.popup(), "대상이 없으면 popup=null");
        }
        verify(wpfMapper, never()).insertDelivery(any(), any(), any());
    }

    /** 첫 노출 후보에 새 전달 건을 발급하고 WPF 비노출 필드를 뺀다. */
    @Test void firstEligiblePopupGetsNewDeliveryAndHidesInternalFields() {
        PopupEntity first = entity("Q1", "QUIZ", 20L);   // POL-06-02 : 선택·제출 — QUIZ만 정답 키·통과 점수 포함
        PopupEntity second = entity("T2", "TEXT", null);
        when(popupMapper.selectAvailablePopups("E1001", true)).thenReturn(List.of(first, second));
        var question = new PopupQuestionDto(1L, "Q", null, "SINGLE_CHOICE", true, true, BigDecimal.TEN, 1,
                List.of(new PopupOptionDto(10L, "1", "A", 1, null)), null, null, "VERTICAL");
        when(popupService.loadQuestionsWithAnswerKey(List.of(20L))).thenReturn(Map.of(20L, List.of(question)));
        when(popupService.toPublicResponseDto(first, List.of(question))).thenReturn(quizDto(List.of(question)));

        var response = service.getNextPopup("E1001");

        assertEquals(1800, response.pollingIntervalSeconds());
        var item = response.popup();
        assertEquals("Q1", item.popupId(), "서버 정렬 첫 팝업 1건");
        assertNotNull(item.deliveryId());
        verify(wpfMapper).insertDelivery(item.deliveryId(), "E1001", "Q1");
        verify(popupService, never()).toPublicResponseDto(eq(second), any());
        assertEquals(1, item.questions().size(), "문항은 최상위 questions에만");
        assertFalse(item.content().containsKey("questions"), "content.questions 중복 제거");
        assertFalse(item.content().containsKey("passingScore"), "content에는 두지 않고 최상위로");
        assertEquals(10.0, item.passingScore(), "[설계 12] QUIZ는 통과 점수를 최상위로 내려줌");
        assertEquals("보안", item.content().get("surveyTitle"));
        // POL-01-01 : 공통 옵션의 위치 — PopupWindow 공통 UI 옵션은 content에서 빼 최상위로 내려준다(없는 값은 기본값).
        assertTrue(item.useBackgroundOverlay());
        assertFalse(item.content().containsKey("useBackgroundOverlay"));
        assertEquals(0.45, item.backgroundOverlayOpacity());
        assertEquals("CENTER", item.popupPosition());
        assertNull(item.headerFontSize());
        // POL-11-01 : 노출 판단 소유 — 완료·숨김·재노출 유예 제외 플래그로 호출됐는지
        verify(popupMapper).selectAvailablePopups("E1001", true);
        verify(popupMapper, never()).selectAvailablePopups("E1001", false);
    }

    /** POL-12-03 : 진행 단위 — 조회는 후보를 읽기 전에 사용자 행을 잠근다(결과 처리와 같은 잠금). */
    @Test void nextPopupLocksUserBeforeReadingCandidates() {
        when(popupMapper.selectAvailablePopups("E1001", true)).thenReturn(List.of());
        service.getNextPopup("E1001");
        var order = inOrder(wpfMapper, popupMapper);
        order.verify(wpfMapper).lockActiveUser("E1001");
        order.verify(popupMapper).selectAvailablePopups("E1001", true);
        order.verify(wpfMapper).selectOpenDelivery("E1001");
    }

    /** OPEN 전달 건의 팝업이 아직 대상이면 같은 deliveryId를 재사용한다. */
    @Test void openDeliveryIsReusedWhileStillEligible() {
        PopupEntity first = entity("T1", "TEXT", null);
        PopupEntity reused = entity("T2", "TEXT", null);
        when(popupMapper.selectAvailablePopups("E1001", true)).thenReturn(List.of(first, reused));
        when(wpfMapper.selectOpenDelivery("E1001")).thenReturn(new WpfPopupDelivery("D-OPEN", "E1001", "T2", "OPEN", "TEXT"));
        when(popupService.toPublicResponseDto(reused, List.of())).thenReturn(quizDto(List.of()));

        var item = service.getNextPopup("E1001").popup();

        assertEquals("D-OPEN", item.deliveryId(), "조회 응답 유실 후 재조회는 같은 전달 건");
        verify(wpfMapper, never()).insertDelivery(any(), any(), any());
        verify(wpfMapper, never()).expireDelivery(any());
    }

    /** OPEN 전달 건의 팝업이 대상이 아니면 EXPIRED로 닫고 다음 후보를 고른다. */
    @Test void openDeliveryNoLongerEligibleIsExpiredAndNextIsChosen() {
        PopupEntity next = entity("T1", "TEXT", null);
        when(popupMapper.selectAvailablePopups("E1001", true)).thenReturn(List.of(next));
        when(wpfMapper.selectOpenDelivery("E1001")).thenReturn(new WpfPopupDelivery("D-OLD", "E1001", "STOPPED", "OPEN", "TEXT"));
        when(popupService.toPublicResponseDto(next, List.of())).thenReturn(quizDto(List.of()));

        var item = service.getNextPopup("E1001").popup();

        verify(wpfMapper).expireDelivery("D-OLD");
        assertNotEquals("D-OLD", item.deliveryId());
        verify(wpfMapper).insertDelivery(item.deliveryId(), "E1001", "T1");
    }

    /** 동시 조회로 다른 요청이 먼저 만든 OPEN 전달 건을 재사용한다. */
    @Test void concurrentQueryReusesDeliveryCreatedByOtherRequest() {
        PopupEntity first = entity("T1", "TEXT", null);
        when(popupMapper.selectAvailablePopups("E1001", true)).thenReturn(List.of(first));
        when(wpfMapper.selectOpenDelivery("E1001"))
                .thenReturn(null, new WpfPopupDelivery("D-OTHER", "E1001", "T1", "OPEN", "TEXT"));
        when(wpfMapper.insertDelivery(any(), eq("E1001"), eq("T1")))
                .thenThrow(new org.springframework.dao.DuplicateKeyException("UX_WPF_POPUP_DELIVERY_OPEN"));
        when(popupService.toPublicResponseDto(first, List.of())).thenReturn(quizDto(List.of()));

        assertEquals("D-OTHER", service.getNextPopup("E1001").popup().deliveryId());
    }

    /** ACCEPTED·DUPLICATE 결과는 후속 후보 유무(nextStatus)를 알려 준다. */
    @Test void savedResultReportsNextCandidate() {
        var ok = result("r-ok", "P1", WpfResultType.CLOSED);
        var dup = result("r-dup", "P1", WpfResultType.CLOSED);
        when(processor.processOne("E1001", ok)).thenReturn(WpfResultItemResponse.accepted(ok));
        when(processor.processOne("E1001", dup)).thenReturn(WpfResultItemResponse.duplicate(dup));
        when(popupMapper.countAvailablePopups("E1001", true)).thenReturn(1, 0);

        var accepted = service.processResult("E1001", ok);
        var duplicate = service.processResult("E1001", dup);

        assertEquals(WpfResultItemResponse.Status.ACCEPTED, accepted.status());
        assertEquals(WpfResultResponse.NextStatus.AVAILABLE, accepted.nextStatus());
        assertEquals("r-ok", accepted.resultId());
        assertNull(accepted.code());
        assertEquals(WpfResultItemResponse.Status.DUPLICATE, duplicate.status());
        assertEquals(WpfResultResponse.NextStatus.EMPTY, duplicate.nextStatus(), "중복 처리 성공도 후속 후보를 알려준다");
    }

    /** 후보 확인 실패는 EMPTY로 바꾸지 않고 nextStatus 생략 + WPF_NEXT_STATUS_UNKNOWN이다. */
    @Test void candidateCheckFailureIsNotReportedAsEmpty() {
        var ok = result("r-ok", "P1", WpfResultType.CLOSED);
        when(processor.processOne("E1001", ok)).thenReturn(WpfResultItemResponse.accepted(ok));
        when(popupMapper.countAvailablePopups("E1001", true)).thenThrow(new IllegalStateException("db down"));

        var response = service.processResult("E1001", ok);

        assertEquals(WpfResultItemResponse.Status.ACCEPTED, response.status(), "저장 성공은 유지");
        assertNull(response.nextStatus(), "후보 확인 실패를 EMPTY로 바꾸지 않는다");
        assertEquals("WPF_NEXT_STATUS_UNKNOWN", response.code());
    }

    /** 업무 거절은 WPF 코드로 매핑하고 nextStatus를 싣지 않는다. */
    @Test void rejectionCodesAreMappedAndNoNextStatus() {
        var cases = Map.of(
                "현재 사용자에게 제출 가능한 팝업이 아닙니다.", "WPF_NOT_ELIGIBLE",
                "현재 설문에 포함되지 않은 문항입니다. questionId=9", "WPF_INVALID_ANSWER",
                "유효한 전달 건이 아닙니다. deliveryId=x", "WPF_INVALID_DELIVERY",
                "전달 건의 팝업과 일치하지 않습니다. deliveryId=x", "WPF_INVALID_DELIVERY",
                "이미 결과가 저장된 전달 건입니다. deliveryId=x", "WPF_DELIVERY_COMPLETED");
        int n = 0;
        for (var entry : cases.entrySet()) {
            var item = result("r-" + n++, "P1", WpfResultType.SUBMITTED);
            when(processor.processOne("E1001", item)).thenThrow(new IllegalArgumentException(entry.getKey()));
            var response = service.processResult("E1001", item);
            assertEquals(WpfResultItemResponse.Status.REJECTED, response.status());
            assertEquals(entry.getValue(), response.code(), entry.getKey());
            assertNull(response.nextStatus(), "거절에는 다음 조회 진행 정보 없음");
        }
        verify(popupMapper, never()).countAvailablePopups(anyString(), anyBoolean());
    }

    /** POL-09-03 : 저장 응답 — 일시 장애는 예외 형식(원인 체인 포함)으로 RETRYABLE_ERROR, 그 밖은 INTERNAL_ERROR. 메시지로 판단하지 않는다. */
    @Test void transientFailuresAreRetryableAndOthersInternal() {
        var failures = new java.util.LinkedHashMap<RuntimeException, WpfResultItemResponse.Status>();
        failures.put(new org.springframework.dao.CannotAcquireLockException("ORA-00060"), WpfResultItemResponse.Status.RETRYABLE_ERROR);
        failures.put(new org.springframework.jdbc.CannotGetJdbcConnectionException("no connection"), WpfResultItemResponse.Status.RETRYABLE_ERROR);
        failures.put(new RuntimeException(new java.sql.SQLRecoverableException("IO error")), WpfResultItemResponse.Status.RETRYABLE_ERROR);
        failures.put(new org.springframework.dao.DataIntegrityViolationException("unique"), WpfResultItemResponse.Status.INTERNAL_ERROR);
        failures.put(new IllegalStateException("timeout deadlock connection"), WpfResultItemResponse.Status.INTERNAL_ERROR);
        int i = 0;
        for (var entry : failures.entrySet()) {
            var item = result("r-" + i++, "P1", WpfResultType.CLOSED);
            when(processor.processOne("E1001", item)).thenThrow(entry.getKey());
            var response = service.processResult("E1001", item);
            assertEquals(entry.getValue(), response.status(), String.valueOf(entry.getKey()));
            assertEquals(entry.getValue() == WpfResultItemResponse.Status.RETRYABLE_ERROR ? "WPF_RETRYABLE" : "WPF_INTERNAL", response.code());
            assertNull(response.nextStatus());
            assertFalse(response.message().contains("db down") || response.message().contains("deadlock"), "내부 오류 메시지 비노출");
        }
    }

    /** SURVEY 문항은 정답 키와 통과 점수를 빼고 내려준다. */
    @Test void surveyQuestionsAreStrippedOfAnswerKeyAndPassingScore() {
        PopupEntity survey = entity("S1", "SURVEY", 20L);
        when(popupMapper.selectAvailablePopups("E1001", true)).thenReturn(List.of(survey));
        var withKey = new PopupQuestionDto(1L, "Q", null, "TEXT", true, true, BigDecimal.TEN, 1,
                List.of(new PopupOptionDto(10L, "1", "A", 1, true)), "정답", "EXACT", "VERTICAL");
        var stripped = new PopupQuestionDto(1L, "Q", null, "TEXT", true, true, BigDecimal.TEN, 1,
                List.of(new PopupOptionDto(10L, "1", "A", 1, null)), null, null, "VERTICAL");
        when(popupService.loadQuestionsWithAnswerKey(List.of(20L))).thenReturn(Map.of(20L, List.of(withKey)));
        when(popupService.toPublicResponseDto(survey, List.of(stripped))).thenReturn(
                new PopupResponseDto("S1", "SURVEY", "설문", OffsetDateTime.now(), OffsetDateTime.now().plusDays(1),
                        "SEQUENTIAL", 10, "FIXED", 600.0, 480.0, .7, .75, 480, 320, 1200, 900,
                        true, true, true, false, false, 20L, "FIXED", null, null, null, null, null, 10.0, List.of(stripped),
                        Map.of("surveyTitle", "설문", "passingScore", 10.0)));

        var item = service.getNextPopup("E1001").popup();

        assertEquals(stripped, item.questions().get(0), "SURVEY 문항에 정답 키 없음");
        assertNull(item.passingScore(), "SURVEY는 통과 점수 없음");
        assertEquals(List.of(stripped), WpfPopupItem.withoutAnswerKey(List.of(withKey)));
    }
}