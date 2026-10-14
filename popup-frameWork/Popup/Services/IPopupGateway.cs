using Popup.Dtos;
using System.Threading.Tasks;

namespace Popup.Services
{
    /*
     * [역할] WPF가 서버에 요구하는 두 가지 통신(단건 조회, 결과 1건 전송)의 추상화다.
     *
     * [추가 이유 — 기준 3·4 + Demo Mode]
     *   실제 구현은 PopupApiService(HTTP, /p/api/wpf/**)이고, Demo Mode는 DemoPopupGateway(인메모리 서버 시뮬레이션)다.
     *   PopupResultQueue가 이 인터페이스만 보도록 해 서버 없이도 결과 흐름
     *   (창 닫힘 → 결과 항목 조립 → 큐 → 전송 → 응답 안내)을 그대로 검증할 수 있다.
     *   MainWindow·DemoWindow는 각각 구체 타입(PopupApiService·DemoPopupGateway)을 보관해 조회를 직접 호출한다.
     */
    public interface IPopupGateway
    {
        /// <summary>[설계 35] 지금 표시할 팝업 최대 1건(공통 옵션·content·문항·deliveryId 포함)과 조회 간격. 없으면 Popup=null.</summary>
        Task<WpfNextPopupResponseDto> GetNextPopupAsync();

        /// <summary>[설계 35] 팝업 처리 결과 1건 전송. 응답의 status(처리 상태)와 nextStatus(후속 후보 유무)를 본다.</summary>
        Task<WpfResultResponseDto> PostResultAsync(WpfResultItemDto item);
    }
}
