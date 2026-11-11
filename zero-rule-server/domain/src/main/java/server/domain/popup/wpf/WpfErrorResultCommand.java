package server.domain.popup.wpf;

/**
 * POL-12-04 : 통합 복구 주기 (TODO45 장애 결과, 2026-11-11)
 * ■ 장애 결과 1건 서비스 계층 모델
 * - in : 아래 @param 값(웹 요청 DTO WpfResultRequest에서 변환, resultCode가 있는 요청)
 * - out: 장애 결과 처리 입력(record)
 *
 * <p>WPF가 받은 조회 응답을 처리하지 못한 경우(빈 본문·JSON 오류·표시 변환 실패)에 보내는 결과다. 사용자 처리 결과가 아니므로
 * resultType이 없고 완료·숨김을 바꾸지 않는다. deliveryId를 확보했으면 그 전달 건을 오류로 종료(재노출 유예)하고,
 * 확보하지 못했으면 영수증만 남긴다. 임의의 전달 건을 종료하지 않는다.</p>
 *
 * @param resultId   결과 멱등 키(UUID). WPF가 생성하고 재전송 시 유지
 * @param deliveryId 확보한 조회 응답 popup.deliveryId. 없으면 null
 * @param popupId    확보한 popupId. 없으면 null
 * @param resultCode 장애 결과 코드. 현재 400(조회 응답 처리 불가)만 쓴다
 * @param resultDesc 오류 내용·JSON 위치. UTF-8 1,000 Byte 이하(원본 JSON 전체는 넣지 않음)
 */
public record WpfErrorResultCommand(
        String resultId,
        String deliveryId,
        String popupId,
        int resultCode,
        String resultDesc
) {
    /** 영수증·전달 건 RESULT_TYPE에 남기는 값. 사용자 처리 유형(WpfResultType)과 구분한다. */
    public static final String RECEIPT_TYPE = "ERROR";
}
