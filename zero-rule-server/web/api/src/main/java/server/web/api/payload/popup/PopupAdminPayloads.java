package server.web.api.payload.popup;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;
import server.domain.popup.AdminPopupListItemDto;
import server.domain.popup.AdminPopupTargetGroup;
import server.domain.popup.PopupResponseDto;

import java.util.List;

/** 관리자 팝업 API의 요청·응답 형식을 모아 둔다. */
public final class PopupAdminPayloads {

    private PopupAdminPayloads() {
    }

    /** 팝업 목록 화면에 전달하는 응답 본문이다. */
    @Schema(description = "관리자 팝업 목록 응답")
    @Builder
    @Data
    public static class PopupListResponse {
        @Schema(description = "등록된 전체 팝업 목록")
        private List<AdminPopupListItemDto> popups;
    }

    /** 목록에서 선택한 팝업의 상세조회 요청이다. */
    @Schema(description = "관리자 팝업 상세조회 요청")
    @Data
    public static class PopupInfoRequest {
        @NotBlank
        @Size(max = 50)
        @Schema(description = "팝업 ID", example = "SAMPLE-TEXT-001")
        private String popupId;
    }

    /** 편집 폼과 CSS 미리보기가 함께 사용하는 상세 데이터다. */
    @Schema(description = "관리자 팝업 상세조회 응답")
    @Builder
    @Data
    public static class PopupInfoResponse {
        @Schema(description = "팝업 표시 설정과 유형별 콘텐츠")
        private PopupResponseDto popup;

        @Schema(description = "그룹 간 OR, 그룹 내부 AND로 적용되는 대상 조건")
        private List<AdminPopupTargetGroup> targetGroups;
    }

    /** 신규 등록과 기존 팝업 수정이 함께 사용하는 저장 요청이다. */
    @Schema(description = "관리자 팝업 등록·수정 요청")
    @Data
    public static class PopupSaveRequest {
        @NotNull
        @Schema(description = "WPF 표시 규격과 같은 팝업 상세 데이터")
        private PopupResponseDto popup;

        @NotNull
        @Schema(description = "팝업 활성 여부", example = "true")
        private Boolean active;

        @NotNull
        @Schema(description = "그룹 간 OR, 그룹 내부 AND로 적용되는 대상 조건")
        private List<AdminPopupTargetGroup> targetGroups;
    }

    /** 목록에서 활성 여부만 변경할 때 사용하는 요청이다. */
    @Schema(description = "관리자 팝업 활성 여부 변경 요청")
    @Data
    public static class PopupActiveRequest {
        @NotBlank
        @Size(max = 50)
        private String popupId;

        @NotNull
        private Boolean active;
    }

    /** 저장 또는 활성 여부 변경 후 최신 팝업을 반환한다. */
    @Schema(description = "관리자 팝업 저장 응답")
    @Builder
    @Data
    public static class PopupSaveResponse {
        private PopupResponseDto popup;
    }
}
