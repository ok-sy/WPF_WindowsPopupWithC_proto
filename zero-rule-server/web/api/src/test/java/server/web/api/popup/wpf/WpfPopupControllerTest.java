package server.web.api.popup.wpf;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import server.domain.popup.wpf.WpfNextPopupResponse;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultResponse;
import server.domain.popup.wpf.WpfResultType;
import server.service.core.popup.wpf.WpfPopupService;
import server.web.api.payload.popup.wpf.WpfResultRequest;
import server.service.core.popup.wpf.WpfUserInactiveException;

import java.time.OffsetDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * [WPF API — 기준 3·6] 컨트롤러·예외 어드바이스·개발용 사용자 식별기의 HTTP 계약을 MockMvc(standalone)로 검증한다.
 * ObjectMapper는 운영 설정(BasicConfig)과 같이 WRITE_DATES_AS_TIMESTAMPS를 켜서, WPF DTO의 @JsonFormat이
 * 전역 설정을 이기고 ISO 8601 문자열로 직렬화되는지 함께 확인한다.
 */
class WpfPopupControllerTest {

    private WpfPopupService service;
    private MockMvc mvc;

    @BeforeEach void setup() {
        service = mock(WpfPopupService.class);
        ObjectMapper mapper = new ObjectMapper().registerModule(new JavaTimeModule())
                .enable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .setSerializationInclusion(com.fasterxml.jackson.annotation.JsonInclude.Include.NON_NULL);
        mvc = MockMvcBuilders.standaloneSetup(new WpfPopupController(service, new DevHeaderWpfUserResolver()))
                .setControllerAdvice(new WpfApiExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(mapper))
                .build();
    }

    private static server.domain.popup.wpf.WpfPopupItem item(String json, boolean grading) throws Exception {
        var dto = new ObjectMapper().registerModule(new JavaTimeModule()).readValue(json, server.domain.popup.PopupResponseDto.class);
        return server.domain.popup.wpf.WpfPopupItem.from(dto, grading).withDeliveryId("D-1");
    }

    /** [설계 35] 조회는 POST 단건 응답 {pollingIntervalSeconds, popup}. 대상이 없으면 popup 키를 null로 유지한다. */
    private org.springframework.test.web.servlet.ResultActions next(server.domain.popup.wpf.WpfPopupItem popup) throws Exception {
        when(service.getNextPopup("E1001")).thenReturn(new WpfNextPopupResponse(1800, popup));
        return mvc.perform(post("/p/api/wpf/popups").header("X-Dev-User-Id", "E1001")
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isOk());
    }

    @Test void nextPopupRequiresDevHeaderAndKeepsNullPopup() throws Exception {
        mvc.perform(post("/p/api/wpf/popups"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("WPF_UNAUTHORIZED"));

        when(service.getNextPopup("E1001")).thenReturn(new WpfNextPopupResponse(1800, null));
        var body = mvc.perform(post("/p/api/wpf/popups").header("X-Dev-User-Id", "E1001"))   // 본문 없이도 호출 가능
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pollingIntervalSeconds").value(1800))
                .andExpect(jsonPath("$.userId").doesNotExist())
                .andExpect(jsonPath("$.serverTime").doesNotExist())
                .andExpect(jsonPath("$.popups").doesNotExist())
                .andExpect(jsonPath("$.nextStatus").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        assertTrue(body.contains("\"popup\":null"), "전역 NON_NULL이어도 popup=null 키 유지: " + body);
        mvc.perform(get("/p/api/wpf/popups").header("X-Dev-User-Id", "E1001"))
                .andExpect(result -> assertNotEquals(200, result.getResponse().getStatus(), "이전 GET 목록 조회는 없다"));
    }

    @Test void inactiveUserIsForbiddenWithCode() throws Exception {
        when(service.getNextPopup("E9999")).thenThrow(new WpfUserInactiveException("E9999"));
        mvc.perform(post("/p/api/wpf/popups").header("X-Dev-User-Id", "E9999"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("WPF_USER_INACTIVE"));
    }

    @Test void popupCarriesDeliveryIdAndNoDisplayOrder() throws Exception {
        next(item("""
                {"popupId":"TEXT-35","popupType":"TEXT","title":"t","displayOrder":3,"sizeMode":"FIXED","width":500,"height":300,
                 "minimumWidth":100,"minimumHeight":100,"maximumWidth":900,"maximumHeight":700,"content":{"plainText":"x"}}
                """, false))
                .andExpect(jsonPath("$.popup.deliveryId").value("D-1"))
                .andExpect(jsonPath("$.popup.popupId").value("TEXT-35"))
                .andExpect(jsonPath("$.popup.displayOrder").doesNotExist())
                .andExpect(jsonPath("$.popup.questions").isArray());
    }

    @Test void image23HttpResponseUsesSingleContentDimensionPair() throws Exception {
        next(item("""
                {"popupId":"IMAGE-23","popupType":"IMAGE","title":"IMAGE","sizeMode":"FIXED",
                 "minimumWidth":100,"minimumHeight":100,"maximumWidth":400,"maximumHeight":300,
                 "content":{"imageUrl":"https://example.com/a.png","imageSizeMode":"FIT_TO_IMAGE",
                            "width":900,"height":600,"keepAspectRatio":false}}
                """, false))
                .andExpect(jsonPath("$.popup.width").doesNotExist())
                .andExpect(jsonPath("$.popup.height").doesNotExist())
                .andExpect(jsonPath("$.popup.content.width").value(900))
                .andExpect(jsonPath("$.popup.content.height").value(600))
                .andExpect(jsonPath("$.popup.content.keepAspectRatio").value(false))
                .andExpect(jsonPath("$.popup.content.imageWidth").doesNotExist());
    }

    /** [설계 29] 노출 판정 값은 WPF 응답에 없고, Footer 버튼 표시는 showFooterButton 하나로 나간다. */
    @Test void popupOmitsServerSideScheduleFieldsAndUsesShowFooterButton() throws Exception {
        next(item("""
                {"popupId":"TEXT-29","popupType":"TEXT","title":"TEXT","sizeMode":"FIXED","width":500,"height":300,
                 "minimumWidth":100,"minimumHeight":100,"maximumWidth":900,"maximumHeight":700,
                 "displayStartAt":"2026-09-19T09:00:00+09:00","displayEndAt":"2026-09-30T18:00:00+09:00",
                 "periodMode":"REPEAT","repeatInterval":1,"repeatDayOfWeek":"MON","repeatDayOfMonth":1,
                 "showCloseButton":false,"content":{"plainText":"본문"}}
                """, false))
                .andExpect(jsonPath("$.popup.showFooterButton").value(false))
                .andExpect(jsonPath("$.popup.showCloseButton").doesNotExist())
                .andExpect(jsonPath("$.popup.displayStartAt").doesNotExist())
                .andExpect(jsonPath("$.popup.displayEndAt").doesNotExist())
                .andExpect(jsonPath("$.popup.periodMode").doesNotExist())
                .andExpect(jsonPath("$.popup.repeatInterval").doesNotExist())
                .andExpect(jsonPath("$.popup.repeatDayOfWeek").doesNotExist())
                .andExpect(jsonPath("$.popup.repeatDayOfMonth").doesNotExist());
    }

    /** [TODO52-2] showLater는 최상위 boolean으로 나가며 요청 값이 없으면 false다. showDoNotShowAgain과 섞이지 않는다. */
    @Test void popupCarriesShowLaterSeparatelyFromDoNotShowAgain() throws Exception {
        String base = """
                {"popupId":"TEXT-52","popupType":"TEXT","title":"TEXT","sizeMode":"FIXED","width":500,"height":300,
                 "minimumWidth":100,"minimumHeight":100,"maximumWidth":900,"maximumHeight":700,%s
                 "content":{"plainText":"본문"}}
                """;
        next(item(base.formatted("\"showLater\":true,\"showDoNotShowAgain\":false,"), false))
                .andExpect(jsonPath("$.popup.showLater").value(true))
                .andExpect(jsonPath("$.popup.showDoNotShowAgain").value(false));
        next(item(base.formatted(""), false))
                .andExpect(jsonPath("$.popup.showLater").value(false));
    }

    /** [설계 30] Footer 동작은 content에서 빼 최상위로 내려주고, SURVEY/QUIZ는 저장 값과 무관하게 SUBMIT이다. */
    @Test void footerActionIsPromotedToTopLevel() throws Exception {
        String base = """
                {"popupId":"%s","popupType":"%s","title":"t","sizeMode":"FIXED","width":500,"height":300,
                 "minimumWidth":100,"minimumHeight":100,"maximumWidth":900,"maximumHeight":700,
                 "content":{%s}}
                """;
        next(item(base.formatted("TEXT-30", "TEXT",
                "\"plainText\":\"x\",\"footerAction\":\"LINK_AND_CLOSE\",\"footerLinkUrl\":\"https://example.com/\""), false))
                .andExpect(jsonPath("$.popup.footerAction").value("LINK_AND_CLOSE"))
                .andExpect(jsonPath("$.popup.footerLinkUrl").value("https://example.com/"))
                .andExpect(jsonPath("$.popup.content.footerAction").doesNotExist())
                .andExpect(jsonPath("$.popup.content.footerLinkUrl").doesNotExist());
        next(item(base.formatted("IMAGE-30", "IMAGE", "\"imageUrl\":\"https://example.com/a.png\""), false))
                .andExpect(jsonPath("$.popup.footerAction").value("CLOSE"))
                .andExpect(jsonPath("$.popup.footerLinkUrl").doesNotExist());
        next(item(base.formatted("QUIZ-30", "QUIZ",
                "\"surveyTitle\":\"q\",\"footerAction\":\"LINK_AND_CLOSE\",\"footerLinkUrl\":\"https://example.com/\""), true))
                .andExpect(jsonPath("$.popup.footerAction").value("SUBMIT"))
                .andExpect(jsonPath("$.popup.footerLinkUrl").doesNotExist())
                .andExpect(jsonPath("$.popup.content.footerAction").doesNotExist());
    }

    /** [설계 31] PopupWindow 공통 UI 옵션은 최상위로 승격하고 content에서 뺀다. 범위 밖·미지원 값은 기본값으로 보정한다. */
    @Test void windowOptionsArePromotedToTopLevel() throws Exception {
        next(item("""
                {"popupId":"TEXT-31","popupType":"TEXT","title":"t","sizeMode":"FIXED","width":500,"height":300,
                 "minimumWidth":100,"minimumHeight":100,"maximumWidth":900,"maximumHeight":700,
                 "content":{"plainText":"x","useBackgroundOverlay":false,"backgroundOverlayOpacity":0.6,
                            "popupPosition":"TOP_RIGHT","headerFontSize":18,"bodyFontSize":"15","footerFontSize":13}}
                """, false))
                .andExpect(jsonPath("$.popup.useBackgroundOverlay").value(false))
                .andExpect(jsonPath("$.popup.backgroundOverlayOpacity").value(0.6))
                .andExpect(jsonPath("$.popup.popupPosition").value("TOP_RIGHT"))
                .andExpect(jsonPath("$.popup.headerFontSize").value(18.0))
                .andExpect(jsonPath("$.popup.bodyFontSize").value(15.0))
                .andExpect(jsonPath("$.popup.footerFontSize").value(13.0))
                .andExpect(jsonPath("$.popup.content.useBackgroundOverlay").doesNotExist())
                .andExpect(jsonPath("$.popup.content.backgroundOverlayOpacity").doesNotExist())
                .andExpect(jsonPath("$.popup.content.popupPosition").doesNotExist())
                .andExpect(jsonPath("$.popup.content.headerFontSize").doesNotExist())
                .andExpect(jsonPath("$.popup.content.bodyFontSize").doesNotExist())
                .andExpect(jsonPath("$.popup.content.footerFontSize").doesNotExist());
        next(item("""
                {"popupId":"IMAGE-31","popupType":"IMAGE","title":"t","sizeMode":"FIXED","width":500,"height":300,
                 "minimumWidth":100,"minimumHeight":100,"maximumWidth":900,"maximumHeight":700,
                 "content":{"imageUrl":"https://example.com/a.png","backgroundOverlayOpacity":3,"popupPosition":"MIDDLE"}}
                """, false))
                .andExpect(jsonPath("$.popup.useBackgroundOverlay").value(true))
                .andExpect(jsonPath("$.popup.backgroundOverlayOpacity").value(1.0))
                .andExpect(jsonPath("$.popup.popupPosition").value("CENTER"))
                .andExpect(jsonPath("$.popup.headerFontSize").doesNotExist());
    }

    /** [설계 34·35] 형식 오류는 400이 아니라 REJECTED(WPF_INVALID_RESULT)이며 서비스로 넘기지 않는다. */
    @Test void invalidResultIsRejectedWithoutProcessing() throws Exception {
        for (String body : List.of(
                "{\"resultId\":\"bad-type\",\"deliveryId\":\"D-1\",\"popupId\":\"P1\",\"resultType\":\"OPENED\"}",
                "{\"resultId\":\"bad-hide\",\"deliveryId\":\"D-1\",\"popupId\":\"P1\",\"resultType\":\"HIDDEN\",\"hideDays\":0}",
                "{\"resultId\":\"bad-video\",\"deliveryId\":\"D-1\",\"popupId\":\"P1\",\"resultType\":\"VIDEO_WATCHED\",\"video\":{\"durationSeconds\":0}}",
                "{\"resultId\":\"no-delivery\",\"popupId\":\"P1\",\"resultType\":\"CLOSED\"}",
                "{\"resultId\":\"\",\"deliveryId\":\"D-1\",\"popupId\":\"P1\",\"resultType\":\"CLOSED\"}",
                "{\"resultId\":\"null-answer\",\"deliveryId\":\"D-1\",\"popupId\":\"Q1\",\"resultType\":\"SUBMITTED\",\"answers\":[null]}",
                "{\"resultId\":\"null-option\",\"deliveryId\":\"D-1\",\"popupId\":\"Q1\",\"resultType\":\"SUBMITTED\",\"answers\":[{\"questionId\":1,\"optionIds\":[null]}]}")) {
            mvc.perform(post("/p/api/wpf/popups/results").header("X-Dev-User-Id", "E1001")
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("REJECTED"))
                    .andExpect(jsonPath("$.code").value("WPF_INVALID_RESULT"))
                    .andExpect(jsonPath("$.nextStatus").doesNotExist());
        }
        verify(service, never()).processResult(any(), any());
    }

    /** [TODO52-2] 나중에 보기 결과 LATER는 형식 검사를 통과해 서비스에 LATER로 전달된다(대소문자 무시). */
    @Test void laterResultIsAcceptedAsLaterCommand() throws Exception {
        when(service.processResult(eq("E1001"), any())).thenAnswer(inv -> {
            WpfResultCommand command = inv.getArgument(1);
            assertEquals(WpfResultType.LATER, command.resultType());
            return WpfResultResponse.of(WpfResultItemResponse.accepted(command), WpfResultResponse.NextStatus.EMPTY);
        });
        mvc.perform(post("/p/api/wpf/popups/results").header("X-Dev-User-Id", "E1001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"resultId\":\"later-1\",\"deliveryId\":\"D-1\",\"popupId\":\"P1\",\"resultType\":\"later\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACCEPTED"));
        verify(service).processResult(eq("E1001"), any());
    }

    /** [설계 34 — 검토 보완] 검증 통과 후 변환 예외는 영구 오류(REJECTED)가 아니라 INTERNAL_ERROR다. */
    @Test void unexpectedConversionFailureIsInternalErrorNotRejected() {
        var controller = new WpfPopupController(service, new DevHeaderWpfUserResolver());
        WpfResultRequest broken = mock(WpfResultRequest.class);
        when(broken.validationError()).thenReturn(null);
        when(broken.resultId()).thenReturn("broken");
        when(broken.toCommand()).thenThrow(new IllegalStateException("conversion bug"));

        var response = controller.process("E1001", broken);

        assertEquals(WpfResultItemResponse.Status.INTERNAL_ERROR, response.status());
        assertEquals("WPF_INTERNAL", response.code());
        assertFalse(response.message().contains("conversion bug"), "내부 오류 상세 비노출");
        verify(service, never()).processResult(any(), any());
    }

    @Test void resultPassesCommandWithoutUserIdFromBodyAndReturnsNextStatus() throws Exception {
        // 본문이 JSON이 아니면 → 400 (요청 전체 형식 오류)
        mvc.perform(post("/p/api/wpf/popups/results").header("X-Dev-User-Id", "E1001")
                        .contentType(MediaType.APPLICATION_JSON).content("[1,2]"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("WPF_BAD_REQUEST"));

        String body = """
                {"resultId":"r2","deliveryId":"D-9","popupId":"Q1","resultType":"submitted","userId":"HACKER",
                 "clientRequestId":"old-envelope","responseStartedAt":"2026-09-19T09:00:06+09:00",
                 "displayedAt":"2026-09-19T09:00:05+09:00","closedAt":"2026-09-19T09:00:40+09:00",
                 "score":80,"passed":true,
                 "answers":[{"questionId":1,"optionIds":[10]},{"questionId":2,"textAnswer":"ok"}]}
                """;
        when(service.processResult(eq("E1001"), any())).thenAnswer(inv -> {
            WpfResultCommand command = inv.getArgument(1);
            assertEquals("D-9", command.deliveryId());
            assertEquals(WpfResultType.SUBMITTED, command.resultType(), "resultType 대소문자 무시");
            // Jackson은 ADJUST_DATES_TO_CONTEXT_TIME_ZONE 기본값으로 오프셋을 UTC로 정규화한다. 순간(instant)만 같으면 된다.
            assertEquals(OffsetDateTime.parse("2026-09-19T09:00:05+09:00").toInstant(), command.displayedAt().toInstant());
            assertEquals(2, command.answers().size());
            assertEquals(List.of(10L), command.answers().get(0).optionIds());
            // [설계 12] WPF 로컬 채점값이 커맨드까지 전달된다
            assertEquals(80.0, command.score());
            assertEquals(Boolean.TRUE, command.passed());
            return WpfResultResponse.of(WpfResultItemResponse.accepted(command), WpfResultResponse.NextStatus.AVAILABLE);
        });

        mvc.perform(post("/p/api/wpf/popups/results").header("X-Dev-User-Id", "E1001")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resultId").value("r2"))
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.nextStatus").value("AVAILABLE"))
                .andExpect(jsonPath("$.code").doesNotExist())
                .andExpect(jsonPath("$.results").doesNotExist())
                .andExpect(jsonPath("$.popup").doesNotExist());

        // 사용자는 헤더(인증 정보)에서만 온다. 본문의 userId는 무시된다. 로그 요청 ID는 resultId.
        verify(service).processResult(eq("E1001"), any());
        verify(service).logRequest(eq("r2"), eq("E1001"), anyString(), eq("POST"), any(), any(),
                eq(200), eq(true), eq("popupId=Q1,type=submitted"), eq("status=ACCEPTED,next=AVAILABLE"));
    }
    @Test void devResolverRejectsBlankHeaderAndTrims() {
        DevHeaderWpfUserResolver resolver = new DevHeaderWpfUserResolver();
        MockHttpServletRequest request = new MockHttpServletRequest();
        assertThrows(WpfUnauthorizedException.class, () -> resolver.resolveEmployeeNo(request));
        request.addHeader("X-Dev-User-Id", " E1001 ");
        assertEquals("E1001", resolver.resolveEmployeeNo(request));
    }
}
