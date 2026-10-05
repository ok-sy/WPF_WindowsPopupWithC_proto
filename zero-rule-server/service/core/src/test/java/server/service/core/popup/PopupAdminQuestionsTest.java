package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.ibatis.builder.xml.XMLMapperBuilder;
import org.apache.ibatis.session.Configuration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import server.domain.popup.*;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.PopupSchema;
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
                560.0, 420.0, .7, .75, 480, 320, 1200, 900,
                true, true, true, false, 10L, "FIXED",
                null, null, null, null, null, 2.0, true, questions,
                Map.of("useBackgroundOverlay", true, "backgroundOverlayOpacity", .45));
    }

    private PopupQuestionDto question(boolean firstCorrect, boolean secondCorrect) {
        return new PopupQuestionDto(1L, "Question", null, "SINGLE_CHOICE", true, true,
                new BigDecimal("2.00"), 1,
                List.of(new PopupOptionDto(2L, "1", "A", 1, firstCorrect),
                        new PopupOptionDto(3L, "2", "B", 2, secondCorrect)), null, null, "VERTICAL");
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

    private PopupResponseDto imagePopup(String imageSizeMode) {
        return new PopupResponseDto("TEST", "IMAGE", "Image", OffsetDateTime.now(),
                OffsetDateTime.now().plusDays(1), "SEQUENTIAL", 100, "FIXED",
                ("ORIGINAL".equals(imageSizeMode) ? 560.0 : null), ("ORIGINAL".equals(imageSizeMode) ? 420.0 : null), .7, .75, 480, 320, 1200, 900,
                true, true, true, false, null, "FIXED",
                null, null, null, null, null, null, true, List.of(),
                Map.of("imageUrl", "https://example.com/a.png", "imageSizeMode", imageSizeMode));
    }

    // [설계 18 L-1] 과거 IMAGE 크기 모드 FIXED는 저장하지 않는다.
    @Test void imagePopupRejectsLegacyFixedImageSizeMode() {
        assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(
                imagePopup("FIXED"), false, List.of(), "admin"));
        verify(mapper, never()).upsertAdminPopupNotice(any());
    }

    @Test void imagePopupAcceptsCurrentImageSizeModes() {
        for (String mode : List.of("ADAPTIVE", "fit_to_image", "ORIGINAL")) {
            service.saveAdminPopup(imagePopup(mode), false, List.of(), "admin");
        }
        verify(mapper, times(3)).upsertAdminPopupNotice(any());
    }

    private PopupResponseDto imageWithContent(String mode, Map<String, Object> extras, Double topWidth) {
        var base = imagePopup(mode);
        var content = new java.util.HashMap<>(base.content());
        content.putAll(extras);
        return new PopupResponseDto(base.popupId(), base.popupType(), base.title(), base.displayStartAt(),
                base.displayEndAt(), base.displayMode(), base.displayOrder(), base.sizeMode(),
                topWidth, base.height(), base.widthRatio(), base.heightRatio(), base.minimumWidth(), base.minimumHeight(),
                base.maximumWidth(), base.maximumHeight(), base.showHeader(), base.showCloseButton(), base.showFooter(),
                base.showDoNotShowAgain(), null, base.periodMode(), null, null, null, null, null, null,
                true, List.of(), content);
    }

    @Test void imageScreenPolicyAllowsMinimumAboveStoredLegacyMaximum() {
        var base = imagePopup("ADAPTIVE");
        var large = new PopupResponseDto(base.popupId(), base.popupType(), base.title(), base.displayStartAt(),
                base.displayEndAt(), base.displayMode(), base.displayOrder(), base.sizeMode(),
                base.width(), base.height(), base.widthRatio(), base.heightRatio(), 2000, 1500,
                1200, 900, base.showHeader(), base.showCloseButton(), base.showFooter(), base.showDoNotShowAgain(),
                null, base.periodMode(), null, null, null, null, null, null, true, List.of(), base.content());
        service.saveAdminPopup(large, false, List.of(), "admin");
        verify(mapper).upsertAdminPopupNotice(any());
    }

    @Test void image23RejectsRetiredFieldsInvalidDimensionsAndDuplicateInstructions() {
        for (String key : List.of("imageWidth", "imageHeight", "descriptionPosition", "imageAreaRatio"))
            assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(
                    imageWithContent("ADAPTIVE", Map.of(key, 1), null), false, List.of(), "admin"));
        for (Object value : List.of(0, -1, Double.NaN, Double.POSITIVE_INFINITY, "600"))
            assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(
                    imageWithContent("FIT_TO_IMAGE", Map.of("width", value), null), false, List.of(), "admin"));
        assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(
                imageWithContent("ADAPTIVE", Map.of("keepAspectRatio", true), null), false, List.of(), "admin"));
        assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(
                imageWithContent("FIT_TO_IMAGE", Map.of("keepAspectRatio", "false"), null), false, List.of(), "admin"));
        assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(imagePopup("FILL"), false, List.of(), "admin"));
        assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(
                imageWithContent("ADAPTIVE", Map.of("width", 600), 600.0), false, List.of(), "admin"));
        verify(mapper, never()).upsertAdminPopupNotice(any());
    }

    @Test void image23StoresOversizedUnlockedImageAndOmitsTopLevelDimensions() throws Exception {
        var popup = imageWithContent("FIT_TO_IMAGE", Map.of("width", 5000, "height", 3000, "keepAspectRatio", false), null);
        service.saveAdminPopup(popup, false, List.of(), "admin");
        verify(mapper).upsertAdminPopupContent(argThat(c -> c.contentOptionsJson().contains("5000")
                && c.contentOptionsJson().contains("\"keepAspectRatio\":false")));
        var json = new ObjectMapper().findAndRegisterModules().valueToTree(server.domain.popup.wpf.WpfPopupItem.from(popup, false));
        assertFalse(json.has("width"));
        assertFalse(json.has("height"));
        assertEquals(5000, json.path("content").path("width").asInt());
    }

    // [설계 18 L-5 — W-10] 편집 가능해진 설명 배치 옵션은 WPF가 받는 값만 저장한다.
    @Test void imagePopupValidatesDescriptionLayoutOptions() {
        java.util.function.Function<Map<String, Object>, PopupResponseDto> withContent = extra -> {
            var base = imagePopup("ADAPTIVE");
            var content = new java.util.HashMap<>(base.content());
            content.putAll(extra);
            return new PopupResponseDto(base.popupId(), base.popupType(), base.title(), base.displayStartAt(),
                    base.displayEndAt(), base.displayMode(), base.displayOrder(), base.sizeMode(),
                    base.width(), base.height(), base.widthRatio(), base.heightRatio(),
                    base.minimumWidth(), base.minimumHeight(), base.maximumWidth(), base.maximumHeight(),
                    base.showHeader(), base.showCloseButton(), base.showFooter(), base.showDoNotShowAgain(),
                    base.questionTemplateId(), base.periodMode(), base.repeatInterval(), base.repeatDayOfWeek(),
                    base.repeatDayOfMonth(), base.hideDays(), base.completionRatio(), base.passingScore(),
                    base.allowCloseBeforeComplete(), base.questions(), content);
        };
        assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(
                withContent.apply(Map.of("descriptionPosition", "LEFT")), false, List.of(), "admin"));
        assertThrows(IllegalArgumentException.class, () -> service.saveAdminPopup(
                withContent.apply(Map.of("imageAreaRatio", 0.95)), false, List.of(), "admin"));
        service.saveAdminPopup(withContent.apply(Map.of("width", 600, "height", 400)),
                false, List.of(), "admin");
        verify(mapper, times(1)).upsertAdminPopupNotice(any());
    }

    // [설계 18 L-3] 정규 컬럼 값은 컬럼에만 저장하고 CONTENT_OPTIONS에는 확장 옵션만 남긴다.
    @Test void saveStoresColumnValuesOutsideContentOptions() {
        service.saveAdminPopup(imagePopup("ADAPTIVE"), false, List.of(), "admin");
        verify(mapper).upsertAdminPopupContent(argThat(c -> "https://example.com/a.png".equals(c.mediaUrl())
                && !c.contentOptionsJson().contains("imageUrl")
                && c.contentOptionsJson().contains("imageSizeMode")));
    }

    @Test void templateLookupRetainsCorrectAnswersForEditor() {
        existingQuestions();
        var entries = service.getAdminQuestions(10L);
        assertTrue(entries.get(0).question().options().get(0).isCorrect());
    }

    @Test void mergedMapperHasNoDuplicateStatements() throws Exception {
        String resource = "mappers/popup/PopupMapper.xml";
        var configuration = new Configuration();
        // [ì¤í¤ë§ ë¶ë¦¬ ì¤ì í] ë§¤í¼ì ${popupSchemaPrefix} ë³ì. íê²½ë³ì POPUP_TEST_DB_SCHEMA(ê¸°ë³¸ POPUP, ë¹ ê° = ì ì ê³ì  ì¤í¤ë§)
        configuration.setVariables(PopupSchema.variables(System.getenv().getOrDefault("POPUP_TEST_DB_SCHEMA", PopupSchema.DEFAULT_SCHEMA)));
        try (var stream = getClass().getClassLoader().getResourceAsStream(resource)) {
            assertNotNull(stream);
            new XMLMapperBuilder(stream, configuration, resource, configuration.getSqlFragments()).parse();
        }
        assertTrue(configuration.hasStatement(PopupMapper.class.getName() + ".selectAdminQuestionTemplates"));
        assertTrue(configuration.hasStatement(PopupMapper.class.getName() + ".insertAdminQuestion"));
    }
}
