namespace Popup.Dtos
{
    /*
     * "30일간 보지 않기" 요청을
     * Java 서버로 전송할 때 사용하는 DTO다.
     *
     * Java의 PopupHideRequestDto와
     * 같은 구조를 사용한다.
     */
    public class PopupHideRequestDto
    {
        /*
         * 팝업을 숨길 사용자 ID다.
         *
         * 현재는 WPF_TEST_USER를 사용하고
         * 나중에는 로그인 사용자나 사번으로 교체한다.
         */
        public string UserId { get; set; } =
            string.Empty;

        /*
         * 팝업을 숨길 일수다.
         *
         * 30을 전달하면
         * 현재 시점부터 30일 동안 숨긴다.
         */
        public int HideDays { get; set; } =
            30;
    }
}