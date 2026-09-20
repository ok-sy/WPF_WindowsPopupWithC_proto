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
    }

    @LocalServerPort int port;
    @Autowired JdbcTemplate jdbc;
    private final RestTemplate rest = new RestTemplate();
    private final ObjectMapper json = new ObjectMapper();

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
        jdbc.update("DELETE FROM POPUP.WPF_RESULT_RECEIPT WHERE EMPLOYEE_NO = ?", USER);
        jdbc.update("DELETE FROM POPUP.POPUP_RESPONSE_VALUE WHERE RESPONSE_ANSWER_ID IN (SELECT RESPONSE_ANSWER_ID FROM POPUP.POPUP_RESPONSE_ANSWER WHERE RESPONSE_ID IN (SELECT RESPONSE_ID FROM POPUP.POPUP_RESPONSE WHERE EMPLOYEE_NO = ?))", USER);
        jdbc.update("DELETE FROM POPUP.POPUP_RESPONSE_ANSWER WHERE RESPONSE_ID IN (SELECT RESPONSE_ID FROM POPUP.POPUP_RESPONSE WHERE EMPLOYEE_NO = ?)", USER);
        jdbc.update("DELETE FROM POPUP.POPUP_RESPONSE WHERE EMPLOYEE_NO = ?", USER);
        jdbc.update("DELETE FROM POPUP.VIDEO_VIEW_STATUS WHERE EMPLOYEE_NO = ?", USER);
        jdbc.update("DELETE FROM POPUP.USER_POPUP_STATUS WHERE EMPLOYEE_NO = ?", USER);
        jdbc.update("DELETE FROM POPUP.API_REQUEST_LOG WHERE EMPLOYEE_NO = ?", USER);
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

        ResponseEntity<String> noHeader = exchange(HttpMethod.GET, "/p/api/wpf/popups", null, null);
        assertEquals(HttpStatus.UNAUTHORIZED, noHeader.getStatusCode());
        assertEquals("WPF_UNAUTHORIZED", json.readTree(noHeader.getBody()).get("code").asText());

        ResponseEntity<String> unknown = exchange(HttpMethod.GET, "/p/api/wpf/popups", "E9999", null);
        assertEquals(HttpStatus.FORBIDDEN, unknown.getStatusCode());
        assertEquals("WPF_USER_INACTIVE", json.readTree(unknown.getBody()).get("code").asText());
    }

    @Test @Order(2)
    void listReturnsServerJudgedPopupsWithIsoDatesAndNoAnswers() throws Exception {
        ResponseEntity<String> res = exchange(HttpMethod.GET, "/p/api/wpf/popups", USER, null);
        assertEquals(HttpStatus.OK, res.getStatusCode(), res.getBody());
        JsonNode root = json.readTree(res.getBody());
        assertEquals(USER, root.get("userId").asText());
        assertEquals(1800, root.get("pollingIntervalSeconds").asInt());
        assertTrue(root.get("serverTime").asText().matches("\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\+09:00"), "ISO 8601 (전역 epoch 설정 무시)");

        List<String> ids = root.get("popups").findValuesAsText("popupId");
        assertEquals(List.of("SAMPLE-TEXT-001", "SAMPLE-VIDEO-002", "SAMPLE-SURVEY-004"), ids);

        JsonNode survey = root.get("popups").get(2);
        assertEquals(2, survey.get("questions").size());
        assertFalse(survey.get("content").has("questions"));
        assertFalse(survey.has("passingScore"));
        assertFalse(survey.has("questionTemplateId"));
        assertFalse(res.getBody().contains("correctAnswer"));
        assertFalse(res.getBody().contains("isCorrect"));
        assertTrue(survey.get("displayStartAt").asText().endsWith("+09:00"));
        assertEquals("9월 21일(일) 02:00~06:00 점검 예정입니다.", root.get("popups").get(0).get("content").get("plainText").asText());
    }

    @Test @Order(3)
    void resultsAreProcessedPerItemAndCommitted() throws Exception {
        JsonNode list = json.readTree(exchange(HttpMethod.GET, "/p/api/wpf/popups", USER, null).getBody());
        JsonNode survey = list.get("popups").get(2);
        long q1 = survey.get("questions").get(0).get("questionId").asLong();
        long o1 = survey.get("questions").get(0).get("options").get(0).get("optionId").asLong();
        long q2 = survey.get("questions").get(1).get("questionId").asLong();

        String hiddenId = UUID.randomUUID().toString();
        String body = """
                {"clientRequestId":"http-test","sentAt":"2026-09-19T09:12:30+09:00","results":[
                  {"resultId":"%s","popupId":"SAMPLE-TEXT-001","resultType":"HIDDEN",
                   "displayedAt":"2026-09-19T09:00:05+09:00","closedAt":"2026-09-19T09:00:40+09:00","hideDays":7},
                  {"resultId":"%s","popupId":"SAMPLE-SURVEY-004","resultType":"SUBMITTED",
                   "answers":[{"questionId":%d,"optionIds":[%d]},{"questionId":%d,"textAnswer":"HTTP 연동 확인"}]},
                  {"resultId":"%s","popupId":"SAMPLE-VIDEO-002","resultType":"VIDEO_WATCHED",
                   "video":{"durationSeconds":540,"positionSeconds":540,"maximumPositionSeconds":540,"watchedSeconds":531.5}},
                  {"resultId":"%s","popupId":"SAMPLE-QUIZ-003","resultType":"SUBMITTED",
                   "answers":[{"questionId":1,"optionIds":[1]}]},
                  {"resultId":"%s","popupId":"SAMPLE-TEXT-001","resultType":"HIDDEN","hideDays":7}
                ]}
                """.formatted(hiddenId, UUID.randomUUID(), q1, o1, q2, UUID.randomUUID(), UUID.randomUUID(), hiddenId);

        ResponseEntity<String> res = exchange(HttpMethod.POST, "/p/api/wpf/popups/results", USER, body);
        assertEquals(HttpStatus.OK, res.getStatusCode(), res.getBody());
        JsonNode results = json.readTree(res.getBody()).get("results");
        assertEquals(5, results.size());
        assertEquals("ACCEPTED", results.get(0).get("status").asText());
        assertEquals("HIDDEN", results.get(0).get("popupStatus").asText());
        assertTrue(results.get(0).get("hiddenUntil").asText().endsWith("+09:00"));
        assertEquals("ACCEPTED", results.get(1).get("status").asText(), results.get(1).toString());
        assertTrue(results.get(1).get("completed").asBoolean(), "SURVEY 즉시 완료");
        assertFalse(results.get(1).has("totalScore"), "SURVEY 채점 결과 없음");
        assertEquals("ACCEPTED", results.get(2).get("status").asText(), results.get(2).toString());
        assertEquals(0.9842, results.get(2).get("watchedRatio").asDouble(), 0.0001);
        assertTrue(results.get(2).get("completed").asBoolean());
        assertEquals("REJECTED", results.get(3).get("status").asText(), "E1002는 QUIZ 대상이 아님");
        assertEquals("WPF_NOT_ELIGIBLE", results.get(3).get("code").asText());
        assertEquals("DUPLICATE", results.get(4).get("status").asText());

        // 항목별 REQUIRES_NEW 커밋 확인 — 거절된 QUIZ 항목과 무관하게 나머지가 DB에 남아 있다
        Integer receipts = jdbc.queryForObject("SELECT COUNT(*) FROM POPUP.WPF_RESULT_RECEIPT WHERE EMPLOYEE_NO = ?", Integer.class, USER);
        assertEquals(3, receipts);
        Integer logs = jdbc.queryForObject("SELECT COUNT(*) FROM POPUP.API_REQUEST_LOG WHERE EMPLOYEE_NO = ? AND CLIENT_REQUEST_ID = 'http-test'", Integer.class, USER);
        assertEquals(1, logs);

        // 완료·숨김 반영 후 목록은 비어야 한다 (기준 2)
        JsonNode after = json.readTree(exchange(HttpMethod.GET, "/p/api/wpf/popups", USER, null).getBody());
        assertEquals(0, after.get("popups").size());
    }

    @Test @Order(4)
    void invalidBodyIsBadRequestWithWpfCode() throws Exception {
        ResponseEntity<String> res = exchange(HttpMethod.POST, "/p/api/wpf/popups/results", USER,
                "{\"clientRequestId\":\"x\",\"results\":[]}");
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertEquals("WPF_BAD_REQUEST", json.readTree(res.getBody()).get("code").asText());
    }
}
