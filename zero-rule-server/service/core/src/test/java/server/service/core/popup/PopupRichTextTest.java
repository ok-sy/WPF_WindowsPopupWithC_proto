package server.service.core.popup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import server.domain.popup.PopupEntity;
import server.domain.popup.PopupResponseDto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** [설계 28] TEXT 본문 서식(textBlocks) 검증·plainText 파생·저장 경로. */
class PopupRichTextTest {

    private static Map<String, Object> run(String text, Object... pairs) {
        Map<String, Object> run = new LinkedHashMap<>();
        run.put("text", text);
        for (int i = 0; i < pairs.length; i += 2) run.put((String) pairs[i], pairs[i + 1]);
        return run;
    }

    private static Map<String, Object> block(String alignment, Object... runs) {
        Map<String, Object> block = new LinkedHashMap<>();
        block.put("alignment", alignment);
        block.put("runs", List.of(runs));
        return block;
    }

    private static List<Object> sample() {
        return List.of(
                block("LEFT", run("확인 후 다시 "), run("확인", "bold", true, "color", "#DC2626"), run("하세요")),
                block("CENTER"),
                block("RIGHT", run("줄1\n", "font", "MALGUN_GOTHIC"), run("  <b>&  ", "size", 20, "italic", true, "underline", true)));
    }

    private PopupResponseDto popup(String type, Map<String, Object> content) {
        PopupResponseDto dto = mock(PopupResponseDto.class);
        when(dto.popupType()).thenReturn(type);
        when(dto.content()).thenReturn(content);
        return dto;
    }

    @Test void derivesPlainTextPreservingSpacesLineBreaksAndEmptyParagraphs() {
        assertEquals("확인 후 다시 확인하세요\n\n줄1\n  <b>&  ", PopupRichText.validateAndDerivePlainText(sample()));
        assertNull(PopupRichText.validateAndDerivePlainText(null));
    }

    @Test void savedBodyComesFromTextBlocksNotClientPlainText() {
        Map<String, Object> content = new HashMap<>(Map.of("plainText", "클라이언트가 보낸 다른 값", "textBlocks", sample()));
        assertEquals("확인 후 다시 확인하세요\n\n줄1\n  <b>&  ", PopupService.bodyText(content));
        assertEquals("기존 본문", PopupService.bodyText(new HashMap<>(Map.of("plainText", "기존 본문"))));
    }

    @Test void rejectsValuesOutsideAllowList() {
        List<Object> bad = List.of(
                List.of(block("JUSTIFY", run("a"))),
                List.of(block("LEFT", run("a", "color", "hsl(0,75%,60%)"))),
                List.of(block("LEFT", run("a", "color", "#dc2626"))),
                List.of(block("LEFT", run("a", "size", 18.5))),
                List.of(block("LEFT", run("a", "size", 13))),
                List.of(block("LEFT", run("a", "font", "Comic Sans MS"))),
                List.of(block("LEFT", run("a", "bold", "true"))),
                List.of(block("LEFT", run("a", "style", "color:red"))),
                List.of(block("LEFT", run(""))),
                List.of(block("LEFT", run("a\u0000b"))),
                List.of(Map.of("alignment", "LEFT", "runs", List.of(), "html", "<p>x</p>")),
                List.of("문자열 문단"),
                "<p>HTML</p>");
        for (Object value : bad) {
            assertThrows(IllegalArgumentException.class, () -> PopupRichText.validateAndDerivePlainText(value), String.valueOf(value));
        }
    }

    /** [설계 49] 문단 들여쓰기 단계: 0~5 정수, 누락 = 0. plainText에는 공백·탭을 넣지 않는다. */
    @Test void paragraphIndentIsLevelZeroToFive() {
        for (Object level : new Object[]{0, 1, 5, 2L, 3.0}) {
            Map<String, Object> indented = new LinkedHashMap<>(block("LEFT", run("들여쓴 문단")));
            indented.put("indent", level);
            assertEquals("들여쓴 문단\n일반", PopupRichText.validateAndDerivePlainText(List.of(indented, block("LEFT", run("일반")))),
                    String.valueOf(level));
        }
        for (Object level : new Object[]{-1, 6, 1.5, "1", true, "40px", Double.NaN}) {
            Map<String, Object> indented = new LinkedHashMap<>(block("LEFT", run("a")));
            indented.put("indent", level);
            assertThrows(IllegalArgumentException.class, () -> PopupRichText.validateAndDerivePlainText(List.of(indented)), String.valueOf(level));
        }
        Map<String, Object> margin = new LinkedHashMap<>(block("LEFT", run("a")));
        margin.put("marginLeft", "40px");
        assertThrows(IllegalArgumentException.class, () -> PopupRichText.validateAndDerivePlainText(List.of(margin)), "임의 CSS 키 거부");
    }

    @Test void colorsAreAnyUppercaseHexNotPalette() {
        for (String color : new String[]{"#0891B2", "#FFFFFF", "#FDE047", "#000000"}) {
            assertDoesNotThrow(() -> PopupRichText.validateAndDerivePlainText(List.of(block("LEFT", run("a", "color", color)))), color);
        }
        for (String color : new String[]{"#0891b2", "#FFF", "red", "#0891B2;x:y", "rgb(0,0,0)", "#0891B2 "}) {
            assertThrows(IllegalArgumentException.class,
                    () -> PopupRichText.validateAndDerivePlainText(List.of(block("LEFT", run("a", "color", color)))), color);
        }
    }

    @Test void enforcesSizeLimits() {
        List<Object> tooMany = new ArrayList<>();
        for (int i = 0; i <= PopupRichText.MAX_BLOCKS; i++) tooMany.add(block("LEFT"));
        assertThrows(IllegalArgumentException.class, () -> PopupRichText.validateAndDerivePlainText(tooMany));
        String longText = "가".repeat(PopupRichText.MAX_TEXT_LENGTH + 1);
        assertThrows(IllegalArgumentException.class,
                () -> PopupRichText.validateAndDerivePlainText(List.of(block("LEFT", run(longText)))));
    }

    @Test void textBlocksAllowedOnlyForText() {
        assertDoesNotThrow(() -> PopupService.validateRichText(popup("TEXT", Map.of("textBlocks", sample()))));
        assertDoesNotThrow(() -> PopupService.validateRichText(popup("TEXT", Map.of("plainText", "기존"))));
        for (String type : new String[]{"IMAGE", "VIDEO", "SURVEY", "QUIZ"}) {
            assertThrows(IllegalArgumentException.class,
                    () -> PopupService.validateRichText(popup(type, Map.of("textBlocks", sample()))));
        }
    }

    @Test void textBlocksAreKeptInContentOptionsAndReturnedWithStoredPlainText() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        Map<String, Object> options = PopupContentAssembler.withoutStoredCopies(
                Map.of("plainText", "x", "textBlocks", sample()));
        assertFalse(options.containsKey("plainText"));
        PopupEntity entity = mock(PopupEntity.class);
        when(entity.popupType()).thenReturn("TEXT");
        when(entity.contentBody()).thenReturn("확인 후 다시 확인하세요\n\n줄1\n  <b>&  ");
        when(entity.contentOptionsJson()).thenReturn(mapper.writeValueAsString(options));
        Map<String, Object> content = new PopupContentAssembler(mapper).assemble(entity);
        assertEquals(mapper.readTree(mapper.writeValueAsString(sample())), mapper.valueToTree(content.get("textBlocks")));
        assertEquals("확인 후 다시 확인하세요\n\n줄1\n  <b>&  ", content.get("plainText"));
    }
}
