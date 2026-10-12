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
import server.domain.popup.wpf.WpfPopupListResponse;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultResponse;
import server.domain.popup.wpf.WpfResultType;
import server.service.core.popup.wpf.WpfPopupService;
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

    @Test void listRequiresDevHeaderAndSerializesIsoDates() throws Exception {
        mvc.perform(get("/p/api/wpf/popups"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("WPF_UNAUTHORIZED"));

        when(service.getPopupsForUser("E1001")).thenReturn(new WpfPopupListResponse(
                OffsetDateTime.parse("2026-09-19T09:00:00+09:00"), "E1001", 1800, List.of()));
        mvc.perform(get("/p/api/wpf/popups").header("X-Dev-User-Id", "E1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value("E1001"))
                .andExpect(jsonPath("$.pollingIntervalSeconds").value(1800))
                .andExpect(jsonPath("$.serverTime").value("2026-09-19T09:00:00+09:00"))
                .andExpect(jsonPath("$.popups").isArray());
    }

    @Test void inactiveUserIsForbiddenWithCode() throws Exception {
        when(service.getPopupsForUser("E9999")).thenThrow(new WpfUserInactiveException("E9999"));
        mvc.perform(get("/p/api/wpf/popups").header("X-Dev-User-Id", "E9999"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("WPF_USER_INACTIVE"));
    }

    @Test void image23HttpResponseUsesSingleContentDimensionPair() throws Exception {
        var dto = new ObjectMapper().readValue("""
                {"popupId":"IMAGE-23","popupType":"IMAGE","title":"IMAGE","sizeMode":"FIXED",
                 "minimumWidth":100,"minimumHeight":100,"maximumWidth":400,"maximumHeight":300,
                 "content":{"imageUrl":"https://example.com/a.png","imageSizeMode":"FIT_TO_IMAGE",
                            "width":900,"height":600,"keepAspectRatio":false}}
                """, server.domain.popup.PopupResponseDto.class);
        when(service.getPopupsForUser("E1001")).thenReturn(new WpfPopupListResponse(
                OffsetDateTime.now(), "E1001", 1800,
                List.of(server.domain.popup.wpf.WpfPopupItem.from(dto, false))));
        mvc.perform(get("/p/api/wpf/popups").header("X-Dev-User-Id", "E1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.popups[0].width").doesNotExist())
                .andExpect(jsonPath("$.popups[0].height").doesNotExist())
                .andExpect(jsonPath("$.popups[0].content.width").value(900))
                .andExpect(jsonPath("$.popups[0].content.height").value(600))
                .andExpect(jsonPath("$.popups[0].content.keepAspectRatio").value(false))
                .andExpect(jsonPath("$.popups[0].content.imageWidth").doesNotExist());
    }

    /** [설계 29] 노출 판정 값은 WPF 응답에 없고, Footer 버튼 표시는 showFooterButton 하나로 나간다. */
    @Test void listItemOmitsServerSideScheduleFieldsAndUsesShowFooterButton() throws Exception {
        var dto = new ObjectMapper().registerModule(new JavaTimeModule()).readValue("""
                {"popupId":"TEXT-29","popupType":"TEXT","title":"TEXT","sizeMode":"FIXED","width":500,"height":300,
                 "minimumWidth":100,"minimumHeight":100,"maximumWidth":900,"maximumHeight":700,
                 "displayStartAt":"2026-09-19T09:00:00+09:00","displayEndAt":"2026-09-30T18:00:00+09:00",
                 "periodMode":"REPEAT","repeatInterval":1,"repeatDayOfWeek":"MON","repeatDayOfMonth":1,
                 "showCloseButton":false,"content":{"plainText":"본문"}}
                """, server.domain.popup.PopupResponseDto.class);
        when(service.getPopupsForUser("E1001")).thenReturn(new WpfPopupListResponse(
                OffsetDateTime.now(), "E1001", 1800,
                List.of(server.domain.popup.wpf.WpfPopupItem.from(dto, false))));
        mvc.perform(get("/p/api/wpf/popups").header("X-Dev-User-Id", "E1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.popups[0].showFooterButton").value(false))
                .andExpect(jsonPath("$.popups[0].showCloseButton").doesNotExist())
                .andExpect(jsonPath("$.popups[0].displayStartAt").doesNotExist())
                .andExpect(jsonPath("$.popups[0].displayEndAt").doesNotExist())
                .andExpect(jsonPath("$.popups[0].periodMode").doesNotExist())
                .andExpect(jsonPath("$.popups[0].repeatInterval").doesNotExist())
                .andExpect(jsonPath("$.popups[0].repeatDayOfWeek").doesNotExist())
                .andExpect(jsonPath("$.popups[0].repeatDayOfMonth").doesNotExist());
    }

    /** [설계 30] Footer 동작은 content에서 빼 최상위로 내려주고, SURVEY/QUIZ는 저장 값과 무관하게 SUBMIT이다. */
    @Test void footerActionIsPromotedToTopLevel() throws Exception {
        var mapper = new ObjectMapper();
        String base = """
                {"popupId":"%s","popupType":"%s","title":"t","sizeMode":"FIXED","width":500,"height":300,
                 "minimumWidth":100,"minimumHeight":100,"maximumWidth":900,"maximumHeight":700,
                 "content":{%s}}
                """;
        var link = mapper.readValue(base.formatted("TEXT-30", "TEXT",
                "\"plainText\":\"x\",\"footerAction\":\"LINK_AND_CLOSE\",\"footerLinkUrl\":\"https://example.com/\""),
                server.domain.popup.PopupResponseDto.class);
        var close = mapper.readValue(base.formatted("IMAGE-30", "IMAGE", "\"imageUrl\":\"https://example.com/a.png\""),
                server.domain.popup.PopupResponseDto.class);
        var quiz = mapper.readValue(base.formatted("QUIZ-30", "QUIZ",
                "\"surveyTitle\":\"q\",\"footerAction\":\"LINK_AND_CLOSE\",\"footerLinkUrl\":\"https://example.com/\""),
                server.domain.popup.PopupResponseDto.class);
        when(service.getPopupsForUser("E1001")).thenReturn(new WpfPopupListResponse(OffsetDateTime.now(), "E1001", 1800,
                List.of(server.domain.popup.wpf.WpfPopupItem.from(link, false),
                        server.domain.popup.wpf.WpfPopupItem.from(close, false),
                        server.domain.popup.wpf.WpfPopupItem.from(quiz, true))));
        mvc.perform(get("/p/api/wpf/popups").header("X-Dev-User-Id", "E1001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.popups[0].footerAction").value("LINK_AND_CLOSE"))
                .andExpect(jsonPath("$.popups[0].footerLinkUrl").value("https://example.com/"))
                .andExpect(jsonPath("$.popups[0].content.footerAction").doesNotExist())
                .andExpect(jsonPath("$.popups[0].content.footerLinkUrl").doesNotExist())
                .andExpect(jsonPath("$.popups[1].footerAction").value("CLOSE"))
                .andExpect(jsonPath("$.popups[1].footerLinkUrl").doesNotExist())
                .andExpect(jsonPath("$.popups[2].footerAction").value("SUBMIT"))
                .andExpect(jsonPath("$.popups[2].footerLinkUrl").doesNotExist())
                .andExpect(jsonPath("$.popups[2].content.footerAction").doesNotExist());
    }

    @Test void resultsValidateBodyAndPassCommandsWithoutUserIdFromBody() throws Exception {
        // 항목 없음 → 400 (요청 전체 형식 오류)
        mvc.perform(post("/p/api/wpf/popups/results").header("X-Dev-User-Id", "E1001")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"clientRequestId\":\"c1\",\"results\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("WPF_BAD_REQUEST"));

        String body = """
                {"clientRequestId":"c1","sentAt":"2026-09-19T09:12:30+09:00",
                 "results":[
                   {"resultId":"r1","popupId":"P1","resultType":"HIDDEN",
                    "displayedAt":"2026-09-19T09:00:05+09:00","closedAt":"2026-09-19T09:00:40+09:00","hideDays":7},
                   {"resultId":"r2","popupId":"Q1","resultType":"SUBMITTED","userId":"HACKER",
                    "responseStartedAt":"2026-09-19T09:00:06+09:00",
                    "score":80,"passed":true,
                    "answers":[{"questionId":1,"optionIds":[10]},{"questionId":2,"textAnswer":"ok"}]}
                 ]}
                """;
        when(service.processResults(eq("E1001"), anyList())).thenAnswer(inv -> {
            List<WpfResultCommand> commands = inv.getArgument(1);
            assertEquals(2, commands.size());
            assertEquals(WpfResultType.HIDDEN, commands.get(0).resultType());
            assertEquals(7, commands.get(0).hideDays());
            // Jackson은 ADJUST_DATES_TO_CONTEXT_TIME_ZONE 기본값으로 오프셋을 UTC로 정규화한다. 순간(instant)만 같으면 된다
            // (KstTimestampTypeHandler가 저장 시 KST 벽시계 시각으로 변환).
            assertEquals(OffsetDateTime.parse("2026-09-19T09:00:05+09:00").toInstant(),
                    commands.get(0).displayedAt().toInstant());
            assertEquals(2, commands.get(1).answers().size());
            assertEquals(List.of(10L), commands.get(1).answers().get(0).optionIds());
            // [설계 12] WPF 로컬 채점값이 커맨드까지 전달된다(서버는 참고·로그용)
            assertEquals(80.0, commands.get(1).score());
            assertEquals(Boolean.TRUE, commands.get(1).passed());
            assertEquals(null, commands.get(0).score(), "HIDDEN 항목은 점수 없음");
            return new WpfResultResponse(OffsetDateTime.parse("2026-09-19T09:12:31+09:00"), List.of(
                    WpfResultItemResponse.accepted(commands.get(0)).build(),
                    WpfResultItemResponse.rejected(commands.get(1), "WPF_NOT_ELIGIBLE", "대상 아님")));
        });

        mvc.perform(post("/p/api/wpf/popups/results").header("X-Dev-User-Id", "E1001")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.receivedAt").value("2026-09-19T09:12:31+09:00"))
                .andExpect(jsonPath("$.results[0].status").value("ACCEPTED"))
                .andExpect(jsonPath("$.results[1].status").value("REJECTED"))
                .andExpect(jsonPath("$.results[1].code").value("WPF_NOT_ELIGIBLE"))
                .andExpect(jsonPath("$.results[1].popupStatus").doesNotExist());

        // 사용자는 헤더(인증 정보)에서만 온다. 본문의 userId는 무시된다.
        verify(service).processResults(eq("E1001"), anyList());
        verify(service).logRequest(eq("c1"), eq("E1001"), anyString(), eq("POST"), any(), any(),
                eq(200), eq(false), anyString(), anyString());
    }

    @Test void devResolverRejectsBlankHeaderAndTrims() {
        DevHeaderWpfUserResolver resolver = new DevHeaderWpfUserResolver();
        MockHttpServletRequest request = new MockHttpServletRequest();
        assertThrows(WpfUnauthorizedException.class, () -> resolver.resolveEmployeeNo(request));
        request.addHeader("X-Dev-User-Id", " E1001 ");
        assertEquals("E1001", resolver.resolveEmployeeNo(request));
    }
}
