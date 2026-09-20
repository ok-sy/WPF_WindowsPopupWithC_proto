package server.service.core.popup.wpf;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import server.base.props.WpfPopupProps;
import server.domain.popup.PopupEntity;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupResponseDto;
import server.domain.popup.wpf.WpfPopupItem;
import server.domain.popup.wpf.WpfPopupListResponse;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultResponse;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.WpfPopupMapper;
import server.service.core.popup.PopupService;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * 신규 WPF API(/p/api/wpf/**)의 업무 진입점: 최종 팝업 목록 조립과 결과 항목 일괄 처리.
 *
 * <p>[추가 이유]</p>
 * <ul>
 *   <li>기준 2: 노출 판단(활성·기간·대상·숨김·<b>완료</b>)을 SQL 한 번({@code selectAvailablePopups(userId, true)})으로
 *       끝내고 WPF는 렌더링만 한다. 기존 WPF-01은 완료 제외를 클라이언트가 하던 계약이라 그대로 두었다.</li>
 *   <li>기준 3: 조회 1개 + 결과 1개 API. 결과는 유형별로 {@link WpfResultProcessor}에 위임한다.</li>
 *   <li>기준 4: 결과는 팝업 종료 시점 1회(또는 일괄)로 들어오며, 항목별 독립 트랜잭션으로 처리한다.</li>
 *   <li>기준 6: 사용자 ID는 컨트롤러가 인증 정보에서 얻어 인자로 넘긴다. 요청 본문의 값은 없다.</li>
 * </ul>
 *
 * <p>기존 {@link PopupService}는 문항 조립·채점 규칙의 단일 원천으로 재사용하며 구조를 바꾸지 않는다.
 * 목록 항목은 {@code PopupService.getPopups}가 만드는 공용 DTO(정답 제외)를 {@link WpfPopupItem#from}으로 변환한다.</p>
 */
@Service
public class WpfPopupService {

    private static final Logger log = LoggerFactory.getLogger(WpfPopupService.class);
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final PopupService popupService;
    private final PopupMapper popupMapper;
    private final WpfPopupMapper wpfMapper;
    private final WpfResultProcessor resultProcessor;
    private final WpfPopupProps props;

    public WpfPopupService(PopupService popupService, PopupMapper popupMapper, WpfPopupMapper wpfMapper,
                           WpfResultProcessor resultProcessor, WpfPopupProps props) {
        this.popupService = popupService;
        this.popupMapper = popupMapper;
        this.wpfMapper = wpfMapper;
        this.resultProcessor = resultProcessor;
        this.props = props;
    }

    /** 사번이 활성 사용자가 아니면 403(WpfUserInactiveException). 목록·결과 API 공통 선행 검사. */
    @Transactional(readOnly = true)
    public void requireActiveUser(String employeeNo) {
        if (employeeNo == null || employeeNo.isBlank() || wpfMapper.countActiveUser(employeeNo.trim()) == 0) {
            throw new WpfUserInactiveException(employeeNo);
        }
    }

    /**
     * 사용자에게 지금 표시해야 할 최종 팝업 목록. 완료 팝업까지 SQL에서 제외한다.
     * 문항은 템플릿 ID를 모아 한 번에 조회한다(팝업마다 문항 쿼리를 반복하지 않음 — 기존 getPopups와 동일).
     */
    @Transactional(readOnly = true)
    public WpfPopupListResponse getPopupsForUser(String employeeNo) {
        requireActiveUser(employeeNo);
        String userId = employeeNo.trim();

        List<PopupEntity> popups = popupMapper.selectAvailablePopups(userId, true);
        List<Long> templateIds = popups.stream()
                .map(PopupEntity::questionTemplateId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<Long, List<PopupQuestionDto>> questionsByTemplate = popupService.loadPublicQuestions(templateIds);

        List<WpfPopupItem> items = popups.stream()
                .map(popup -> {
                    List<PopupQuestionDto> questions = popup.questionTemplateId() == null
                            ? List.of()
                            : questionsByTemplate.getOrDefault(popup.questionTemplateId(), List.of());
                    PopupResponseDto dto = popupService.toPublicResponseDto(popup, questions);
                    return WpfPopupItem.from(dto);
                })
                .toList();

        return new WpfPopupListResponse(OffsetDateTime.now(KST), userId, props.getPollingIntervalSeconds(), items);
    }

    /**
     * 결과 항목을 순서대로 처리한다. 항목마다 REQUIRES_NEW 트랜잭션이며 한 항목의 실패는 REJECTED 응답으로만 남는다.
     * 이 메서드 자체는 트랜잭션이 아니다(항목 간 격리 목적).
     *
     * <ul>
     *   <li>IllegalArgumentException: 업무 검증 실패(대상 아님·문항 불일치 등) → REJECTED + 메시지</li>
     *   <li>그 외 RuntimeException: 서버 오류 → REJECTED WPF_INTERNAL (메시지 비노출, 로그)</li>
     * </ul>
     */
    public WpfResultResponse processResults(String employeeNo, List<WpfResultCommand> items) {
        requireActiveUser(employeeNo);
        String userId = employeeNo.trim();

        List<WpfResultItemResponse> results = new ArrayList<>(items.size());
        for (WpfResultCommand item : items) {
            try {
                results.add(resultProcessor.processOne(userId, item));
            } catch (IllegalArgumentException ex) {
                results.add(WpfResultItemResponse.rejected(item, codeOf(item, ex), ex.getMessage()));
            } catch (RuntimeException ex) {
                log.error("WPF 결과 항목 처리 실패 userId={} popupId={} resultId={} type={}",
                        userId, item.popupId(), item.resultId(), item.resultType(), ex);
                results.add(WpfResultItemResponse.rejected(item, "WPF_INTERNAL", "서버 처리 중 오류가 발생했습니다."));
            }
        }
        return new WpfResultResponse(OffsetDateTime.now(KST), results);
    }

    /** 요청 단위 로그. 본 처리와 분리된 트랜잭션이라 로그 실패가 결과 처리에 영향을 주지 않도록 호출자가 예외를 잡는다. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logRequest(String clientRequestId, String employeeNo, String apiPath, String httpMethod,
                           String clientIp, OffsetDateTime receivedAt, int httpStatus, boolean success,
                           String requestSummary, String responseSummary) {
        long elapsed = Math.max(0, java.time.Duration.between(receivedAt, OffsetDateTime.now(KST)).toMillis());
        wpfMapper.insertApiRequestLog(clientRequestId, employeeNo, apiPath, httpMethod, clientIp, receivedAt,
                elapsed, httpStatus, success ? "Y" : "N", requestSummary, responseSummary);
    }

    /**
     * 업무 예외 메시지를 WPF 코드로 분류한다. 기존 PopupService의 한국어 메시지를 기준으로 하며,
     * 매핑되지 않으면 WPF_INVALID_RESULT.
     */
    private static String codeOf(WpfResultCommand item, IllegalArgumentException ex) {
        String message = ex.getMessage() == null ? "" : ex.getMessage();
        if (message.contains("제출 가능한 팝업이 아닙니다") || message.contains("유효한 영상 팝업이 아닙니다")
                || message.contains("유효한 사용자 또는 팝업이 아닙니다")) {
            return "WPF_NOT_ELIGIBLE";
        }
        if (message.contains("설문형 팝업만")) {
            return "WPF_TYPE_MISMATCH";
        }
        if (message.contains("문항") || message.contains("선택지") || message.contains("답안")) {
            return "WPF_INVALID_ANSWER";
        }
        if (message.contains("숨김 일수")) {
            return "WPF_INVALID_HIDE_DAYS";
        }
        if (message.contains("영상")) {
            return "WPF_INVALID_VIDEO";
        }
        return "WPF_INVALID_RESULT";
    }
}
