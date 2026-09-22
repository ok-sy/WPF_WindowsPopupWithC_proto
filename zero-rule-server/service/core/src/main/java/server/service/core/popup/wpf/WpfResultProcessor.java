package server.service.core.popup.wpf;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import server.domain.popup.PopupHideResponseDto;
import server.domain.popup.PopupSubmitResponseDto;
import server.domain.popup.VideoProgressResponseDto;
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
 */
@Service
public class WpfResultProcessor {

    private static final Logger log = LoggerFactory.getLogger(WpfResultProcessor.class);

    private final PopupService popupService;
    private final PopupMapper popupMapper;
    private final WpfPopupMapper wpfMapper;

    public WpfResultProcessor(PopupService popupService, PopupMapper popupMapper, WpfPopupMapper wpfMapper) {
        this.popupService = popupService;
        this.popupMapper = popupMapper;
        this.wpfMapper = wpfMapper;
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

        WpfResultItemResponse response = switch (item.resultType()) {
            case CLOSED -> handleClosed(employeeNo, item);
            case HIDDEN -> handleHidden(employeeNo, item);
            case SUBMITTED -> handleSubmitted(employeeNo, item);
            case VIDEO_WATCHED -> handleVideo(employeeNo, item);
        };

        wpfMapper.insertReceipt(item.resultId(), employeeNo, item.popupId(),
                item.resultType().name(), "ACCEPTED", null);
        return response;
    }

    /** CLOSED: 활성 사용자·팝업 확인 후 표시·닫기 정보만 반영한다. 완료 상태는 건드리지 않는다. */
    private WpfResultItemResponse handleClosed(String employeeNo, WpfResultCommand item) {
        requireActiveUserAndPopup(employeeNo, item.popupId());
        recordDisplayAndClose(employeeNo, item);
        return WpfResultItemResponse.accepted(item)
                .status(wpfMapper.selectStatus(employeeNo, item.popupId()))
                .build();
    }

    /**
     * HIDDEN: 표시·닫기 반영 후 기존 hidePopup으로 숨김 기간을 설정한다.
     * 만료 시각은 서버(KST) 시각 기준이며 응답의 hiddenUntil로 돌려준다.
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
        // selectStatus의 hiddenUntilAt이 방금 저장된 HIDDEN_UNTIL_AT을 돌려준다.
        return WpfResultItemResponse.accepted(item)
                .status(wpfMapper.selectStatus(employeeNo, item.popupId()))
                .build();
    }

    /**
     * SUBMITTED: 기존 submitResponse에 위임한다(노출 자격 재검사·문항 검증·응답 upsert·완료 표시).
     * resultId를 clientRequestId로 넘겨 POPUP_RESPONSE.CLIENT_REQUEST_ID에 남긴다.
     * SURVEY는 채점 대상이 아니므로 totalScore/passed를 응답에서 생략한다
     * (기존 로직은 passingScore=null → 0점 기준 통과로 완료 처리하므로 제출 즉시 COMPLETED가 된다).
     *
     * <p>[설계 12 §4·§6·§10] QUIZ 점수·통과 판정은 이제 WPF가 로컬에서 먼저 하고 사용자에게 즉시 보여 준 뒤,
     * 결과 항목의 score/passed로 함께 보낸다. 서버는 결과 저장에 집중하며 WPF 값을 거절하거나 재채점으로 덮어쓰지 않는다.
     * 다만 DB 저장 로직(submitResponse)이 이미 같은 규칙으로 점수를 계산하므로, 그 값과 WPF 값이 다르면
     * 경고 로그만 남겨 정답 데이터 불일치를 추적할 수 있게 한다. (WPF 응답은 서버 계산값을 돌려주지만 WPF는 더 이상 기다리지 않는다.)</p>
     */
    private WpfResultItemResponse handleSubmitted(String employeeNo, WpfResultCommand item) {
        if (item.answers().isEmpty()) {
            throw new IllegalArgumentException("SUBMITTED 결과에는 answers가 1개 이상 필요합니다.");
        }
        PopupSubmitResponseDto submitted = popupService.submitResponse(
                item.popupId(), item.resultId(), employeeNo, item.responseStartedAt(), item.answers());
        recordDisplayAndClose(employeeNo, item);   // 완료 상태는 MERGE가 유지한다

        boolean quiz = "QUIZ".equalsIgnoreCase(popupTypeOf(employeeNo, item.popupId()));
        if (quiz) {
            logClientScoreMismatch(employeeNo, item, submitted);
        }
        WpfResultItemResponse.Builder builder = WpfResultItemResponse.accepted(item)
                .status(wpfMapper.selectStatus(employeeNo, item.popupId()))
                .response(submitted.responseId());
        if (quiz) {
            builder.score(submitted.totalScore(), submitted.passed());
        }
        return builder.build();
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
        VideoProgressResponseDto progress = popupService.saveVideoProgress(
                item.popupId(), employeeNo, video.durationSeconds(), video.positionSeconds(),
                video.maximumPositionSeconds(), video.watchedSeconds());
        recordDisplayAndClose(employeeNo, item);
        return WpfResultItemResponse.accepted(item)
                .status(wpfMapper.selectStatus(employeeNo, item.popupId()))
                .video(progress.watchedRatio(), progress.requiredRatio())
                .build();
    }

    /**
     * [설계 12] WPF 로컬 채점값과 서버 저장 계산값이 다르면 경고 로그. 정답 데이터가 어긋났거나 구 클라이언트일 때 추적용.
     * WPF가 값을 보내지 않았으면(구 버전) 비교하지 않는다. 점수는 소수 둘째 자리(WPF 반올림 기준)로 비교한다.
     */
    private static void logClientScoreMismatch(String employeeNo, WpfResultCommand item, PopupSubmitResponseDto submitted) {
        if (item.score() == null && item.passed() == null) {
            return;
        }
        boolean scoreDiffers = item.score() != null
                && Math.abs(item.score() - submitted.totalScore()) >= 0.01;
        boolean passedDiffers = item.passed() != null
                && item.passed() != submitted.passed();
        if (scoreDiffers || passedDiffers) {
            log.warn("[WPF] QUIZ 로컬 채점값 불일치 userId={} popupId={} resultId={} wpf(score={}, passed={}) server(score={}, passed={})",
                    employeeNo, item.popupId(), item.resultId(), item.score(), item.passed(),
                    submitted.totalScore(), submitted.passed());
        }
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

    /** 제출 직후 팝업 유형 확인(QUIZ 여부). selectSubmissionContext는 활성·기간 조건을 포함하므로 제출 성공 후엔 항상 존재한다. */
    private String popupTypeOf(String employeeNo, String popupId) {
        var context = popupMapper.selectSubmissionContext(employeeNo, popupId);
        return context == null ? "" : context.popupType();
    }
}
