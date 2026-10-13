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
 * <p>글자 색은 팔레트로 제한하지 않고 {@code #RRGGBB}(대문자) 형식만 검사한다. 가독성은 작성자가 판단한다.
 * 크기·글꼴·정렬 허용 값과 색 규칙은 관리자 웹 {@code popupRichText.ts}, WPF {@code PopupRichText.cs}와 같아야 한다.</p>
 */
final class PopupRichText {

    static final String KEY = "textBlocks";
    static final Set<String> ALIGNMENTS = Set.of("LEFT", "CENTER", "RIGHT");
    private static final java.util.regex.Pattern HEX_COLOR = java.util.regex.Pattern.compile("^#[0-9A-F]{6}$");
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
                if (color != null && !(color instanceof String c && HEX_COLOR.matcher(c).matches())) {
                    throw invalid("글자 색은 #RRGGBB(대문자) 형식이어야 합니다.");
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

    /**
     * [설계 37] TEXT content의 콘텐츠 제목(contentTitle)·설명(description)은 서식 본문(textBlocks)으로 통합했다.
     * 통합 전에 저장된 행의 CONTENT_TITLE·DESCRIPTION 값은 조회 시 본문 앞 문단(제목: 굵게·24, 설명: 기본)으로 합쳐
     * DB 변환 없이 계속 표시한다. showContentHeader=false였던 행은 표시하지 않던 값이므로 합치지 않는다.
     * 관리자가 다시 저장하면 합쳐진 본문이 textBlocks로 저장되고 두 컬럼은 비워진다.
     * plainText도 같은 순서로 앞에 붙여 서식 본문과 어긋나지 않게 한다.
     * [설계 39-3] 헤더는 보이고 본문은 숨겼던 행(showPlainText=false)은 "헤더만 보이기"로 변환한다 — 보이던 제목·설명만 본문 문단으로
     * 만들고 숨겨져 있던 본문은 응답에서 뺀 뒤 showPlainText=true로 바꾼다. 관리자가 다시 저장하면 숨겼던 본문은 삭제된다(허용).
     */
    static void mergeLegacyHeader(Map<String, Object> content, String title, String description) {
        boolean showHeader = !Boolean.FALSE.equals(content.remove("showContentHeader"));
        List<String> header = new java.util.ArrayList<>();
        if (showHeader) {
            if (title != null && !title.isBlank()) header.add(normalizeLineBreaks(title.strip()));
            if (description != null && !description.isBlank()) header.add(normalizeLineBreaks(description));
        }
        if (header.isEmpty()) {
            return;
        }
        List<Object> blocks = new java.util.ArrayList<>();
        for (int i = 0; i < header.size(); i++) {
            Map<String, Object> run = new java.util.LinkedHashMap<>();
            run.put("text", header.get(i));
            if (i == 0 && title != null && !title.isBlank()) {
                run.put("bold", true);
                run.put("size", 24);
            }
            blocks.add(paragraph(List.of(run)));
        }
        boolean bodyHidden = Boolean.FALSE.equals(content.get("showPlainText"));
        Object existing = bodyHidden ? List.of() : content.get(KEY);
        String plain = !bodyHidden && content.get("plainText") instanceof String s ? s : "";
        if (bodyHidden) {
            content.put("showPlainText", true);
        }
        boolean hasBody;
        if (existing instanceof List<?> list) {
            blocks.addAll(list);
            hasBody = !list.isEmpty();
        } else {
            hasBody = !plain.isEmpty();
            if (hasBody) {
                for (String line : normalizeLineBreaks(plain).split("\n", -1)) {
                    blocks.add(paragraph(line.isEmpty() ? List.of() : List.of(Map.of("text", line))));
                }
            }
        }
        content.put(KEY, blocks);
        content.put("plainText", String.join("\n", header) + (hasBody ? "\n" + plain : ""));
    }

    private static Map<String, Object> paragraph(List<?> runs) {
        Map<String, Object> block = new java.util.LinkedHashMap<>();
        block.put("alignment", "LEFT");
        block.put("runs", runs);
        return block;
    }

    private static String normalizeLineBreaks(String value) {
        return value.replace("\r\n", "\n").replace('\r', '\n');
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
