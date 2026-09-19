package server.web.api.popup;

import cl.cloverframework.api.CLNewApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import server.service.core.popup.PopupService;
import server.web.api.payload.popup.PopupAdminPayloads;
import server.web.support.ApiBaseController;

import static server.service.UserSecurityUtils.currentLgonId;

/**
 * 로그인한 zero-rule-web 관리자가 사용하는 팝업 관리 API다.
 * WPF 공개 API와 달리 /apis/** 경로를 사용해 기존 인증 필터를 거친다.
 */
@Tag(name = "Popup Admin")
@RestController
@RequestMapping("/apis/popup")
public class PopupAdminController extends ApiBaseController {

    private final PopupService popupService;

    public PopupAdminController(PopupService popupService) {
        this.popupService = popupService;
    }

    /** 비활성·기간 만료 팝업을 포함한 관리자용 전체 목록을 조회한다. */
    @Operation(summary = "관리자 팝업 전체 목록 조회")
    @PostMapping("/list")
    public CLNewApiResponse<PopupAdminPayloads.PopupListResponse> getPopups() {
        return resultMsg(
                "BE00000001",
                PopupAdminPayloads.PopupListResponse.builder()
                        .popups(popupService.getAdminPopups())
                        .build());
    }

    /** 목록에서 선택한 팝업의 편집·미리보기용 상세정보를 조회한다. */
    @Operation(summary = "관리자 팝업 상세조회")
    @PostMapping("/info")
    public CLNewApiResponse<PopupAdminPayloads.PopupInfoResponse> getPopup(
            @Valid @RequestBody PopupAdminPayloads.PopupInfoRequest request) {
        var popup = popupService.getAdminPopup(request.getPopupId());
        return resultMsg(
                "BE00000001",
                PopupAdminPayloads.PopupInfoResponse.builder()
                        .popup(popup)
                        .adminQuestions(popupService.getAdminQuestions(
                                popup.questionTemplateId()))
                        .targetGroups(popupService.getAdminTargetGroups(request.getPopupId()))
                        .build());
    }

    /** 신규 팝업을 등록하거나 같은 ID의 기존 팝업을 수정한다. */
    @Operation(summary = "관리자 팝업 등록·수정")
    @PostMapping("/save")
    public CLNewApiResponse<PopupAdminPayloads.PopupSaveResponse> savePopup(
            @Valid @RequestBody PopupAdminPayloads.PopupSaveRequest request) {
        return resultMsg(
                "BE00000001",
                PopupAdminPayloads.PopupSaveResponse.builder()
                        .popup(popupService.saveAdminPopup(
                                request.getPopup(),
                                request.getActive(),
                                request.getTargetGroups(),
                                currentLgonId()))
                        .build());
    }

    /** 팝업의 내용은 유지하고 활성 여부만 변경한다. */
    @Operation(summary = "관리자 팝업 활성 여부 변경")
    @PostMapping("/active")
    public CLNewApiResponse<PopupAdminPayloads.PopupSaveResponse> updateActive(
            @Valid @RequestBody PopupAdminPayloads.PopupActiveRequest request) {
        return resultMsg(
                "BE00000001",
                PopupAdminPayloads.PopupSaveResponse.builder()
                        .popup(popupService.updateAdminPopupActive(
                                request.getPopupId(),
                                request.getActive(),
                                currentLgonId()))
                        .build());
    }

    @PostMapping("/question-templates")
    public CLNewApiResponse<java.util.Map<String, Object>> getQuestionTemplates() {
        return resultMsg("BE00000001", java.util.Map.of("templates", popupService.getAdminQuestionTemplates()));
    }
    public record TemplateRequest(@jakarta.validation.constraints.NotNull Long templateId) {}
    @PostMapping("/question-template")
    public CLNewApiResponse<java.util.Map<String, Object>> getQuestionTemplate(
            @Valid @RequestBody TemplateRequest request) {
        return resultMsg("BE00000001", java.util.Map.of("adminQuestions",
                popupService.getAdminQuestions(request.templateId())));
    }
}
