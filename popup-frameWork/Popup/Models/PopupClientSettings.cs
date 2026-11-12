namespace Popup.Models
{
    /// <summary>
    /// POL-15-02 : 인증·버전
    /// ■ appsettings.json에서 읽은 WPF 팝업 클라이언트 설정이다.
    ///
    /// 요청에 사용자 ID(UserId)를 싣지 않는다. 사용자는 서버가 인증 헤더로 식별한다.
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

        /*
         * POL-14-02 : Demo 모드
         * [Demo SSO·로그인 테스트] DemoMode에서 Demo 화면에 "SSO 테스트"(Auth.SsoUrl GET → 사번·구분 코드)와
         * "로그인 테스트"(BaseUrl+Auth.LoginPath POST, 입력한 사번·구분 코드) 버튼을 따로 표시한다.
         * 팝업 조회·결과 전송은 하지 않고 토큰도 보관하지 않는다. Auth.Mode와 무관하며 DemoMode=false에서는 쓰지 않는다.
         */
        public bool DemoSsoLoginTest { get; set; }

        /*
         * POL-14-02 : Demo 모드
         * 실행 인자 -Demo -Api일 때 true(API Demo). Demo 화면에서 BaseUrl·인증·요청 JSON을 입력해 실제 API를 수동 호출한다.
         * appsettings 항목이 아니라 실행 인자로만 켠다. DemoMode가 false이면 항상 false.
         */
        public bool DemoApi { get; set; }

        /* POL-09-01 : 3 API 순서 — BaseUrl은 서버 주소(컨텍스트 경로까지, /p 제외). API 경로 /p/api/wpf/... 를 뒤에 붙인다. */
        public string BaseUrl { get; set; } =
            string.Empty;

        /* 시작 시 자동 조회 여부. 기본 true */
        public bool AutoLoadOnStartup { get; set; } =
            true;

        /// <summary>SURVEY·QUIZ 문항 디자인 버전(V1·V2, 기본 최신). Views/Contents/SurveyDesign.cs 참고.</summary>
        public string SurveyDesignVersion { get; set; } =
            Popup.Views.Contents.SurveyDesign.Latest;

        /// <summary>
        /// POL-09-02 : 조회 응답
        /// 주기 조회 간격(초). 서버 단건 조회 응답의 pollingIntervalSeconds가 있으면 그 값이 우선한다.
        /// 서버 값과 로컬 fallback 모두 1800~3600초로 제한한다.
        /// </summary>
        public int PollingIntervalSeconds { get; set; } =
            1800;

        /// <summary>POL-15-02 : 인증·버전 — 인증 헤더 공급 방식. None | Static | SsoPrototype(MockSSO 프로토타입).</summary>
        public string AuthMode { get; set; } =
            "None";

        /// <summary>AuthMode=Static일 때 Authorization 헤더에 그대로 넣을 문자열("Bearer ..."). 운영 배포 시 비움.</summary>
        public string AuthStaticHeader { get; set; } =
            string.Empty;

        /*
         * POL-15-02 : 인증·버전
         * [AuthMode=SsoPrototype 전용 설정]
         *   SsoUrl               : 사내 SSO 주소. Windows 통합 인증(Negotiate)으로 GET 하면 MAIN_USER_ID·MAIN_USER_CLASSI_CODE가 담긴 XML을 준다.
         *   LoginPath            : BaseUrl 뒤에 붙는 서버 프로토타입 로그인 API 경로(기본 /p/api/wpf/auth/login).
         *   PeriodicLoginMinutes : 정기 재로그인 주기(분, 기본 60). 0 이하이면 정기 재로그인을 끄고 401 기반 재로그인만 쓴다.
         * 토큰은 파일·Registry·appsettings 어디에도 저장하지 않고 SsoAuthHeaderProvider 메모리에만 둔다.
         */
        public string AuthSsoUrl { get; set; } =
            string.Empty;

        public string AuthLoginPath { get; set; } =
            "/p/api/wpf/auth/login";

        public int AuthPeriodicLoginMinutes { get; set; } =
            60;

        /*
         * POL-14-02 : Demo 모드
         * [API Demo 연결 대상] appsettings PopupApi.DemoApiTargets.Local·Dev. API Demo 화면의 "로컬 서버 사용" 체크박스가
         * Base URL·로그인 경로 입력칸을 이 값으로 채운다(체크 = Local, 해제 = Dev). 입력칸은 그대로 직접 고칠 수 있다.
         * 일반 실행·인메모리 Demo에서는 쓰지 않는다. Dev.BaseUrl은 환경마다 넣는 값이라 기본값이 없다.
         */
        public string DemoLocalBaseUrl { get; set; } =
            "http://localhost:8080/zero-rule-server";

        public string DemoLocalLoginPath { get; set; } =
            "/p/api/wpf/auth/login";

        public string DemoDevBaseUrl { get; set; } =
            string.Empty;

        public string DemoDevLoginPath { get; set; } =
            "/p/api/auth/sso/login";

        /// <summary>
        /// 개발 전용. 서버 custom.wpf-popup.dev-user-header=true일 때만 의미가 있는 사번.
        /// 환경변수 POPUP_DEV_USER_ID가 있으면 그 값이 우선한다. 비어 있으면 헤더를 보내지 않는다.
        /// </summary>
        public string DevUserId { get; set; } =
            string.Empty;

        /*
         * POL-15 : 배포·실행 환경 — appsettings 최상위 "Startup" 항목(선택). null = 설정 없음(환경변수·기본값 사용).
         * 우선순위: 명령행(--tray) > 환경변수(WPF_POPUP_TRAY_ENABLED·WPF_POPUP_AUTOSTART_ENABLED) > appsettings > 기본값. StartupOptions.Resolve 참고.
         */
        /// <summary>Startup.TrayEnabled — 트레이 아이콘 표시(기본 false). Demo 모드는 항상 표시.</summary>
        public bool? TrayEnabled { get; set; }

        /// <summary>Startup.AutostartEnabled — 사용자 세션 첫 실행 시 로그인 자동 시작 1회 등록(기본 true). false면 이 앱 등록 값 삭제.</summary>
        public bool? AutostartEnabled { get; set; }
    }
}
