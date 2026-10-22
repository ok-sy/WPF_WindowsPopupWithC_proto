package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupOptionEntity;
import server.domain.popup.PopupQuestionEntity;
import server.domain.popup.PopupSubmissionContext;
import server.domain.popup.PopupSubmitAnswer;
import server.domain.popup.VideoPopupContext;
import server.repo.core.mapper.popup.PopupMapper;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * POL-10-02 : 검증·원자성
 * ■ 전달 건 결과 수용 경로 테스트
 * - 이미 전달한 건의 제출·시청 결과 수용 경로(submitDeliveredResponse·saveDeliveredVideoProgress)를 DB 없이 검증한다.
 *
 * <p>게시중단(활성 해제·기간 종료·대상 변경) 뒤에는 신규 조회의 노출 후보(selectAvailablePopups)에서 팝업이 빠지고,
 * 활성 해제·기간 종료는 게시 조건을 확인하는 문맥 조회(requirePublished=true)도 비게 된다. mock은 이 상태를 그대로 재현하고
 * (게시 조건 없는 문맥 requirePublished=false만 행을 돌려줌) 전달 건 경로가 이를 다시 따지지 않는지 확인한다.
 * 실제 SQL 조건별 재현은 WpfDeliveredResultDatabaseTest(로컬 Oracle)가 맡는다.</p>
 */
class PopupDeliveredResultTest {

    private PopupMapper mapper;
    private PopupService service;
    private final List<PopupSubmitAnswer> answers = List.of(new PopupSubmitAnswer(1L, null, List.of(10L)));

    @BeforeEach void setup() {
        mapper = mock(PopupMapper.class);
        service = new PopupService(mapper, new ObjectMapper());
        // 게시중단: 노출 후보 없음, 게시 조건 문맥 없음
        when(mapper.selectAvailablePopups(anyString())).thenReturn(List.of());
        when(mapper.selectAvailablePopups(anyString(), anyBoolean())).thenReturn(List.of());
        when(mapper.selectQuestionsByTemplateIds(List.of(20L))).thenReturn(List.of(new PopupQuestionEntity(
                1L, 20L, "SINGLE_CHOICE", "문항", null, "Y", "Y", BigDecimal.TEN, 1, null, null, "VERTICAL")));
        when(mapper.selectOptionsByQuestionIds(List.of(1L))).thenReturn(List.of(
                new PopupOptionEntity(10L, 1L, "A", "정답", "Y", 1),
                new PopupOptionEntity(11L, 1L, "B", "오답", "N", 2)));
        when(mapper.upsertPopupResponse(any(), any(), any(), any(), any(), any())).thenReturn(5001L);
        when(mapper.insertResponseAnswer(any(), any(), any(), any(), any(), any())).thenReturn(7001L);
        when(mapper.upsertVideoProgress(any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
    }

    /** 게시중단 뒤에도 전달 건 제출은 노출 자격 재검사 없이 저장한다. */
    @Test void deliveredSubmissionIsAcceptedAfterUnpublishWithoutEligibilityCheck() {
        for (String type : List.of("SURVEY", "QUIZ")) {
            setup();   // 유형마다 새 mock
            when(mapper.selectSubmissionContext("E1001", "Q1", false))
                    .thenReturn(new PopupSubmissionContext("Q1", type, 20L, BigDecimal.TEN));
            var result = service.submitDeliveredResponse("Q1", "r-1", "E1001", answers, 10.0, true);
            assertTrue(result.passed(), type);
            verify(mapper).markPopupCompleted("E1001", "Q1", "Y");
            verify(mapper, never()).selectAvailablePopups(anyString());
            verify(mapper, never()).selectAvailablePopups(anyString(), anyBoolean());
            verify(mapper, never()).selectSubmissionContext(any(), any(), eq(true));
        }
    }

    /** 대조: 게시 조건을 다시 검사하는 기존 경로는 같은 상태에서 거절한다(전달 건 없는 제출용 동작 유지). */
    @Test void publishedSubmissionPathStillRejectsUnpublishedPopup() {
        when(mapper.selectSubmissionContext("E1001", "Q1", false))
                .thenReturn(new PopupSubmissionContext("Q1", "SURVEY", 20L, null));
        assertTrue(assertThrows(IllegalArgumentException.class,
                () -> service.submitResponse("Q1", "r-1", "E1001", answers, null, null))
                .getMessage().contains("제출 가능한 팝업이 아닙니다"));
        verify(mapper, never()).upsertPopupResponse(any(), any(), any(), any(), any(), any());
    }

    /** 팝업 행 삭제(또는 비활성 사용자)면 게시 조건 없는 문맥도 없으므로 WPF_NOT_ELIGIBLE 메시지로 거절한다. */
    @Test void deliveredSubmissionRejectsDeletedPopup() {
        assertTrue(assertThrows(IllegalArgumentException.class,
                () -> service.submitDeliveredResponse("Q1", "r-1", "E1001", answers, 10.0, true))
                .getMessage().contains("제출 가능한 팝업이 아닙니다"));
        verify(mapper, never()).upsertPopupResponse(any(), any(), any(), any(), any(), any());
        verify(mapper, never()).markPopupCompleted(any(), any(), any());
    }

    /** 유형 불일치 검증은 전달 건 경로에서도 유지한다. */
    @Test void deliveredSubmissionStillChecksPopupType() {
        when(mapper.selectSubmissionContext("E1001", "Q1", false))
                .thenReturn(new PopupSubmissionContext("Q1", "TEXT", null, null));
        assertTrue(assertThrows(IllegalArgumentException.class,
                () -> service.submitDeliveredResponse("Q1", "r-1", "E1001", answers, null, null))
                .getMessage().contains("설문형 팝업만"));
    }

    /** 게시중단 뒤에도 전달 건 영상 시청 결과를 저장한다. */
    @Test void deliveredVideoProgressIsAcceptedAfterUnpublish() {
        when(mapper.selectVideoPopupContext("E1001", "V1", false))
                .thenReturn(new VideoPopupContext("V1", "VIDEO", new BigDecimal("0.9")));
        var response = service.saveDeliveredVideoProgress("V1", "E1001", new BigDecimal("100"), new BigDecimal("100"),
                new BigDecimal("100"), new BigDecimal("95"));
        assertTrue(response.completed());
        verify(mapper).markPopupCompleted("E1001", "V1", "Y");
        verify(mapper, never()).selectVideoPopupContext(any(), any(), eq(true));

        // 대조: 게시 조건을 확인하는 기존 경로는 같은 상태에서 거절
        assertThrows(IllegalArgumentException.class, () -> service.saveVideoProgress("V1", "E1001",
                new BigDecimal("100"), new BigDecimal("100"), new BigDecimal("100"), new BigDecimal("95")));
    }

    /** 팝업 행이 삭제됐으면 전달 건 영상 시청 결과를 거절한다. */
    @Test void deliveredVideoProgressRejectsDeletedPopup() {
        assertTrue(assertThrows(IllegalArgumentException.class, () -> service.saveDeliveredVideoProgress("V1", "E1001",
                new BigDecimal("100"), new BigDecimal("100"), new BigDecimal("100"), new BigDecimal("95")))
                .getMessage().contains("유효한 영상 팝업이 아닙니다"));
        verify(mapper, never()).upsertVideoProgress(any(), any(), any(), any(), any(), any(), any(), any());
    }
}
