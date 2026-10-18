using Popup.Dtos;
using Popup.Models;
using Popup.Services;
using Popup.Services.Auth;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;

namespace Popup
{
    /*
     * [설계 51] API Demo(-Demo -Api). Demo 화면에서 개발계/검증계 실제 API를 수동으로 호출한다.
     *
     *   팝업 조회 버튼 → (바뀐 연결 입력 적용) → 미전송 결과 전송 → POST /api/wpf/popups(입력한 JSON 본문)
     *     → popup 1건을 일반 실행과 같은 PopupService·PopupManager 경로로 표시
     *     → 창 닫힘 → PopupResultBuilder 결과가 결과 큐에 저장 → 실제 결과 API로 전송 → nextStatus 표시
     *     → 다음 조회는 다시 버튼으로(자동 폴링·nextStatus 기반 연속 조회 없음)
     *
     * [재사용 — 51-4] PopupApiService(인증 헤더·401 1회 재시도·426·DTO 역직렬화), PopupResultQueue(resultId 고정·재전송·종결 판정),
     *   PopupService/PopupFactory/PopupManager, PopupResultBuilder를 그대로 쓴다. Demo 전용으로 추가한 것은
     *   입력 JSON 본문을 보내는 오버로드, HttpClient 안쪽의 관찰 지점(HttpExchangeRecorder), 입력값 기반 인증 공급자뿐이다.
     *   응답 구조 재작성·별도 렌더러·가짜 deliveryId 생성은 하지 않는다.
     *
     * [경계 — 51-7] 결과 큐 파일을 "Base URL·인증 방식·인증 대상·X-Dev-User-Id" 조합별로 나눈다. 연결을 바꾸면 이전 연결의 미전송 결과는
     *   그 연결 전용 파일에 남고, 같은 연결을 다시 적용했을 때만 전송된다. 일반 실행의 pending-results.json과도 섞이지 않는다.
     * [동시 실행 — 51-8] 이 모드에서 MainWindow는 API 서비스·주기 조회를 만들지 않으므로 자동 조회 루프와 겹치지 않는다.
     */
    public partial class DemoWindow
    {
        private readonly Dictionary<int, HttpExchangeRecord> _httpDetails = new();
        private PopupClientSettings? _apiSettings;
        private HttpClient? _apiHttpClient;
        private PopupApiService? _apiService;
        private PopupResultQueue? _apiQueue;
        private DemoApiAuthHeaderProvider? _apiAuth;
        private string? _apiConnectionKey;
        private string _apiAuthModeLabel = string.Empty;
        private int _apiBusyCount;
        private string? _lastNextStatus;
        private int? _lastPollingIntervalSeconds;
        /* 마지막 HTTP 기록. 응답 해석 실패를 빈 응답·잘못된 JSON·구조 불일치로 나눌 때 쓴다(관찰 스레드에서 기록). */
        private HttpExchangeRecord? _lastExchange;

        private bool IsApiDemo => _apiSettings != null;
        private bool IsApiBusy => _apiBusyCount > 0;
        private bool ApiRevealSecrets => ApiRevealSecretsCheck.IsChecked == true;

        /// <summary>[설계 51] 이번 API Demo가 쓰는 결과 큐 파일 경로(연결 미적용이면 null). 검증용.</summary>
        internal string? ApiQueueFilePath { get; private set; }

        private void InitializeApiDemo(PopupClientSettings settings)
        {
            _apiSettings = settings;
            HttpExchangeRecorder recorder = new(new HttpClientHandler());
            recorder.Recorded += record =>
            {
                Volatile.Write(ref _lastExchange, record);
                Dispatcher.BeginInvoke(() => AppendHttpLog(record));
            };
            _apiHttpClient = new HttpClient(recorder) { Timeout = TimeSpan.FromSeconds(10) };

            Title = "Popup Demo Mode — API";
            HeaderSubtitleText.Text = "개발계/검증계 API를 수동으로 호출해 실제 응답 팝업과 결과 전송을 확인합니다. 자동 조회는 하지 않습니다.";
            LeftPanelTitle.Text = "API 호출";
            InMemoryPanel.Visibility = InMemoryActionBar.Visibility = Visibility.Collapsed;
            ApiPanel.Visibility = ApiActionBar.Visibility = Visibility.Visible;
            // [TODO54-2] 현재 모드 표시
            ModeBadgeText.Text = "API 연결";
            ModeBadge.Background = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0xE7, 0xEE, 0xF8));
            ModeBadgeText.Foreground = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(0x1F, 0x4E, 0x8C));
            ModeHintText.Text = "로컬 샘플로 확인하려면 popupSample.exe --demo 로 실행";
            QuizScoreText.Text = "결과 전송 후 status·nextStatus가 로그에 표시됩니다. 다음 조회는 '팝업 조회' 버튼으로 실행합니다.";

            ApiBaseUrlText.Text = settings.BaseUrl;
            ApiLoginPathText.Text = settings.AuthLoginPath;
            ApiLoginBodyText.Text = "{\n  \"logonId\": \"\",\n  \"classCode\": \"\",\n  \"linkYn\": \"N\"\n}";
            ApiDevUserIdText.Text = MainWindow.ResolveDevUserId(settings.DevUserId) ?? string.Empty;
            // appsettings Auth.Mode를 초기 선택으로만 쓴다(SsoPrototype은 SSO 대신 로그인 본문 직접 입력).
            switch (settings.AuthMode.Trim().ToUpperInvariant())
            {
                case "STATIC":
                    ApiAuthModeCombo.SelectedIndex = 1;
                    ApiTokenBox.Password = settings.AuthStaticHeader;
                    break;
                case "SSOPROTOTYPE":
                    ApiAuthModeCombo.SelectedIndex = 0;
                    break;
                default:
                    ApiAuthModeCombo.SelectedIndex = 2;
                    break;
            }
            ApplyAuthModeVisibility();
            AppendLog("--- API Demo: 수동 호출 모드(자동 폴링 OFF). 입력 후 '팝업 조회'를 누르세요 ---");
            UpdateApiState();
        }

        private string SelectedAuthMode => (ApiAuthModeCombo.SelectedItem as ComboBoxItem)?.Tag as string ?? "NONE";

        private void ApiAuthModeCombo_SelectionChanged(object sender, SelectionChangedEventArgs e) => ApplyAuthModeVisibility();

        private void ApplyAuthModeVisibility()
        {
            if (ApiLoginPanel == null || ApiTokenPanel == null || ApiLoginButton == null) return;   // XAML 로드 중
            ApiLoginPanel.Visibility = SelectedAuthMode == "LOGIN" ? Visibility.Visible : Visibility.Collapsed;
            ApiTokenPanel.Visibility = SelectedAuthMode == "TOKEN" ? Visibility.Visible : Visibility.Collapsed;
            ApiLoginButton.Visibility = SelectedAuthMode == "LOGIN" ? Visibility.Visible : Visibility.Collapsed;
        }

        private void ApiRevealSecretsCheck_Changed(object sender, RoutedEventArgs e) => ResultLogList_SelectionChanged(sender, null!);

        private async void ApiApplyButton_Click(object sender, RoutedEventArgs e)
            => await RunApiAsync(() => Task.FromResult(EnsureApiConnection(forceLog: true)));

        private async void ApiQueryButton_Click(object sender, RoutedEventArgs e) => await QueryApiAsync();

        private async void ApiLoginButton_Click(object sender, RoutedEventArgs e)
        {
            await RunApiAsync(async () =>
            {
                if (!EnsureApiConnection(forceLog: false) || _apiAuth is not { UsesLogin: true } auth) return;
                try
                {
                    WpfLoginResponseDto login = await auth.LoginNowAsync();
                    AppendLog($"[로그인] 성공 · tokenType={login.TokenType} · 토큰 {login.AccessToken.Length}자(메모리 보관) · "
                              + $"expiresAt={login.ExpiresAt.ToLocalTime():yyyy-MM-dd HH:mm:ss zzz}");
                }
                catch (Exception exception)
                {
                    LogApiError("로그인", exception);
                }
            });
        }

        private async void ApiFlushButton_Click(object sender, RoutedEventArgs e)
        {
            await RunApiAsync(async () =>
            {
                if (!EnsureApiConnection(forceLog: false)) return;
                await FlushApiResultsAsync(_apiQueue!, "재전송");
            });
        }

        /// <summary>
        /// [설계 51-5] 단건 조회 1회. 호출 중·표시 중에는 중복 조회하지 않는다. 미전송 결과가 남으면 일반 실행과 같이 조회하지 않는다.
        /// </summary>
        internal async Task QueryApiAsync()
        {
            if (!IsApiDemo) return;
            if (IsApiBusy)
            {
                AppendLog("[조회] 호출 중이라 요청을 무시했습니다.");
                return;
            }
            if (_popupManager.HasOpenPopups)
            {
                MessageBox.Show(this, "표시 중인 팝업을 먼저 닫아 주세요. 닫힌 뒤 결과를 보내고 다음 조회는 버튼으로 실행합니다.",
                    "API Demo", MessageBoxButton.OK, MessageBoxImage.Information);
                return;
            }
            if (!TryParseJsonObject(ApiQueryBodyText.Text, "단건 조회 요청 JSON", out JsonElement body)) return;

            await RunApiAsync(async () =>
            {
                if (!EnsureApiConnection(forceLog: false)) return;
                PopupApiService service = _apiService!;
                PopupResultQueue queue = _apiQueue!;

                // 일반 실행(MainWindow)과 같이 미전송 결과를 먼저 보낸다. 남으면 조회하지 않는다(미전송 결과 우선).
                ResultFlushOutcome flushed = await FlushApiResultsAsync(queue, "조회 전");
                if (flushed.Blocked)
                {
                    AppendLog("[조회] 미전송 결과가 남아 조회하지 않았습니다. '미전송 결과 재전송'으로 같은 resultId를 다시 보내세요.");
                    return;
                }

                WpfNextPopupResponseDto response;
                try
                {
                    response = await service.GetNextPopupAsync(body);
                }
                catch (Exception exception)
                {
                    LogApiError("단건 조회", exception);
                    return;
                }

                _lastPollingIntervalSeconds = response.PollingIntervalSeconds;
                if (response.Popup == null)
                {
                    AppendLog($"[조회] popup=null — 표시 대상 없음(정상) · pollingIntervalSeconds={response.PollingIntervalSeconds} (수동 모드, 타이머 미시작)");
                    return;
                }
                AppendLog($"[조회] {response.Popup.PopupId} · {response.Popup.PopupType} · deliveryId={response.Popup.DeliveryId} · "
                          + $"pollingIntervalSeconds={response.PollingIntervalSeconds} (수동 모드, 타이머 미시작)");

                // [설계 51-3] 팝업 생성·표시 실패는 HTTP·응답 해석 오류와 구분해 기록한다.
                try
                {
                    PopupOptions options = _popupService.CreatePopupOptions(new List<PopupResponseDto> { response.Popup }).Single();
                    // 일반 실행과 같은 결과 훅. 결과는 이 연결의 큐에 저장되고, 창이 닫히면 그 큐를 전송한다.
                    options.EnqueueResult = queue.Enqueue;
                    options.RetainResultForExit = queue.RetainForExit;
                    options.FlushResultsInBackground = () => _ = OnApiPopupClosedAsync(queue);
                    _popupManager.Show(options);
                }
                catch (Exception exception)
                {
                    _lastApiFailure = "팝업 생성";
                    AppendLog($"[오류] 팝업 생성 — 응답은 정상 수신했지만 WPF 팝업을 만들지 못했습니다: {exception.GetType().Name}: {exception.Message}");
                }
            });
        }

        /// <summary>[설계 51-6] 창이 닫히면(결과는 이미 큐에 저장됨) 실제 결과 API로 보내고 nextStatus를 보여 준다. 다음 조회는 하지 않는다.</summary>
        private async Task OnApiPopupClosedAsync(PopupResultQueue queue)
        {
            _apiBusyCount++;
            _lastApiFailure = null;
            SetRunState("결과 전송 중…");
            UpdateApiControls();
            try
            {
                ResultFlushOutcome outcome = await FlushApiResultsAsync(queue, "닫힘 후");
                if (!outcome.Blocked && outcome.LastSaved != null)
                {
                    AppendLog($"[결과] nextStatus={outcome.LastSaved.NextStatus ?? "(없음)"} — 다음 조회는 '팝업 조회' 버튼으로 실행합니다(수동 모드).");
                }
            }
            finally
            {
                _apiBusyCount--;
                UpdateApiControls();
                UpdateApiState();
                SetApiIdleState();
            }
        }

        /// <summary>결과 큐를 전송하고 요약을 남긴다. 426은 기록 후 Blocked로 돌려준다(큐는 전송 중단, 항목 보관).</summary>
        private async Task<ResultFlushOutcome> FlushApiResultsAsync(PopupResultQueue queue, string stage)
        {
            int before = SafeCountPending(queue);
            ResultFlushOutcome outcome;
            try
            {
                outcome = await queue.FlushAsync();
            }
            catch (WpfClientVersionException exception)
            {
                LogApiError($"결과 전송({stage})", exception);
                return new ResultFlushOutcome(true, null);
            }
            int after = SafeCountPending(queue);
            if (outcome.LastSaved != null) _lastNextStatus = outcome.LastSaved.NextStatus;
            if (before == 0 && after == 0 && outcome.LastSaved == null && !outcome.Blocked) return outcome;   // 보낼 것이 없었다.
            AppendLog($"[결과 전송 · {stage}] 보관 {Describe(before)} → {Describe(after)}"
                      + (outcome.LastSaved is { } saved ? $" · 마지막 저장 {saved.Status} nextStatus={saved.NextStatus ?? "(없음)"}" : string.Empty)
                      + (outcome.Blocked ? " · 미종결 결과 있음(보관, 같은 resultId로 재전송 가능)" : string.Empty));
            if (outcome.Blocked) _lastApiFailure = $"결과 전송({stage}) — 미종결 결과 보관";
            return outcome;
        }

        /*
         * [설계 51-7] 입력한 연결 값이 바뀌었으면 API 서비스·인증 공급자·결과 큐를 새로 만든다. 같으면 그대로 쓴다.
         * 현재 연결에 미전송 결과가 있으면 확인을 받는다(그 결과는 현재 연결 전용 파일에 남아 다른 연결로 보내지 않는다).
         */
        private bool EnsureApiConnection(bool forceLog)
        {
            if (_apiHttpClient == null) return false;
            if (_popupManager.HasOpenPopups)
            {
                AppendLog("[연결] 표시 중인 팝업이 있어 연결을 바꾸지 않았습니다.");
                return _apiService != null;
            }

            string baseUrl = ApiBaseUrlText.Text.Trim().TrimEnd('/');
            if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out Uri? uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                ApiConnectionExpander.IsExpanded = true;   // [TODO54-6] 연결 입력 오류는 설정을 펼쳐 보여 준다
                AppendLog("[입력 오류] Base URL은 http:// 또는 https://로 시작하는 절대 주소여야 합니다.");
                return false;
            }
            string mode = SelectedAuthMode;
            string devUserId = ApiDevUserIdText.Text.Trim();
            string loginPath = ApiLoginPathText.Text.Trim();
            string identity;
            JsonElement loginBody = default;
            string? token = null;
            switch (mode)
            {
                case "LOGIN":
                    if (!TryParseJsonObject(ApiLoginBodyText.Text, "로그인 요청 JSON", out loginBody)) { ApiConnectionExpander.IsExpanded = true; return false; }
                    identity = loginPath + "\n" + loginBody.GetRawText();
                    break;
                case "TOKEN":
                    token = DemoApiAuthHeaderProvider.NormalizeAuthorization(ApiTokenBox.Password);
                    if (token == null)
                    {
                        ApiConnectionExpander.IsExpanded = true;
                        AppendLog("[입력 오류] 토큰 직접 입력 방식에는 Authorization 토큰이 필요합니다.");
                        return false;
                    }
                    identity = token;
                    break;
                default:
                    identity = string.Empty;
                    break;
            }

            string key = ComputeConnectionKey(baseUrl, mode, identity, devUserId);
            if (key == _apiConnectionKey && _apiService != null)
            {
                if (forceLog) AppendLog("[연결] 입력값이 같아 현재 연결을 유지합니다.");
                return true;
            }

            if (_apiQueue != null)
            {
                int pending = SafeCountPending(_apiQueue);
                if (pending != 0
                    && MessageBox.Show(this,
                        $"현재 연결에 미전송 결과 {Describe(pending)}이 있습니다.\n\n연결을 바꾸면 이 결과는 현재 연결 전용 파일에 남고, " +
                        "같은 연결 값을 다시 적용할 때만 전송됩니다. 다른 연결로는 보내지 않습니다.\n\n연결을 바꿀까요?",
                        "API Demo 연결 변경", MessageBoxButton.YesNo, MessageBoxImage.Warning) != MessageBoxResult.Yes)
                {
                    AppendLog("[연결] 변경을 취소했습니다(현재 연결 유지).");
                    return false;
                }
                _apiQueue.StopTransmission();
                _apiService?.StopRequests();
            }

            DemoApiAuthHeaderProvider auth;
            try
            {
                auth = mode switch
                {
                    "LOGIN" => DemoApiAuthHeaderProvider.ForLogin(new WpfLoginClient(baseUrl, loginPath, _apiHttpClient), loginBody),
                    "TOKEN" => DemoApiAuthHeaderProvider.ForToken(token),
                    _ => DemoApiAuthHeaderProvider.ForToken(null)
                };
            }
            catch (ArgumentException exception)
            {
                ApiConnectionExpander.IsExpanded = true;
                AppendLog("[입력 오류] " + exception.Message);
                return false;
            }

            _apiAuth = auth;
            _apiService = new PopupApiService(baseUrl, auth, string.IsNullOrEmpty(devUserId) ? null : devUserId, _apiHttpClient);
            ApiQueueFilePath = Path.Combine(Path.GetTempPath(), "Popup", "api-demo", $"pending-{key[..16]}.json");
            _apiQueue = new PopupResultQueue(_apiService, ApiQueueFilePath);
            _apiConnectionKey = key;
            _apiAuthModeLabel = mode switch { "LOGIN" => "로그인 토큰", "TOKEN" => "토큰 직접 입력", _ => "인증 헤더 없음" };
            _lastNextStatus = null;
            _lastPollingIntervalSeconds = null;
            ApiConnectionExpander.IsExpanded = false;   // [TODO54-6] 적용한 연결은 요약만 남기고 접는다
            AppendLog($"--- 연결 적용: {baseUrl} · {_apiAuthModeLabel}"
                      + (string.IsNullOrEmpty(devUserId) ? string.Empty : $" · X-Dev-User-Id={devUserId}")
                      + $" · 이 연결의 미전송 {Describe(SafeCountPending(_apiQueue))} ---");
            UpdateApiState();
            return true;
        }

        /// <summary>Base URL·인증 방식·인증 대상·X-Dev-User-Id 조합의 해시. 토큰 원문은 남기지 않고 해시만 파일 이름에 쓴다.</summary>
        internal static string ComputeConnectionKey(string baseUrl, string mode, string identity, string devUserId)
        {
            byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(
                $"{baseUrl.Trim().TrimEnd('/').ToLowerInvariant()}\n{mode}\n{identity}\n{devUserId}"));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private async Task RunApiAsync(Func<Task> action)
        {
            if (IsApiBusy) return;
            _apiBusyCount++;
            _lastApiFailure = null;
            SetRunState("요청 중…");
            UpdateApiControls();
            try
            {
                await action();
            }
            catch (Exception exception)
            {
                LogApiError("API Demo", exception);
            }
            finally
            {
                _apiBusyCount--;
                UpdateApiControls();
                UpdateApiState();
                SetApiIdleState();
            }
        }

        /* [TODO54-8] 요청이 끝난 뒤 상태: 실패 > 팝업 표시 중 > 대기 */
        private string? _lastApiFailure;
        private void SetApiIdleState()
        {
            if (_lastApiFailure != null) SetRunState("실패 · " + _lastApiFailure, failed: true);
            else if (_popupManager.HasOpenPopups) SetRunState("팝업 표시 중 — 닫으면 결과를 전송합니다(다음 조회는 버튼으로)");
            else SetRunState("대기");
        }

        /*
         * [설계 51-3] 실패 단계를 구분해 남긴다. HTTP 오류(상태 코드)·통신 실패·시간 초과·버전 차단(426)·
         * 응답 해석 실패(빈 응답 / 잘못된 JSON / 응답 구조 불일치)는 팝업 생성 오류와 다른 줄로 보인다.
         */
        private void LogApiError(string stage, Exception exception)
        {
            string detail = exception switch
            {
                WpfClientVersionException version =>
                    $"클라이언트 버전 차단(426) — {version.UserMessage} 결과 전송을 멈췄습니다(항목 보관, 연결을 다시 적용하면 재개).",
                HttpRequestException { StatusCode: HttpStatusCode.Unauthorized } http =>
                    $"인증 실패(401){(_apiAuth?.UsesLogin == true ? " — 재로그인 1회 후에도 실패" : " — 토큰 직접 입력은 재로그인하지 않음")}: {http.Message}",
                HttpRequestException { StatusCode: { } status } http => $"HTTP 오류 {(int)status}: {http.Message}",
                HttpRequestException http => $"통신 실패(응답 없음): {http.Message}",
                JsonException json => ResponseParseFailure(json),
                OperationCanceledException => "시간 초과(10초) 또는 취소 — 응답을 받지 못했습니다.",
                _ => $"{exception.GetType().Name}: {exception.Message}"
            };
            AppendLog($"[오류] {stage} — {detail}");
            _lastApiFailure = stage;
        }

        private string ResponseParseFailure(JsonException exception)
        {
            HttpExchangeRecord? last = Volatile.Read(ref _lastExchange);
            string kind = last == null ? "UNKNOWN" : HttpExchangeRecord.BodyKind(last.ResponseBody, last.StatusCode);
            return kind switch
            {
                "EMPTY" => "응답 해석 실패 — 빈 응답 본문",
                "INVALID_JSON" => "응답 해석 실패 — 잘못된 JSON: " + exception.Message,
                _ => "응답 해석 실패 — JSON 구조가 계약 DTO와 맞지 않음: " + exception.Message
            };
        }

        /// <summary>[TODO54-7] 로그 구분: 조회·결과 저장·로그인을 경로로 나눈다(그 밖은 HTTP).</summary>
        internal static string HttpCategory(string url)
        {
            string path = Uri.TryCreate(url, UriKind.Absolute, out Uri? uri) ? uri.AbsolutePath.TrimEnd('/') : url;
            if (path.EndsWith("/popups/results", StringComparison.OrdinalIgnoreCase)) return "[결과]";
            if (path.EndsWith("/popups", StringComparison.OrdinalIgnoreCase)) return "[조회]";
            if (path.Contains("/auth/", StringComparison.OrdinalIgnoreCase)) return "[로그인]";
            return "[HTTP]";
        }

        private void AppendHttpLog(HttpExchangeRecord record)
        {
            int index = ResultLogList.Items.Count;
            _httpDetails[index] = record;
            AppendLog($"[{record.StartedAt:HH:mm:ss}] {HttpCategory(record.Url)} {record.Summary(_apiService?.BaseUrl ?? string.Empty)}");
            ResultLogList.SelectedIndex = index;
            DetailTabs.SelectedIndex = 1;
        }

        private bool TryParseJsonObject(string text, string label, out JsonElement element)
        {
            element = default;
            try
            {
                using JsonDocument document = JsonDocument.Parse(string.IsNullOrWhiteSpace(text) ? "{}" : text);
                if (document.RootElement.ValueKind != JsonValueKind.Object)
                {
                    AppendLog($"[입력 오류] {label}은 JSON 객체({{...}})여야 합니다.");
                    return false;
                }
                element = document.RootElement.Clone();
                return true;
            }
            catch (JsonException exception)
            {
                AppendLog($"[입력 오류] {label} 형식이 잘못됐습니다(요청을 보내지 않음): {exception.Message}");
                return false;
            }
        }

        private void UpdateApiControls()
        {
            if (!IsApiDemo) return;
            bool idle = !IsApiBusy && !_popupManager.HasOpenPopups;
            ApiApplyButton.IsEnabled = ApiLoginButton.IsEnabled = ApiQueryButton.IsEnabled = ApiFlushButton.IsEnabled = idle;
        }

        private void UpdateApiState()
        {
            if (!IsApiDemo) return;
            if (_apiService == null || _apiQueue == null)
            {
                ServerStateText.Text = "연결 미적용 · 수동 모드(자동 폴링 OFF)";
                ApiConnectionSummaryText.Text = "연결 미적용 · 아래 설정을 입력하고 '연결 적용' 또는 '팝업 조회'를 누르세요.";
                return;
            }
            string token = _apiAuth?.UsesLogin == true ? (_apiAuth.HasAuthorization ? " (토큰 보관)" : " (토큰 없음)") : string.Empty;
            // [TODO54-6] 현재 대상 환경·인증 상태 요약(토큰 값은 표시하지 않음)
            string devUser = ApiDevUserIdText.Text.Trim();
            ApiConnectionSummaryText.Text = $"대상 {_apiService.BaseUrl}\n인증 {_apiAuthModeLabel}{token}"
                + (devUser.Length == 0 ? string.Empty : $" · X-Dev-User-Id {devUser}")
                + $"\n미전송 {Describe(SafeCountPending(_apiQueue))}";
            ServerStateText.Text = $"{_apiService.BaseUrl} · {_apiAuthModeLabel}{token} · 미전송 {Describe(SafeCountPending(_apiQueue))}"
                + $" · nextStatus {_lastNextStatus ?? "-"} · pollingIntervalSeconds {_lastPollingIntervalSeconds?.ToString() ?? "-"}(미사용)";
            UpdateApiControls();
        }

        private static int SafeCountPending(PopupResultQueue queue)
        {
            try
            {
                return queue.CountPending();
            }
            catch (Exception exception) when (exception is IOException or UnauthorizedAccessException)
            {
                return -1;
            }
        }

        private static string Describe(int count) => count < 0 ? "확인 불가" : $"{count}건";
    }
}
