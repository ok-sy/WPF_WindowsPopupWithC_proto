package server.web.api.popup.wpf.version;

import java.util.Arrays;
import java.util.Optional;

/**
 * WPF 클라이언트 버전 문자열({@code major.minor.patch})의 숫자 비교.
 *
 * <p>[추가 이유 — 설계 13 §6] 문자열 비교는 {@code "1.10.0" < "1.9.0"}처럼 잘못된 결과를 내므로
 * 자리별 정수로 비교한다. 자리 수가 다르면 부족한 자리는 0으로 본다({@code 1.3 == 1.3.0}).
 * {@code 1.4.2+abc12} 같은 빌드 메타데이터(+ 이후)와 {@code -beta} 같은 프리릴리스 접미어는 잘라내고 비교한다.</p>
 */
public record ClientSemver(int[] parts) implements Comparable<ClientSemver> {

    /** 해석할 수 없으면(빈 문자열·숫자 아님) empty. */
    public static Optional<ClientSemver> parse(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        String text = raw.trim();
        int cut = indexOfAny(text, '+', '-');
        if (cut >= 0) {
            text = text.substring(0, cut);
        }
        if (text.isEmpty()) {
            return Optional.empty();
        }
        String[] tokens = text.split("\\.", -1);
        int[] parts = new int[tokens.length];
        for (int i = 0; i < tokens.length; i++) {
            try {
                parts[i] = Integer.parseInt(tokens[i].trim());
            } catch (NumberFormatException e) {
                return Optional.empty();
            }
            if (parts[i] < 0) {
                return Optional.empty();
            }
        }
        return Optional.of(new ClientSemver(parts));
    }

    @Override
    public int compareTo(ClientSemver other) {
        int length = Math.max(parts.length, other.parts.length);
        for (int i = 0; i < length; i++) {
            int a = i < parts.length ? parts[i] : 0;
            int b = i < other.parts.length ? other.parts[i] : 0;
            if (a != b) {
                return Integer.compare(a, b);
            }
        }
        return 0;
    }

    public boolean isAtLeast(ClientSemver minimum) {
        return compareTo(minimum) >= 0;
    }

    private static int indexOfAny(String text, char... chars) {
        int result = -1;
        for (char c : chars) {
            int index = text.indexOf(c);
            if (index >= 0 && (result < 0 || index < result)) {
                result = index;
            }
        }
        return result;
    }

    @Override
    public String toString() {
        return String.join(".", Arrays.stream(parts).mapToObj(Integer::toString).toList());
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof ClientSemver other && compareTo(other) == 0;
    }

    @Override
    public int hashCode() {
        return Arrays.hashCode(parts);
    }
}
