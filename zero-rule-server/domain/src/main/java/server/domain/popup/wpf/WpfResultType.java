package server.domain.popup.wpf;

/**
 * WPF 결과 API(POST /p/api/wpf/popups/results)의 결과 항목 유형.
 *
 * <p>[추가 이유 — 기준 3·4] 기존 WPF API는 숨김(hide)·제출(responses)·영상 진행률(video-progress)·
 * 표시/닫기 이벤트(events) 4개 엔드포인트로 나뉘어 있었다. 이를 하나의 결과 API로 통합하면서
 * 항목이 어떤 처리를 요구하는지 이 열거형으로 구분한다. 표시·닫기 시각은 모든 유형이 함께 담아 보내므로
 * 별도 DISPLAYED/CLOSED 이벤트 유형은 없다.</p>
 */
public enum WpfResultType {
    /** 단순 닫기. 표시·닫기 정보만 기록한다. */
    CLOSED,
    /** "다시 보지 않기". 닫기 정보 + 숨김 기간(hideDays) 기록. */
    HIDDEN,
    /** 설문·퀴즈 답안 제출. 서버가 검증·채점·완료 판정한다. */
    SUBMITTED,
    /** 영상 팝업 종료 시 누적 시청 정보. 서버가 완료 비율을 판정한다. */
    VIDEO_WATCHED
}
