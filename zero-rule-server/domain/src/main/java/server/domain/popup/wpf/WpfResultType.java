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
    /**
     * 닫기(완료 전 닫기 포함). 표시·닫기 정보를 기록한다. [설계 35] 일반 안내(TEXT·IMAGE)의 닫기는 확인으로 보아 완료 처리하고,
     * 설문·퀴즈·영상은 완료 상태를 바꾸지 않는다(전달 건 재노출 유예만 적용).
     */
    CLOSED,
    /** "다시 보지 않기". 닫기 정보 + 숨김 기간(hideDays) 기록. */
    HIDDEN,
    /**
     * [TODO52-2] "나중에 보기". 모든 유형에서 표시·닫기 정보만 기록하고 완료 처리하지 않는다(TEXT·IMAGE 포함).
     * 전달 건 재노출 유예(저장 시각 + pollingIntervalSeconds)로 다음 조회 주기에 다시 표시된다. hideDays·answers·video는 보내도 무시한다.
     */
    LATER,
    /**
     * 설문·퀴즈 답안 제출. 서버가 문항·답안을 검증하고 저장한다. QUIZ 점수·통과 여부는 WPF 로컬 채점값(score·passed)을
     * 그대로 저장해 완료 판정에 쓰며(설계 12·33, 서버 계산값과 다르면 경고 로그만), SURVEY는 제출 즉시 완료한다.
     */
    SUBMITTED,
    /** 영상 팝업 종료 시 누적 시청 정보. 서버가 완료 비율을 판정한다. */
    VIDEO_WATCHED
}
