namespace Popup.Models
{
    /// <summary>
    /// appsettings.json에서 읽은 WPF 팝업 클라이언트 설정이다.
    ///
    /// [기준 6] 예전의 UserId(요청에 실어 보내던 사용자 ID)는 제거했다. 사용자는 서버가 인증 헤더로 식별한다.
    /// 인증 헤더 공급 방식은 Auth.Mode로 고르고, 통합 토큰 필터 적용 전 개발 단계에서는 DevUserId를
    /// X-Dev-User-Id 헤더로 보내 서버 개발 프로파일에서만 사용자를 지정한다.
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

        public bool AutoLoadOnStartup { get; set; } =
            true;

        /// <summary>
        /// 주기 조회 간격(초). 서버 목록 응답의 pollingIntervalSeconds가 있으면 그 값이 우선한다.
        /// [기준 4] 기본값을 300초에서 1800초로 늘렸다. 0이면 주기 조회를 끈다.
        /// </summary>
        public int PollingIntervalSeconds { get; set; } =
            1800;

        /// <summary>인증 헤더 공급 방식. None | Static. (향후 Sso)</summary>
        public string AuthMode { get; set; } =
            "None";

        /// <summary>AuthMode=Static일 때 Authorization 헤더에 그대로 넣을 문자열("Bearer ..."). 운영 배포 시 비움.</summary>
        public string AuthStaticHeader { get; set; } =
            string.Empty;

        /// <summary>
        /// 개발 전용. 서버 custom.wpf-popup.dev-user-header=true일 때만 의미가 있는 사번.
        /// 환경변수 POPUP_DEV_USER_ID가 있으면 그 값이 우선한다. 비어 있으면 헤더를 보내지 않는다.
        /// </summary>
        public string DevUserId { get; set; } =
            string.Empty;
    }
}
