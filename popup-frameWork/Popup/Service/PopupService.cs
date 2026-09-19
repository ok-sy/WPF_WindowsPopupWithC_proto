using Popup.Dtos;
using Popup.Factories;
using Popup.Models;
using System.Collections.Generic;

namespace Popup.Services
{
    /*
     * 서버에서 받은 팝업 DTO 목록을 검사하고
     * 화면에서 사용할 PopupOptions 목록으로 변환한다.
     */
    public class PopupService
    {
        /*
         * 팝업을 현재 화면에 표시할 수 있는지
         * 검사하는 정책 서비스
         *
         * 다음 조건을 검사한다.
         *
         * 1. 팝업 노출 시작 일시가 되었는지
         * 2. 팝업 노출 종료 일시가 지나지 않았는지
         * 3. 사용자가 PopupId를 숨김 처리했는지
         */
        private readonly PopupPolicyService
            _popupPolicyService;

        /*
         * PopupService 생성자
         *
         * PopupWindow가 숨김 정보를 저장하는 것과
         * 동일한 PopupStorageService.Instance를
         * PopupPolicyService에 전달한다.
         *
         * 이렇게 해야 팝업 창에서 저장한 숨김 정보를
         * PopupPolicyService가 같은 실행 중에 조회할 수 있다.
         */
        public PopupService()
        {
            _popupPolicyService =
                new PopupPolicyService(
                    PopupStorageService.Instance);
        }

        /*
         * 팝업 목록을 검사하고 변환한다.
         *
         * 표시 가능한 DTO만 PopupOptions로 변환하여
         * 결과 목록에 추가한다.
         */
        public List<PopupOptions> CreatePopupOptions(
            IEnumerable<PopupResponseDto> popupDtos)
        {
            /*
             * 정책 검사를 통과한 팝업의
             * PopupOptions를 저장할 결과 목록
             */
            List<PopupOptions> popupOptions =
                new();

            foreach (PopupResponseDto popupDto
                     in popupDtos)
            {
                /*
                 * 현재 팝업을 표시할 수 있는지 검사한다.
                 *
                 * false가 되는 경우:
                 *
                 * - 아직 노출 시작 일시가 되지 않음
                 * - 노출 종료 일시가 이미 지남
                 * - 사용자가 해당 PopupId를 숨김 처리함
                 *
                 * 표시할 수 없는 팝업은 PopupOptions로 만들지 않고
                 * 다음 DTO 검사로 넘어간다.
                 */
                if (!_popupPolicyService.CanShow(
                        popupDto))
                {
                    continue;
                }

                /*
                 * 정책 검사를 통과한 팝업만
                 * PopupFactory에서 실제 화면과
                 * PopupOptions로 변환한다.
                 */
                popupOptions.Add(
                    PopupFactory.Create(
                        popupDto));
            }

            /*
             * 최종적으로 화면에 표시 가능한
             * PopupOptions 목록을 반환한다.
             */
            return popupOptions;
        }
    }
}