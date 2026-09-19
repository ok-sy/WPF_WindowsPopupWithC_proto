package server.domain.popup.wpf;

import java.time.OffsetDateTime;

/**
 * WpfPopupMapper.selectStatus 결과(사용자×팝업 1행). 결과 API 응답의 상태 값을 채우는 데 쓴다.
 * 매퍼는 completed를 1/0으로 내리고 MyBatis가 boolean으로 변환한다.
 */
public record WpfUserPopupStatus(
        String popupStatus,
        boolean completed,
        OffsetDateTime completedAt,
        OffsetDateTime hiddenUntilAt
) {
}
