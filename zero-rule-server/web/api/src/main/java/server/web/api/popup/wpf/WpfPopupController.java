package server.web.api.popup.wpf;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import server.domain.popup.wpf.WpfPopupListResponse;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultResponse;
import server.service.core.popup.wpf.WpfPopupService;
import server.web.api.payload.popup.wpf.WpfResultRequest;

import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * 신규 WPF 팝업 클라이언트 API 2개.
 * <pre>
 *   GET  /p/api/wpf/popups          — 사용자에게 지금 표시해야 할 최종 팝업 목록(공통 옵션·content·문항·선택지 포함)
 *   POST /p/api/wpf/popups/results  — 팝업 처리 결과(닫기·숨김·제출·영상 시청) 일괄 수신
 * </pre>
 *
 * <p>[추가 이유]</p>
 * <ul>
 *   <li>기준 2: 표시 대상 판단(완료 제외 포함)을 서버가 끝내고 WPF는 렌더링만 한다.</li>
 *   <li>기준 3: 기존 6개 API(목록/상태/숨김/제출/진행률/이벤트)를 조회 1개 + 결과 1개로 통합한다.</li>
 *   <li>기준 4: 실시간 이벤트·진행률 호출을 없애고 종료 시점 1회 전송을 받는다.</li>
 *   <li>기준 6: 사용자 식별은 요청의 userId가 아니라 {@link WpfUserResolver}가 인증 정보에서 읽은 사번이다.
 *       토큰 발급·검증 자체는 타 팀 통합 토큰 필터가 담당하며 이 컨트롤러는 그 결과만 사용한다.</li>
 * </ul>
 *
 * <p>[기존 구조와의 관계] 구 WPF 개별 API {@code PopupController}(/p/api/popups/**)는 설계 18 L-0에서 삭제했다.
 * 같은 접두어의 {@code PopupVideoController}(GET /p/api/popups/video)는 영상 스트리밍 URL이라 유지한다.
 * 응답 날짜는 WPF DTO 필드의 {@code @JsonFormat}(ISO 8601)으로 직렬화하며 전역 ObjectMapper 설정은 건드리지 않는다.
 * SecurityConfig·CustomAuthenticationFilter·DefaultPublicUrls도 수정하지 않는다(/p/**는 이미 공개 경로이며,
 * 통합 토큰 필터 등록은 타 팀 작업).</p>
 */
@Tag(name = "Popup WPF")
@RestController
@RequestMapping("/p/api/wpf/popups")
public class WpfPopupController {

    private static final Logger log = LoggerFactory.getLogger(WpfPopupController.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final WpfPopupService wpfPopupService;
    private final WpfUserResolver wpfUserResolver;

    public WpfPopupController(WpfPopupService wpfPopupService, WpfUserResolver wpfUserResolver) {
        this.wpfPopupService = wpfPopupService;
        this.wpfUserResolver = wpfUserResolver;
    }

    /** 인증된 사용자의 최종 팝업 목록. 사번은 WpfUserResolver에서 얻는다(요청 파라미터 사용 금지). */
    @Operation(summary = "WPF 표시 대상 팝업 목록 조회 (공통 옵션·콘텐츠·문항 포함, 완료·숨김 제외)")
    @GetMapping
    public WpfPopupListResponse getPopups(HttpServletRequest request) {
        String employeeNo = wpfUserResolver.resolveEmployeeNo(request);   // 실패 → 401 WPF_UNAUTHORIZED
        return wpfPopupService.getPopupsForUser(employeeNo);              // 비활성 → 403 WPF_USER_INACTIVE
    }

    /**
     * 결과 항목 일괄 수신. 항목 단위로 독립 처리하며 한 항목의 실패가 다른 항목에 영향을 주지 않는다.
     * 요청 전체가 잘못된 경우(envelope 검증 실패·인증 없음)만 HTTP 오류이고, 항목 실패는 본문 status로 알린다.
     * [설계 34 — 검토 보완] 항목 형식 오류는 그 항목만 REJECTED(WPF_INVALID_RESULT)로 돌려주고 나머지는 정상 처리한다.
     * 응답은 요청 항목 순서를 유지한다.
     * 요청 단위 로그는 처리 결과와 무관하게 남기되, 로그 실패가 응답을 막지 않도록 예외를 삼킨다.
     */
    @Operation(summary = "WPF 팝업 처리 결과 일괄 전송 (닫기·숨김·제출·영상)")
    @PostMapping("/results")
    public WpfResultResponse postResults(@Valid @RequestBody WpfResultRequest body, HttpServletRequest request) {
        OffsetDateTime receivedAt = OffsetDateTime.now(KST);
        String employeeNo = wpfUserResolver.resolveEmployeeNo(request);
        java.util.List<WpfResultCommand> commands = new java.util.ArrayList<>();
        java.util.List<String> errors = new java.util.ArrayList<>(body.results().size());
        for (WpfResultRequest.Item item : body.results()) {
            String error = item == null ? "결과 항목이 비어 있습니다." : item.validationError();
            errors.add(error);
            if (error == null) commands.add(item.toCommand());
        }
        WpfResultResponse processed = wpfPopupService.processResults(employeeNo, commands);
        java.util.Iterator<WpfResultItemResponse> processedResults = processed.results().iterator();
        java.util.List<WpfResultItemResponse> merged = new java.util.ArrayList<>(body.results().size());
        for (int i = 0; i < body.results().size(); i++) {
            WpfResultRequest.Item item = body.results().get(i);
            if (errors.get(i) == null) {
                merged.add(processedResults.next());
            } else {
                merged.add(new WpfResultItemResponse(item == null ? null : item.resultId(), item == null ? null : item.popupId(),
                        item == null ? null : item.type(), WpfResultItemResponse.Status.REJECTED,
                        "WPF_INVALID_RESULT", "결과 항목 형식 오류: " + errors.get(i)));
            }
        }
        WpfResultResponse response = new WpfResultResponse(merged);

        // [설계 34-19] 상태별 건수를 그대로 센다(일시·미확정 오류를 DUPLICATE로 잘못 세지 않도록).
        java.util.Map<WpfResultItemResponse.Status, Long> counts = response.results().stream()
                .collect(java.util.stream.Collectors.groupingBy(WpfResultItemResponse::status,
                        () -> new java.util.EnumMap<>(WpfResultItemResponse.Status.class), java.util.stream.Collectors.counting()));
        boolean allSettledWithoutError = counts.keySet().stream()
                .allMatch(s -> s == WpfResultItemResponse.Status.ACCEPTED || s == WpfResultItemResponse.Status.DUPLICATE);
        String summary = java.util.Arrays.stream(WpfResultItemResponse.Status.values())
                .map(s -> s.name().toLowerCase(java.util.Locale.ROOT) + "=" + counts.getOrDefault(s, 0L))
                .collect(java.util.stream.Collectors.joining(","));
        try {
            wpfPopupService.logRequest(body.clientRequestId(), employeeNo, request.getRequestURI(), "POST",
                    request.getRemoteAddr(), receivedAt, 200, allSettledWithoutError,
                    "items=" + body.results().size(), summary);
        } catch (RuntimeException ex) {
            log.warn("WPF 결과 API 요청 로그 저장 실패 clientRequestId={}", body.clientRequestId(), ex);
        }
        return response;
    }
}
