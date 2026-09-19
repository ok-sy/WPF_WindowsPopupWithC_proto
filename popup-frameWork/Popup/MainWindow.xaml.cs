using Popup.Dtos;
using Popup.Models;
using Popup.Views.Contents;
using Popup.Views.Windows;
using System.Linq;
using System.Security.Policy;
using System.Windows;
using Popup.Managers;
using Popup.Services;
using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.IO;
using System.Windows.Threading;


namespace Popup
{
    public partial class MainWindow : Window
    {

        /*
         * 
         * 팝업을 순서대로 표시하는 관리자
         */
        private readonly PopupManager
            _popupManager;

        /*
         * DTO를 PopupOptions로 변환하는 서비스
         */
        private readonly PopupService
            _popupService;

        /*
         * Java Spring Boot 서버와 통신하여
         * 팝업 목록을 조회하는 API 서비스다.
         */
        private readonly PopupApiService?
            _popupApiService;

        /*
         * WPF 내부 샘플만 사용하는 화면 시연 모드 여부다.
         * true이면 Java API 생성, 사용자 ID 확인, 주기 조회를 모두 건너뛴다.
         */
        private readonly bool
            _demoMode;

        /*
         * appsettings.json에서 읽은 현재 사용자 ID다.
         *
         * 현재는 로그인 시스템이 없으므로 설정값을 사용하고,
         * 이후 사내 로그인 연계 시 이 값만 로그인 사용자 정보로 교체한다.
         */
        private readonly string
            _currentUserId;

        private readonly bool
            _autoLoadOnStartup;

        private readonly int
            _pollingIntervalSeconds;

        private readonly DispatcherTimer
            _pollingTimer;

        /*
         * 같은 실행 중 이미 화면에 전달한 팝업 ID를 기억한다.
         * 주기 조회 때 서버가 같은 목록을 반환해도 중복 표시하지 않는다.
         */
        private readonly HashSet<string>
            _shownPopupIds =
                new HashSet<string>(
                    StringComparer.OrdinalIgnoreCase);

        private bool
            _isLoadingPopups;

        /*
         * App.xaml.cs가 시작 시 관리 화면을 숨길지 판단할 때 사용한다.
         * Demo Mode에서는 선택 화면을 계속 표시한다.
         */
        public bool IsDemoMode =>
            _demoMode;

        /*
         * appsettings.json에서 Java 팝업 API 주소와
         * 현재 사용자 ID를 함께 읽는다.
         *
         * 반환 예:
         * BaseUrl = http://localhost:8080/zero-rule-server/p
         * UserId  = E1002
         */
        private static PopupClientSettings LoadPopupClientSettings()
        {
            /*
             * 실행 중인 Popup.exe가 위치한 폴더를 기준으로
             * appsettings.json의 전체 경로를 만든다.
             *
             * AppContext.BaseDirectory를 사용해야
             * 바로가기나 다른 작업 폴더에서 실행해도
             * EXE 옆의 설정 파일을 정확하게 찾을 수 있다.
             */
            string configurationFilePath =
                Path.Combine(
                    AppContext.BaseDirectory,
                    "appsettings.json");

            string configurationJson;

            if (File.Exists(configurationFilePath))
            {
                configurationJson =
                    File.ReadAllText(configurationFilePath);
            }
            else
            {
                using Stream configurationStream =
                    typeof(MainWindow).Assembly.GetManifestResourceStream(
                        "Popup.appsettings.json")
                    ?? throw new InvalidOperationException(
                        "내장 appsettings.json을 찾을 수 없습니다.");

                using StreamReader configurationReader =
                    new StreamReader(configurationStream);

                configurationJson =
                    configurationReader.ReadToEnd();
            }

            /*
             * JSON 문자열을 탐색 가능한
             * JsonDocument 객체로 변환한다.
             *
             * using을 사용하므로 메서드 종료 시
             * JsonDocument가 자동으로 정리된다.
             */
            using JsonDocument configurationDocument =
                JsonDocument.Parse(
                    configurationJson);

            JsonElement rootElement =
                configurationDocument.RootElement;

            /*
             * 다음 구조에서 PopupApi 영역을 찾는다.
             *
             * {
             *   "PopupApi": {
             *     "BaseUrl": "...",
             *     "UserId": "E1002"
             *   }
             * }
             */
            if (!rootElement.TryGetProperty(
                    "PopupApi",
                    out JsonElement popupApiElement))
            {
                throw new InvalidOperationException(
                    "appsettings.json에 PopupApi 설정이 없습니다.");
            }

            /*
             * PopupApi 내부에서 BaseUrl 값을 찾는다.
             */
            bool demoMode =
                popupApiElement.TryGetProperty(
                    "DemoMode",
                    out JsonElement demoModeElement)
                && demoModeElement.ValueKind == JsonValueKind.True;

            /*
             * JSON의 BaseUrl 값을
             * C# 문자열로 변환한다.
             */
            string baseUrl =
                string.Empty;

            if (popupApiElement.TryGetProperty(
                    "BaseUrl",
                    out JsonElement baseUrlElement))
            {
                baseUrl =
                    baseUrlElement.GetString()
                    ?? string.Empty;
            }

            /*
             * 속성은 존재하지만 값이 비어 있는 경우에도
             * 잘못된 설정으로 처리한다.
             */
            if (!demoMode
                && string.IsNullOrWhiteSpace(
                    baseUrl))
            {
                throw new InvalidOperationException(
                    "PopupApi.BaseUrl 값이 비어 있습니다.");
            }

            /*
             * UserId는 실행 환경변수가 없을 때 사용할 대체값이다.
             * 환경변수만 사용하는 운영 환경에서는 생략하거나 비워도 된다.
             */
            string configuredUserId =
                string.Empty;

            if (popupApiElement.TryGetProperty(
                    "UserId",
                    out JsonElement userIdElement))
            {
                configuredUserId =
                    userIdElement.GetString()
                    ?? string.Empty;
            }

            bool autoLoadOnStartup =
                true;

            if (popupApiElement.TryGetProperty(
                    "AutoLoadOnStartup",
                    out JsonElement autoLoadElement)
                && (autoLoadElement.ValueKind == JsonValueKind.True
                    || autoLoadElement.ValueKind == JsonValueKind.False))
            {
                autoLoadOnStartup =
                    autoLoadElement.GetBoolean();
            }

            int pollingIntervalSeconds =
                300;

            if (popupApiElement.TryGetProperty(
                    "PollingIntervalSeconds",
                    out JsonElement pollingIntervalElement)
                && pollingIntervalElement.TryGetInt32(
                    out int configuredPollingIntervalSeconds))
            {
                pollingIntervalSeconds =
                    Math.Max(
                        0,
                        configuredPollingIntervalSeconds);
            }

            return new PopupClientSettings
            {
                DemoMode =
                    demoMode,

                BaseUrl =
                    baseUrl.Trim(),
                UserId =
                    configuredUserId.Trim(),
                AutoLoadOnStartup =
                    autoLoadOnStartup,
                PollingIntervalSeconds =
                    pollingIntervalSeconds
            };
        }

        /*
         * 현재 사용자 ID를 결정한다.
         *
         * 1순위: 실행 환경변수 POPUP_USER_ID
         * 2순위: appsettings.json의 PopupApi.UserId
         *
         * 백그라운드 실행 프로그램은 POPUP_USER_ID만 전달하면
         * 사용자마다 appsettings.json을 수정할 필요가 없다.
         */
        private static string ResolveCurrentUserId(
            string configuredUserId)
        {
            string? environmentUserId =
                Environment.GetEnvironmentVariable(
                    "POPUP_USER_ID");

            if (!string.IsNullOrWhiteSpace(
                    environmentUserId))
            {
                return environmentUserId.Trim();
            }

            if (!string.IsNullOrWhiteSpace(
                    configuredUserId))
            {
                return configuredUserId.Trim();
            }

            throw new InvalidOperationException(
                "현재 사용자 ID가 없습니다.\n" +
                "POPUP_USER_ID 환경변수 또는 " +
                "appsettings.json의 PopupApi.UserId를 설정해주세요.");
        }

        /*
         * MainWindow 생성자
         *
         * MainWindow.xaml을 읽어서
         * 화면 요소를 실제 객체로 만든다.
         */
        public MainWindow()
        {
            InitializeComponent();

            /*
             * MainWindow를 팝업의 부모 창으로 사용하는
             * PopupManager를 생성한다.
             */
            _popupManager =
                new PopupManager(
                    this);

            /*
             * DTO 변환용 PopupService를 생성한다.
             */
            _popupService =
                new PopupService();


            /*
             * Java Spring Boot 서버의 주소를 전달하여
             * PopupApiService를 생성한다.
             */
            /*
             * appsettings.json에서
             * Java 팝업 API 주소를 읽는다.
             */
            PopupClientSettings popupClientSettings =
                LoadPopupClientSettings();

            _demoMode =
                popupClientSettings.DemoMode;

            _currentUserId =
                _demoMode
                    ? "DEMO_USER"
                    : ResolveCurrentUserId(
                        popupClientSettings.UserId);

            _autoLoadOnStartup =
                popupClientSettings.AutoLoadOnStartup;

            _pollingIntervalSeconds =
                popupClientSettings.PollingIntervalSeconds;

            _pollingTimer =
                new DispatcherTimer();

            _pollingTimer.Tick +=
                PollingTimer_Tick;

            /*
             * 설정 파일에서 읽은 API 주소를 전달하여
             * PopupApiService를 생성한다.
             */
            if (!_demoMode)
            {
                _popupApiService =
                    new PopupApiService(
                        popupClientSettings.BaseUrl);
            }

            if (_demoMode)
            {
                Title =
                    "Popup 관리 화면 - Demo Mode";
            }

            Loaded +=
                MainWindow_Loaded;
        }

        /*
         * MainWindow가 처음 준비되면 API 팝업을 자동으로 조회한다.
         * 설정값이 false이면 기존처럼 버튼을 눌러야 조회한다.
         */
        private async void MainWindow_Loaded(
            object sender,
            RoutedEventArgs e)
        {
            Loaded -=
                MainWindow_Loaded;

            if (_demoMode)
            {
                return;
            }

            if (_autoLoadOnStartup)
            {
                await LoadAndShowAvailablePopupsAsync(
                    showEmptyMessage: false,
                    showErrorMessage: true);
            }

            StartPeriodicPolling();
        }

        /*
         * 설정된 초 간격으로 서버 조회 타이머를 시작한다.
         * 0이면 주기 조회를 사용하지 않는다.
         */
        private void StartPeriodicPolling()
        {
            if (_demoMode
                || _pollingIntervalSeconds <= 0)
            {
                return;
            }

            _pollingTimer.Interval =
                TimeSpan.FromSeconds(
                    _pollingIntervalSeconds);

            _pollingTimer.Start();
        }

        /*
         * 주기 조회 실패는 백그라운드에서 조용히 넘긴다.
         * 다음 주기가 되면 서버 연결을 다시 시도한다.
         */
        private async void PollingTimer_Tick(
            object? sender,
            EventArgs e)
        {
            await LoadAndShowAvailablePopupsAsync(
                showEmptyMessage: false,
                showErrorMessage: false);
        }

        /*
         * Java API에서 현재 사용자에게 노출할 팝업을 조회하고
         * PopupManager를 통해 화면에 표시한다.
         */
        private async void OpenPopupButton_Click(
            object sender,
            RoutedEventArgs e)
        {
            await RefreshPopupsAsync();
        }

        /*
         * 관리 화면의 버튼과 App의 트레이 메뉴가 함께 사용하는
         * 공개 팝업 재조회 메서드다.
         */
        public async Task RefreshPopupsAsync()
        {
            await LoadAndShowAvailablePopupsAsync(
                showEmptyMessage: true,
                showErrorMessage: true);
        }

        /*
         * 자동 실행과 수동 버튼이 함께 사용하는 실제 조회 메서드다.
         */
        private async Task LoadAndShowAvailablePopupsAsync(
            bool showEmptyMessage,
            bool showErrorMessage)
        {
            if (_popupApiService == null)
            {
                throw new InvalidOperationException(
                    "API 모드의 PopupApiService가 생성되지 않았습니다.");
            }

            if (_isLoadingPopups)
            {
                return;
            }

            _isLoadingPopups =
                true;

            /*
             * 생성자에서 appsettings.json으로부터 읽어둔
             * 현재 사용자 ID를 이번 API 요청 전체에서 사용한다.
             */
            string currentUserId =
                _currentUserId;

            try
            {
                /*
                 * Java API와 PostgreSQL DB를 통해
                 * 현재 사용자에게 노출 가능한 팝업만 조회한다.
                 */
                List<PopupResponseDto> popupDtos =
                    await _popupApiService
                        .GetAvailablePopupsAsync(
                            currentUserId);

                /*
                 * 앱을 다시 실행해도 이미 완료한 설문이나 영상이
                 * 다시 표시되지 않도록 서버의 사용자별 상태를 조회한다.
                 *
                 * /api/popups 목록은 현재 기간·대상·숨김 조건을 처리하고,
                 * /api/popups/statuses 목록은 사용자의 완료 이력을 알려준다.
                 */
                List<UserPopupStatusDto> popupStatuses =
                    await _popupApiService
                        .GetPopupStatusesAsync(
                            currentUserId);

                Dictionary<string, UserPopupStatusDto> statusByPopupId =
                    popupStatuses
                        .GroupBy(
                            status => status.PopupId,
                            StringComparer.OrdinalIgnoreCase)
                        .ToDictionary(
                            group => group.Key,
                            group => group.First(),
                            StringComparer.OrdinalIgnoreCase);

                /*
                 * 완료 상태가 없는 팝업과 아직 미완료인 팝업만 남긴다.
                 * 숨김 상태는 Java 조회 SQL에서도 제외되지만,
                 * 완료 상태는 이 단계에서 최종적으로 제외한다.
                 */
                popupDtos =
                    popupDtos
                        .Where(popup =>
                            (!_shownPopupIds.Contains(
                                popup.PopupId))
                            && (!statusByPopupId.TryGetValue(
                                    popup.PopupId,
                                    out UserPopupStatusDto? status)
                                || !status.Completed))
                        .ToList();

                if (popupDtos.Count == 0)
                {
                    if (showEmptyMessage)
                    {
                        MessageBox.Show(
                            "현재 표시할 팝업이 없습니다.",
                            "팝업 조회",
                            MessageBoxButton.OK,
                            MessageBoxImage.Information);
                    }

                    return;
                }

                /*
                 * 서버 DTO를 실제 PopupWindow에서 사용하는
                 * PopupOptions 목록으로 변환한다.
                 */
                List<PopupOptions> popupOptionsList =
                    _popupService.CreatePopupOptions(
                        popupDtos);

                foreach (PopupOptions popupOptions
                         in popupOptionsList)
                {
                    /*
                     * PopupWindow에서 "다시 보지 않기"를 선택하면
                     * 실행할 서버 저장 콜백을 설정한다.
                     *
                     * PopupWindow는 API 주소나 사용자 ID를 직접 알지 않고,
                     * 이 콜백만 호출한다.
                     */
                    popupOptions.HidePopupAsync =
                        async (
                            popupId,
                            hideDays) =>
                        {
                            await _popupApiService
                                .HidePopupAsync(
                                    popupId,
                                    currentUserId,
                                    hideDays);
                        };

                    /*
                     * 팝업 내용이 실제 화면에 표시되면
                     * 서버에 DISPLAYED 이벤트를 저장한다.
                     */
                    popupOptions.PopupDisplayedAsync =
                        async popupId =>
                        {
                            await _popupApiService
                                .RecordPopupEventAsync(
                                    popupId,
                                    currentUserId,
                                    "DISPLAYED");
                        };

                    /*
                     * 팝업 창이 실제로 닫히면
                     * 서버에 CLOSED 이벤트를 저장한다.
                     */
                    popupOptions.PopupClosedAsync =
                        async popupId =>
                        {
                            await _popupApiService
                                .RecordPopupEventAsync(
                                    popupId,
                                    currentUserId,
                                    "CLOSED");
                        };

                    /*
                     * 설문/퀴즈 팝업의 제출 이벤트를
                     * 서버 응답 저장 API와 연결한다.
                     */
                    popupOptions.SubmitSurveyAsync =
                        async (popupId, surveyAnswers) =>
                        {
                            List<PopupSubmitAnswerRequestDto> requestAnswers =
                                surveyAnswers
                                    .Select(answer =>
                                        new PopupSubmitAnswerRequestDto
                                        {
                                            QuestionId =
                                                answer.QuestionId,

                                            TextAnswer =
                                                string.IsNullOrWhiteSpace(
                                                    answer.TextAnswer)
                                                    ? null
                                                    : answer.TextAnswer,

                                            OptionIds =
                                                new List<long>(
                                                    answer.SelectedOptionIds)
                                        })
                                    .ToList();

                            await _popupApiService
                                .SubmitResponseAsync(
                                    popupId,
                                    currentUserId,
                                    requestAnswers);
                        };

                    /*
                     * VideoPopupView가 측정한 재생 위치와 실제 시청시간을
                     * 서버의 영상 진행률 API에 저장한다.
                     */
                    popupOptions.SaveVideoProgressAsync =
                        async (popupId, progress) =>
                        {
                            VideoProgressResponseDto response =
                                await _popupApiService
                                .SaveVideoProgressAsync(
                                    popupId,
                                    new VideoProgressRequestDto
                                    {
                                        UserId =
                                            currentUserId,
                                        DurationSeconds =
                                            progress.DurationSeconds,
                                        PositionSeconds =
                                            progress.PositionSeconds,
                                        MaximumPositionSeconds =
                                            progress.MaximumPositionSeconds,
                                        WatchedSeconds =
                                            progress.WatchedSeconds
                                    });

                            return response.Completed;
                        };
                }

                /*
                 * 조회한 팝업을 PopupManager에 전달한다.
                 *
                 * 서버의 displayMode 값에 따라:
                 *
                 * SEQUENTIAL
                 * → 한 개씩 순차적으로 표시
                 * SIMULTANEOUS
                 * → 여러 팝업을 한 번에 표시
                 */
                foreach (PopupResponseDto popupDto
                         in popupDtos)
                {
                    _shownPopupIds.Add(
                        popupDto.PopupId);
                }

                _popupManager.ShowRange(
                    popupOptionsList);
            }
            catch (HttpRequestException exception)
            {
                if (showErrorMessage)
                {
                    MessageBox.Show(
                        "Java 팝업 서버에 연결할 수 없습니다.\n\n" +
                        "Spring Boot 서버가 실행 중인지 확인해주세요.\n\n" +
                        exception.Message,
                        "서버 연결 오류",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error);
                }
            }
            catch (TaskCanceledException)
            {
                if (showErrorMessage)
                {
                    MessageBox.Show(
                        "팝업 서버의 응답 시간이 초과되었습니다.",
                        "서버 응답 시간 초과",
                        MessageBoxButton.OK,
                        MessageBoxImage.Warning);
                }
            }
            catch (Exception exception)
            {
                if (showErrorMessage)
                {
                    MessageBox.Show(
                        "팝업을 불러오는 중 오류가 발생했습니다.\n\n" +
                        exception.Message,
                        "팝업 오류",
                        MessageBoxButton.OK,
                        MessageBoxImage.Error);
                }
            }
            finally
            {
                _isLoadingPopups =
                    false;
            }
        }
    }
}
