package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupResponseDto;
import server.domain.popup.VideoPopupContext;
import server.repo.core.mapper.popup.PopupMapper;
import java.math.BigDecimal;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PopupActionOptionsTest {
    private PopupResponseDto popup(String type, Map<String, Object> content) {
        PopupResponseDto dto = mock(PopupResponseDto.class);
        when(dto.popupType()).thenReturn(type);
        when(dto.content()).thenReturn(content);
        return dto;
    }

    @Test void footerLinkAcceptsWebUrlsAndRejectsExecutableOrMissingUrls() {
        for (String url : new String[]{"http://intranet/training", "https://example.com/path?q=1"}) {
            assertDoesNotThrow(() -> PopupService.validateActionOptions(popup("TEXT",
                    Map.of("footerAction", "LINK_AND_CLOSE", "footerLinkUrl", url))));
        }
        for (String url : new String[]{"", "javascript:alert(1)", "file:///C:/test.exe", "https:///no-host"}) {
            assertThrows(IllegalArgumentException.class, () -> PopupService.validateActionOptions(popup("TEXT",
                    Map.of("footerAction", "LINK_AND_CLOSE", "footerLinkUrl", url))));
        }
        assertDoesNotThrow(() -> PopupService.validateActionOptions(popup("TEXT", Map.of())));
        assertThrows(IllegalArgumentException.class, () -> PopupService.validateActionOptions(popup("TEXT",
                Map.of("footerAction", "UNKNOWN"))));
    }

    /** [설계 30·34-35] SUBMIT은 설문·퀴즈 전용이고, 설문·퀴즈에 CLOSE·LINK_AND_CLOSE를 명시하면 거부한다. 저장 시 키는 남기지 않는다. */
    @Test void footerActionPolicyByPopupType() {
        assertThrows(IllegalArgumentException.class, () -> PopupService.validateActionOptions(popup("TEXT",
                Map.of("footerAction", "SUBMIT"))));
        for (String type : new String[]{"SURVEY", "QUIZ"}) {
            assertDoesNotThrow(() -> PopupService.validateActionOptions(popup(type, Map.of())));
            assertDoesNotThrow(() -> PopupService.validateActionOptions(popup(type, Map.of("footerAction", "SUBMIT"))));
            for (String wrong : new String[]{"CLOSE", "LINK_AND_CLOSE"}) {
                assertThrows(IllegalArgumentException.class, () -> PopupService.validateActionOptions(popup(type,
                        Map.of("footerAction", wrong, "footerLinkUrl", "https://example.com/"))), type + "/" + wrong);
            }
            for (String action : new String[]{"SUBMIT", "CLOSE", "LINK_AND_CLOSE"}) {
                var stored = PopupService.storedOptions(type, Map.of("footerAction", action,
                        "footerLinkUrl", "https://example.com/", "surveyTitle", "t", "useBackgroundOverlay", true));
                assertFalse(stored.containsKey("footerAction") || stored.containsKey("footerLinkUrl"), type + "/" + action);
                assertEquals(true, stored.get("useBackgroundOverlay"));
            }
            assertThrows(IllegalArgumentException.class, () -> PopupService.validateActionOptions(popup(type,
                    Map.of("footerAction", "OPEN"))));
        }
        var link = PopupService.storedOptions("IMAGE", Map.of("footerAction", "LINK_AND_CLOSE", "footerLinkUrl", " https://example.com/ "));
        assertEquals("LINK_AND_CLOSE", link.get("footerAction"));
        assertEquals("https://example.com/", link.get("footerLinkUrl"));
        var close = PopupService.storedOptions("VIDEO", Map.of("footerAction", "CLOSE", "footerLinkUrl", "https://example.com/"));
        assertFalse(close.containsKey("footerAction") || close.containsKey("footerLinkUrl"), "CLOSE는 기본값이라 저장하지 않는다");
    }

    /** [설계 31] Overlay·위치 저장 검증. 값이 없으면 통과하고 WPF 응답에서 기본값을 쓴다. */
    @Test void windowOptionsValidation() {
        assertDoesNotThrow(() -> PopupService.validateWindowOptions(Map.of()));
        assertDoesNotThrow(() -> PopupService.validateWindowOptions(Map.of("useBackgroundOverlay", false,
                "backgroundOverlayOpacity", 0, "popupPosition", "BOTTOM_RIGHT")));
        assertDoesNotThrow(() -> PopupService.validateWindowOptions(Map.of("backgroundOverlayOpacity", 1.0)));
        for (Map<String, Object> bad : java.util.List.<Map<String, Object>>of(
                Map.of("useBackgroundOverlay", "true"), Map.of("backgroundOverlayOpacity", 1.5),
                Map.of("backgroundOverlayOpacity", -0.1), Map.of("backgroundOverlayOpacity", "0.5"),
                Map.of("popupPosition", "MIDDLE"), Map.of("popupPosition", "center"))) {
            assertThrows(IllegalArgumentException.class, () -> PopupService.validateWindowOptions(bad), bad.toString());
        }
    }

    @Test void combinedQuizRequiresTrackableVideoAndQuizType() {
        assertDoesNotThrow(() -> PopupService.validateActionOptions(popup("QUIZ",
                Map.of("videoEnabled", true, "videoUrl", "https://example.com/training.mp4"))));
        assertThrows(IllegalArgumentException.class, () -> PopupService.validateActionOptions(popup("SURVEY",
                Map.of("videoEnabled", true, "videoUrl", "https://example.com/training.mp4"))));
        assertThrows(IllegalArgumentException.class, () -> PopupService.validateActionOptions(popup("QUIZ",
                Map.of("videoEnabled", true))));
    }

    @Test void allowSeekAcceptsOnlyBooleanAndIsStoredAsContentOption() {
        for (String type : new String[]{"VIDEO", "QUIZ"}) {
            assertDoesNotThrow(() -> PopupService.validateActionOptions(popup(type, Map.of("allowSeek", false))));
            assertDoesNotThrow(() -> PopupService.validateActionOptions(popup(type, Map.of("allowSeek", true))));
            assertThrows(IllegalArgumentException.class, () -> PopupService.validateActionOptions(popup(type,
                    Map.of("allowSeek", "false"))));
            assertThrows(IllegalArgumentException.class, () -> PopupService.validateActionOptions(popup(type,
                    Map.of("allowSeek", 0))));
        }
        assertEquals(false, PopupContentAssembler.withoutStoredCopies(Map.of("allowSeek", false)).get("allowSeek"));
    }

    @Test void watchingQuizVideoDoesNotCompleteTheQuiz() {
        PopupMapper mapper = mock(PopupMapper.class);
        PopupService service = new PopupService(mapper, new ObjectMapper());
        when(mapper.selectVideoPopupContext("E1", "P1"))
                .thenReturn(new VideoPopupContext("P1", "QUIZ", new BigDecimal("0.8")));
        when(mapper.upsertVideoProgress(any(), any(), any(), any(), any(), any(), any(), any())).thenReturn(1);
        var response = service.saveVideoProgress("P1", "E1", new BigDecimal("100"), new BigDecimal("80"),
                new BigDecimal("80"), new BigDecimal("80"));
        assertTrue(response.completed());
        verify(mapper, never()).markPopupCompleted(any(), any(), any());
        when(mapper.selectVideoPopupContext("E1", "P1"))
                .thenReturn(new VideoPopupContext("P1", "VIDEO", new BigDecimal("0.8")));
        service.saveVideoProgress("P1", "E1", new BigDecimal("100"), new BigDecimal("80"),
                new BigDecimal("80"), new BigDecimal("80"));
        verify(mapper).markPopupCompleted("E1", "P1", "Y");
    }
}
