package server.web.api.popup.sample;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import server.service.core.popup.sample.PopupSampleException;
import server.service.core.popup.sample.PopupSingleQuerySampleService;
import server.web.api.popup.wpf.WpfUnauthorizedException;
import server.web.api.popup.wpf.WpfUserResolver;

/** [TODO65] 샘플 API의 HTTP 계약: 정상·없음(popup:null)·데이터 오류 500·인증 401·본문 400. */
class PopupSingleQuerySampleControllerTest {

    private final PopupSingleQuerySampleService service = mock(PopupSingleQuerySampleService.class);
    private final WpfUserResolver resolver = request -> {
        String user = request.getHeader("X-Dev-User");
        if (user == null) throw new WpfUnauthorizedException("사번 없음");
        return user;
    };
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new PopupSingleQuerySampleController(service, resolver))
                .setControllerAdvice(new PopupSingleQuerySampleExceptionHandler()).build();
    }

    @Test
    void returnsServiceResponseAndNullPopup() throws Exception {
        ObjectNode empty = new ObjectMapper().createObjectNode().put("pollingIntervalSeconds", 1800);
        empty.putNull("popup");
        when(service.nextPopup(eq("E1001"), isNull(), isNull())).thenReturn(empty);
        mvc.perform(post("/p/api/sample/wpf/popups/single").header("X-Dev-User", "E1001").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pollingIntervalSeconds").value(1800))
                .andExpect(jsonPath("$.popup").isEmpty());
    }

    @Test
    void dataErrorIsInternalWithoutDetails() throws Exception {
        when(service.nextPopup(any(), any(), any())).thenThrow(
                new PopupSampleException(PopupSampleException.Reason.INVALID_CONTENT_JSON, "C-001", "CNTN_CN JSON 구문 오류"));
        mvc.perform(post("/p/api/sample/wpf/popups/single").header("X-Dev-User", "E1001").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("WPF_INTERNAL"))
                .andExpect(jsonPath("$.message").value("서버 처리 중 오류가 발생했습니다."))
                .andExpect(jsonPath("$.popup").doesNotExist());
    }

    @Test
    void authAndBodyErrorsUseWpfCodes() throws Exception {
        mvc.perform(post("/p/api/sample/wpf/popups/single").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("WPF_UNAUTHORIZED"));
        mvc.perform(post("/p/api/sample/wpf/popups/single").header("X-Dev-User", "E1001").contentType(MediaType.APPLICATION_JSON).content("[1]"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("WPF_BAD_REQUEST"));
    }
}
