package server.domain.popup;

/**
 * POL-05-02 : 완료·화면 이탈
 * ■ 영상 시청 저장 결과
 * - in : completed(boolean) 서버 판정 완료 여부
 * - out: 서비스 내부 결과(record)
 * - 영상 시청 저장 결과(서비스 내부 모델, HTTP 응답으로 직렬화하지 않음).
 * 서버가 계산한 완료 여부만 담는다. VIDEO+QUIZ 제출은 이 값으로 시청 완료 비율 충족을 확인한다.
 */
public record VideoProgressResponseDto(
        boolean completed
) {
}
