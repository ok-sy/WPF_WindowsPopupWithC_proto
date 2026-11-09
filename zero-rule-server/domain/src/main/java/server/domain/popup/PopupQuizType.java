package server.domain.popup;

import java.util.Set;

/**
 * POL-06-02 : 선택·제출
 * ■ 퀴즈 유형 코드(공통코드 그룹 0090)
 * - in : POPUP_NOTICE.QUIZ_TYPE_CD 또는 관리자 저장 요청 quizTypeCode
 * - out: 코드 상수 · WPF 조회 응답 requiresPassing 파생값
 * - 참여형은 채점 결과와 무관하게 제출하면 완료, 만점형·컷트라인형은 합격해야 제출(WPF가 차단)한다(PU001 §7).
 *   서버 완료 처리는 유형과 관계없이 유효한 QUIZ 제출이면 COMPLETED다. 유형은 WPF 안내·제출 허용 판단에만 쓴다.
 */
public final class PopupQuizType {
    private PopupQuizType() {}

    /** 참여형: 기준 점수가 있어도 제출하면 완료. */
    public static final String PARTICIPATION = "00";
    /** 만점형: 통과 점수 = 문항 배점 합계. */
    public static final String FULL = "01";
    /** 컷트라인형: 통과 점수 이상이어야 합격. */
    public static final String CUTOFF = "02";

    public static final Set<String> CODES = Set.of(PARTICIPATION, FULL, CUTOFF);

    /**
     * ■ WPF requiresPassing 파생
     * - in : code(String) 퀴즈 유형 코드(null 허용)
     * - out: 00 → false, 01·02 → true, null·알 수 없는 값 → null(응답에서 생략, WPF는 passingScore 기준 구 판정으로 대체)
     */
    public static Boolean requiresPassing(String code) {
        if (code == null) return null;
        return switch (code.trim()) {
            case PARTICIPATION -> Boolean.FALSE;
            case FULL, CUTOFF -> Boolean.TRUE;
            default -> null;
        };
    }
}
