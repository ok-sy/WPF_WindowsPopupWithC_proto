package server.domain.popup;

/**
 * POL-10-03 : 완료·숨김·연기
 * ■ 설문·퀴즈 제출 저장 결과
 * - in : totalScore(double) 저장한 총점 · passed(boolean) 통과 여부
 * - out: 서비스 내부 결과(record)
 * - 설문·퀴즈 제출 저장 결과(서비스 내부 모델, HTTP 응답으로 직렬화하지 않음).
 * 저장한 총점과 통과 여부만 담는다. QUIZ는 WPF 로컬 채점값, SURVEY는 0점·통과다. passed는 채점 합불이며 완료 여부가 아니다
 * (유효한 제출은 합불과 관계없이 완료, PU001 §7).
 * WPF 결과 처리(WpfResultProcessor)는 반환값을 쓰지 않으며 저장 값 검증(테스트)에 쓴다.
 */
public record PopupSubmitResponseDto(
        double totalScore,
        boolean passed
) {
}
