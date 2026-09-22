using Popup.Dtos;
using Popup.Factories;
using Popup.Models;
using System.Collections.Generic;

namespace Popup.Services
{
    /*
     * 서버에서 받은 팝업 DTO 목록을 화면에서 사용할 PopupOptions 목록으로 변환한다.
     *
     * [기준 2] 예전에는 PopupPolicyService(노출 기간 검사)와 PopupStorageService(숨김 로컬 파일)로
     * 클라이언트가 노출 여부를 한 번 더 판단했다. 이제 서버가 활성·기간·대상·숨김·완료를 모두 판정한
     * 최종 목록을 내려주므로 클라이언트 판단을 제거하고, 받은 목록을 그대로 변환만 한다.
     * (PopupPolicyService·PopupStorageService는 삭제했다.)
     */
    public class PopupService
    {
        /*
         * 서버가 내려준 팝업을 모두 PopupOptions로 변환한다.
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
