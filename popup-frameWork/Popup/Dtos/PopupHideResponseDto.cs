using System;

namespace Popup.Dtos
{
    /*
     * Java 서버가 숨김 저장을 완료한 뒤
     * 반환하는 응답을 담는 DTO다.
     */
    public class PopupHideResponseDto
    {
        /*
         * 숨김 처리가 적용된 사용자 ID다.
         */
        public string UserId { get; set; } =
            string.Empty;

        /*
         * 숨김 처리가 적용된 팝업 ID다.
         */
        public string PopupId { get; set; } =
            string.Empty;

        /*
         * 숨김 종류다.
         *
         * 현재 서버에서는 기간 숨김을 뜻하는
         * UNTIL 값이 반환된다.
         */
        public string HideType { get; set; } =
            string.Empty;

        /*
         * 실제 숨김 종료 일시다.
         *
         * Oracle의 HIDDEN_UNTIL 값이
         * Java 서버를 거쳐 전달된다.
         */
        public DateTimeOffset HiddenUntil { get; set; }
    }
}