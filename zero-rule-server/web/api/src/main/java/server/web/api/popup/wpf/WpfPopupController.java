package server.web.api.popup.wpf;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import server.domain.popup.wpf.WpfNextPopupResponse;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultResponse;
import server.service.core.popup.wpf.WpfPopupService;
import server.web.api.payload.popup.wpf.WpfResultRequest;

import java.time.OffsetDateTime;
import java.time.ZoneId;

/**
 * POL-09-01 : 3 API 순서
 * POL-09-02 : 조회 응답
 * POL-09-03 : 저장 응답
 * POL-11-01 : 노출 판단 소유
 * POL-15-02 : 인증·버전
 * ■ WPF 팝업 클라이언트 API(조회·결과)
 * - in : 인증된 사용자 요청({@link WpfUserResolver}로 사번 확인)
 * - out: 조회 WpfNextPopupResponse · 결과 WpfResultResponse
 * <pre>
 *   POST /p/api/wpf/popups          — 지금 표시할 팝업 최대 1건 + deliveryId(공통 옵션·content·문항·선택지 포함)
 *   POST /p/api/wpf/popups/results  — 팝업 처리 결과(닫기·숨김·제출·영상 시청) 1건 수신 + nextStatus
 * </pre>
 *
 * <ul>
 *   <li>표시 대상 판단(완료 제외 포함)을 서버가 끝내고 WPF는 렌더링만 한다.</li>
 *   <li>구 개별 6개 API(목록/상태/숨김/제출/진행률/이벤트)를 조회 1개 + 결과 1개로 통합했다.</li>
 *   <li>실시간 이벤트·진행률 호출 없이 종료 시점 1회 전송을 받는다.</li>
 *   <li>사용자 식별은 요청의 userId가 아니라 {@link WpfUserResolver}가 인증 정보에서 읽은 사번이다.
 *       토큰 발급·검증 자체는 타 팀 통합 토큰 필터가 담당하며 이 컨트롤러는 그 결과만 사용한다.</li>
 * </ul>
 *
 * <p>[기존 구조와의 관계] 구 WPF 개별 API {@code PopupController}(/p/api/popups/**)는 미사용 소스 정리 때 삭제했다.
 * 같은 접두어의 {@code PopupVideoController}(GET /p/api/popups/video)는 영상 스트리밍 URL이라 유지한다.
 * 조회·결과 응답에는 날짜 필드가 없다. 날짜를 내리는 WPF DTO(오류 응답 {@code WpfErrorResponse.timestamp} 등)는 필드의
 * {@code @JsonFormat}(ISO 8601)으로 직렬화하며 전역 ObjectMapper 설정은 건드리지 않는다.
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

    /**
     * POL-09-02 : 조회 응답
     * POL-11-01 : 노출 판단 소유
     * ■ 표시 대상 팝업 1건 조회 (POST /p/api/wpf/popups)
     * - in : request(HttpServletRequest) 사번 확인용(요청 본문은 비어 있거나 {}이며 내용은 쓰지 않음)
     * - out: WpfNextPopupResponse 폴링 간격 + popup(대상이 없으면 null) · 예외: 401 WPF_UNAUTHORIZED, 403 WPF_USER_INACTIVE
     * - 전달 건(deliveryId)을 만들거나 재사용하므로 POST다. 사번은 WpfUserResolver에서 얻는다(요청 파라미터 사용 금지).
     */
    @Operation(summary = "WPF 표시 대상 팝업 1건 조회 (전달 건 발급·재사용, 완료·숨김·재노출 유예 제외)")
    @PostMapping
    public WpfNextPopupResponse nextPopup(HttpServletRequest request) {
        String employeeNo = wpfUserResolver.resolveEmployeeNo(request);   // 실패 → 401 WPF_UNAUTHORIZED
        return wpfPopupService.getNextPopup(employeeNo);                  // 비활성 → 403 WPF_USER_INACTIVE
    }

    /**
     * POL-09-03 : 저장 응답
     * POL-10-02 : 검증·원자성
     * ■ 결과 1건 수신 (POST /p/api/wpf/popups/results)
     * - in : body(WpfResultRequest) 결과 1건 · request(HttpServletRequest) 사번 확인·요청 로그용
     * - out: WpfResultResponse resultId·status·code·message·nextStatus · 예외: 401 WPF_UNAUTHORIZED, 403 WPF_USER_INACTIVE
     * - 형식 오류는 400이 아니라 REJECTED(WPF_INVALID_RESULT)로 돌려준다(WPF가 반복 재전송하지 않도록).
     * 검증 통과 후 예상하지 못한 변환 예외는 INTERNAL_ERROR(WPF_INTERNAL)로 돌려 WPF가 결과를 보관·재시도하게 한다.
     * 저장 성공(ACCEPTED·DUPLICATE)이면 후속 후보 유무 nextStatus(AVAILABLE/EMPTY)를 함께 준다.
     * 요청 단위 로그는 200으로 응답하는 결과 요청마다 처리 상태(ACCEPTED·REJECTED·오류 등)와 무관하게 남기되(clientRequestId = resultId),
     * 로그 실패가 응답을 막지 않도록 예외를 삼킨다. 인증 실패(401)·비활성 사용자(403)는 로그 전에 예외로 끝나 기록하지 않는다.
     * POPUP_ID 컬럼은 비워 두고 popupId·resultType은 요청 요약에 남긴다.
     */
    @Operation(summary = "WPF 팝업 처리 결과 1건 수신 (닫기·숨김·제출·영상) + 후속 후보 유무")
    @PostMapping("/results")
    public WpfResultResponse postResult(@RequestBody WpfResultRequest body, HttpServletRequest request) {
        OffsetDateTime receivedAt = OffsetDateTime.now(KST);
        String employeeNo = wpfUserResolver.resolveEmployeeNo(request);
        WpfResultResponse response = process(employeeNo, body);
        try {
            wpfPopupService.logRequest(body.resultId(), employeeNo, request.getRequestURI(), "POST",
                    request.getRemoteAddr(), receivedAt, 200, response.saved(),
                    "popupId=" + body.popupId() + ",type=" + body.resultType(),
                    "status=" + response.status() + ",next=" + response.nextStatus());
        } catch (RuntimeException ex) {
            log.warn("WPF 결과 API 요청 로그 저장 실패 resultId={}", body.resultId(), ex);
        }
        return response;
    }

    /** 형식 검사(오류면 활성 사용자 확인 후 REJECTED) → 커맨드 변환(예외면 INTERNAL_ERROR) → 서비스 결과 처리. */
    WpfResultResponse process(String employeeNo, WpfResultRequest body) {
        String error = body.validationError();
        if (error != null) {
            wpfPopupService.requireActiveUser(employeeNo);
            return new WpfResultResponse(body.resultId(), WpfResultItemResponse.Status.REJECTED, null,
                    "WPF_INVALID_RESULT", "결과 형식 오류: " + error);
        }
        WpfResultCommand command;
        try {
            command = body.toCommand();
        } catch (RuntimeException ex) {
            log.error("WPF 결과 변환 중 예상하지 못한 오류 resultId={}", body.resultId(), ex);
            return new WpfResultResponse(body.resultId(), WpfResultItemResponse.Status.INTERNAL_ERROR, null,
                    "WPF_INTERNAL", "서버 처리 중 오류가 발생했습니다.");
        }
        return wpfPopupService.processResult(employeeNo, command);
    }}
