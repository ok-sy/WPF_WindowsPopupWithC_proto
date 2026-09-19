package server.domain.popup;

import java.time.OffsetDateTime;

/**
 * 관리자 팝업 목록 화면의 한 행을 표현한다.
 *
 * WPF용 PopupResponseDto는 화면을 그리는 모든 내용을 포함하지만,
 * 관리자 목록은 검색과 선택에 필요한 요약 정보만 반환한다.
 */
public record AdminPopupListItemDto(
        String popupId,
        String popupType,
        String title,
        OffsetDateTime displayStartAt,
        OffsetDateTime displayEndAt,
        String displayMode,
        int displayOrder,
        String sizeMode,
        String activeYn,
        String periodMode,
        Long questionTemplateId,
        String createdBy,
        OffsetDateTime createdAt,
        String updatedBy,
        OffsetDateTime updatedAt
) {
}
