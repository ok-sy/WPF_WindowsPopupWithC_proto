package server.web.api.popup.sample.relay;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;


/**
 * POL-14-03 : 서버 인계 예제
 * POL-16-02 : 재현 가능한 검증
 * ■ 조회 중계 샘플 통합 테스트
 * - DB 드라이버·접속 정보 없이 샘플을 기동하고, mock 백엔드의 실제 HTTP 응답을 중계 API로 받는다.
 */
@SpringBootTest(classes = RelaySampleBootConfig.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "popup.sample.relay.enabled=true")
class PopupRelayIntegrationTest {

    static final MockBackendServer BACKEND = new MockBackendServer("127.0.0.1", 0);
    static final ObjectMapper JSON = new ObjectMapper();
    static final HttpClient CLIENT = HttpClient.newHttpClient();

    @DynamicPropertySource
    static void backend(DynamicPropertyRegistry registry) {
        registry.add("popup.sample.relay.base-url", () -> "http://127.0.0.1:" + BACKEND.port());
        registry.add("popup.sample.relay.read-timeout", () -> "700ms");
        registry.add("popup.sample.relay.api-key-header", () -> "X-Api-Key");
        registry.add("popup.sample.relay.api-key", () -> "sample-secret");
    }

    @AfterAll
    static void stop() {
        BACKEND.close();
    }

    @LocalServerPort
    int port;
    @Autowired
    ApplicationContext context;

    @BeforeEach
    void reset() {
        BACKEND.requests().clear();
        BACKEND.setDefaultScenario("ok");
    }

    private HttpResponse<String> call(String body) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://127.0.0.1:" + port + "/p/api/sample/relay/wpf/popups"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer user-token")
                .header("X-Client-Version", "1.4.2")
                .header("X-Not-Forwarded", "secret")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
        return CLIENT.send(request.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    }

    private HttpResponse<String> call() throws Exception {
        return call("{}");
    }

    @Test
    void startsWithoutAnyDataSource() {
        assertEquals(0, context.getBeanNamesForType(javax.sql.DataSource.class, false, false).length, "DataSource 빈이 없어야 한다");
        assertFalse(context.containsBean("sqlSessionFactory"));
    }

    @Test
    void forwardsMethodPathHeadersAndBodyOnce() throws Exception {
        assertEquals(200, call().statusCode());
        assertEquals(1, BACKEND.requests().size(), "자동 재시도 없이 1회만 호출");
        MockBackendServer.Received received = BACKEND.requests().get(0);
        assertEquals("POST", received.method());
        assertEquals("/api/wpf/popups", received.path());
        assertEquals("{}", received.body());
        assertEquals("Bearer user-token", received.header("Authorization"));
        assertEquals("1.4.2", received.header("X-Client-Version"));
        assertEquals("sample-secret", received.header("X-Api-Key"));
        assertNull(received.header("X-Not-Forwarded"), "설정에 없는 헤더는 넘기지 않는다");
    }

    @Test
    void keepsNestedContentFalseZeroAndNullWithoutDoubleEncoding() throws Exception {
        HttpResponse<String> response = call();
        assertEquals(200, response.statusCode());
        JsonNode expected = JSON.readTree(MockBackendServer.OK_BODY);
        JsonNode actual = JSON.readTree(response.body());
        assertEquals(expected, actual, "WPF 구조 백엔드는 변환 없이 같은 JSON");
        JsonNode popup = actual.get("popup");
        assertTrue(popup.get("content").isObject(), "content는 문자열이 아니라 객체");
        assertTrue(popup.at("/content/textBlocks/0/runs/0/italic").isBoolean() && !popup.at("/content/textBlocks/0/runs/0/italic").booleanValue());
        assertTrue(popup.get("useBackgroundOverlay").isBoolean() && !popup.get("useBackgroundOverlay").booleanValue());
        assertEquals(0, popup.get("backgroundOverlayOpacity").intValue());
        assertTrue(popup.has("hideDays") && popup.get("hideDays").isNull(), "null 값도 유지");
        assertEquals("6b1d2c3e-4f50-4a6b-8c7d-9e0f1a2b3c4d", popup.get("deliveryId").asText(), "백엔드 ID 보존");
    }

    @Test
    void relaysEveryFullOptionSampleUnchanged() throws Exception {
        for (String scenario : MockBackendServer.FULL_OPTION_SCENARIOS) {
            BACKEND.setDefaultScenario(scenario);
            HttpResponse<String> response = call();
            assertEquals(200, response.statusCode(), scenario);
            String file = scenario.equals("ok") ? MockBackendServer.OK_BODY
                    : new String(getClass().getClassLoader().getResourceAsStream("sample/relay/" + scenario + ".json").readAllBytes(), StandardCharsets.UTF_8);
            assertEquals(JSON.readTree(file), JSON.readTree(response.body()), scenario + " 전체 옵션 응답이 변환 없이 전달된다");
        }
    }

    @Test
    void relaysQuestions() throws Exception {
        BACKEND.setDefaultScenario("survey");
        JsonNode popup = JSON.readTree(call().body()).get("popup");
        assertEquals("SURVEY", popup.get("popupType").asText());
        assertEquals(2, popup.at("/questions/0/options").size());
        assertFalse(popup.at("/questions/0/options/0/isCorrect").booleanValue());
    }

    @Test
    void emptyIsNormalNullPopup() throws Exception {
        BACKEND.setDefaultScenario("empty");
        HttpResponse<String> response = call();
        assertEquals(200, response.statusCode());
        JsonNode body = JSON.readTree(response.body());
        assertEquals(1800, body.get("pollingIntervalSeconds").intValue());
        assertTrue(body.has("popup") && body.get("popup").isNull());
        assertTrue(response.headers().firstValue(RelayExceptionHandler.UPSTREAM_ERROR_HEADER).isEmpty());
    }

    @Test
    void passesThroughWpfAuthErrors() throws Exception {
        BACKEND.setDefaultScenario("e401");
        HttpResponse<String> response = call();
        assertEquals(401, response.statusCode());
        JsonNode body = JSON.readTree(response.body());
        assertEquals("WPF_UNAUTHORIZED", body.get("code").asText());
        assertEquals("토큰이 만료되었습니다.", body.get("message").asText());
        assertTrue(body.get("timestamp").asText().endsWith("+09:00"));

        BACKEND.setDefaultScenario("e403");
        response = call();
        assertEquals(403, response.statusCode());
        assertEquals("WPF_USER_INACTIVE", JSON.readTree(response.body()).get("code").asText(), "JSON이 아닌 403 본문은 상태 기본 코드");

        BACKEND.setDefaultScenario("e400");
        assertEquals(400, call().statusCode());
    }

    @Test
    void passesThroughClientVersion426Body() throws Exception {
        BACKEND.setDefaultScenario("e426");
        HttpResponse<String> response = call();
        assertEquals(426, response.statusCode());
        JsonNode body = JSON.readTree(response.body());
        assertEquals("CLIENT_VERSION_NOT_SUPPORTED", body.get("code").asText());
        assertEquals("1.3.0", body.get("minimumSupportedVersion").asText());
    }

    @Test
    void upstreamFailuresAreInternalErrorsNotEmptyPopups() throws Exception {
        for (String[] c : new String[][] {
                {"e500", "HTTP_5XX"}, {"e404", "HTTP_4XX"}, {"badjson", "INVALID_JSON"},
                {"notobject", "INVALID_RESPONSE"}, {"nopolling", "INVALID_RESPONSE"}, {"slow", "TIMEOUT"}}) {
            BACKEND.setDefaultScenario(c[0]);
            BACKEND.requests().clear();
            HttpResponse<String> response = call();
            assertEquals(500, response.statusCode(), c[0]);
            JsonNode body = JSON.readTree(response.body());
            assertEquals("WPF_INTERNAL", body.get("code").asText(), c[0]);
            assertFalse(response.body().contains("internal detail"), "백엔드 내부 메시지 비노출");
            assertFalse(body.has("popup"), "실패를 popup:null 정상 응답으로 덮지 않는다");
            assertEquals(c[1], response.headers().firstValue(RelayExceptionHandler.UPSTREAM_ERROR_HEADER).orElse(""), c[0]);
            assertEquals(1, BACKEND.requests().size(), c[0] + " 재시도 없음");
        }
    }

    @Test
    void rejectsNonObjectRequestBody() throws Exception {
        HttpResponse<String> response = call("[1]");
        assertEquals(400, response.statusCode());
        assertEquals("WPF_BAD_REQUEST", JSON.readTree(response.body()).get("code").asText());
        assertEquals(0, BACKEND.requests().size());
    }
}
