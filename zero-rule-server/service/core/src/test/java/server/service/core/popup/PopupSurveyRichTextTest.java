package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import server.domain.popup.*;
import server.domain.popup.wpf.WpfPopupItem;
import server.repo.core.mapper.popup.PopupMapper;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * [TODO55-4] SURVEY·QUIZ 서식 필드(콘텐츠 제목·설명, 문항 제목·설명, 선택지 문구)의 검증·일반 문자열 파생·저장·재조회.
 */
class PopupSurveyRichTextTest {
    private static final ObjectMapper JSON = new ObjectMapper();
    private PopupMapper mapper;
    private PopupService service;

    @BeforeEach void setup() {
        mapper = mock(PopupMapper.class);
        service = spy(new PopupService(mapper, JSON));
        doReturn(null).when(service).getAdminPopup("TEST");
        when(mapper.upsertAdminPopupNotice(any())).thenReturn(1);
        when(mapper.upsertAdminPopupContent(any())).thenReturn(1);
        when(mapper.insertQuestionTemplate(anyString(), anyString(), anyString())).thenReturn(20L);
        when(mapper.insertAdminQuestion(eq(20L), any(), any(), any(), anyBoolean(), anyInt(), anyString())).thenReturn(30L);
        when(mapper.insertAdminOption(anyLong(), any(), any(), anyBoolean(), anyInt(), anyString())).thenReturn(1);
    }

    /** 문단 하나에 구간 여러 개. 구간은 [text, bold] 쌍. */
    private static List<Object> blocks(Object... textAndBold) {
        List<Object> runs = new java.util.ArrayList<>();
        for (int i = 0; i < textAndBold.length; i += 2) {
            Map<String, Object> run = new LinkedHashMap<>();
            run.put("text", textAndBold[i]);
            if (Boolean.TRUE.equals(textAndBold[i + 1])) run.put("bold", true);
            runs.add(run);
        }
        Map<String, Object> block = new LinkedHashMap<>();
        block.put("alignment", "LEFT");
        block.put("runs", runs);
        return List.of(block);
    }

    private static List<Object> emptyParagraph() {
        return List.of(Map.of("alignment", "LEFT", "runs", List.of()));
    }

    private static PopupQuestionDto question(String title, List<Object> titleBlocks, List<Object> optionBlocks) {
        return new PopupQuestionDto(1L, title, "설명", "SINGLE_CHOICE", true, false, null, 1,
                List.of(new PopupOptionDto(2L, "1", "stale", 1, false, optionBlocks),
                        new PopupOptionDto(3L, "2", "B", 2, false, null)),
                null, null, "VERTICAL", titleBlocks, null);
    }

    private static PopupResponseDto popup(String type, List<PopupQuestionDto> questions, Map<String, Object> content) {
        return new PopupResponseDto("TEST", type, "설문", OffsetDateTime.now(),
                OffsetDateTime.now().plusDays(1), "SEQUENTIAL", 100, "FIXED",
                560.0, 420.0, .7, .75, 480, 320, 1200, 900,
                true, true, true, false, false, null, "FIXED",
                null, null, null, null, null, null, questions, content);
    }

    @Test void questionAndOptionPlainTextIsDerivedFromBlocks() {
        PopupQuestionDto normalized = PopupSurveyRichText.normalizeQuestion(
                question("client title", blocks("만족", true, "도", false), blocks("매우 ", false, "그렇다", true)));
        assertEquals("만족도", normalized.title(), "title comes from titleBlocks, not the client value");
        assertEquals("매우 그렇다", normalized.options().get(0).text());
        assertNotNull(normalized.titleBlocks());
        assertNull(normalized.descriptionBlocks(), "missing description blocks stay null");
        assertEquals("설명", normalized.description(), "plain description is kept without blocks");
        assertEquals("B", normalized.options().get(1).text());
    }

    @Test void emptyOrBlankBlocksMeanNoFormatting() {
        for (List<Object> none : java.util.Arrays.asList(null, List.of(), emptyParagraph())) {
            PopupQuestionDto normalized = PopupSurveyRichText.normalizeQuestion(question("원래 제목", none, none));
            assertNull(normalized.titleBlocks());
            assertEquals("원래 제목", normalized.title());
            assertNull(normalized.options().get(0).textBlocks());
            assertEquals("stale", normalized.options().get(0).text());
        }
    }

    /** [TODO63] 공용 검증을 쓰는 문항·선택지 서식도 6단계 이상 들여쓰기를 그대로 유지한다. */
    @SuppressWarnings("unchecked")
    @Test void questionAndOptionIndentAboveFiveIsKept() {
        Map<String, Object> title = new LinkedHashMap<>((Map<String, Object>) blocks("제목", false).get(0));
        title.put("indent", 6);
        Map<String, Object> option = new LinkedHashMap<>((Map<String, Object>) blocks("선택지", false).get(0));
        option.put("indent", 11);
        PopupQuestionDto normalized = PopupSurveyRichText.normalizeQuestion(question("t", List.of(title), List.of(option)));
        assertEquals(6, ((Map<?, ?>) normalized.titleBlocks().get(0)).get("indent"));
        assertEquals(11, ((Map<?, ?>) normalized.options().get(0).textBlocks().get(0)).get("indent"));
        Map<String, Object> negative = new LinkedHashMap<>(option);
        negative.put("indent", -1);
        assertThrows(IllegalArgumentException.class,
                () -> PopupSurveyRichText.normalizeQuestion(question("t", null, List.of(negative))));
    }

    @Test void invalidOrTooLongBlocksAreRejectedWithFieldName() {
        List<Object> badColor = List.of(Map.of("alignment", "LEFT",
                "runs", List.of(Map.of("text", "A", "color", "red"))));
        IllegalArgumentException color = assertThrows(IllegalArgumentException.class,
                () -> PopupSurveyRichText.normalizeQuestion(question("t", null, badColor)));
        assertTrue(color.getMessage().startsWith("선택지 내용 서식"), color.getMessage());
        IllegalArgumentException length = assertThrows(IllegalArgumentException.class,
                () -> PopupSurveyRichText.normalizeQuestion(question("t", blocks("가".repeat(1001), false), null)));
        assertTrue(length.getMessage().contains("1000자"), length.getMessage());
    }

    @Test void contentTitleAndDescriptionAreDerivedAndOtherTypesAreRejected() {
        Map<String, Object> content = new LinkedHashMap<>();
        content.put("surveyTitle", "old");
        content.put("surveyTitleBlocks", blocks("교육 ", false, "만족도", true));
        content.put("description", "설명");
        content.put("descriptionBlocks", List.of());
        PopupResponseDto normalized = PopupSurveyRichText.normalize(popup("SURVEY", List.of(), content));
        assertEquals("교육 만족도", normalized.content().get("surveyTitle"));
        assertFalse(normalized.content().containsKey("descriptionBlocks"), "empty description blocks are dropped");
        assertEquals("설명", normalized.content().get("description"));
        assertThrows(IllegalArgumentException.class, () -> PopupSurveyRichText.normalize(
                popup("IMAGE", List.of(), Map.of("descriptionBlocks", blocks("x", false)))));
    }

    @Test void saveStoresDerivedTextAndBlocksJson() throws Exception {
        Map<String, Object> content = new LinkedHashMap<>(Map.of("surveyTitle", "old"));
        content.put("surveyTitleBlocks", blocks("교육 ", false, "만족도", true));
        service.saveAdminPopup(popup("SURVEY",
                List.of(question("client", blocks("문항", true), blocks("매우 ", false, "그렇다", true))), content),
                false, List.of(), "admin");
        verify(mapper).insertAdminQuestion(eq(20L), argThat(q -> "문항".equals(q.title())),
                argThat(json -> json != null && json.startsWith("[{\"alignment\":\"LEFT\"") && json.contains("\"bold\":true")),
                isNull(), eq(false), eq(1), eq("admin"));
        verify(mapper).insertAdminOption(eq(30L), argThat(o -> "매우 그렇다".equals(o.text())),
                argThat(json -> json != null && json.contains("그렇다")), eq(false), eq(1), eq("admin"));
        verify(mapper).insertAdminOption(eq(30L), argThat(o -> "B".equals(o.text())), isNull(), eq(false), eq(2), eq("admin"));
        verify(mapper).upsertAdminPopupContent(argThat(c -> "교육 만족도".equals(c.contentTitle())
                && c.contentOptionsJson().contains("surveyTitleBlocks")));
    }

    @Test void storedBlocksAreReturnedAndUnchangedFormattingReusesTemplate() throws Exception {
        List<Object> titleBlocks = blocks("문항", true);
        List<Object> optionBlocks = blocks("매우 ", false, "그렇다", true);
        when(mapper.selectQuestionsByTemplateIds(List.of(10L))).thenReturn(List.of(
                new PopupQuestionEntity(1L, 10L, "SINGLE_CHOICE", "문항", "설명", "Y", "N", null, 1, null, null,
                        "VERTICAL", JSON.writeValueAsString(titleBlocks), null)));
        when(mapper.selectOptionsByQuestionIds(List.of(1L))).thenReturn(List.of(
                new PopupOptionEntity(2L, 1L, "1", "매우 그렇다", "N", 1, JSON.writeValueAsString(optionBlocks)),
                new PopupOptionEntity(3L, 1L, "2", "B", "N", 2)));
        PopupQuestionDto loaded = service.loadQuestionsWithAnswerKey(List.of(10L)).get(10L).get(0);
        assertEquals(titleBlocks, loaded.titleBlocks());
        assertEquals(optionBlocks, loaded.options().get(0).textBlocks());
        assertNull(loaded.options().get(1).textBlocks());

        // WPF 응답(정답 키 제거 사본)에도 서식이 남는다.
        PopupQuestionDto wpf = WpfPopupItem.withoutAnswerKey(List.of(loaded)).get(0);
        assertEquals(titleBlocks, wpf.titleBlocks());
        assertEquals(optionBlocks, wpf.options().get(0).textBlocks());
        String json = JSON.writeValueAsString(wpf);
        assertTrue(json.contains("\"titleBlocks\"") && !json.contains("\"descriptionBlocks\""), json);

        // 같은 서식으로 다시 저장하면 기존 템플릿을 재사용한다(파생 문자열·서식이 저장값과 같음).
        PopupEntity existing = mock(PopupEntity.class);
        when(existing.popupType()).thenReturn("SURVEY");
        when(existing.questionTemplateId()).thenReturn(10L);
        when(mapper.selectAdminPopupById("TEST")).thenReturn(existing);
        service.saveAdminPopup(popup("SURVEY", List.of(question("client", titleBlocks, optionBlocks)),
                new LinkedHashMap<>()), false, List.of(), "admin");
        verify(mapper, never()).insertQuestionTemplate(anyString(), anyString(), anyString());

        // 서식만 바뀌어도 새 템플릿을 만든다.
        service.saveAdminPopup(popup("SURVEY", List.of(question("client", blocks("문항", false), optionBlocks)),
                new LinkedHashMap<>()), false, List.of(), "admin");
        verify(mapper).insertQuestionTemplate(anyString(), anyString(), anyString());
    }

    @Test void corruptStoredBlocksFailWithId() {
        when(mapper.selectQuestionsByTemplateIds(List.of(10L))).thenReturn(List.of(
                new PopupQuestionEntity(7L, 10L, "TEXT", "문항", null, "N", "N", null, 1, null, null,
                        "VERTICAL", "{broken", null)));
        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> service.loadQuestionsWithAnswerKey(List.of(10L)));
        assertTrue(error.getMessage().contains("questionId=7"), error.getMessage());
    }

    @Test void requestJsonDeserializesBlocks() throws Exception {
        PopupQuestionDto parsed = JSON.readValue("""
                {"questionId":1,"title":"t","questionType":"SINGLE_CHOICE","isRequired":true,"isScored":false,
                 "sortOrder":1,"optionLayout":"VERTICAL",
                 "titleBlocks":[{"alignment":"LEFT","runs":[{"text":"t","size":16}]}],
                 "options":[{"optionId":2,"value":"1","text":"A","sortOrder":1,
                             "textBlocks":[{"alignment":"CENTER","indent":1,"runs":[{"text":"A","italic":true}]}]}]}
                """, PopupQuestionDto.class);
        assertEquals(1, parsed.titleBlocks().size());
        assertEquals(new BigDecimal("16"), new BigDecimal(String.valueOf(
                ((Map<?, ?>) ((List<?>) ((Map<?, ?>) parsed.titleBlocks().get(0)).get("runs")).get(0)).get("size"))));
        assertEquals("A", PopupSurveyRichText.normalizeQuestion(parsed).options().get(0).text());
    }
}
