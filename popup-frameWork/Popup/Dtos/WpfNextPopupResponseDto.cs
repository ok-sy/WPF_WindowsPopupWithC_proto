using System.Text.Json.Serialization;

namespace Popup.Dtos
{
    /// <summary>
    /// [설계 35] POST /p/api/wpf/popups 응답 — 지금 표시할 팝업 최대 1건.
    ///
    /// 서버가 노출 판단(활성·기간·대상·숨김·완료·재노출 유예)과 정렬을 끝내고 1건만 내려준다.
    /// <see cref="Popup"/>이 null이면 표시할 팝업이 없으므로 <see cref="PollingIntervalSeconds"/> 뒤에 다시 조회한다.
    /// 이전 목록 응답(GET, serverTime·userId·popups[])은 삭제했다. 팝업 항목은 기존 평면 구조 <see cref="PopupResponseDto"/>를
    /// 재사용하며 <see cref="PopupResponseDto.DeliveryId"/>를 결과 수신 때 그대로 돌려준다.
    /// </summary>
    public class WpfNextPopupResponseDto
    {
        /// <summary>서버가 통제하는 조회 간격(초). 매 응답에 있으며 최신 값을 반영한다. 0 이하이면 appsettings 값을 유지한다.</summary>
        public int PollingIntervalSeconds { get; set; }

        [JsonPropertyName("popup")]
        public PopupResponseDto? Popup { get; set; }
    }
}