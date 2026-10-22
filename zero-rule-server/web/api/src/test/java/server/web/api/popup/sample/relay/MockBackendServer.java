package server.web.api.popup.sample.relay;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.UncheckedIOException;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

/**
 * POL-14-03 : 서버 인계 예제
 * ■ 중계 샘플 확인용 mock 백엔드
 * - in : host·port(0이면 임의 포트) · 요청 쿼리 scenario
 * - out: 시나리오별 고정 응답 · requests()에 받은 요청 기록
 * - 테이블·실제 백엔드 없이 확인하는 고정 응답 mock 백엔드(JDK 내장 HttpServer, 추가 의존성 없음).
 *
 * <p>{@code POST /api/wpf/popups?scenario=...}. 시나리오: {@code ok}(기본, TEXT), {@code image}·{@code video}·{@code survey}·{@code quiz}·{@code video-quiz}
 * (유형별로 계약 옵션 키를 모두 담은 응답, 파일 web/api/src/test/resources/sample/relay/*.json),
 * {@code empty}(popup:null), {@code envelope}({@code {resultCode, data}} 형태), {@code e400}·{@code e401}·{@code e403}·{@code e426}·{@code e404}·{@code e500},
 * {@code slow}(3초 지연), {@code badjson}, {@code notobject}, {@code nopolling}.
 * 받은 요청(메서드·경로·헤더·본문)은 {@link #requests()}에 남겨 테스트가 전송 내용을 확인한다.</p>
 */
public final class MockBackendServer implements AutoCloseable {

    public record Received(String method, String path, Map<String, List<String>> headers, String body) {
        public String header(String name) {
            return headers.entrySet().stream().filter(e -> e.getKey().equalsIgnoreCase(name))
                    .map(e -> e.getValue().get(0)).findFirst().orElse(null);
        }
    }

    /**
     * 중첩 content, boolean false, 숫자 0, null 값을 함께 담은 정상 응답(web/api/src/test/resources/sample/relay/ok.json).
     * deliveryId는 백엔드가 만든 값이다. WPF PopupWindowTests도 같은 파일을 WPF DTO로 역직렬화한다.
     */
    public static final String OK_BODY = resource("sample/relay/ok.json");
    /** 문항·선택지를 포함한 SURVEY 응답(sample/relay/survey.json). */
    public static final String SURVEY_BODY = resource("sample/relay/survey.json");
    /** 유형별 전체 옵션 응답(모든 계약 옵션 키 포함). scenario 이름 = 파일 이름. */
    public static final java.util.List<String> FULL_OPTION_SCENARIOS = java.util.List.of("ok", "image", "video", "survey", "quiz", "video-quiz");
    public static final String EMPTY_BODY = "{\"pollingIntervalSeconds\":1800,\"popup\":null}";

    private static String resource(String name) {
        try (InputStream in = MockBackendServer.class.getClassLoader().getResourceAsStream(name)) {
            if (in == null) throw new IllegalStateException("mock 응답 파일 없음: " + name);
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    private final HttpServer server;
    private final List<Received> requests = new CopyOnWriteArrayList<>();
    private volatile String defaultScenario = "ok";

    public MockBackendServer(String host, int port) {
        try {
            server = HttpServer.create(new InetSocketAddress(host, port), 0);
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
        server.setExecutor(Executors.newCachedThreadPool());
        server.createContext("/", this::handle);
        server.start();
    }

    public int port() { return server.getAddress().getPort(); }

    public List<Received> requests() { return requests; }

    /** 쿼리에 scenario가 없을 때 쓸 시나리오(테스트에서 중계 경로를 바꾸지 않고 응답을 고른다). */
    public void setDefaultScenario(String scenario) { this.defaultScenario = scenario; }

    private void handle(HttpExchange exchange) throws IOException {
        try (exchange; InputStream in = exchange.getRequestBody()) {
            String body = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            requests.add(new Received(exchange.getRequestMethod(), exchange.getRequestURI().getPath(),
                    Map.copyOf(exchange.getRequestHeaders()), body));
            String scenario = scenario(exchange.getRequestURI().getRawQuery(), defaultScenario);
            switch (scenario) {
                case "survey" -> send(exchange, 200, SURVEY_BODY);
                case "image", "video", "quiz", "video-quiz" -> send(exchange, 200, resource("sample/relay/" + scenario + ".json"));
                case "empty" -> send(exchange, 200, EMPTY_BODY);
                case "envelope" -> send(exchange, 200, "{\"resultCode\":\"0000\",\"data\":" + OK_BODY + "}");
                case "e400" -> send(exchange, 400, "{\"code\":\"WPF_BAD_REQUEST\",\"message\":\"요청 형식 오류\",\"timestamp\":\"2026-10-22T10:00:00+09:00\"}");
                case "e401" -> send(exchange, 401, "{\"code\":\"WPF_UNAUTHORIZED\",\"message\":\"토큰이 만료되었습니다.\",\"timestamp\":\"2026-10-22T10:00:00+09:00\"}");
                case "e403" -> send(exchange, 403, "<html>forbidden</html>");
                case "e426" -> send(exchange, 426, "{\"code\":\"CLIENT_VERSION_NOT_SUPPORTED\",\"message\":\"업데이트가 필요합니다.\",\"clientVersion\":\"1.0.0\","
                        + "\"minimumSupportedVersion\":\"1.3.0\",\"latestVersion\":\"1.4.2\",\"timestamp\":\"2026-10-22T10:00:00+09:00\"}");
                case "e404" -> send(exchange, 404, "{\"error\":\"not found\"}");
                case "e500" -> send(exchange, 500, "{\"code\":\"BACKEND_DOWN\",\"message\":\"internal detail\"}");
                case "slow" -> {
                    sleep(3000);
                    send(exchange, 200, OK_BODY);
                }
                case "badjson" -> send(exchange, 200, "{\"pollingIntervalSeconds\":1800,\"popup\":");
                case "notobject" -> send(exchange, 200, "[1,2,3]");
                case "nopolling" -> send(exchange, 200, "{\"popup\":null}");
                default -> send(exchange, 200, OK_BODY);
            }
        } catch (IOException ignored) {
            // 클라이언트가 timeout으로 먼저 끊은 경우
        }
    }

    private static String scenario(String rawQuery, String fallback) {
        if (rawQuery == null) return fallback;
        for (String pair : rawQuery.split("&")) {
            String[] kv = pair.split("=", 2);
            if (kv.length == 2 && kv[0].equals("scenario")) return URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
        }
        return fallback;
    }

    private static void send(HttpExchange exchange, int status, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }

    private static void sleep(long millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    @Override
    public void close() {
        server.stop(0);
    }
}
