using Popup.Dtos;
using Popup.Models;
using Popup.Managers;
using Popup.Services;
using Popup.Services.Auth;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace Popup
{
    /*
     * 관리 화면 창. 팝업 조회·표시 흐름의 진입점이다.
     *
     * [기준 2·4·6 — 이 파일에서 바뀐 것]
     *   - appsettings의 UserId를 제거했다. 사용자는 서버가 인증 헤더로 식별한다.
     *     인증 헤더는 IAuthHeaderProvider(확장 지점)가 공급하고, 통합 토큰 필터 적용 전 개발 단계에서는
     *     DevUserId를 X-Dev-User-Id 헤더로 보낸다.
     *   - /statuses 조회와 클라이언트 완료 필터, PopupPolicyService(기간·숨김 로컬 판단)를 제거했다.
     *     서버 단건 조회(POST /p/api/wpf/popups, 설계 35)가 표시할 1건을 정한다.
     *   - 팝업 결과는 PopupResultQueue에 저장한 뒤 팝업이 닫힐 때마다(OnPopupFinished) 전송한다. 시작·조회 직전에 미전송 큐를 먼저 보낸다.
     *   - 조회 주기는 서버 응답 pollingIntervalSeconds가 우선한다(30~60분). [설계 35] 팝업 표시 중에는 조회하지 않고,
     *     창이 닫혀 결과를 보낸 뒤 nextStatus에 따라 다음 조회를 이어 간다.
     *
     * [설계 10 — SSO·토큰 프로토타입]
     *   - Auth.Mode=SsoPrototype 이면 SsoAuthHeaderProvider(사내 SSO Negotiate → 서버 로그인 API → 메모리 토큰)를 쓴다.
     *     토큰 갱신은 서버 401(PopupApiService 재시도)과 정기 주기(Auth.PeriodicLoginMinutes, 기본 60분)로만 일어난다.
     *     창이 닫힐 때(앱 종료) 정기 루프를 멈추고 메모리 토큰을 지운다.
     */
    public partial class MainWindow : Window
    {
        private readonly PopupManager _popupManager;
        private readonly PopupService _popupService;
        private readonly PopupApiService? _popupApiService;
        private readonly PopupResultQueue? _resultQueue;
        /* [설계 10] SsoPrototype 모드의 인증 공급자. 정기 재로그인 루프 정지·토큰 폐기를 위해 보관한다(다른 모드는 null). */
        private readonly SsoAuthHeaderProvider? _ssoAuthHeaderProvider;
        private readonly bool _demoMode;
        private readonly bool _autoLoadOnStartup;
        private readonly DispatcherTimer _pollingTimer;
        private bool _isClosed;
        private int _pollingIntervalSeconds;
        private bool _isLoadingPopups;
        private readonly PopupPollingRecovery _pollingRecovery = new();
        private TimeSpan? _nextRecoveryDelay;

        /*
         * [설계 35] 단건 순차 표시: 지금 화면에 서버 팝업 1건이 떠 있으면 true. 표시 중에는 주기·수동 조회를 하지 않고
         * (중복 조회·표시 방지), 창이 닫혀 결과가 처리된 뒤 nextStatus에 따라 다음 조회를 이어 간다.
         * 이전의 실행 중 표시 ID 기억(_shownPopupIds)은 서버가 완료·재노출 유예로 판단하므로 삭제했다.
         */
        private bool _popupShowing;

        /* App.xaml.cs가 시작 시 관리 화면을 숨길지 판단할 때 사용한다. Demo Mode에서는 선택 화면을 계속 표시한다. */
        public bool IsDemoMode => _demoMode;

        /* [Demo SSO·로그인 테스트] DemoMode이고 DemoSsoLoginTest=true일 때만 설정을 넘긴다(그 밖에는 null → 버튼 숨김). */
        public PopupClientSettings? DemoAuthTestSettings { get; }

        public MainWindow()
        {
            InitializeComponent();

            _popupManager = new PopupManager(this);
            _popupService = new PopupService();

            PopupClientSettings settings = LoadPopupClientSettings();
            _demoMode = settings.DemoMode;
            DemoAuthTestSettings = settings.DemoMode && settings.DemoSsoLoginTest ? settings : null;
            _autoLoadOnStartup = settings.AutoLoadOnStartup;
            _pollingIntervalSeconds = settings.PollingIntervalSeconds;

            _pollingTimer = new DispatcherTimer();
            _pollingTimer.Tick += PollingTimer_Tick;

            if (!_demoMode)
            {
                /*
                 * [기준 6] 인증 헤더 공급자 선택. PopupApiService는 헤더 값만 받는다.
                 *   None         : 헤더 없음(서버 dev-user-header 모드에서는 X-Dev-User-Id 로 사용자 지정)
                 *   Static       : appsettings 고정 문자열
                 *   SsoPrototype : [설계 10] 사내 SSO(Windows 통합 인증) → 서버 프로토타입 로그인 → 메모리 토큰, 401 시 재로그인
                 * 통합 토큰(타 팀) 규격이 확정되면 여기에 구현체를 하나 더 고르면 된다.
                 */
                IAuthHeaderProvider authHeaderProvider;
                switch (settings.AuthMode.Trim().ToUpperInvariant())
                {
                    case "SSOPROTOTYPE":
                        _ssoAuthHeaderProvider = new SsoAuthHeaderProvider(
                            new SsoClient(settings.AuthSsoUrl),
                            new WpfLoginClient(settings.BaseUrl, settings.AuthLoginPath));
                        // [설계 10 §4.2] 1시간(설정값) 주기 선제 재로그인. 0 이하이면 401 기반 재로그인만 사용.
                        _ssoAuthHeaderProvider.ClientVersionRejected += (_, exception) => HandleClientVersionRejected(exception);
                        _ssoAuthHeaderProvider.StartPeriodicLogin(TimeSpan.FromMinutes(settings.AuthPeriodicLoginMinutes));
                        authHeaderProvider = _ssoAuthHeaderProvider;
                        break;
                    case "STATIC":
                        authHeaderProvider = new StaticAuthHeaderProvider(settings.AuthStaticHeader);
                        break;
                    default:
                        authHeaderProvider = new NoAuthHeaderProvider();
                        break;
                }

                _popupApiService = new PopupApiService(
                    settings.BaseUrl,
                    authHeaderProvider,
                    ResolveDevUserId(settings.DevUserId));
                // [설계 13 §11] 결과 전송의 426은 FlushAsync가 예외로 전파하고 LoadAndShowAvailablePopupsAsync가 처리한다.
                _resultQueue = new PopupResultQueue(_popupApiService);
            }
            else
            {
                Title = "Popup 관리 화면 - Demo Mode";
            }

            Loaded += MainWindow_Loaded;
        }

        /*
         * appsettings.json을 읽는다. EXE 옆 파일이 있으면 그것을, 없으면 내장 리소스를 사용한다.
         *
         * {
         *   "PopupApi": {
         *     "DemoMode": false,
         *     "DemoSsoLoginTest": false,
         *     "BaseUrl": "http://localhost:8080/zero-rule-server/p",
         *     "AutoLoadOnStartup": true,
         *     "PollingIntervalSeconds": 1800,
         *     "Auth": { "Mode": "None", "StaticHeader": "",
         *               "SsoUrl": "https://SSO_URL/encriptloginprocess.aspx", "LoginPath": "/api/wpf/auth/login", "PeriodicLoginMinutes": 60 },
         *     "DevUserId": ""
         *   }
         * }
         * Auth.SsoUrl·LoginPath·PeriodicLoginMinutes 는 Mode=SsoPrototype(설계 10)에서만 쓴다.
         */
        private static PopupClientSettings LoadPopupClientSettings()
        {
            string configurationFilePath = Path.Combine(AppContext.BaseDirectory, "appsettings.json");
            string configurationJson;
            if (File.Exists(configurationFilePath))
            {
                configurationJson = File.ReadAllText(configurationFilePath);
            }
            else
            {
                using Stream configurationStream =
                    typeof(MainWindow).Assembly.GetManifestResourceStream("Popup.appsettings.json")
                    ?? throw new InvalidOperationException("내장 appsettings.json을 찾을 수 없습니다.");
                using StreamReader reader = new(configurationStream);
                configurationJson = reader.ReadToEnd();
            }

            using JsonDocument document = JsonDocument.Parse(configurationJson);
            if (!document.RootElement.TryGetProperty("PopupApi", out JsonElement api))
            {
                throw new InvalidOperationException("appsettings.json에 PopupApi 설정이 없습니다.");
            }

            // [Demo Mode] appsettings의 DemoMode 외에 실행 인자 --demo 로도 켤 수 있다.
            // 배포한 exe를 설정 파일 수정 없이 시연할 때 쓴다: Popup.exe --demo
            bool demoByArgument = Environment.GetCommandLineArgs().Skip(1)
                .Any(argument => argument.Equals("--demo", StringComparison.OrdinalIgnoreCase));

            PopupClientSettings settings = new()
            {
                DemoMode = demoByArgument || GetBoolean(api, "DemoMode", false),
                DemoSsoLoginTest = GetBoolean(api, "DemoSsoLoginTest", false),
                BaseUrl = GetString(api, "BaseUrl").Trim(),
                AutoLoadOnStartup = GetBoolean(api, "AutoLoadOnStartup", true),
                PollingIntervalSeconds = Math.Clamp(GetInt32(api, "PollingIntervalSeconds", 1800), 1800, 3600),
                DevUserId = GetString(api, "DevUserId").Trim()
            };

            if (api.TryGetProperty("Auth", out JsonElement auth) && auth.ValueKind == JsonValueKind.Object)
            {
                settings.AuthMode = GetString(auth, "Mode", "None").Trim();
                settings.AuthStaticHeader = GetString(auth, "StaticHeader").Trim();
                settings.AuthSsoUrl = GetString(auth, "SsoUrl").Trim();
                settings.AuthLoginPath = GetString(auth, "LoginPath", "/api/wpf/auth/login").Trim();
                settings.AuthPeriodicLoginMinutes = GetInt32(auth, "PeriodicLoginMinutes", 60);
            }

            if (!settings.DemoMode && string.IsNullOrWhiteSpace(settings.BaseUrl))
            {
                throw new InvalidOperationException("PopupApi.BaseUrl 값이 비어 있습니다.");
            }
            if (!settings.DemoMode && settings.AuthMode.Equals("SsoPrototype", StringComparison.OrdinalIgnoreCase)
                && string.IsNullOrWhiteSpace(settings.AuthSsoUrl))
            {
                throw new InvalidOperationException("PopupApi.Auth.Mode=SsoPrototype 에는 Auth.SsoUrl 값이 필요합니다.");
            }
            return settings;
        }

        private static string GetString(JsonElement element, string name, string defaultValue = "")
            => element.TryGetProperty(name, out JsonElement value) && value.ValueKind == JsonValueKind.String
                ? value.GetString() ?? defaultValue
                : defaultValue;

        private static bool GetBoolean(JsonElement element, string name, bool defaultValue)
            => element.TryGetProperty(name, out JsonElement value)
               && (value.ValueKind == JsonValueKind.True || value.ValueKind == JsonValueKind.False)
                ? value.GetBoolean()
                : defaultValue;

        private static int GetInt32(JsonElement element, string name, int defaultValue)
            => element.TryGetProperty(name, out JsonElement value) && value.TryGetInt32(out int result)
                ? result
                : defaultValue;

        /*
         * [개발 전용] X-Dev-User-Id 헤더로 보낼 사번. 1순위 환경변수 POPUP_DEV_USER_ID, 2순위 appsettings DevUserId.
         * 둘 다 없으면 null → 헤더를 보내지 않는다(운영: 통합 토큰 필터가 사용자를 식별).
         * 예전의 POPUP_USER_ID / PopupApi.UserId(요청 파라미터용)는 더 이상 읽지 않는다.
         */
        private static string? ResolveDevUserId(string configuredDevUserId)
        {
            string? fromEnvironment = Environment.GetEnvironmentVariable("POPUP_DEV_USER_ID");
            if (!string.IsNullOrWhiteSpace(fromEnvironment)) return fromEnvironment.Trim();
            return string.IsNullOrWhiteSpace(configuredDevUserId) ? null : configuredDevUserId.Trim();
        }

        /*
         * [설계 10] 앱 종료(트레이 종료 → Close)에서 정기 재로그인 루프를 멈추고 메모리 토큰을 지운다.
         * API 모드의 X 버튼은 App.MainWindow_Closing이 취소하고 트레이로 숨기므로 여기까지 오지 않는다.
         */
        protected override void OnClosed(EventArgs e)
        {
            _isClosed = true;
            StopServerRequests();
            base.OnClosed(e);
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            /*
             * [실행 순서 2/6]
             * App.xaml.cs에서 MainWindow.Show()가 호출되면 여기로 들어온다.
             *
             * API 모드의 실제 자동 실행 흐름:
             *   LoadAndShowAvailablePopupsAsync()
             *     → PopupResultQueue.FlushAsync()
             *     → PopupApiService.GetNextPopupAsync()   (팝업 1건 또는 null)
             *     → PopupService.CreatePopupOptions()
             *     → PopupManager.Show()                  (1건 표시)
             *     → 창 닫힘 → 결과 1건 전송 → nextStatus AVAILABLE이면 즉시 다음 조회, EMPTY면 조회 간격 대기
             *
             * 즉 이 메서드부터 "서버에서 팝업을 받아 실제 화면에 띄우는" 작업이 시작된다.
             */
            Loaded -= MainWindow_Loaded;
            if (_demoMode) return;

            StartPeriodicPolling();
            if (_autoLoadOnStartup)
            {
                await LoadAndShowAvailablePopupsAsync(showEmptyMessage: false, showErrorMessage: true);
            }
        }

        /* 다음 조회 하나만 예약하는 30~60분 타이머(복구 중이면 복구 간격). 인증 재시도는 별도 타이머를 만들지 않는다. */
        private void StartPeriodicPolling()
        {
            if (_demoMode || _clientVersionRejected || _isClosed)
            {
                _pollingTimer.Stop();
                return;
            }
            _pollingTimer.Stop();
            _pollingTimer.Interval = _nextRecoveryDelay ?? GetPollingDelay(_pollingIntervalSeconds);
            _pollingTimer.Start();
        }

        // [설계 35] 빈 조회·EMPTY 이후 가장 최근 조회 간격만큼 기다린다(30~60분으로 제한).
        private static TimeSpan GetPollingDelay(int intervalSeconds)
        {
            return PopupPollingRecovery.NormalDelay(intervalSeconds);
        }

        /*
         * [기준 4] 서버가 응답으로 내려준 조회 간격을 적용한다. 서버 값이 있으면 appsettings 값보다 우선한다.
         */
        private void ApplyPollingInterval(int serverIntervalSeconds)
        {
            if (serverIntervalSeconds <= 0) return; // 선택 필드 누락 시 범위 제한된 로컬 fallback 유지
            serverIntervalSeconds = Math.Clamp(serverIntervalSeconds, 1800, 3600);
            if (serverIntervalSeconds == _pollingIntervalSeconds) return;
            _pollingIntervalSeconds = serverIntervalSeconds;
        }

        /* 정상/복구 타이머를 일회성으로 사용한다. 조회 종료 후 다음 요청 하나만 예약한다. */
        private async void PollingTimer_Tick(object? sender, EventArgs e)
        {
            _pollingTimer.Stop();
            await LoadAndShowAvailablePopupsAsync(showEmptyMessage: false, showErrorMessage: false);
        }

        /*
         * [설계 13 §8·§10·§11] 서버 426(클라이언트 버전 미지원) 처리 — 조회·로그인·결과 전송 공통.
         *   - 401 재로그인 경로에 들어가지 않는다(WpfClientVersionException은 별도 타입).
         *   - 같은 API를 무한 재시도하지 않도록 주기 조회 타이머를 멈춘다(프로그램을 업데이트 후 다시 실행해야 한다).
         *   - pending 결과는 PopupResultQueue가 지우지 않았으므로 새 버전에서 재전송된다.
         *   - 안내는 프로세스당 1회만 띄우고 안내를 닫으면 Agent를 정상 종료한다.
         * 백그라운드 스레드에서 올 수 있으므로 Dispatcher로 UI 스레드에서 실행한다.
         */
        private bool _clientVersionRejected;

        private void HandleClientVersionRejected(WpfClientVersionException exception)
        {
            if (!Dispatcher.CheckAccess())
            {
                Dispatcher.BeginInvoke(() => HandleClientVersionRejected(exception));
                return;
            }
            if (_clientVersionRejected || _isClosed) return;
            _clientVersionRejected = true; // 모달의 중첩 메시지 루프에 들어가기 전에 차단한다.
            StopServerRequests();
            MessageBox.Show(exception.UserMessage, "프로그램 업데이트 필요",
                MessageBoxButton.OK, MessageBoxImage.Warning);
            // 트레이 숨김 경로 대신 기존 정상 종료 경로로 창·아이콘·Mutex를 정리한다.
            if (Application.Current is App app) app.ExitAgent();
        }

        private void StopServerRequests()
        {
            _pollingTimer.Stop();
            _resultQueue?.StopTransmission(); // 로컬 Enqueue는 계속 허용해 결과 저장을 보존한다.
            _popupApiService?.StopRequests();
            _ssoAuthHeaderProvider?.Dispose();
        }

        private async void OpenPopupButton_Click(object sender, RoutedEventArgs e)
        {
            await RefreshPopupsAsync();
        }

        /*
         * [설계 10 — 로그인 테스트] 팝업 조회와 무관하게 "SSO GET → XML(MAIN_USER_ID·MAIN_USER_CLASSI_CODE) 파싱 → 로그인 API → 토큰"
         * 까지만 수행하고 단계별 결과를 보여준다. 실제 사내 SSO 또는 임시 SSO 프로그램(popup-frameWork/MockSso)에 붙여
         * 로그인 흐름을 눈으로 확인하는 용도. 성공하면 얻은 토큰이 현재 토큰으로 교체된다(이후 조회에 사용).
         */
        private async void SsoLoginTestButton_Click(object sender, RoutedEventArgs e)
        {
            if (_isClosed || _clientVersionRejected) return;
            if (_ssoAuthHeaderProvider == null)
            {
                MessageBox.Show("appsettings.json 의 PopupApi.Auth.Mode 가 SsoPrototype 이 아니거나 Demo Mode 입니다.",
                    "SSO 로그인 테스트", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }

            SsoLoginTestButton.IsEnabled = false;
            try
            {
                SsoLoginTestResult result = await _ssoAuthHeaderProvider.TestLoginAsync();
                MessageBox.Show(
                    "1. SSO GET (Windows 통합 인증)\n" +
                    $"   {result.SsoUrl}\n" +
                    $"   MAIN_USER_ID = {result.User.LogonId}\n" +
                    $"   MAIN_USER_CLASSI_CODE = {result.User.ClassCode}\n" +
                    $"   {result.SsoElapsedMs} ms\n\n" +
                    "2. 로그인 API\n" +
                    $"   POST {result.LoginUrl}\n" +
                    $"   {{ logonId: {result.User.LogonId}, classCode: {result.User.ClassCode}, linkYn: N }}\n" +
                    $"   tokenType = {result.TokenType}, 토큰 {result.TokenLength}자 (메모리 보관)\n" +
                    $"   expiresAt = {result.ExpiresAt:yyyy-MM-dd HH:mm:ss zzz}\n" +
                    $"   {result.LoginElapsedMs} ms",
                    "SSO 로그인 테스트 — 성공", MessageBoxButton.OK, MessageBoxImage.Information);
            }
            catch (WpfClientVersionException exception)
            {
                HandleClientVersionRejected(exception);
            }
            catch (OperationCanceledException) when (_isClosed || _clientVersionRejected) { }
            catch (Exception exception)
            {
                // 어느 단계 실패인지 메시지로 구분: "SSO 호출 실패"(HTTP) / "SSO 응답에 ... 태그"(XML) / "WPF 로그인 API 실패"(서버)
                MessageBox.Show(exception.GetType().Name + "\n\n" + exception.Message,
                    "SSO 로그인 테스트 — 실패", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
            finally
            {
                SsoLoginTestButton.IsEnabled = true;
            }
        }

        /* 관리 화면의 버튼과 App의 트레이 메뉴가 함께 사용하는 공개 팝업 재조회 메서드다. */
        public async Task RefreshPopupsAsync()
        {
            await LoadAndShowAvailablePopupsAsync(showEmptyMessage: true, showErrorMessage: true);
        }

        /*
         * [설계 35] 자동 실행·수동 버튼·주기 조회가 함께 사용하는 단건 조회 메서드다.
         *
         * 순서:
         *  1. 미전송 결과 전송(순서대로 1건씩). 미종결 결과가 남거나 큐 파일을 읽을 수 없으면 조회하지 않고 복구 간격 뒤
         *     다시 시도한다 — 미전송 결과를 건너뛰고 다음 팝업으로 가지 않는다(임시 기준, 설계 35 §4·39-1).
         *     이번에 저장한 결과의 nextStatus가 EMPTY면 조회하지 않고 조회 간격을 기다린다(설계 39-2 — 닫힘 직후·복구 재전송 공통).
         *  2. POST /p/api/wpf/popups — 서버가 판정·정렬한 팝업 최대 1건(deliveryId 포함). 최신 조회 간격 적용.
         *  3. popup=null이면 조회 간격 뒤 다시 조회. 있으면 1건을 표시하고, 표시 중에는 다른 조회를 하지 않는다.
         *  4. 창이 닫히면 OnPopupFinished가 결과를 보내고 nextStatus로 다음 단계를 정한다.
         */
        private async Task LoadAndShowAvailablePopupsAsync(bool showEmptyMessage, bool showErrorMessage)
        {
            if (_popupApiService == null || _resultQueue == null)
            {
                throw new InvalidOperationException("API 모드의 PopupApiService가 생성되지 않았습니다.");
            }
            if (_isLoadingPopups || _isClosed || _clientVersionRejected) return;
            if (_popupShowing)
            {
                // 표시 중 팝업 1건을 유지한다. 닫히면 다음 조회가 이어진다.
                if (showEmptyMessage)
                {
                    MessageBox.Show("표시 중인 팝업을 먼저 확인해 주세요.", "팝업 조회",
                        MessageBoxButton.OK, MessageBoxImage.Information);
                }
                return;
            }

            _isLoadingPopups = true;
            _pollingTimer.Stop();
            bool shown = false;
            try
            {
                ResultFlushOutcome flushed = await _resultQueue.FlushAsync();
                if (_isClosed || _clientVersionRejected) return;
                if (!flushed.Blocked && string.Equals(flushed.LastSaved?.NextStatus, "EMPTY", StringComparison.OrdinalIgnoreCase))
                {
                    // [설계 39-2] 방금 저장한 결과(닫힘 직후·복구 재전송 모두)가 EMPTY면 조회하지 않고 최신 조회 간격을 기다린다.
                    // 저장한 결과가 없는 정상 최초 조회·빈 큐는 그대로 조회한다.
                    _pollingRecovery.Reset();
                    _nextRecoveryDelay = null;
                    if (showEmptyMessage)
                    {
                        MessageBox.Show("현재 표시할 팝업이 없습니다.", "팝업 조회",
                            MessageBoxButton.OK, MessageBoxImage.Information);
                    }
                    return;
                }
                if (flushed.Blocked)
                {
                    _nextRecoveryDelay = _pollingRecovery.NextDelay();
                    System.Diagnostics.Debug.WriteLine($"[POLLING] 미전송 결과 우선 — 조회 보류, {_nextRecoveryDelay.Value.TotalSeconds}초 뒤 재시도");
                    if (showErrorMessage)
                    {
                        MessageBox.Show("이전 팝업 처리 결과를 서버에 보내지 못해 새 팝업을 조회하지 않았습니다.\n잠시 후 다시 시도합니다.",
                            "팝업 조회", MessageBoxButton.OK, MessageBoxImage.Warning);
                    }
                    return;
                }

                WpfNextPopupResponseDto response = await _popupApiService.GetNextPopupAsync();
                if (_isClosed || _clientVersionRejected) return;
                ApplyPollingInterval(response.PollingIntervalSeconds);
                _pollingRecovery.Reset();
                _nextRecoveryDelay = null;

                if (response.Popup == null)
                {
                    if (showEmptyMessage)
                    {
                        MessageBox.Show("현재 표시할 팝업이 없습니다.", "팝업 조회",
                            MessageBoxButton.OK, MessageBoxImage.Information);
                    }
                    return;
                }

                PopupOptions popupOptions = _popupService.CreatePopupOptions(new List<PopupResponseDto> { response.Popup }).Single();
                /*
                 * [기준 3·4] PopupWindow·View는 서버를 모른다. 창이 닫힐 때 만들어지는 결과 항목을 큐로 넘기는 훅만 연결한다.
                 * [설계 12·35] 결과: 로컬 큐 저장(Enqueue) → 창 닫기 → OnPopupFinished(전송 후 nextStatus에 따라 다음 조회).
                 */
                popupOptions.EnqueueResult = _resultQueue.Enqueue;
                popupOptions.RetainResultForExit = _resultQueue.RetainForExit;
                popupOptions.FlushResultsInBackground = OnPopupFinished;
                _popupShowing = true;
                shown = true;
                _popupManager.Show(popupOptions);
            }
            catch (OperationCanceledException) when (_isClosed || _clientVersionRejected)
            {
                // 종료/426 취소는 Timeout으로 오인해 복구 예약하지 않는다.
            }
            catch (WpfClientVersionException exception)
            {
                HandleClientVersionRejected(exception);
            }
            catch (Exception exception)
            {
                if (shown) _popupShowing = false;
                if (_isClosed || _clientVersionRejected) return;
                if (PopupPollingRecovery.IsTransient(exception))
                {
                    _nextRecoveryDelay = _pollingRecovery.NextDelay();
                    System.Diagnostics.Debug.WriteLine($"[POLLING] 복구 조회 예약: {_nextRecoveryDelay.Value.TotalSeconds}초, {exception.Message}");
                }
                else
                {
                    // 400/401(1회 재인증 후에도 실패)/403 및 데이터 오류는 복구 루프에서 제외한다.
                    _pollingRecovery.Reset();
                    _nextRecoveryDelay = null;
                }
                if (showErrorMessage)
                {
                    MessageBox.Show("팝업 조회에 실패했습니다.\n\n" + exception.Message,
                        "팝업 조회 오류", MessageBoxButton.OK, MessageBoxImage.Warning);
                }
            }
            finally
            {
                _isLoadingPopups = false;
                // 표시 중에는 타이머를 걸지 않는다. 닫힌 뒤 OnPopupFinished가 다음 단계를 정한다.
                if (!_popupShowing) StartPeriodicPolling();
            }
        }

        /*
         * [설계 35] 표시한 팝업 창이 닫히면(결과는 이미 큐에 저장됨) 결과를 보내고 nextStatus로 다음 단계를 정한다.
         *   - 미종결 결과가 남음(전송 실패 등) → 조회하지 않고 복구 간격 뒤 재시도
         *   - EMPTY → 가장 최근 조회 간격만큼 대기
         *   - AVAILABLE, 또는 확인 불가(후보 확인 실패·이번 저장 결과 없음) → 즉시 조회.
         *     후보가 그사이 게시 중단·만료되어도 조회 응답 popup=null을 정상 처리한다.
         * 거절(REJECTED)된 결과는 종결이므로 다음 조회를 막지 않는다.
         */
        private async void OnPopupFinished()
        {
            _popupShowing = false;
            if (_isClosed || _clientVersionRejected || _resultQueue == null || _isLoadingPopups) return;
            // [설계 39-2] 결과 전송·nextStatus 판단은 복구 재전송과 같은 경로(LoadAndShowAvailablePopupsAsync)에서 한다.
            await LoadAndShowAvailablePopupsAsync(showEmptyMessage: false, showErrorMessage: false);
        }    }
}
