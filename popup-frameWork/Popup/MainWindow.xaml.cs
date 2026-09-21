using Popup.Dtos;
using Popup.Models;
using Popup.Managers;
using Popup.Services;
using Popup.Services.Auth;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
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
     *     서버 목록(GET /p/api/wpf/popups)이 곧 표시 목록이다.
     *   - 팝업 결과는 PopupResultQueue를 통해 종료 시점에 1회 전송한다. 시작·조회 직전에 미전송 큐를 먼저 보낸다.
     *   - 주기 조회 간격은 서버 응답 pollingIntervalSeconds가 우선하며, 팝업이 열려 있으면 그 주기는 건너뛴다.
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
        private int _pollingIntervalSeconds;
        private bool _isLoadingPopups;

        /*
         * 같은 실행 중 이미 화면에 전달한 팝업 ID를 기억한다.
         * 서버가 완료·숨김을 제외하더라도 TEXT/IMAGE처럼 완료 개념이 없는 팝업은 조회마다 다시 내려오므로,
         * 한 실행 안에서는 한 번만 표시한다(다음 실행에서 다시 표시).
         */
        private readonly HashSet<string> _shownPopupIds = new(StringComparer.OrdinalIgnoreCase);

        /* App.xaml.cs가 시작 시 관리 화면을 숨길지 판단할 때 사용한다. Demo Mode에서는 선택 화면을 계속 표시한다. */
        public bool IsDemoMode => _demoMode;

        public MainWindow()
        {
            InitializeComponent();

            _popupManager = new PopupManager(this);
            _popupService = new PopupService();

            PopupClientSettings settings = LoadPopupClientSettings();
            _demoMode = settings.DemoMode;
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
                BaseUrl = GetString(api, "BaseUrl").Trim(),
                AutoLoadOnStartup = GetBoolean(api, "AutoLoadOnStartup", true),
                PollingIntervalSeconds = Math.Max(0, GetInt32(api, "PollingIntervalSeconds", 1800)),
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
            _pollingTimer.Stop();
            _ssoAuthHeaderProvider?.Dispose();
            base.OnClosed(e);
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            Loaded -= MainWindow_Loaded;
            if (_demoMode) return;

            if (_autoLoadOnStartup)
            {
                await LoadAndShowAvailablePopupsAsync(showEmptyMessage: false, showErrorMessage: true);
            }
            StartPeriodicPolling();
        }

        /* 설정된 초 간격으로 서버 조회 타이머를 시작한다. 0이면 주기 조회를 사용하지 않는다. */
        private void StartPeriodicPolling()
        {
            if (_demoMode || _pollingIntervalSeconds <= 0)
            {
                _pollingTimer.Stop();
                return;
            }
            _pollingTimer.Interval = TimeSpan.FromSeconds(_pollingIntervalSeconds);
            _pollingTimer.Start();
        }

        /*
         * [기준 4] 서버가 응답으로 내려준 조회 간격을 적용한다. 서버 값이 있으면 appsettings 값보다 우선한다.
         */
        private void ApplyPollingInterval(int serverIntervalSeconds)
        {
            if (serverIntervalSeconds <= 0 || serverIntervalSeconds == _pollingIntervalSeconds) return;
            _pollingIntervalSeconds = serverIntervalSeconds;
            StartPeriodicPolling();
        }

        /* 주기 조회 실패는 백그라운드에서 조용히 넘긴다. 다음 주기가 되면 서버 연결을 다시 시도한다. */
        private async void PollingTimer_Tick(object? sender, EventArgs e)
        {
            await LoadAndShowAvailablePopupsAsync(showEmptyMessage: false, showErrorMessage: false);
        }

        private async void OpenPopupButton_Click(object sender, RoutedEventArgs e)
        {
            await RefreshPopupsAsync();
        }

        /* 관리 화면의 버튼과 App의 트레이 메뉴가 함께 사용하는 공개 팝업 재조회 메서드다. */
        public async Task RefreshPopupsAsync()
        {
            await LoadAndShowAvailablePopupsAsync(showEmptyMessage: true, showErrorMessage: true);
        }

        /*
         * 자동 실행·수동 버튼·주기 조회가 함께 사용하는 실제 조회 메서드다.
         *
         * 순서:
         *  1. 미전송 결과 큐 flush — 이전 실행에서 못 보낸 완료·숨김이 먼저 반영되어야 서버 목록이 정확하다.
         *  2. GET /p/api/wpf/popups — 서버가 판정한 최종 목록(공통 옵션·content·문항 포함).
         *  3. 서버 조회 간격 적용, 이번 실행에서 이미 표시한 팝업 제외, PopupOptions 변환·표시.
         * 팝업이 열려 있으면(HasOpenPopups) 조회를 건너뛴다(열린 팝업 위에 중복 표시 방지).
         */
        private async Task LoadAndShowAvailablePopupsAsync(bool showEmptyMessage, bool showErrorMessage)
        {
            if (_popupApiService == null || _resultQueue == null)
            {
                throw new InvalidOperationException("API 모드의 PopupApiService가 생성되지 않았습니다.");
            }
            if (_isLoadingPopups) return;
            if (_popupManager.HasOpenPopups)
            {
                if (showEmptyMessage)
                {
                    MessageBox.Show("표시 중인 팝업이 있어 새로 조회하지 않습니다.", "팝업 조회",
                        MessageBoxButton.OK, MessageBoxImage.Information);
                }
                return;
            }

            _isLoadingPopups = true;
            try
            {
                await _resultQueue.FlushAsync();

                WpfPopupListResponseDto response = await _popupApiService.GetWpfPopupsAsync();
                ApplyPollingInterval(response.PollingIntervalSeconds);

                List<PopupResponseDto> popupDtos = response.Popups
                    .Where(popup => !_shownPopupIds.Contains(popup.PopupId))
                    .ToList();

                if (popupDtos.Count == 0)
                {
                    if (showEmptyMessage)
                    {
                        MessageBox.Show("현재 표시할 팝업이 없습니다.", "팝업 조회",
                            MessageBoxButton.OK, MessageBoxImage.Information);
                    }
                    return;
                }

                List<PopupOptions> popupOptionsList = _popupService.CreatePopupOptions(popupDtos);
                foreach (PopupOptions popupOptions in popupOptionsList)
                {
                    /*
                     * [기준 3·4] PopupWindow·View는 서버를 모른다. 창이 닫힐 때 만들어지는 결과 항목을
                     * 큐로 넘기는 훅만 연결한다. 제출은 즉시 전송해 응답을 사용자에게 안내한다.
                     */
                    popupOptions.ReportResultAsync = _resultQueue.EnqueueAndSendAsync;
                    popupOptions.ReportResultImmediateAsync = _resultQueue.SendImmediateAsync;
                }

                foreach (PopupResponseDto popupDto in popupDtos)
                {
                    _shownPopupIds.Add(popupDto.PopupId);
                }
                _popupManager.ShowRange(popupOptionsList);
            }
            catch (HttpRequestException exception) when (exception.StatusCode == HttpStatusCode.Unauthorized
                                                         || exception.StatusCode == HttpStatusCode.Forbidden)
            {
                if (showErrorMessage)
                {
                    MessageBox.Show(
                        "팝업 서버가 사용자 인증을 거절했습니다.\n\n" + exception.Message,
                        "인증 오류", MessageBoxButton.OK, MessageBoxImage.Warning);
                }
            }
            catch (HttpRequestException exception)
            {
                if (showErrorMessage)
                {
                    MessageBox.Show(
                        "팝업 서버에 연결할 수 없습니다.\n\n서버가 실행 중인지 확인해주세요.\n\n" + exception.Message,
                        "서버 연결 오류", MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
            catch (TaskCanceledException)
            {
                if (showErrorMessage)
                {
                    MessageBox.Show("팝업 서버의 응답 시간이 초과되었습니다.", "서버 응답 시간 초과",
                        MessageBoxButton.OK, MessageBoxImage.Warning);
                }
            }
            catch (Exception exception)
            {
                if (showErrorMessage)
                {
                    MessageBox.Show("팝업을 불러오는 중 오류가 발생했습니다.\n\n" + exception.Message, "팝업 오류",
                        MessageBoxButton.OK, MessageBoxImage.Error);
                }
            }
            finally
            {
                _isLoadingPopups = false;
            }
        }
    }
}
