package server.service.core.popup.wpf;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import server.base.props.WpfPopupProps;
import server.domain.popup.PopupEntity;
import server.domain.popup.PopupQuestionDto;
import server.domain.popup.PopupResponseDto;
import server.domain.popup.wpf.WpfPopupItem;
import server.domain.popup.wpf.WpfNextPopupResponse;
import server.domain.popup.wpf.WpfPopupDelivery;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfResultResponse;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.WpfPopupMapper;
import server.service.core.popup.PopupService;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

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
 * 목록 항목은 {@code PopupService.toPublicResponseDto}로 만든 공용 DTO를 {@link WpfPopupItem#from}으로 변환한다.
 * QUIZ가 아닌 팝업은 {@link WpfPopupItem#withoutAnswerKey}로 정답 키를 제거한다.</p>
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
     * [설계 35] 지금 표시할 팝업 최대 1건과 전달 건 ID. 노출 판단(활성·기간·대상·숨김·완료·재노출 유예)은 SQL에서 끝낸다.
     *
     * <ol>
     *   <li>사용자의 OPEN 전달 건이 있고 그 팝업이 아직 노출 대상이면 같은 deliveryId로 다시 준다(조회 응답 유실 복구).</li>
     *   <li>OPEN 건의 팝업이 더 이상 대상이 아니면(게시 중단·기간 만료 등) EXPIRED로 닫고 새로 고른다.</li>
     *   <li>새 건은 서버 정렬(DISPLAY_ORDER, CREATED_AT, POPUP_ID) 첫 팝업으로 만든다. 동시 조회로 OPEN 건이 먼저 생기면
     *       (유니크 인덱스 위반) 그 건을 재사용한다.</li>
     * </ol>
     * 전달 자체는 읽음·완료로 처리하지 않는다. 문항은 고른 팝업 1건만 읽는다.
     * [설계 39-4] 시작할 때 사용자 행을 잠가(결과 처리와 같은 잠금) 진행 중인 결과 커밋 이후의 상태로 후보를 고른다.
     *
     * <p>[설계 12 §4 — WPF 로컬 채점] QUIZ는 정답 키·통과 점수를 포함하고, 그 밖의 유형은 정답 키를 뺀다.</p>
     */
    @Transactional
    public WpfNextPopupResponse getNextPopup(String employeeNo) {
        if (employeeNo == null || employeeNo.isBlank() || wpfMapper.lockActiveUser(employeeNo.trim()) == null) {
            throw new WpfUserInactiveException(employeeNo);
        }
        String userId = employeeNo.trim();
        List<PopupEntity> eligible = popupMapper.selectAvailablePopups(userId, true);

        PopupEntity chosen = null;
        String deliveryId = null;
        WpfPopupDelivery open = wpfMapper.selectOpenDelivery(userId);
        if (open != null) {
            chosen = find(eligible, open.popupId());
            if (chosen != null) {
                deliveryId = open.deliveryId();
            } else {
                wpfMapper.expireDelivery(open.deliveryId());
            }
        }
        if (chosen == null && !eligible.isEmpty()) {
            chosen = eligible.get(0);
            deliveryId = UUID.randomUUID().toString();
            try {
                wpfMapper.insertDelivery(deliveryId, userId, chosen.popupId());
            } catch (DuplicateKeyException concurrent) {
                WpfPopupDelivery other = wpfMapper.selectOpenDelivery(userId);
                chosen = other == null ? null : find(eligible, other.popupId());
                deliveryId = chosen == null ? null : other.deliveryId();
            }
        }
        return new WpfNextPopupResponse(props.getPollingIntervalSeconds(),
                chosen == null ? null : toItem(chosen).withDeliveryId(deliveryId));
    }

    private static PopupEntity find(List<PopupEntity> popups, String popupId) {
        return popups.stream().filter(p -> p.popupId().equals(popupId)).findFirst().orElse(null);
    }

    private WpfPopupItem toItem(PopupEntity popup) {
        boolean quiz = "QUIZ".equalsIgnoreCase(popup.popupType());
        List<PopupQuestionDto> questions = popup.questionTemplateId() == null
                ? List.of()
                : popupService.loadQuestionsWithAnswerKey(List.of(popup.questionTemplateId()))
                        .getOrDefault(popup.questionTemplateId(), List.of());
        if (!quiz) {
            questions = WpfPopupItem.withoutAnswerKey(questions);
        }
        return WpfPopupItem.from(popupService.toPublicResponseDto(popup, questions), quiz);
    }

    /**
     * [설계 35] 결과 1건 처리 후 후속 후보 유무(nextStatus)를 돌려준다. 결과 처리는 REQUIRES_NEW 트랜잭션이며
     * 이 메서드 자체는 트랜잭션이 아니다(후보 확인이 저장 커밋 후 상태를 보도록).
     *
     * <ul>
     *   <li>IllegalArgumentException: 업무 검증 실패(대상 아님·전달 건 불일치·문항 불일치 등) → REJECTED + 코드(영구)</li>
     *   <li>[설계 34-19] 확인된 일시 장애 → RETRYABLE_ERROR, 그 밖의 RuntimeException → INTERNAL_ERROR</li>
     *   <li>ACCEPTED·DUPLICATE: 저장 후 노출 후보(완료·숨김·재노출 유예 제외)가 있으면 AVAILABLE, 없으면 EMPTY.
     *       후보 확인이 실패하면 EMPTY로 바꾸지 않고 nextStatus를 생략하며 code=WPF_NEXT_STATUS_UNKNOWN을 준다.
     *       방금 저장한 팝업은 완료·숨김·유예로 이미 제외되어 있다.</li>
     *   <li>거절·실패에는 nextStatus가 없다(다음 조회를 자동 진행하지 않음).</li>
     * </ul>
     */
    public WpfResultResponse processResult(String employeeNo, WpfResultCommand item) {
        requireActiveUser(employeeNo);
        String userId = employeeNo.trim();

        WpfResultItemResponse processed;
        try {
            processed = resultProcessor.processOne(userId, item);
        } catch (IllegalArgumentException ex) {
            return WpfResultResponse.of(WpfResultItemResponse.rejected(item, codeOf(item, ex), ex.getMessage()), null);
        } catch (RuntimeException ex) {
            boolean retryable = isTransientFailure(ex);
            log.error("WPF 결과 처리 실패({}) userId={} popupId={} resultId={} type={}",
                    retryable ? "일시 장애" : "미확정 오류", userId, item.popupId(), item.resultId(), item.resultType(), ex);
            return WpfResultResponse.of(retryable
                    ? WpfResultItemResponse.failed(item, WpfResultItemResponse.Status.RETRYABLE_ERROR,
                            "WPF_RETRYABLE", "일시적인 서버 오류로 처리하지 못했습니다. 다시 전송해 주세요.")
                    : WpfResultItemResponse.failed(item, WpfResultItemResponse.Status.INTERNAL_ERROR,
                            "WPF_INTERNAL", "서버 처리 중 오류가 발생했습니다."), null);
        }
        try {
            boolean available = popupMapper.countAvailablePopups(userId, true) > 0;
            return WpfResultResponse.of(processed,
                    available ? WpfResultResponse.NextStatus.AVAILABLE : WpfResultResponse.NextStatus.EMPTY);
        } catch (RuntimeException ex) {
            log.error("WPF 후속 후보 확인 실패(결과는 저장됨) userId={} resultId={}", userId, item.resultId(), ex);
            return new WpfResultResponse(processed.resultId(), processed.status(), null,
                    "WPF_NEXT_STATUS_UNKNOWN", "결과는 저장했으나 다음 팝업 유무를 확인하지 못했습니다.");
        }
    }
    /**
     * [설계 34-19] 재시도하면 성공할 수 있는 일시 장애인지 예외 형식(원인 체인 포함)으로 판단한다.
     * Spring 일시 장애 계열(TransientDataAccessException: 데드락·잠금 대기·쿼리 타임아웃 등), 복구 가능 오류,
     * DB 자원 접근 실패(연결 불가), 트랜잭션 시작 실패, JDBC 일시·복구 가능 예외를 일시 장애로 본다.
     */
    static boolean isTransientFailure(Throwable ex) {
        for (Throwable t = ex; t != null; t = t.getCause() == t ? null : t.getCause()) {
            if (t instanceof org.springframework.dao.TransientDataAccessException
                    || t instanceof org.springframework.dao.RecoverableDataAccessException
                    || t instanceof org.springframework.dao.DataAccessResourceFailureException
                    || t instanceof org.springframework.transaction.CannotCreateTransactionException
                    || t instanceof org.springframework.transaction.TransactionTimedOutException
                    || t instanceof java.sql.SQLTransientException
                    || t instanceof java.sql.SQLRecoverableException) {
                return true;
            }
        }
        return false;
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
        if (message.contains("이미 결과가 저장된 전달 건")) {
            return "WPF_DELIVERY_COMPLETED";
        }
        if (message.contains("전달 건")) {
            return "WPF_INVALID_DELIVERY";
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
