package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupEntity;
import server.domain.popup.PopupOptionEntity;
import server.domain.popup.PopupQuestionEntity;
import server.domain.popup.PopupSubmissionContext;
import server.domain.popup.PopupSubmitAnswer;
import server.repo.core.mapper.popup.PopupMapper;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * POL-06-02 : 선택·제출
 * ■ SURVEY 복수 선택 최소·최대 선택 수 제출 검증 테스트(PU001 B-4)
 * - 서버도 WPF 화면 제한과 같은 기준(최대 ≤ max, 필수는 max(1, min) 이상, 선택 문항은 0개 또는 min 이상)으로 거절한다.
 * - 거절 메시지에 "문항"이 들어가 WPF_INVALID_ANSWER로 분류된다.
 */
class PopupSubmitSelectionCountTest {
    private static final List<Long> OPTION_IDS = List.of(10L, 11L, 12L, 13L);

    private PopupMapper mapper;
    private PopupService service;

    /** 선택지 4개, 최소 2·최대 3인 SURVEY 복수 선택 문항 하나로 구성한다. */
    private void setup(String requiredYn, Integer min, Integer max) {
        mapper = mock(PopupMapper.class);
        service = new PopupService(mapper, new ObjectMapper());
        PopupEntity popup = mock(PopupEntity.class);
        when(popup.popupId()).thenReturn("S1");
        when(mapper.selectAvailablePopups("E1001")).thenReturn(List.of(popup));
        when(mapper.selectSubmissionContext("E1001", "S1", true))
                .thenReturn(new PopupSubmissionContext("S1", "SURVEY", 20L, null));
        when(mapper.selectQuestionsByTemplateIds(List.of(20L))).thenReturn(List.of(new PopupQuestionEntity(
                1L, 20L, "MULTIPLE_CHOICE", "문항", null, requiredYn, "N", null, 1, null, null, "VERTICAL",
                null, null, min, max)));
        when(mapper.selectOptionsByQuestionIds(List.of(1L))).thenReturn(OPTION_IDS.stream()
                .map(id -> new PopupOptionEntity(id, 1L, "V" + id, "선택지" + id, "N", (int) (id - 9)))
                .toList());
        when(mapper.upsertPopupResponse(any(), any(), any(), any(), any(), any())).thenReturn(5001L);
        when(mapper.insertResponseAnswer(any(), any(), any(), any(), any(), any())).thenReturn(7001L);
    }

    private void submit(int count) {
        service.submitResponse("S1", "r-1", "E1001",
                List.of(new PopupSubmitAnswer(1L, null, OPTION_IDS.subList(0, count))), null, null);
    }

    private String rejected(int count) {
        return assertThrows(IllegalArgumentException.class, () -> submit(count)).getMessage();
    }

    /** 최대 초과는 거절하고 저장하지 않는다. */
    @Test void overMaximumIsRejected() {
        setup("Y", 2, 3);
        String message = rejected(4);
        assertTrue(message.contains("최대 3개") && message.contains("문항"), message);
        verify(mapper, never()).upsertPopupResponse(any(), any(), any(), any(), any(), any());
    }

    /** 최소 미달은 거절한다(필수 문항). */
    @Test void underMinimumIsRejected() {
        setup("Y", 2, 3);
        String message = rejected(1);
        assertTrue(message.contains("최소 2개") && message.contains("문항"), message);
        verify(mapper, never()).upsertPopupResponse(any(), any(), any(), any(), any(), any());
    }

    /** 경계값(최소·최대와 같은 수)은 저장한다. */
    @Test void boundaryCountsAreAccepted() {
        for (int count : new int[] {2, 3}) {
            setup("Y", 2, 3);
            assertDoesNotThrow(() -> submit(count));
            verify(mapper).markPopupCompleted("E1001", "S1", "Y");
        }
    }

    /** 선택 문항은 0개(미응답)를 허용하고, 1개 이상 고르면 최소를 지켜야 한다. */
    @Test void optionalQuestionAllowsZeroButNotUnderMinimum() {
        setup("N", 2, 3);
        assertDoesNotThrow(() -> submit(0));
        setup("N", 2, 3);
        assertTrue(rejected(1).contains("최소 2개"));
    }

    /** 필수 문항의 0개는 기존 필수 답안 검사로 거절한다(최소 미지정이어도 1개 이상). */
    @Test void requiredQuestionStillNeedsAtLeastOne() {
        setup("Y", null, null);
        assertTrue(rejected(0).contains("필수 문항"));
    }

    /** 제한이 없으면(null) 모든 선택지를 골라도 저장한다. */
    @Test void noLimitAcceptsAnyCount() {
        setup("N", null, null);
        assertDoesNotThrow(() -> submit(4));
    }
}
