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
