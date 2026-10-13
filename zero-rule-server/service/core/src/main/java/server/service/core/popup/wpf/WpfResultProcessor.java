package server.service.core.popup.wpf;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import server.base.props.WpfPopupProps;
import server.domain.popup.PopupHideResponseDto;
import server.domain.popup.PopupSubmitResponseDto;
import server.domain.popup.VideoProgressResponseDto;
import server.domain.popup.wpf.WpfPopupDelivery;
import server.domain.popup.wpf.WpfResultCommand;
import server.domain.popup.wpf.WpfResultItemResponse;
import server.domain.popup.wpf.WpfVideoProgress;
import server.repo.core.mapper.popup.PopupMapper;
import server.repo.core.mapper.popup.WpfPopupMapper;
import server.service.core.popup.PopupService;

/**
 * WPF 결과 항목 1건을 유형(CLOSED/HIDDEN/SUBMITTED/VIDEO_WATCHED)에 따라 처리한다.
 *
 * <p>[추가 이유 — 기준 3·4] 기존에는 hide / responses / video-progress / events 4개 API가 각각 처리하던 일을
 * 한 진입점에서 분배한다. 검증·채점·완료 판정 규칙은 기존 {@link PopupService}의 공개 메서드
 * (hidePopup, submitResponse, saveVideoProgress)를 그대로 호출해 두 API 계약이 어긋나지 않게 한다.
 * 이 클래스가 새로 하는 일은 (1) 표시·닫기 정보를 결과와 함께 1회 반영, (2) resultId 멱등 처리다.</p>
 *
 * <p>[트랜잭션] {@link #processOne}은 REQUIRES_NEW다. 항목 하나의 실패(예외)는 그 항목만 롤백하고
 * 다른 항목의 커밋에 영향을 주지 않는다. 업무 검증 실패(IllegalArgumentException)는 이 메서드 밖으로
 * 그대로 던져 트랜잭션이 깨끗하게 롤백되게 하고, 호출자(WpfPopupService)가 REJECTED 응답으로 바꾼다.
 * (예외를 이 안에서 잡고 정상 반환하면 내부 @Transactional 경계에서 rollback-only로 표시된 트랜잭션을
 * 커밋하려다 UnexpectedRollbackException이 난다.)</p>
 *
 * <p>[멱등성] WPF_RESULT_RECEIPT.RESULT_ID(UNIQUE). 이미 있으면 DUPLICATE를 돌려주고 아무것도 하지 않는다.
 * 영수증은 성공 처리와 같은 트랜잭션에서 기록되어, 처리 도중 실패하면 영수증도 남지 않아 재전송 시 재처리된다.</p>
 *
 * <p>[설계 35] 전달 건(deliveryId): 영수증 확인 뒤 전달 건의 소유(사번)·팝업 일치·미종료를 확인하고, 처리 성공 시 같은 트랜잭션에서
 * 전달 건을 종료하며 재노출 유예(저장 시각 + pollingIntervalSeconds)를 기록한다. 일반 안내(TEXT·IMAGE)의 닫기(CLOSED,
 * Footer 닫기·바로가기 포함)는 완료로 처리해 이후 조회에서 제외한다. 설문·퀴즈·영상은 기존 제출·통과·시청 완료 조건을 유지하고,
 * 미완료로 닫으면 유예 기간 동안만 제외된다.</p>
 */
@Service
public class WpfResultProcessor {

    private final PopupService popupService;
    private final PopupMapper popupMapper;
    private final WpfPopupMapper wpfMapper;
    private final WpfPopupProps props;

    public WpfResultProcessor(PopupService popupService, PopupMapper popupMapper, WpfPopupMapper wpfMapper,
                              WpfPopupProps props) {
        this.popupService = popupService;
        this.popupMapper = popupMapper;
        this.wpfMapper = wpfMapper;
        this.props = props;
    }

    /**
     * 항목 1건 처리. 업무 검증 실패는 IllegalArgumentException으로 전파된다(호출자가 REJECTED로 변환).
     *
     * @param employeeNo 인증 정보에서 얻은 사번 (요청 본문의 값이 아님 — 기준 6)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public WpfResultItemResponse processOne(String employeeNo, WpfResultCommand item) {
        if (wpfMapper.countReceipt(item.resultId()) > 0) {
            return WpfResultItemResponse.duplicate(item);
        }
        WpfPopupDelivery delivery = requireDelivery(employeeNo, item);

        WpfResultItemResponse response = switch (item.resultType()) {
            case CLOSED -> handleClosed(employeeNo, item, delivery.popupType());
            case HIDDEN -> handleHidden(employeeNo, item);
            case SUBMITTED -> handleSubmitted(employeeNo, item);
            case VIDEO_WATCHED -> handleVideo(employeeNo, item);
        };

        wpfMapper.completeDelivery(item.deliveryId(), item.resultId(), item.resultType().name(),
                props.getPollingIntervalSeconds());
        wpfMapper.insertReceipt(item.resultId(), employeeNo, item.popupId(),
                item.resultType().name(), "ACCEPTED", null);
        return response;
    }

    /**
     * CLOSED: 활성 사용자·팝업 확인 후 표시·닫기 정보를 반영한다.
     * [설계 35] 일반 안내(TEXT·IMAGE)는 닫기가 곧 확인이므로 완료로 처리한다. 그 밖의 유형(설문·퀴즈·영상)의 닫기는
     * 완료 전 닫기라 완료 상태를 건드리지 않는다(전달 건 재노출 유예만 적용).
     */
    private WpfResultItemResponse handleClosed(String employeeNo, WpfResultCommand item, String popupType) {
        requireActiveUserAndPopup(employeeNo, item.popupId());
        recordDisplayAndClose(employeeNo, item);
        if ("TEXT".equals(popupType) || "IMAGE".equals(popupType)) {
            popupMapper.markPopupCompleted(employeeNo, item.popupId(), "Y");
        }
        return WpfResultItemResponse.accepted(item);
    }

    /**
     * [설계 35] 전달 건 확인: 존재·소유 사번·팝업 일치·미종료. 같은 전달 건의 동시 결과는 행 잠금으로 직렬화한다.
     * 재조회로 EXPIRED가 된 건(표시 중 게시 중단 등)의 결과는 기존과 같이 받는다.
     */
    private WpfPopupDelivery requireDelivery(String employeeNo, WpfResultCommand item) {
        WpfPopupDelivery delivery = item.deliveryId() == null ? null : wpfMapper.selectDeliveryForUpdate(item.deliveryId());
        if (delivery == null || !employeeNo.equals(delivery.employeeNo())) {
            throw new IllegalArgumentException("유효한 전달 건이 아닙니다. deliveryId=" + item.deliveryId());
        }
        if (!delivery.popupId().equals(item.popupId())) {
            throw new IllegalArgumentException("전달 건의 팝업과 일치하지 않습니다. deliveryId=" + item.deliveryId());
        }
        if (delivery.done()) {
            throw new IllegalArgumentException("이미 결과가 저장된 전달 건입니다. deliveryId=" + item.deliveryId());
        }
        return delivery;
    }

    /**
     * HIDDEN: 표시·닫기 반영 후 기존 hidePopup으로 숨김 기간을 설정한다.
     * 만료 시각은 서버(KST) 시각 기준으로 저장하며 [설계 34-05] 응답으로 돌려주지 않는다.
     */
    private WpfResultItemResponse handleHidden(String employeeNo, WpfResultCommand item) {
        if (item.hideDays() == null) {
            throw new IllegalArgumentException("HIDDEN 결과에는 hideDays가 필요합니다.");
        }
        requireActiveUserAndPopup(employeeNo, item.popupId());
        recordDisplayAndClose(employeeNo, item);
        PopupHideResponseDto hidden = popupService.hidePopup(item.popupId(), employeeNo, item.hideDays());
        if (hidden.hiddenUntil() == null) {
            throw new IllegalStateException("숨김 만료 시각을 확인할 수 없습니다. popupId=" + item.popupId());
        }
        return WpfResultItemResponse.accepted(item);
    }

    /**
     * SUBMITTED: 기존 submitResponse에 위임한다(노출 자격 재검사·문항 검증·응답 upsert·완료 표시).
     * resultId를 clientRequestId로 넘겨 POPUP_RESPONSE.CLIENT_REQUEST_ID에 남긴다.
     * SURVEY는 passingScore=null → 0점 기준 통과로 완료 처리하므로 제출 즉시 COMPLETED가 된다.
     *
     * <p>[설계 12 §4·§6·§10 / 설계 33] QUIZ 점수·통과 판정은 WPF가 로컬에서 먼저 하고 사용자에게 즉시 보여 준 뒤,
     * 결과 항목의 score/passed로 함께 보낸다. 서버는 그 값을 그대로 저장하고 완료 판정에 쓴다(submitResponse).
     * 서버 계산값과 다르면 경고 로그만 남긴다. 응답은 처리 상태 중심이며 totalScore/passed를 다시 내려주지 않는다.</p>
     */
    private WpfResultItemResponse handleSubmitted(String employeeNo, WpfResultCommand item) {
        if (item.answers().isEmpty()) {
            throw new IllegalArgumentException("SUBMITTED 결과에는 answers가 1개 이상 필요합니다.");
        }
        var videoContext = popupMapper.selectVideoPopupContext(employeeNo, item.popupId());
        if (videoContext != null && "QUIZ".equals(videoContext.popupType())) {
            WpfVideoProgress video = item.video();
            if (video == null) throw new IllegalArgumentException("동영상+퀴즈 제출에는 영상 시청 정보가 필요합니다.");
            VideoProgressResponseDto progress = popupService.saveVideoProgress(item.popupId(), employeeNo,
                    video.durationSeconds(), video.positionSeconds(), video.maximumPositionSeconds(), video.watchedSeconds());
            if (!progress.completed()) throw new IllegalArgumentException("영상 시청 완료 비율을 충족해야 퀴즈를 제출할 수 있습니다.");
        }
        PopupSubmitResponseDto submitted = popupService.submitResponse(
                item.popupId(), item.resultId(), employeeNo, item.answers(), item.score(), item.passed());
        recordDisplayAndClose(employeeNo, item);   // 완료 상태는 MERGE가 유지한다
        return WpfResultItemResponse.accepted(item);
    }

    /**
     * VIDEO_WATCHED: 기존 saveVideoProgress에 위임한다(비율 계산·완료 판정·최대값 유지).
     * 실시간 진행률 대신 종료 시 1회 누적값이 들어오지만 판정 규칙은 같다.
     */
    private WpfResultItemResponse handleVideo(String employeeNo, WpfResultCommand item) {
        WpfVideoProgress video = item.video();
        if (video == null) {
            throw new IllegalArgumentException("VIDEO_WATCHED 결과에는 video 블록이 필요합니다.");
        }
        // 시청 비율 계산·완료 판정·최대값 유지는 서버 내부 처리이며 [설계 34-05] 비율은 응답에 싣지 않는다.
        popupService.saveVideoProgress(
                item.popupId(), employeeNo, video.durationSeconds(), video.positionSeconds(),
                video.maximumPositionSeconds(), video.watchedSeconds());
        recordDisplayAndClose(employeeNo, item);
        return WpfResultItemResponse.accepted(item);
    }

    /** 표시(displayedAt)·닫기(closedAt) 정보를 USER_POPUP_STATUS에 1회 반영한다. */
    private void recordDisplayAndClose(String employeeNo, WpfResultCommand item) {
        if (wpfMapper.mergeDisplayAndClose(employeeNo, item.popupId(), item.displayedAt(), item.closedAt()) <= 0) {
            throw new IllegalStateException("팝업 표시·닫기 상태 저장에 실패했습니다. popupId=" + item.popupId());
        }
    }

    /** CLOSED/HIDDEN은 노출 자격을 다시 따지지 않고(기존 이벤트 API와 동일) 활성 사용자·팝업 존재만 확인한다. */
    private void requireActiveUserAndPopup(String employeeNo, String popupId) {
        if (popupMapper.countActiveUserAndPopup(employeeNo, popupId) == 0) {
            throw new IllegalArgumentException("유효한 사용자 또는 팝업이 아닙니다. popupId=" + popupId);
        }
    }
}
