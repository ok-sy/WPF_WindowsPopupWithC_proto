package server.domain.popup.wpf;

import java.time.OffsetDateTime;

/**
 * WpfPopupMapper.selectStatus 결과(사용자×팝업 1행, 테스트 검증용). [설계 34-03] 결과 API 응답에서는 더 이상 쓰지 않아 운영 코드 참조가 없고
 * 실DB 테스트의 완료·숨김 상태 확인에 쓴다.
 * 매퍼는 completed를 1/0으로 내리고 MyBatis가 boolean으로 변환한다.
 */
public record WpfUserPopupStatus(
        String popupStatus,
        boolean completed,
        OffsetDateTime completedAt,
        OffsetDateTime hiddenUntilAt
) {
}
