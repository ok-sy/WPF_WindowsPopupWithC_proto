using System;
using System.Collections.Generic;

namespace Popup.Dtos
{
    /// <summary>
    /// GET /p/api/wpf/popups 응답이다.
    ///
    /// [추가 이유 — 기준 2·3] 서버가 노출 판단(활성·기간·대상·숨김·완료)을 끝낸 최종 목록을 한 번에 받는다.
    /// 기존 WPF-01(/api/popups)과 WPF-06(/api/popups/statuses) 두 호출과 클라이언트 완료 필터를 대체한다.
    /// 팝업 항목은 기존 <see cref="PopupResponseDto"/>와 같은 평면 구조라 DTO를 재사용한다
    /// (서버는 questionTemplateId·passingScore·content.questions를 내려주지 않으며, 해당 속성은 기본값으로 남는다).
    /// </summary>
    public class WpfPopupListResponseDto
    {
        /// <summary>서버 시각(KST). WPF는 시각 판단을 하지 않고 참고만 한다.</summary>
        public DateTimeOffset? ServerTime { get; set; }

        /// <summary>서버가 인증 정보에서 확인한 사번. 요청에는 보내지 않는다.</summary>
        public string UserId { get; set; } = string.Empty;

        /// <summary>서버가 통제하는 주기 조회 간격(초). 0 이하이면 appsettings 값을 유지한다.</summary>
        public int PollingIntervalSeconds { get; set; }

        public List<PopupResponseDto> Popups { get; set; } = new();
    }
}
