package server.web.api.popup.wpf;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import server.base.props.WpfPopupProps;
import server.domain.popup.wpf.WpfErrorResultCommand;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.WpfPopupMapper;
import server.service.core.popup.PopupService;
import server.service.core.popup.wpf.WpfPopupService;
import server.service.core.popup.wpf.WpfResultProcessor;
import server.web.api.popup.wpf.version.WpfClientVersionInterceptor;
import server.base.props.WpfClientVersionProps;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/**
 * POL-09-03 : 저장 응답
 * POL-12-01 : 종결과 보관
 * POL-16-02 : 재현 가능한 검증
 * ■ 장애별 분기 처리 결과 예시(백엔드 인계, 2026-11-17)
 * - 실제 컨트롤러·서비스·WPF 예외 어드바이스·버전 인터셉터를 거친 응답을 경우별로 만들고 HTTP 상태·status·code를 단언한다.
 *   매퍼·결과 처리기만 mock이다(DB 없음). 응답 본문은 build/wpf-error-branch-examples/&lt;번호&gt;.json에 저장하며,
 *   docs/interfaces/Server/SERVER_WPF_ERROR_BRANCH_GUIDE.md의 결과 예시는 이 파일에서 가져온다(timestamp는 실행 시각).
 * - 분류: H = HTTP 오류로 응답(본문 {code, message, timestamp}), R = HTTP 200 결과 응답(본문 {resultId, status, nextStatus?, code?, message?}),
 *   Q = HTTP 200 조회 응답.
 */
class WpfErrorBranchExamplesTest {

    private static final Path OUT = Path.of("build", "wpf-error-branch-examples");
    private static final String VERSION = "1.3.0";
    private static final String CLOSED = """
            {"resultId":"r-0001","deliveryId":"d-0001","popupId":"NOTICE-001","resultType":"CLOSED",
             "displayedAt":"2026-11-17T09:00:00+09:00","closedAt":"2026-11-17T09:01:00+09:00"}""";

    private final ObjectMapper json = new ObjectMapper().registerModule(new JavaTimeModule());
    private PopupMapper popupMapper;
    private WpfPopupMapper wpfMapper;
    private WpfResultProcessor processor;
    private MockMvc mvc;

    @BeforeEach void setup() throws Exception {
        popupMapper = mock(PopupMapper.class);
        wpfMapper = mock(WpfPopupMapper.class);
        processor = mock(WpfResultProcessor.class);
        WpfPopupProps props = new WpfPopupProps();
        props.setPollingIntervalSeconds(1800);
        WpfPopupService service = new WpfPopupService(mock(PopupService.class), popupMapper, wpfMapper, processor, props);
        when(wpfMapper.countActiveUser("E1001")).thenReturn(1);
        when(wpfMapper.lockActiveUser("E1001")).thenReturn("E1001");

        WpfClientVersionProps versionProps = new WpfClientVersionProps();
        versionProps.setMinimumSupportedVersion(VERSION);
        versionProps.setLatestVersion("1.4.2");
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule())
                .enable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .setSerializationInclusion(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL);
        mvc = MockMvcBuilders.standaloneSetup(new WpfPopupController(service, new DevHeaderWpfUserResolver()))
                .setControllerAdvice(new WpfApiExceptionHandler())
                .addMappedInterceptors(new String[] {"/p/api/wpf/**"}, new WpfClientVersionInterceptor(versionProps, json))
                .setMessageConverters(new MappingJackson2HttpMessageConverter(mapper))
                .build();
        Files.createDirectories(OUT);
    }

    private static MockHttpServletRequestBuilder query(String user) {
        var request = post("/p/api/wpf/popups").header("X-Client-Version", VERSION).contentType(MediaType.APPLICATION_JSON).content("{}");
        return user == null ? request : request.header("X-Dev-User-Id", user);
    }

    private static MockHttpServletRequestBuilder result(String user, String body) {
        var request = post("/p/api/wpf/popups/results").header("X-Client-Version", VERSION)
                .contentType(MediaType.APPLICATION_JSON).content(body);
        return user == null ? request : request.header("X-Dev-User-Id", user);
    }

    /** 응답을 저장하고 HTTP 상태·주요 필드를 단언한다. expected는 "필드=값" 목록(값 null = 필드 없음). */
    private JsonNode example(String name, MockHttpServletRequestBuilder request, int http, String... expected) throws Exception {
        MvcResult mvcResult = mvc.perform(request).andReturn();
        String body = mvcResult.getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode node = json.readTree(body);
        Files.writeString(OUT.resolve(name + ".json"),
                "HTTP " + mvcResult.getResponse().getStatus() + System.lineSeparator()
                        + json.writerWithDefaultPrettyPrinter().writeValueAsString(node) + System.lineSeparator(), StandardCharsets.UTF_8);
        assertEquals(http, mvcResult.getResponse().getStatus(), name + " HTTP: " + body);
        for (String pair : expected) {
            String field = pair.substring(0, pair.indexOf('=')), value = pair.substring(pair.indexOf('=') + 1);
            if (value.equals("null")) assertFalse(node.has(field) && !node.get(field).isNull(), name + " " + field + " absent: " + body);
            else assertEquals(value, node.path(field).asText(), name + " " + field + ": " + body);
        }
        return node;
    }

    // ── H: 요청 자체를 처리하지 못함 → HTTP 오류 + {code, message, timestamp} ──

    @Test void h1_versionTooOldIs426() throws Exception {
        example("H1-426-version", post("/p/api/wpf/popups").header("X-Client-Version", "1.2.9").header("X-Dev-User-Id", "E1001"),
                426, "code=CLIENT_VERSION_NOT_SUPPORTED", "clientVersion=1.2.9", "minimumSupportedVersion=" + VERSION);
    }

    @Test void h2_noUserIs401() throws Exception {
        example("H2-401-unauthorized", query(null), 401, "code=WPF_UNAUTHORIZED");
    }

    @Test void h3_inactiveUserIs403() throws Exception {
        example("H3-403-user-inactive", result("E9999", CLOSED), 403, "code=WPF_USER_INACTIVE");
    }

    @Test void h4_unreadableBodyIs400() throws Exception {
        example("H4-400-bad-request", result("E1001", "{\"resultId\": \"r-0001\", "), 400,
                "code=WPF_BAD_REQUEST", "message=요청 본문을 해석할 수 없습니다.");
    }

    @Test void h5_queryFailureIs500() throws Exception {
        when(wpfMapper.lockActiveUser("E1001")).thenThrow(new IllegalStateException("ORA-01017 내부 오류(응답에 노출되지 않음)"));
        JsonNode node = example("H5-500-internal", query("E1001"), 500, "code=WPF_INTERNAL", "message=서버 처리 중 오류가 발생했습니다.");
        assertFalse(node.toString().contains("ORA-"), "내부 오류 상세는 응답에 넣지 않는다");
    }

    // ── Q: 조회 정상 — 표시할 팝업 없음은 오류가 아니다 ──

    @Test void q1_noPopupIs200WithNull() throws Exception {
        JsonNode node = example("Q1-200-no-popup", query("E1001"), 200, "pollingIntervalSeconds=1800");
        assertEquals(true, node.has("popup") && node.get("popup").isNull(), "popup 키는 null로 유지");
    }

    // ── R: 결과 API — 요청은 읽었고 그 결과 1건의 처리 판정을 HTTP 200 status로 알린다 ──

    @Test void r1_acceptedWithNextAvailable() throws Exception {
        when(processor.processOne(anyString(), any())).thenAnswer(i -> WpfResultItemResponse.accepted(i.getArgument(1, WpfResultCommand.class)));
        when(popupMapper.countAvailablePopups("E1001", true)).thenReturn(1);
        example("R1-200-ACCEPTED", result("E1001", CLOSED), 200, "status=ACCEPTED", "nextStatus=AVAILABLE", "code=null");
    }

    @Test void r2_duplicateWithNextEmpty() throws Exception {
        when(processor.processOne(anyString(), any())).thenAnswer(i -> WpfResultItemResponse.duplicate(i.getArgument(1, WpfResultCommand.class)));
        when(popupMapper.countAvailablePopups("E1001", true)).thenReturn(0);
        example("R2-200-DUPLICATE", result("E1001", CLOSED), 200, "status=DUPLICATE", "nextStatus=EMPTY");
    }

    @Test void r3_formatErrorIsRejectedNot400() throws Exception {
        example("R3-200-REJECTED-format", result("E1001", "{\"resultId\":\"r-0001\",\"deliveryId\":\"d-0001\",\"popupId\":\"NOTICE-001\"}"),
                200, "status=REJECTED", "code=WPF_INVALID_RESULT", "nextStatus=null");
    }

    @Test void r4_businessRuleIsRejectedWithCode() throws Exception {
        when(processor.processOne(anyString(), any())).thenThrow(new IllegalArgumentException("유효한 전달 건이 아닙니다. deliveryId=d-0001"));
        example("R4-200-REJECTED-delivery", result("E1001", CLOSED), 200, "status=REJECTED", "code=WPF_INVALID_DELIVERY", "nextStatus=null");
    }

    @Test void r5_transientDbFailureIsRetryable() throws Exception {
        when(processor.processOne(anyString(), any())).thenThrow(new org.springframework.dao.CannotAcquireLockException("ORA-00060: deadlock detected"));
        JsonNode node = example("R5-200-RETRYABLE_ERROR", result("E1001", CLOSED), 200, "status=RETRYABLE_ERROR", "code=WPF_RETRYABLE", "nextStatus=null");
        assertFalse(node.toString().contains("ORA-"), "DB 오류 상세는 응답에 넣지 않는다");
    }

    @Test void r6_unclassifiedFailureIsInternal() throws Exception {
        when(processor.processOne(anyString(), any())).thenThrow(new IllegalStateException("NullPointer 등 원인 미확정"));
        example("R6-200-INTERNAL_ERROR", result("E1001", CLOSED), 200, "status=INTERNAL_ERROR", "code=WPF_INTERNAL", "nextStatus=null");
    }

    @Test void r7_savedButNextUnknown() throws Exception {
        when(processor.processOne(anyString(), any())).thenAnswer(i -> WpfResultItemResponse.accepted(i.getArgument(1, WpfResultCommand.class)));
        when(popupMapper.countAvailablePopups("E1001", true)).thenThrow(new IllegalStateException("후보 조회 실패"));
        example("R7-200-ACCEPTED-next-unknown", result("E1001", CLOSED), 200, "status=ACCEPTED", "code=WPF_NEXT_STATUS_UNKNOWN", "nextStatus=null");
    }

    @Test void r8_wpfErrorResultIsAccepted() throws Exception {
        when(processor.processError(anyString(), any())).thenAnswer(i -> new WpfResultItemResponse(
                i.getArgument(1, WpfErrorResultCommand.class).resultId(), WpfResultItemResponse.Status.ACCEPTED, null, null));
        when(popupMapper.countAvailablePopups("E1001", true)).thenReturn(0);
        String errorResult = """
                {"resultId":"r-0002","deliveryId":"d-0002","popupId":"NOTICE-002","resultCode":400,
                 "resultDesc":"팝업 조회 응답 처리 실패: JSON 형식 오류(Path=$.popup.width)","closedAt":"2026-11-17T09:05:00+09:00"}""";
        example("R8-200-ACCEPTED-error-result", result("E1001", errorResult), 200, "status=ACCEPTED", "nextStatus=EMPTY");
    }
}
