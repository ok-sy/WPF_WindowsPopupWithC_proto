package server.service.core.popup;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * TODO62 공용 서버 RichText 검증을 JDK17만으로 재현한다(Gradle·DB 불필요).
 * 저장소 루트:
 * javac -encoding UTF-8 -d .offline-verify/rich62-server
 *   zero-rule-server/service/core/src/main/java/server/service/core/popup/PopupRichText.java scripts/RichText62ServerTest.java
 * java -cp .offline-verify/rich62-server server.service.core.popup.RichText62ServerTest
 * 전체 서비스·DB 검증을 대신하지 않는다. 같은 계약은 PopupRichTextTest에서도 검증한다.
 */
public final class RichText62ServerTest {
    private static int checks;

    private static void check(boolean condition, String message) {
        if (!condition) throw new AssertionError(message);
        checks++;
    }

    public static void main(String[] args) {
        for (Object value : new Object[] { true, false, null }) {
            Map<String, Object> run = new LinkedHashMap<>();
            run.put("text", "<변경 전> & 변경 후\n둘째 줄");
            run.put("underline", true);
            run.put("strikethrough", value);
            Map<String, Object> block = Map.of("alignment", "RIGHT", "indent", 1, "runs", List.of(run));
            check("<변경 전> & 변경 후\n둘째 줄".equals(PopupRichText.validateAndDerivePlainText(List.of(block))),
                    "valid strikethrough must preserve plain text");
            check(run.containsKey("strikethrough") && java.util.Objects.equals(run.get("strikethrough"), value),
                    "validation must not remove the style");
        }
        check("기존".equals(PopupRichText.validateAndDerivePlainText(List.of(Map.of("runs", List.of(Map.of("text", "기존")))))),
                "older data without strikethrough remains valid");
        for (Object value : new Object[] { "true", 1, 0, List.of(), Map.of() }) {
            try {
                PopupRichText.validateAndDerivePlainText(List.of(Map.of("runs", List.of(Map.of("text", "본문", "strikethrough", value)))));
                throw new AssertionError("non-boolean strikethrough must be rejected: " + value);
            } catch (IllegalArgumentException expected) {
                check(expected.getMessage().contains("strikethrough"), "rejection must identify strikethrough");
            }
        }
        System.out.println("PASS: " + checks + " server RichText62 checks (JDK17, no DB)");
    }
}
