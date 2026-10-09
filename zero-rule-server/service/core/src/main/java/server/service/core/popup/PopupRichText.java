package server.service.core.popup;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * [설계 28] TEXT 본문 서식 데이터(content.textBlocks) 검증과 일반 문자열(plainText) 파생.
 *
 * <p>구조: {@code textBlocks = [{ alignment, runs: [{ text, bold?, italic?, underline?, color?, size?, font? }] }]}.
 * 문단 안 Run의 text를 순서대로 이어 붙인 것이 문단 본문이고, 문단은 줄바꿈(\n)으로 구분한다.
 * 문단 내부 줄바꿈은 Run text의 \n이다. HTML은 저장하지 않으며, 허용 목록 밖의 키·값은 저장을 거부한다
 * (관리자 편집기는 허용 값만 만들므로 거부는 API 직접 입력 방어다).</p>
 *
 * <p>허용 값은 관리자 웹 {@code popupRichText.ts}, WPF {@code PopupRichText.cs}와 같아야 한다.</p>
 */
final class PopupRichText {

    static final String KEY = "textBlocks";
    static final Set<String> ALIGNMENTS = Set.of("LEFT", "CENTER", "RIGHT");
    static final Set<String> COLORS = Set.of(
            "#111827", "#6B7280", "#DC2626", "#EA580C", "#CA8A04", "#16A34A", "#2563EB", "#7C3AED");
    static final Set<Integer> SIZES = Set.of(12, 14, 16, 18, 20, 24, 28, 32);
    static final Set<String> FONTS = Set.of("MALGUN_GOTHIC", "GULIM", "DOTUM", "BATANG");
    static final int MAX_BLOCKS = 500;
    static final int MAX_RUNS = 2000;
    static final int MAX_TEXT_LENGTH = 20000;

    private static final Set<String> BLOCK_KEYS = Set.of("alignment", "runs");
    private static final Set<String> RUN_KEYS = Set.of("text", "bold", "italic", "underline", "color", "size", "font");

    private PopupRichText() {
    }

    /**
     * textBlocks를 검증하고 일반 문자열을 만든다. 값이 없으면(null) 서식 본문을 쓰지 않는 기존 데이터로 보고 null을 돌려준다.
     *
     * @throws IllegalArgumentException 구조·허용 값·제한을 벗어난 경우
     */
    static String validateAndDerivePlainText(Object value) {
        if (value == null) {
            return null;
        }
        if (!(value instanceof List<?> blocks)) {
            throw invalid("textBlocks는 배열이어야 합니다.");
        }
        if (blocks.size() > MAX_BLOCKS) {
            throw invalid("본문 문단은 " + MAX_BLOCKS + "개 이하여야 합니다.");
        }
        StringBuilder plain = new StringBuilder();
        int runCount = 0;
        for (int i = 0; i < blocks.size(); i++) {
            if (!(blocks.get(i) instanceof Map<?, ?> block)) {
                throw invalid("본문 문단 형식이 올바르지 않습니다.");
            }
            requireKnownKeys(block, BLOCK_KEYS, "문단");
            Object alignment = block.get("alignment");
            if (alignment != null && !(alignment instanceof String a && ALIGNMENTS.contains(a))) {
                throw invalid("문단 정렬은 LEFT, CENTER, RIGHT 중 하나여야 합니다.");
            }
            Object runsValue = block.get("runs");
            if (!(runsValue instanceof List<?> runs)) {
                throw invalid("문단의 runs는 배열이어야 합니다.");
            }
            if (i > 0) {
                plain.append('\n');
            }
            for (Object runValue : runs) {
                if (++runCount > MAX_RUNS) {
                    throw invalid("본문 서식 구간은 " + MAX_RUNS + "개 이하여야 합니다.");
                }
                if (!(runValue instanceof Map<?, ?> run)) {
                    throw invalid("본문 서식 구간 형식이 올바르지 않습니다.");
                }
                requireKnownKeys(run, RUN_KEYS, "서식 구간");
                if (!(run.get("text") instanceof String text) || text.isEmpty()) {
                    throw invalid("서식 구간의 text는 빈 값이 아닌 문자열이어야 합니다.");
                }
                if (text.chars().anyMatch(c -> c < 0x20 && c != '\n' && c != '\t')) {
                    throw invalid("본문에 사용할 수 없는 제어 문자가 있습니다.");
                }
                for (String flag : List.of("bold", "italic", "underline")) {
                    Object v = run.get(flag);
                    if (v != null && !(v instanceof Boolean)) {
                        throw invalid(flag + "는 boolean이어야 합니다.");
                    }
                }
                Object color = run.get("color");
                if (color != null && !(color instanceof String c && COLORS.contains(c))) {
                    throw invalid("허용되지 않은 글자 색입니다.");
                }
                Object size = run.get("size");
                if (size != null && !(size instanceof Number n && n.doubleValue() == n.intValue()
                        && SIZES.contains(n.intValue()))) {
                    throw invalid("허용되지 않은 글자 크기입니다.");
                }
                Object font = run.get("font");
                if (font != null && !(font instanceof String f && FONTS.contains(f))) {
                    throw invalid("허용되지 않은 글꼴입니다.");
                }
                plain.append(text);
            }
        }
        if (plain.length() > MAX_TEXT_LENGTH) {
            throw invalid("본문은 " + MAX_TEXT_LENGTH + "자 이하여야 합니다.");
        }
        return plain.toString();
    }

    private static void requireKnownKeys(Map<?, ?> map, Set<String> allowed, String label) {
        for (Object key : map.keySet()) {
            if (!(key instanceof String k) || !allowed.contains(k)) {
                throw invalid(label + "에 허용되지 않은 항목이 있습니다: " + key);
            }
        }
    }

    private static IllegalArgumentException invalid(String message) {
        return new IllegalArgumentException(message);
    }
}
