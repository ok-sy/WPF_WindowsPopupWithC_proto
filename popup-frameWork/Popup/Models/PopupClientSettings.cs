namespace Popup.Models
{
    /// <summary>
    /// appsettings.json에서 읽은 WPF 팝업 클라이언트 설정이다.
    /// </summary>
    public class PopupClientSettings
    {
        /*
         * true이면 Java API를 전혀 호출하지 않고
         * WPF 내부의 시연용 샘플 데이터만 사용한다.
         */
        public bool DemoMode { get; set; }

        public string BaseUrl { get; set; } =
            string.Empty;

        public string UserId { get; set; } =
            string.Empty;

        public bool AutoLoadOnStartup { get; set; } =
            true;

        public int PollingIntervalSeconds { get; set; } =
            300;
    }
}
