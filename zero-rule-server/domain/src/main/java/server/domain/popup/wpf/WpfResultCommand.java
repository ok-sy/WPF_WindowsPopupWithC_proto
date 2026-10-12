package server.domain.popup.wpf;

import server.domain.popup.PopupSubmitAnswer;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * 결과 항목 1건의 서비스 계층 모델. 웹 요청 DTO(WpfResultRequest)에서 변환된다.
 *
 * <p>[추가 이유 — 기준 3·4·6] 사용자 ID는 담지 않는다. 사용자는 컨트롤러가 인증 정보에서 얻어
 * 서비스 메서드 인자로 따로 전달한다(요청 본문의 userId를 신뢰하지 않음).</p>
 *
 * <p>[설계 32] 응답 시작 시각(responseStartedAt)은 WPF가 displayedAt을 그대로 복사하던 중복 값이라 제거했다.
 * 응답·처리 소요 시간은 closedAt - displayedAt으로 계산한다.</p>
 *
 * @param resultId          항목 멱등 키(UUID). WPF_RESULT_RECEIPT.RESULT_ID
 * @param popupId           대상 팝업
 * @param resultType        처리 유형
 * @param displayedAt       팝업이 처음 표시된 시각(선택). 있으면 표시 횟수 +1
 * @param closedAt          닫힌 시각(선택). 없으면 서버 수신 시각
 * @param hideDays          HIDDEN일 때 숨김 일수
 * @param answers           SUBMITTED일 때 답안 목록
 * @param video             VIDEO_WATCHED 또는 동영상+퀴즈 SUBMITTED일 때 시청 누적값
 * @param score             [설계 12·33] QUIZ SUBMITTED일 때 WPF 로컬 채점 점수(QUIZ 필수). 서버가 그대로 저장한다
 * @param passed            [설계 12·33] QUIZ SUBMITTED일 때 WPF 로컬 통과 여부(QUIZ 필수). 저장·완료 판정에 사용한다
 */
public record WpfResultCommand(
        String resultId,
        String popupId,
        WpfResultType resultType,
        OffsetDateTime displayedAt,
        OffsetDateTime closedAt,
        Integer hideDays,
        List<PopupSubmitAnswer> answers,
        WpfVideoProgress video,
        Double score,
        Boolean passed
) {
    // [설계 18 L-0] 테스트에서만 쓰던 score/passed 없는 9인자 호환 생성자를 삭제했다. 호출부는 정식 생성자를 쓴다.
    public WpfResultCommand {
        answers = answers == null ? List.of() : List.copyOf(answers);
    }
}
