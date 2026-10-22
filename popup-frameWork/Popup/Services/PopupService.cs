using Popup.Dtos;
using Popup.Factories;
using Popup.Models;
using System.Collections.Generic;

namespace Popup.Services
{
    /*
     * POL-11-01 : 노출 판단 소유
     * ■ 팝업 옵션 변환 서비스
     * - in : 서버에서 받은 팝업 DTO 목록
     * - out: 화면에서 사용할 PopupOptions 목록
     * - 서버가 활성·기간·대상·숨김·완료를 모두 판정한 결과를 내려주므로 클라이언트는 노출 여부를 다시 판단하지 않고
     *   받은 목록을 그대로 변환만 한다(노출 기간 검사·숨김 로컬 파일 없음).
     */
    public class PopupService
    {
        /*
         * ■ PopupOptions 일괄 변환
         * - in : popupDtos(IEnumerable<PopupResponseDto>)
         * - out: List<PopupOptions> · 예외: PopupFactory.Create 변환 예외를 그대로 올린다
         * - 서버가 내려준 팝업을 모두 PopupOptions로 변환한다.
         * 변환에 실패한 항목(지원하지 않는 유형 등)은 예외를 그대로 올려 호출자가 안내한다.
         */
        public List<PopupOptions> CreatePopupOptions(
            IEnumerable<PopupResponseDto> popupDtos)
        {
            List<PopupOptions> popupOptions = new();

            foreach (PopupResponseDto popupDto in popupDtos)
            {
                popupOptions.Add(
                    PopupFactory.Create(
                        popupDto));
            }

            return popupOptions;
        }
    }
}
