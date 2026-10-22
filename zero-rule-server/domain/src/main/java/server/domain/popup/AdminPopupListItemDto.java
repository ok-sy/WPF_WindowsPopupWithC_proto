package server.domain.popup;

import java.time.OffsetDateTime;

/**
 * POL-07-01 : 부모의 데이터 소유
 * ■ 관리자 팝업 목록 행
 * - in : 팝업 ID·유형·제목·기간·표시 방식·정렬·활성·감사 정보·일정 요약 값
 * - out: 관리자 목록 화면 한 행(record)
 * - 관리자 팝업 목록 화면의 한 행을 표현한다.
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
        OffsetDateTime updatedAt,
        // POL-11-03 : 시간 경계 — 목록 일정 요약용. SCHEDULE 요일(ISO 번호, null = 매일)과 시간대 문자열("09:00~12:00, 22:00~02:00", 없으면 null = 종일)
        String repeatDayOfWeek,
        String displayTimesText
) {
}
