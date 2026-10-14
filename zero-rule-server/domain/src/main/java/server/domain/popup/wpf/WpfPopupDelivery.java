package server.domain.popup.wpf;

/**
 * [설계 35] WPF 팝업 전달 건 1행(WPF_POPUP_DELIVERY). 조회 API가 만들고 결과 수신 API가 종료한다.
 *
 * @param deliveryId     전달 건 ID(UUID)
 * @param employeeNo     전달 대상 사번
 * @param popupId        전달한 팝업
 * @param deliveryStatus OPEN / DONE / EXPIRED
 * @param popupType      팝업 유형(POPUP_NOTICE 조인). 결과 처리에서 일반 안내(TEXT·IMAGE) 닫기 완료 판정에 쓴다
 */
public record WpfPopupDelivery(
        String deliveryId,
        String employeeNo,
        String popupId,
        String deliveryStatus,
        String popupType
) {
    public boolean done() {
        return "DONE".equals(deliveryStatus);
    }
}