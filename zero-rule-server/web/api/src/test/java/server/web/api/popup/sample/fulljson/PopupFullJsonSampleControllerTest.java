package server.web.api.popup.sample.fulljson;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import server.service.core.popup.sample.fulljson.PopupFullJsonSampleService;
import server.web.api.popup.wpf.WpfUnauthorizedException;
import server.web.api.popup.wpf.WpfUserResolver;

/**
 * POL-14-03 : 서버 인계 예제
 * POL-16-02 : 재현 가능한 검증
 * ■ DTIY3117 전체 JSON 조회 샘플 API의 HTTP 계약 테스트
 * - 정상·없음(popup:null)·데이터 오류 500·인증 401·본문/popupId 400을 확인한다.
 */
class PopupFullJsonSampleControllerTest {

    private static final String URL = "/p/api/sample/wpf/popups/full-json/single";
    private final PopupFullJsonSampleService service = mock(PopupFullJsonSampleService.class);
    private final WpfUserResolver resolver = request -> {
        String user = request.getHeader("X-Dev-User");
        if (user == null) throw new WpfUnauthorizedException("사번 없음");
        return user;
    };
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new PopupFullJsonSampleController(service, resolver))
                .setControllerAdvice(new PopupFullJsonSampleExceptionHandler()).build();
    }

    @Test
    void returnsServiceResponseAndNullPopup() throws Exception {
        ObjectNode empty = new ObjectMapper().createObjectNode().put("pollingIntervalSeconds", 1800);
        empty.putNull("popup");
        when(service.nextPopup(eq("E1001"), eq("S17-TXT-01"))).thenReturn(empty);
        mvc.perform(post(URL).param("popupId", "S17-TXT-01").header("X-Dev-User", "E1001").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pollingIntervalSeconds").value(1800))
                .andExpect(jsonPath("$.popup").isEmpty());
    }

    @Test
    void dataErrorIsInternalWithoutDetails() throws Exception {
        when(service.nextPopup(any(), any())).thenThrow(new PopupSampleException(PopupSampleException.Reason.INVALID_CONTENT_JSON, "S17-TXT-01", "내부 상세"));
        mvc.perform(post(URL).param("popupId", "S17-TXT-01").header("X-Dev-User", "E1001"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("WPF_INTERNAL"))
                .andExpect(jsonPath("$.message").value("서버 처리 중 오류가 발생했습니다."));
    }

    @Test
    void missingUserIsUnauthorized() throws Exception {
        mvc.perform(post(URL).param("popupId", "S17-TXT-01"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("WPF_UNAUTHORIZED"));
    }

    @Test
    void badBodyOrMissingPopupIdIsBadRequest() throws Exception {
        mvc.perform(post(URL).param("popupId", "S17-TXT-01").header("X-Dev-User", "E1001").contentType(MediaType.APPLICATION_JSON).content("[]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("WPF_BAD_REQUEST"));
        when(service.nextPopup(eq("E1001"), eq(null))).thenThrow(new IllegalArgumentException("popupId가 필요합니다."));
        mvc.perform(post(URL).header("X-Dev-User", "E1001"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("popupId가 필요합니다."));
    }
}
