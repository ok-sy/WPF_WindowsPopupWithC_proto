package server.web.api.popup;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import server.domain.popup.PopupHideResponseDto;
import server.domain.popup.PopupEventResponseDto;
import server.domain.popup.PopupResponseDto;
import server.domain.popup.PopupSubmitResponseDto;
import server.domain.popup.VideoProgressResponseDto;
import server.domain.popup.UserPopupStatusDto;
import server.service.core.popup.PopupService;
import server.web.api.payload.popup.PopupHideRequest;
import server.web.api.payload.popup.PopupEventRequest;
import server.web.api.payload.popup.PopupSubmitRequest;
import server.web.api.payload.popup.VideoProgressRequest;

import java.util.List;

/**
 * WPF 팝업 클라이언트가 JWT 로그인 없이 사용하는 공개 API다.
 * zero-server의 공개 URL 규칙인 /p/** 아래에 두어 인증 필터가 통과시킨다.
 */
@Tag(name = "Popup")
@RestController
@RequestMapping("/p/api/popups")
public class PopupController {

    private final PopupService popupService;

    public PopupController(PopupService popupService) {
        this.popupService = popupService;
    }

    /** 기존 popup-api와 같은 JSON 배열 계약을 유지한다. */
    @Operation(summary = "사용자에게 표시할 팝업 목록 조회")
    @GetMapping
    public List<PopupResponseDto> getPopups(
            @RequestParam("userId") String userId) {
        return popupService.getPopups(userId);
    }

    /** 사용자가 선택한 일수만큼 해당 팝업을 숨긴다. */
    @Operation(summary = "사용자 팝업 숨김 기간 저장")
    @PostMapping("/{popupId}/hide")
    public PopupHideResponseDto hidePopup(
            @PathVariable("popupId") String popupId,
            @Valid @RequestBody PopupHideRequest request) {
        return popupService.hidePopup(
                popupId, request.userId(), request.hideDays());
    }

    /** 설문 답안을 검증·채점하고 사용자 응답으로 저장한다. */
    @Operation(summary = "설문 답안 제출 및 서버 채점")
    @PostMapping("/{popupId}/responses")
    public PopupSubmitResponseDto submitResponse(
            @PathVariable("popupId") String popupId,
            @Valid @RequestBody PopupSubmitRequest request) {
        return popupService.submitResponse(
                popupId,
                request.clientRequestId(),
                request.userId(),
                request.responseStartedAt(),
                request.toAnswers());
    }

    /** 영상 시청률을 서버에서 계산하고 완료 여부를 저장한다. */
    @Operation(summary = "영상 시청 진행률 저장")
    @PostMapping("/{popupId}/video-progress")
    public VideoProgressResponseDto saveVideoProgress(
            @PathVariable("popupId") String popupId,
            @Valid @RequestBody VideoProgressRequest request) {
        return popupService.saveVideoProgress(
                popupId, request.userId(), request.durationSeconds(),
                request.positionSeconds(), request.maximumPositionSeconds(),
                request.watchedSeconds());
    }

    /** 팝업 표시·닫기 이벤트를 사용자 상태에 기록한다. */
    @Operation(summary = "팝업 표시·닫기 이벤트 저장")
    @PostMapping("/{popupId}/events")
    public PopupEventResponseDto recordPopupEvent(
            @PathVariable("popupId") String popupId,
            @Valid @RequestBody PopupEventRequest request) {
        return popupService.recordPopupEvent(
                popupId, request.userId(), request.eventType());
    }

    /** 사용자별 팝업 표시·숨김·완료 상태를 조회한다. */
    @Operation(summary = "사용자 팝업 상태 목록 조회")
    @GetMapping("/statuses")
    public List<UserPopupStatusDto> getPopupStatuses(
            @RequestParam("userId") String userId) {
        return popupService.getPopupStatuses(userId);
    }
}
