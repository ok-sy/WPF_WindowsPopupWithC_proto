package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import server.domain.popup.*;
import server.repo.core.mapper.popup.PopupMapper;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class PopupAdminQuestionsTest {
    private PopupMapper mapper;
    private PopupService service;

    @BeforeEach void setup() {
        mapper = mock(PopupMapper.class);
        service = spy(new PopupService(mapper, new ObjectMapper()));
        doReturn(null).when(service).getAdminPopup("TEST");
        when(mapper.upsertAdminPopupNotice(any())).thenReturn(1);
        when(mapper.upsertAdminPopupContent(any())).thenReturn(1);
        when(mapper.insertQuestionTemplate(anyString(), anyString(), anyString())).thenReturn(20L);
        when(mapper.insertAdminQuestion(eq(20L), any(), eq(true), anyInt(), anyString())).thenReturn(30L);
        when(mapper.insertAdminOption(anyLong(), any(), eq(true), anyInt(), anyString())).thenReturn(1);
    }

    private PopupResponseDto popup(List<PopupQuestionDto> questions) {
        return new PopupResponseDto("TEST", "QUIZ", "Quiz", OffsetDateTime.now(),
                OffsetDateTime.now().plusDays(1), "SEQUENTIAL", 100, "FIXED",
                560, 420, .7, .75, 480, 320, 1200, 900,
                true, true, true, false, 10L, "FIXED",
                null, null, null, null, null, 2.0, true, questions,
                Map.of("useBackgroundOverlay", true, "backgroundOverlayOpacity", .45));
    }

    private PopupQuestionDto question(boolean firstCorrect, boolean secondCorrect) {
        return new PopupQuestionDto(1L, "Question", null, "SINGLE_CHOICE", true, true,
                new BigDecimal("2.00"), 1,
                List.of(new PopupOptionDto(2L, "1", "A", 1, firstCorrect),
                        new PopupOptionDto(3L, "2", "B", 2, secondCorrect)), null, null);
    }

    private void existingQuestions() {
        when(mapper.selectQuestionsByTemplateIds(List.of(10L))).thenReturn(List.of(
                new PopupQuestionEntity(1L, 10L, "SINGLE_CHOICE", "Question", null,
                        "Y", "Y", new BigDecimal("2.00"), 1, null, null)));
        when(mapper.selectOptionsByQuestionIds(List.of(1L))).thenReturn(List.of(
                new PopupOptionEntity(2L, 1L, "1", "A", "Y", 1),
                new PopupOptionEntity(3L, 1L, "2", "B", "N", 2)));
    }

    @Test void changedQuestionsCreateTemplateAndPersistCorrectAnswer() {
        service.saveAdminPopup(popup(List.of(question(false, true))), false, List.of(), "admin");
        verify(mapper).insertQuestionTemplate("Quiz", "QUIZ", "admin");
        verify(mapper).insertAdminOption(eq(30L), argThat(o -> Boolean.FALSE.equals(o.isCorrect())), eq(true), eq(1), eq("admin"));
        verify(mapper).insertAdminOption(eq(30L), argThat(o -> Boolean.TRUE.equals(o.isCorrect())), eq(true), eq(2), eq("admin"));
        verify(mapper).upsertAdminPopupNotice(argThat(c -> c.questionTemplateId().equals(20L)));
        verify(mapper).upsertAdminPopupContent(argThat(c -> c.contentOptionsJson().contains("backgroundOverlayOpacity")));
    }

    @Test void unchangedQuestionsReuseExistingTemplate() {
        existingQuestions();
        PopupEntity existing = mock(PopupEntity.class);
        when(existing.popupType()).thenReturn("QUIZ");
        when(existing.questionTemplateId()).thenReturn(10L);
        when(mapper.selectAdminPopupById("TEST")).thenReturn(existing);
        service.saveAdminPopup(popup(List.of(question(true, false))), false, List.of(), "admin");
        verify(mapper, never()).insertQuestionTemplate(anyString(), anyString(), anyString());
        verify(mapper).upsertAdminPopupNotice(argThat(c -> c.questionTemplateId().equals(10L)));
    }

    @Test void missingCorrectAnswerDoesNotWriteAnything() {
        assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(
                popup(List.of(question(false, false))), false, List.of(), "admin"));
        verify(mapper, never()).upsertAdminPopupNotice(any());
        verify(mapper, never()).insertQuestionTemplate(anyString(), anyString(), anyString());
    }

    @Test void singleChoiceRejectsMultipleCorrectAnswers() {
        assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(
                popup(List.of(question(true, true))), false, List.of(), "admin"));
    }

    @Test void emptyQuizIsRejectedByCurrentQuestionRules() {
        assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(popup(List.of()), false, List.of(), "admin"));
        verify(mapper, never()).upsertAdminPopupNotice(any());
    }

    @Test void templateLookupRetainsCorrectAnswersForEditor() {
        existingQuestions();
        var entries = service.getAdminQuestions(10L);
        assertEquals(List.of("1"), entries.get(0).correctValues());
        assertTrue(entries.get(0).question().options().get(0).isCorrect());
    }

    @Test void mergedMapperHasNoDuplicateStatements() throws Exception {
        String resource = "mappers/popup/PopupMapper.xml";
        var configuration = new Configuration();
        try (var stream = getClass().getClassLoader().getResourceAsStream(resource)) {
            assertNotNull(stream);
            new XMLMapperBuilder(stream, configuration, resource, configuration.getSqlFragments()).parse();
        }
        assertTrue(configuration.hasStatement(PopupMapper.class.getName() + ".selectAdminQuestionTemplates"));
        assertTrue(configuration.hasStatement(PopupMapper.class.getName() + ".insertAdminQuestion"));
    }
}
