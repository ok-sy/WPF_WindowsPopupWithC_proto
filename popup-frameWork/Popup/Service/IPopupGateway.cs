using Popup.Dtos;
using System.Threading.Tasks;

namespace Popup.Services
{
    /*
     * [역할] WPF가 서버에 요구하는 두 가지 통신(목록 조회, 결과 전송)의 추상화다.
     *
     * [추가 이유 — 기준 3·4 + Demo Mode]
     *   실제 구현은 PopupApiService(HTTP, /p/api/wpf/**)이고, Demo Mode는 DemoPopupGateway(인메모리 서버 시뮬레이션)다.
     *   PopupResultQueue·MainWindow·DemoWindow가 이 인터페이스만 보도록 해 서버 없이도 결과 흐름
     *   (창 닫힘 → 결과 항목 조립 → 큐 → 전송 → 응답 안내)을 그대로 검증할 수 있다.
     */
    public interface IPopupGateway
    {
        /// <summary>서버가 노출 판정을 끝낸 최종 팝업 목록(공통 옵션·content·문항 포함).</summary>
        Task<WpfPopupListResponseDto> GetWpfPopupsAsync();

        /// <summary>팝업 처리 결과 일괄 전송. 항목별 결과는 응답 results[]에 담긴다.</summary>
        Task<WpfResultResponseDto> PostResultsAsync(WpfResultRequestDto request);
    }
}
