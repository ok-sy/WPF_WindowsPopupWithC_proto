package server.service.core.popup.wpf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import server.base.props.WpfPopupProps;
import server.domain.popup.PopupEntity;
import server.domain.popup.PopupOptionDto;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupResponseDto;
import server.domain.popup.wpf.WpfPopupItem;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
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
 * [WPF 조회·결과 API — 기준 2·3·6] 목록 조립(완료 제외 플래그, WPF 비노출 필드 제거)과
 * 결과 일괄 처리의 항목 격리·코드 매핑을 DB 없이 검증한다.
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
    }

    private PopupResponseDto quizDto(List<PopupQuestionDto> questions) {
        return new PopupResponseDto("Q1", "QUIZ", "퀴즈", OffsetDateTime.now(), OffsetDateTime.now().plusDays(1),
                "SEQUENTIAL", 10, "FIXED", 600, 480, .7, .75, 480, 320, 1200, 900,
                true, true, true, false, 20L, "FIXED", null, null, null, null, null, 10.0, true, questions,
                Map.of("surveyTitle", "보안", "passingScore", 10.0, "validateRequiredQuestions", true,
                        "questions", questions, "useBackgroundOverlay", true));
    }

    @Test void inactiveUserIsForbidden() {
        when(wpfMapper.countActiveUser("E9999")).thenReturn(0);
        assertThrows(WpfUserInactiveException.class, () -> service.getPopupsForUser("E9999"));
        assertThrows(WpfUserInactiveException.class, () -> service.processResults("E9999", List.of()));
        verify(popupMapper, never()).selectAvailablePopups(anyString(), anyBoolean());
    }

    @Test void listExcludesCompletedAndHidesInternalFields() {
        PopupEntity entity = mock(PopupEntity.class);
        when(entity.questionTemplateId()).thenReturn(20L);
        when(entity.popupType()).thenReturn("QUIZ");   // [설계 12] QUIZ만 정답 키·통과 점수 포함
        when(popupMapper.selectAvailablePopups("E1001", true)).thenReturn(List.of(entity));
        var question = new PopupQuestionDto(1L, "Q", null, "SINGLE_CHOICE", true, true, BigDecimal.TEN, 1,
                List.of(new PopupOptionDto(10L, "1", "A", 1, null)), null, null);
        // [설계 12] WPF 로컬 채점: 목록은 정답 키 포함 문항을 1회 조회하고 QUIZ에만 그대로 내려준다
        when(popupService.loadQuestionsWithAnswerKey(List.of(20L))).thenReturn(Map.of(20L, List.of(question)));
        when(popupService.toPublicResponseDto(entity, List.of(question))).thenReturn(quizDto(List.of(question)));

        var response = service.getPopupsForUser("E1001");

        assertEquals("E1001", response.userId());
        assertEquals(1800, response.pollingIntervalSeconds());
        assertNotNull(response.serverTime());
        var item = response.popups().get(0);
        assertEquals("Q1", item.popupId());
        assertEquals(1, item.questions().size(), "문항은 최상위 questions에만");
        assertFalse(item.content().containsKey("questions"), "content.questions 중복 제거");
        assertFalse(item.content().containsKey("passingScore"), "content에는 두지 않고 최상위로");
        assertEquals(10.0, item.passingScore(), "[설계 12] QUIZ는 통과 점수를 최상위로 내려줌");
        assertFalse(item.content().containsKey("validateRequiredQuestions"));
        assertEquals("보안", item.content().get("surveyTitle"));
        assertEquals(true, item.content().get("useBackgroundOverlay"));
        // 완료 제외 플래그로 호출됐는지 (기준 2)
        verify(popupMapper).selectAvailablePopups("E1001", true);
        verify(popupMapper, never()).selectAvailablePopups("E1001", false);
    }

    /** [설계 12] 정답 키는 QUIZ에만. SURVEY는 정답 포함으로 조회된 문항에서 isCorrect/correctAnswer/answerMatchMode를 제거해 내려준다. */
    @Test void surveyQuestionsAreStrippedOfAnswerKeyAndPassingScore() {
        PopupEntity entity = mock(PopupEntity.class);
        when(entity.questionTemplateId()).thenReturn(20L);
        when(entity.popupType()).thenReturn("SURVEY");
        when(popupMapper.selectAvailablePopups("E1001", true)).thenReturn(List.of(entity));
        var withKey = new PopupQuestionDto(1L, "Q", null, "TEXT", true, true, BigDecimal.TEN, 1,
                List.of(new PopupOptionDto(10L, "1", "A", 1, true)), "정답", "EXACT");
        var stripped = new PopupQuestionDto(1L, "Q", null, "TEXT", true, true, BigDecimal.TEN, 1,
                List.of(new PopupOptionDto(10L, "1", "A", 1, null)), null, null);
        when(popupService.loadQuestionsWithAnswerKey(List.of(20L))).thenReturn(Map.of(20L, List.of(withKey)));
        when(popupService.toPublicResponseDto(entity, List.of(stripped))).thenReturn(
                new PopupResponseDto("S1", "SURVEY", "설문", OffsetDateTime.now(), OffsetDateTime.now().plusDays(1),
                        "SEQUENTIAL", 10, "FIXED", 600, 480, .7, .75, 480, 320, 1200, 900,
                        true, true, true, false, 20L, "FIXED", null, null, null, null, null, 10.0, true, List.of(stripped),
                        Map.of("surveyTitle", "설문", "passingScore", 10.0)));

        var item = service.getPopupsForUser("E1001").popups().get(0);

        assertEquals(stripped, item.questions().get(0), "SURVEY 문항에 정답 키 없음");
        assertNull(item.passingScore(), "SURVEY는 통과 점수 없음");
        assertEquals(List.of(stripped), WpfPopupItem.withoutAnswerKey(List.of(withKey)));
    }

    @Test void resultsAreIsolatedPerItemAndRejectionCodesMapped() {
        var ok = new WpfResultCommand("r-ok", "P1", WpfResultType.CLOSED, null, null, null, null, null, null);
        var notEligible = new WpfResultCommand("r-ne", "P2", WpfResultType.SUBMITTED, null, null, null, null, null, null);
        var badAnswer = new WpfResultCommand("r-ba", "P3", WpfResultType.SUBMITTED, null, null, null, null, null, null);
        var boom = new WpfResultCommand("r-boom", "P4", WpfResultType.VIDEO_WATCHED, null, null, null, null, null, null);

        when(processor.processOne("E1001", ok)).thenReturn(WpfResultItemResponse.accepted(ok).build());
        when(processor.processOne("E1001", notEligible))
                .thenThrow(new IllegalArgumentException("현재 사용자에게 제출 가능한 팝업이 아닙니다."));
        when(processor.processOne("E1001", badAnswer))
                .thenThrow(new IllegalArgumentException("현재 설문에 포함되지 않은 문항입니다. questionId=9"));
        when(processor.processOne("E1001", boom)).thenThrow(new IllegalStateException("db down"));

        var response = service.processResults("E1001", List.of(ok, notEligible, badAnswer, boom));

        assertEquals(4, response.results().size());
        assertEquals(WpfResultItemResponse.Status.ACCEPTED, response.results().get(0).status());
        assertEquals(WpfResultItemResponse.Status.REJECTED, response.results().get(1).status());
        assertEquals("WPF_NOT_ELIGIBLE", response.results().get(1).code());
        assertEquals("WPF_INVALID_ANSWER", response.results().get(2).code());
        assertEquals("WPF_INTERNAL", response.results().get(3).code());
        assertFalse(response.results().get(3).message().contains("db down"), "내부 오류 메시지 비노출");
        // 한 항목의 실패 뒤에도 다음 항목이 처리된다
        verify(processor, times(4)).processOne(eq("E1001"), any());
    }
}
