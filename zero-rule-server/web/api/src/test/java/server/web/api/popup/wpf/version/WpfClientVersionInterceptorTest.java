package server.web.api.popup.wpf.version;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import server.base.props.WpfClientVersionProps;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * [설계 13 §13] 클라이언트 버전 인터셉터의 HTTP 계약을 MockMvc(standalone)로 검증한다.
 * T1 동일 버전 허용 / T2 상위 허용 / T3 하위 426 / T4 1.10.0 > 1.9.0 숫자 비교 / T5 헤더 누락 426 /
 * T7 실행 중 최소 버전 변경 즉시 반영 / 검증 비활성(minimum 비움) / WPF 외 경로 미적용.
 */
class WpfClientVersionInterceptorTest {

    @RestController
    static class ProbeController {
        @GetMapping("/p/api/wpf/popups") String wpf() { return "ok"; }
        @GetMapping("/p/api/wpf/auth/login") String login() { return "ok"; }
        @GetMapping("/apis/popup/list") String admin() { return "ok"; }
    }

    private WpfClientVersionProps props;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        props = new WpfClientVersionProps();
        props.setLatestVersion("1.4.2");
        props.setMinimumSupportedVersion("1.3.0");
        WpfClientVersionInterceptor interceptor = new WpfClientVersionInterceptor(props,
                new ObjectMapper().registerModule(new JavaTimeModule()));   // 앱의 ObjectMapper(BasicConfig)는 JSR-310 등록됨
        mvc = MockMvcBuilders.standaloneSetup(new ProbeController())
                .addMappedInterceptors(new String[] {"/p/api/wpf/**"}, interceptor)
                .build();
    }

    @Test void t1_sameAsMinimumIsAllowed() throws Exception {
        mvc.perform(get("/p/api/wpf/popups").header("X-Client-Version", "1.3.0")).andExpect(status().isOk());
    }

    @Test void t2_newerThanMinimumIsAllowed() throws Exception {
        mvc.perform(get("/p/api/wpf/popups").header("X-Client-Version", "1.3.5")).andExpect(status().isOk());
        mvc.perform(get("/p/api/wpf/popups").header("X-Client-Version", "1.4.2")).andExpect(status().isOk());
        mvc.perform(get("/p/api/wpf/popups").header("X-Client-Version", "2.0.0+build7")).andExpect(status().isOk());
    }

    @Test void t3_olderThanMinimumIs426WithBody() throws Exception {
        mvc.perform(get("/p/api/wpf/popups").header("X-Client-Version", "1.2.9"))
                .andExpect(status().is(426))
                .andExpect(jsonPath("$.code").value("CLIENT_VERSION_NOT_SUPPORTED"))
                .andExpect(jsonPath("$.clientVersion").value("1.2.9"))
                .andExpect(jsonPath("$.minimumSupportedVersion").value("1.3.0"))
                .andExpect(jsonPath("$.latestVersion").value("1.4.2"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test void t4_numericNotLexicographic() {
        assertTrue(ClientSemver.parse("1.10.0").orElseThrow().isAtLeast(ClientSemver.parse("1.9.0").orElseThrow()));
        assertTrue(ClientSemver.parse("1.3").orElseThrow().isAtLeast(ClientSemver.parse("1.3.0").orElseThrow()));
        assertEquals(0, ClientSemver.parse("1.3.0-beta").orElseThrow().compareTo(ClientSemver.parse("1.3").orElseThrow()));
        assertTrue(ClientSemver.parse("abc").isEmpty());
        assertTrue(ClientSemver.parse("").isEmpty());
        assertTrue(ClientSemver.parse("1.x.0").isEmpty());
    }

    @Test void t5_missingOrMalformedHeaderIs426_unlessNotRequired() throws Exception {
        mvc.perform(get("/p/api/wpf/popups")).andExpect(status().is(426))
                .andExpect(jsonPath("$.code").value("CLIENT_VERSION_NOT_SUPPORTED"));
        mvc.perform(get("/p/api/wpf/popups").header("X-Client-Version", "latest")).andExpect(status().is(426));

        props.setRequireHeader(false);
        mvc.perform(get("/p/api/wpf/popups")).andExpect(status().isOk());
        mvc.perform(get("/p/api/wpf/popups").header("X-Client-Version", "1.2.9")).andExpect(status().is(426));   // 헤더가 있으면 require-header와 무관하게 비교
    }

    @Test void t6_loginPathIsAlsoChecked() throws Exception {
        mvc.perform(get("/p/api/wpf/auth/login").header("X-Client-Version", "1.2.9")).andExpect(status().is(426));
        mvc.perform(get("/p/api/wpf/auth/login").header("X-Client-Version", "1.3.0")).andExpect(status().isOk());
    }

    @Test void t7_minimumChangedAtRuntimeAppliesToNextRequest() throws Exception {
        mvc.perform(get("/p/api/wpf/popups").header("X-Client-Version", "1.3.5")).andExpect(status().isOk());
        props.setMinimumSupportedVersion("1.4.0");
        mvc.perform(get("/p/api/wpf/popups").header("X-Client-Version", "1.3.5")).andExpect(status().is(426));
    }

    @Test void disabledWhenMinimumIsBlank_andAdminPathsUntouched() throws Exception {
        props.setMinimumSupportedVersion("");
        mvc.perform(get("/p/api/wpf/popups")).andExpect(status().isOk());
        mvc.perform(get("/p/api/wpf/popups").header("X-Client-Version", "0.0.1")).andExpect(status().isOk());

        props.setMinimumSupportedVersion("1.3.0");
        mvc.perform(get("/apis/popup/list")).andExpect(status().isOk());   // 관리자 API에는 등록되지 않음
    }
}
