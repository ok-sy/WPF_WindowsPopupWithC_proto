package server.app.wpf;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringBootConfiguration;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import server.repo.core.mapper.popup.PopupSchema;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.client.RestTemplate;
import server.base.props.WpfPopupProps;
import server.service.core.popup.PopupService;
import server.service.core.popup.wpf.WpfPopupService;
import server.service.core.popup.wpf.WpfResultProcessor;
import server.web.api.popup.wpf.DevHeaderWpfUserResolver;
import server.web.api.popup.wpf.WpfApiExceptionHandler;
import server.web.api.popup.wpf.WpfPopupController;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * [기준 2·3·4·6 + Oracle] 신규 WPF API 2개를 **실제 HTTP + 실제 Oracle + 실제 트랜잭션**으로 검증한다.
 *
 * <p>왜 전체 zeroserver 대신 부분 컨텍스트인가: 이 저장소의 zero 프레임워크(clover-* 0.0.1-POSTGRE-SNAPSHOT)와
 * 공통 매퍼 13개는 PostgreSQL 전용 SQL(nextval 등)이라 Oracle에서는 앱이 기동되지 않는다(공통 프레임워크의
 * Oracle 빌드는 타 팀/운영 환경 소관). 그래서 팝업·WPF API에 필요한 빈만 올려 서버 계층을 검증한다:
 * 컨트롤러·어드바이스·개발용 사용자 식별기·서비스·프로세서(REQUIRES_NEW)·MyBatis 팝업 매퍼·Oracle 데이터소스.</p>
 *
 * <p>실행 조건: POPUP_TEST_DB_PASSWORD(및 선택 POPUP_TEST_DB_URL/USER). db/oracle/00~03 적용 상태의 XEPDB1.
 * 결과 API는 항목별로 커밋되므로(REQUIRES_NEW) 테스트 사용자 E1002의 상태 행을 시작·종료 시 직접 정리한다.</p>
 */
@SpringBootTest(classes = WpfApiOracleHttpTest.TestApp.class,
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "custom.wpf-popup.dev-user-header=true",
                "custom.wpf-popup.polling-interval-seconds=1800",
                "mybatis.config-location=classpath:mybatis-config.xml",
                "mybatis.mapper-locations=classpath:mappers/popup/*.xml",
                "server.servlet.context-path=/zero-rule-server",
                "spring.jackson.serialization.write-dates-as-timestamps=true"   // 운영 BasicConfig와 동일 조건
        })
@EnabledIfEnvironmentVariable(named = "POPUP_TEST_DB_PASSWORD", matches = ".+")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class WpfApiOracleHttpTest {

    @SpringBootConfiguration
    @EnableAutoConfiguration(exclude = {SecurityAutoConfiguration.class, UserDetailsServiceAutoConfiguration.class})
    @MapperScan("server.repo.core.mapper.popup")
    @Import({WpfPopupController.class, WpfApiExceptionHandler.class, DevHeaderWpfUserResolver.class,
            WpfPopupService.class, WpfResultProcessor.class, PopupService.class, WpfPopupProps.class})
    static class TestApp {
    }

    private static final String USER = "E1002";   // 샘플 기대: TEXT, VIDEO, SURVEY(사번 지정)

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> System.getenv().getOrDefault(
                "POPUP_TEST_DB_URL", "jdbc:oracle:thin:@//localhost:1521/XEPDB1"));
        registry.add("spring.datasource.username", () -> System.getenv().getOrDefault("POPUP_TEST_DB_USER", "POPUP"));
        registry.add("spring.datasource.password", () -> System.getenv("POPUP_TEST_DB_PASSWORD"));
        registry.add("spring.datasource.driver-class-name", () -> "oracle.jdbc.OracleDriver");
        // [스키마 분리 설정화] 팝업 매퍼의 ${popupSchemaPrefix} — mybatis-spring-boot 자동구성 경로로 같은 변수를 공급한다.
        registry.add("mybatis.configuration-properties." + PopupSchema.PROPERTY, () -> SCHEMA_PREFIX);
    }

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper json = new ObjectMapper();
    // 정리·검증 SQL에 쓰는 스키마 접두어 (환경변수 POPUP_TEST_DB_SCHEMA, 기본 POPUP, 빈 값 = 접속 계정 스키마)
    private static final String SCHEMA_PREFIX = PopupSchema.prefix(System.getenv().getOrDefault("POPUP_TEST_DB_SCHEMA", PopupSchema.DEFAULT_SCHEMA));

    private static JdbcTemplate cleanupJdbc;

    @BeforeAll
    static void noteStart() {
        // 정리는 @Autowired JdbcTemplate이 필요하므로 인스턴스 테스트 1번에서 수행
    }

    @AfterAll
    static void cleanupAfter() {
        if (cleanupJdbc != null) cleanup(cleanupJdbc);
    }

    private static void cleanup(JdbcTemplate jdbc) {
        jdbc.update("DELETE FROM " + SCHEMA_PREFIX + "WPF_RESULT_RECEIPT WHERE EMPLOYEE_NO = ?", USER);
        jdbc.update("DELETE FROM " + SCHEMA_PREFIX + "WPF_POPUP_DELIVERY WHERE EMPLOYEE_NO = ?", USER);
        jdbc.update("DELETE FROM " + SCHEMA_PREFIX + "POPUP_RESPONSE_VALUE WHERE RESPONSE_ANSWER_ID IN (SELECT RESPONSE_ANSWER_ID FROM " + SCHEMA_PREFIX + "POPUP_RESPONSE_ANSWER WHERE RESPONSE_ID IN (SELECT RESPONSE_ID FROM " + SCHEMA_PREFIX + "POPUP_RESPONSE WHERE EMPLOYEE_NO = ?))", USER);
        jdbc.update("DELETE FROM " + SCHEMA_PREFIX + "POPUP_RESPONSE_ANSWER WHERE RESPONSE_ID IN (SELECT RESPONSE_ID FROM " + SCHEMA_PREFIX + "POPUP_RESPONSE WHERE EMPLOYEE_NO = ?)", USER);
        jdbc.update("DELETE FROM " + SCHEMA_PREFIX + "POPUP_RESPONSE WHERE EMPLOYEE_NO = ?", USER);
        jdbc.update("DELETE FROM " + SCHEMA_PREFIX + "VIDEO_VIEW_STATUS WHERE EMPLOYEE_NO = ?", USER);
        jdbc.update("DELETE FROM " + SCHEMA_PREFIX + "USER_POPUP_STATUS WHERE EMPLOYEE_NO = ?", USER);
        jdbc.update("DELETE FROM " + SCHEMA_PREFIX + "API_REQUEST_LOG WHERE EMPLOYEE_NO = ?", USER);
    }

    private String url(String path) {
        return "http://localhost:" + port + "/zero-rule-server" + path;
    }

    private HttpHeaders devUser(String userId) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (userId != null) headers.set("X-Dev-User-Id", userId);
        return headers;
    }

    private ResponseEntity<String> exchange(HttpMethod method, String path, String userId, String body) {
        try {
            return rest.exchange(url(path), method, new HttpEntity<>(body, devUser(userId)), String.class);
        } catch (org.springframework.web.client.HttpStatusCodeException ex) {
            return ResponseEntity.status(ex.getStatusCode()).headers(ex.getResponseHeaders()).body(ex.getResponseBodyAsString());
        }
    }

    @Test @Order(1)
    void unauthorizedWithoutDevHeaderAndForbiddenForUnknownUser() throws Exception {
        cleanupJdbc = jdbc;
        cleanup(jdbc);

        ResponseEntity<String> noHeader = exchange(HttpMethod.POST, "/p/api/wpf/popups", null, "{}");
        assertEquals(HttpStatus.UNAUTHORIZED, noHeader.getStatusCode(), noHeader.getBody());
        // JDK HttpURLConnection(RestTemplate 기본)은 본문이 있는 POST의 401 응답 본문을 읽지 못한다. 본문 코드는 MockMvc 테스트에서 확인한다.
        if (noHeader.getBody() != null && !noHeader.getBody().isBlank()) {
            assertEquals("WPF_UNAUTHORIZED", json.readTree(noHeader.getBody()).get("code").asText());
        }

        ResponseEntity<String> unknown = exchange(HttpMethod.POST, "/p/api/wpf/popups", "E9999", "{}");
        assertEquals(HttpStatus.FORBIDDEN, unknown.getStatusCode(), unknown.getBody());
        assertNotNull(json.readTree(unknown.getBody()).get("code"), unknown.getBody());
        assertEquals("WPF_USER_INACTIVE", json.readTree(unknown.getBody()).get("code").asText());
    }

    /** [설계 35] 조회는 POST 단건: {pollingIntervalSeconds, popup(deliveryId 포함)}. 응답 유실 후 재조회는 같은 전달 건. */
    @Test @Order(2)
    void nextPopupReturnsOneServerJudgedPopupWithDelivery() throws Exception {
        ResponseEntity<String> res = exchange(HttpMethod.POST, "/p/api/wpf/popups", USER, "{}");
        assertEquals(HttpStatus.OK, res.getStatusCode(), res.getBody());
        JsonNode root = json.readTree(res.getBody());
        assertEquals(1800, root.get("pollingIntervalSeconds").asInt());
        for (String removed : List.of("userId", "serverTime", "popups", "nextStatus")) assertFalse(root.has(removed), removed);

        JsonNode popup = root.get("popup");
        assertEquals("SAMPLE-TEXT-001", popup.get("popupId").asText());
        assertFalse(popup.get("deliveryId").asText().isBlank());
        assertFalse(popup.has("displayOrder"));
        assertFalse(popup.has("displayStartAt"));
        assertEquals("서비스 점검 안내\n점검 시간 동안 접속이 제한됩니다.\n9월 21일(일) 02:00~06:00 점검 예정입니다.",
                popup.get("content").get("plainText").asText());

        JsonNode again = json.readTree(exchange(HttpMethod.POST, "/p/api/wpf/popups", USER, null).getBody()).get("popup");
        assertEquals(popup.get("deliveryId").asText(), again.get("deliveryId").asText(), "OPEN 전달 건 재사용");
    }

    private JsonNode next() throws Exception {
        ResponseEntity<String> res = exchange(HttpMethod.POST, "/p/api/wpf/popups", USER, "{}");
        assertEquals(HttpStatus.OK, res.getStatusCode(), res.getBody());
        return json.readTree(res.getBody());
    }

    private JsonNode result(String body) throws Exception {
        ResponseEntity<String> res = exchange(HttpMethod.POST, "/p/api/wpf/popups/results", USER, body);
        assertEquals(HttpStatus.OK, res.getStatusCode(), res.getBody());
        return json.readTree(res.getBody());
    }

    /** [설계 35] 결과 1건씩 처리하고 커밋하며 nextStatus로 다음 조회 여부를 알린다. 마지막엔 popup=null. */
    @Test @Order(3)
    void resultsAreProcessedOneByOneWithNextStatus() throws Exception {
        JsonNode text = next().get("popup");
        String hiddenId = UUID.randomUUID().toString();
        String hiddenBody = """
                {"resultId":"%s","deliveryId":"%s","popupId":"SAMPLE-TEXT-001","resultType":"HIDDEN",
                 "displayedAt":"2026-09-19T09:00:05+09:00","closedAt":"2026-09-19T09:00:40+09:00","hideDays":7}
                """.formatted(hiddenId, text.get("deliveryId").asText());
        JsonNode hidden = result(hiddenBody);
        assertEquals("ACCEPTED", hidden.get("status").asText(), hidden.toString());
        assertEquals("AVAILABLE", hidden.get("nextStatus").asText());
        assertEquals(hiddenId, hidden.get("resultId").asText());
        for (String removed : List.of("results", "popup", "popupStatus", "hiddenUntil")) assertFalse(hidden.has(removed), removed);
        JsonNode duplicate = result(hiddenBody);
        assertEquals("DUPLICATE", duplicate.get("status").asText(), "같은 resultId 재전송");
        assertEquals("AVAILABLE", duplicate.get("nextStatus").asText());

        JsonNode video = next().get("popup");
        assertEquals("SAMPLE-VIDEO-002", video.get("popupId").asText());
        JsonNode watched = result("""
                {"resultId":"%s","deliveryId":"%s","popupId":"SAMPLE-VIDEO-002","resultType":"VIDEO_WATCHED",
                 "video":{"durationSeconds":540,"positionSeconds":540,"maximumPositionSeconds":540,"watchedSeconds":531.5}}
                """.formatted(UUID.randomUUID(), video.get("deliveryId").asText()));
        assertEquals("ACCEPTED", watched.get("status").asText(), watched.toString());
        assertEquals("AVAILABLE", watched.get("nextStatus").asText());

        ResponseEntity<String> surveyRes = exchange(HttpMethod.POST, "/p/api/wpf/popups", USER, "{}");
        assertFalse(surveyRes.getBody().contains("correctAnswer"));
        assertFalse(surveyRes.getBody().contains("isCorrect"));
        JsonNode survey = json.readTree(surveyRes.getBody()).get("popup");
        assertEquals("SAMPLE-SURVEY-004", survey.get("popupId").asText());
        assertEquals(2, survey.get("questions").size());
        assertFalse(survey.has("passingScore"));
        long q1 = survey.get("questions").get(0).get("questionId").asLong();
        long o1 = survey.get("questions").get(0).get("options").get(0).get("optionId").asLong();
        long q2 = survey.get("questions").get(1).get("questionId").asLong();
        JsonNode submitted = result("""
                {"resultId":"%s","deliveryId":"%s","popupId":"SAMPLE-SURVEY-004","resultType":"SUBMITTED",
                 "answers":[{"questionId":%d,"optionIds":[%d]},{"questionId":%d,"textAnswer":"HTTP 연동 확인"}]}
                """.formatted(UUID.randomUUID(), survey.get("deliveryId").asText(), q1, o1, q2));
        assertEquals("ACCEPTED", submitted.get("status").asText(), submitted.toString());
        assertEquals("EMPTY", submitted.get("nextStatus").asText(), "완료·숨김 후 남은 후보 없음");

        ResponseEntity<String> empty = exchange(HttpMethod.POST, "/p/api/wpf/popups", USER, "{}");
        assertTrue(empty.getBody().contains("\"popup\":null"), empty.getBody());

        JsonNode foreign = result("""
                {"resultId":"%s","deliveryId":"NO-SUCH-DELIVERY","popupId":"SAMPLE-QUIZ-003","resultType":"CLOSED"}
                """.formatted(UUID.randomUUID()));
        assertEquals("REJECTED", foreign.get("status").asText());
        assertEquals("WPF_INVALID_DELIVERY", foreign.get("code").asText());
        assertFalse(foreign.has("nextStatus"));

        // 결과별 REQUIRES_NEW 커밋 — 영수증 3건, 전달 건 3건 종료, 요청 로그는 결과 요청마다 1건
        assertEquals(3, jdbc.queryForObject("SELECT COUNT(*) FROM " + SCHEMA_PREFIX + "WPF_RESULT_RECEIPT WHERE EMPLOYEE_NO = ?", Integer.class, USER));
        assertEquals(3, jdbc.queryForObject("SELECT COUNT(*) FROM " + SCHEMA_PREFIX + "WPF_POPUP_DELIVERY WHERE EMPLOYEE_NO = ? AND DELIVERY_STATUS = 'DONE'", Integer.class, USER));
        assertEquals(5, jdbc.queryForObject("SELECT COUNT(*) FROM " + SCHEMA_PREFIX + "API_REQUEST_LOG WHERE EMPLOYEE_NO = ? AND API_PATH LIKE '%/results'", Integer.class, USER));
    }

    @Test @Order(4)
    void invalidBodyIsBadRequestWithWpfCode() throws Exception {
        ResponseEntity<String> res = exchange(HttpMethod.POST, "/p/api/wpf/popups/results", USER, "[1,2]");
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertEquals("WPF_BAD_REQUEST", json.readTree(res.getBody()).get("code").asText());
    }}
