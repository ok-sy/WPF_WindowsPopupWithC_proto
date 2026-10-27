package server.web.api.popup.wpf.auth;

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
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import server.domain.popup.wpf.WpfNextPopupResponse;
import server.service.core.popup.wpf.WpfPopupService;
import server.web.api.popup.wpf.WpfApiExceptionHandler;
import server.web.api.popup.wpf.WpfPopupController;

import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * POL-15-02 : 인증·버전
 * POL-09-01 : 3 API 순서
 * POL-16-02 : 재현 가능한 검증
 * ■ SSO·토큰 프로토타입 HTTP 계약 테스트
 * - SSO·토큰 프로토타입의 HTTP 계약을 MockMvc(standalone)로 검증한다(T번호는 시험 항목 구분).
 * <ul>
 *   <li>T1: 로그인 → {accessToken, tokenType=Bearer, expiresAt(ISO)} → 그 토큰으로 팝업 API 200</li>
 *   <li>T2: TTL 경과 → 같은 토큰으로 팝업 API 401 WPF_UNAUTHORIZED → 재로그인 → 새 토큰으로 200</li>
 *   <li>헤더 없음·Bearer 아님·모르는 토큰 → 401, 필수 값 누락 → 400 WPF_BAD_REQUEST</li>
 * </ul>
 * 팝업 서비스는 mock이며, 컨트롤러가 토큰에서 얻은 사번으로 서비스를 호출하는지 확인한다.
 */
class WpfAuthPrototypeControllerTest {

    private WpfPrototypeTokenStoreTest.MutableClock clock;
    private WpfPrototypeTokenStore store;
    private WpfPopupService popupService;
    private MockMvc mvc;
    private final ObjectMapper json = new ObjectMapper();

    @BeforeEach void setup() {
        clock = new WpfPrototypeTokenStoreTest.MutableClock(Instant.parse("2026-09-21T09:00:00Z"));
        store = new WpfPrototypeTokenStore(Duration.ofMinutes(10), clock);
        popupService = mock(WpfPopupService.class);
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule())
                .enable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .setSerializationInclusion(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL);
        mvc = MockMvcBuilders.standaloneSetup(
                        new WpfAuthController(store),
                        new WpfPopupController(popupService, new PrototypeTokenWpfUserResolver(store)))
                .setControllerAdvice(new WpfApiExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(mapper))
                .build();
        when(popupService.getNextPopup("E1001")).thenReturn(new WpfNextPopupResponse(1800, null));
    }

    private String login() throws Exception {
        // 기대 만료 = 로그인 시점(고정 시계) + 10분, ISO 8601(+09:00)
        String expectedExpiresAt = OffsetDateTime.now(clock).plusMinutes(10)
                .format(java.time.format.DateTimeFormatter.ofPattern(server.domain.popup.wpf.WpfJson.DATE_TIME));
        MvcResult result = mvc.perform(post("/p/api/wpf/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lgonId\":\"E1001\",\"classCode\":\"A1\",\"linkYn\":\"N\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresAt").value(expectedExpiresAt))
                .andReturn();
        JsonNode body = json.readTree(result.getResponse().getContentAsString());
        String token = body.get("accessToken").asText();
        assertTrue(token.matches("[0-9a-f]{64}"));
        return token;
    }

    @Test void t1_loginThenPopupsWithBearer() throws Exception {
        String token = login();
        mvc.perform(post("/p/api/wpf/popups").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pollingIntervalSeconds").value(1800));
        verify(popupService).getNextPopup("E1001");
    }

    @Test void t2_expiredTokenIs401ThenReloginWorks() throws Exception {
        String token = login();
        clock.advance(Duration.ofMinutes(10));

        mvc.perform(post("/p/api/wpf/popups").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("WPF_UNAUTHORIZED"));
        verify(popupService, never()).getNextPopup(anyString());

        // WPF: 401 → OnUnauthorizedAsync → SSO·login → 새 토큰으로 원 요청 재전송
        String renewed = login();
        assertNotEquals(token, renewed);
        mvc.perform(post("/p/api/wpf/popups").header("Authorization", "Bearer " + renewed))
                .andExpect(status().isOk());
        mvc.perform(post("/p/api/wpf/popups").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());   // 만료 토큰은 계속 거절
    }

    @Test void missingOrWrongAuthorizationIs401AndDevHeaderIsIgnored() throws Exception {
        mvc.perform(post("/p/api/wpf/popups"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("WPF_UNAUTHORIZED"));
        mvc.perform(post("/p/api/wpf/popups").header("X-Dev-User-Id", "E1001"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/p/api/wpf/popups").header("Authorization", "Basic abc"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/p/api/wpf/popups").header("Authorization", "Bearer " + "0".repeat(64)))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(popupService);
    }

    /** 폐쇄망 p/api/ssoLogin과 같은 lgonId가 기준 키이고, 이전 WPF의 logonId도 별칭으로 받는다. */
    @Test void legacyLogonIdKeyIsAcceptedAsAlias() throws Exception {
        MvcResult result = mvc.perform(post("/p/api/wpf/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"logonId\":\"E1001\",\"classCode\":\"A1\",\"linkYn\":\"N\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String token = json.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
        mvc.perform(post("/p/api/wpf/popups").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
        verify(popupService).getNextPopup("E1001");
    }

    @Test void loginValidatesRequiredFields() throws Exception {
        mvc.perform(post("/p/api/wpf/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lgonId\":\"\",\"classCode\":\"A1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("WPF_BAD_REQUEST"));
        mvc.perform(post("/p/api/wpf/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lgonId\":\"E1001\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/p/api/wpf/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"lgonId\":\"E1001\",\"classCode\":\"A1\",\"linkYn\":\"X\"}"))
                .andExpect(status().isBadRequest());
        assertEquals(0, store.size());
    }
}
