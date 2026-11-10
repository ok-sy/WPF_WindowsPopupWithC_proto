package server.web.api.popup;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import server.service.core.popup.PopupService;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * POL-07-03 : 저장 경계
 * ■ 관리자 팝업 API 입력 오류 응답 테스트(2026-11-11)
 * - 서비스 검증 실패(IllegalArgumentException)와 @Valid 실패는 HTTP 400 + 기존 응답 형식(msgClsf=ER, msgCn=검증 문구)으로 응답한다.
 * - 그 밖의 예외는 이 처리기가 잡지 않는다(기존처럼 500 경로).
 */
class PopupAdminExceptionHandlerTest {

    private MockMvc mvc(PopupService service) {
        return MockMvcBuilders.standaloneSetup(new PopupAdminController(service))
                .setControllerAdvice(new PopupAdminExceptionHandler())
                .build();
    }

    @Test
    void validationFailureIs400WithServerMessage() throws Exception {
        PopupService service = mock(PopupService.class);
        String message = "선택지 내용은 UTF-8 300 Byte 이하여야 합니다. (현재 301 Byte)";
        when(service.getAdminPopup(any())).thenThrow(new IllegalArgumentException(message));
        mvc(service).perform(post("/apis/popup/info").contentType(MediaType.APPLICATION_JSON).content("{\"popupId\":\"P1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.msgClsf").value("ER"))
                .andExpect(jsonPath("$.msgId").value(PopupAdminExceptionHandler.INVALID_PARAMS_MSG_ID))
                .andExpect(jsonPath("$.msgCn").value(message))
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    @Test
    void beanValidationFailureIs400() throws Exception {
        mvc(mock(PopupService.class)).perform(post("/apis/popup/info").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.msgClsf").value("ER"))
                .andExpect(jsonPath("$.msgCn").value(org.hamcrest.Matchers.startsWith("popupId")));
    }

    @Test
    void otherErrorsAreNotTurnedInto400() {
        PopupService service = mock(PopupService.class);
        when(service.getAdminPopup(any())).thenThrow(new IllegalStateException("db down"));
        assertThrows(Exception.class, () ->
                mvc(service).perform(post("/apis/popup/info").contentType(MediaType.APPLICATION_JSON).content("{\"popupId\":\"P1\"}")));
    }
}
