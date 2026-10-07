using Popup.Dtos;
using Popup.Managers;
using Popup.Models;
using Popup.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;

namespace Popup
{
    /// <summary>
    /// Java API·DB 없이 샘플 팝업과 결과 전송 흐름을 확인하는 Demo Mode 화면이다.
    ///
    /// [Demo Mode — 기준 3·4 흐름 재현]
    ///   실제 모드와 같은 PopupResultQueue·PopupResultBuilder·PopupManager를 쓰고, 서버만
    ///   <see cref="DemoPopupGateway"/>(인메모리)로 바꾼다. 팝업이 닫힐 때 만들어지는 결과 항목과
    ///   "서버" 응답을 오른쪽 로그에 JSON으로 보여 주므로 실제 전송 본문을 그대로 검토할 수 있다.
    ///   결과 큐 파일은 실제 모드와 섞이지 않도록 임시 폴더의 demo 전용 파일을 쓴다.
    /// </summary>
    public partial class DemoWindow : Window
    {
        // 화면 표시·복사용. 기본 인코더는 한글 등 비 ASCII를 \uXXXX로 이스케이프하므로 원문 그대로 쓴다.
        // TextBox에만 표시하고 HTML/스크립트에 넣지 않으므로 완화된 이스케이프를 사용한다.
        private static readonly JsonSerializerOptions DisplayJsonOptions = new()
        {
            WriteIndented = true,
            Encoder = System.Text.Encodings.Web.JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        private static readonly JsonSerializerOptions LogJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        private readonly PopupManager _popupManager;
        private readonly PopupService _popupService;
        private readonly DemoPopupGateway _gateway;
        private readonly PopupResultQueue _resultQueue;
        private readonly Dictionary<int, (string Request, string Response)> _resultDetails = new();
        private bool _isLoading;
        private const string EmptyScoreText = "퀴즈 완료 후 점수와 통과 여부가 표시됩니다.";
        private const string EmptyDetailText = "로그를 선택하면 요청·응답 JSON을 확인하고 복사할 수 있습니다.";

        public DemoWindow()
        {
            InitializeComponent();
            _popupManager = new PopupManager(this);
            _popupService = new PopupService();
            _gateway = new DemoPopupGateway();
            _gateway.ResultProcessed += Gateway_ResultProcessed;
            _resultQueue = new PopupResultQueue(
                _gateway,
                Path.Combine(Path.GetTempPath(), "Popup", "demo-pending-results.json"));
            InitializeDemoSettings();
            UpdateServerState();
        }

        private void OpenAllPopupsButton_Click(object sender, RoutedEventArgs e) => ShowDemoPopups();

        private void ResetServerButton_Click(object sender, RoutedEventArgs e)
        {
            _gateway.Reload();
            foreach (var popup in _configuredPopups.Values) _gateway.ConfigurePopup(popup);
            UpdateServerState();
            AppendLog("--- 서버 상태 초기화 (숨김·완료·영수증 삭제) ---");
        }

        private void ClearLogButton_Click(object sender, RoutedEventArgs e)
        {
            ResultLogList.Items.Clear();
            _resultDetails.Clear();
            ShowResultDetails(null);
            QuizScoreText.Text = EmptyScoreText;
        }

        /// <summary>
        /// 실제 모드의 MainWindow.LoadAndShowAvailablePopupsAsync와 같은 순서:
        /// 미전송 큐 flush → 목록 조회(숨김·완료 제외) → PopupOptions 변환 → 결과 훅 연결 → 표시.
        /// </summary>
        public async void ShowDemoPopups(string? popupType = null)
        {
            if (_isLoading) return;
            try
            {
                if (_popupManager.HasOpenPopups)
                {
                    MessageBox.Show("표시 중인 팝업이 있습니다. 먼저 닫아 주세요.", "Demo Mode",
                        MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }

                _isLoading = true;
                await _resultQueue.FlushAsync();
                WpfPopupListResponseDto response = await _gateway.GetWpfPopupsAsync(popupType);
                LogListQuery(popupType, response);
                if (response.Popups.Count == 0)
                {
                    MessageBox.Show(
                        "표시할 팝업이 없습니다. (숨김·완료 상태이면 '서버 상태 초기화'를 누르세요)",
                        "Demo Mode", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }


                List<PopupOptions> popupOptions = _popupService.CreatePopupOptions(response.Popups);
                foreach (PopupOptions options in popupOptions)
                {
                    // [설계 12] 운영 코드(MainWindow)와 같은 훅: 로컬 큐 저장 → 창 닫기 → 백그라운드 전송(데모 게이트웨이)
                    options.EnqueueResultAsync = _resultQueue.EnqueueAsync;
                    options.FlushResultsInBackground = _resultQueue.FlushInBackground;
                }
                _popupManager.ShowRange(popupOptions);
            }
            catch (Exception exception)
            {
                MessageBox.Show(
                    "Demo Mode 팝업을 만드는 중 오류가 발생했습니다.\n\n" + exception.Message,
                    "Demo Mode 오류", MessageBoxButton.OK, MessageBoxImage.Error);
            }
            finally
            {
                _isLoading = false;
            }
        }

        private void Gateway_ResultProcessed(object? sender, (WpfResultItemDto Item, WpfResultItemResponseDto Response) e)
        {
            Dispatcher.Invoke(() =>
            {
                string request = JsonSerializer.Serialize(e.Item, LogJsonOptions);
                string response = JsonSerializer.Serialize(e.Response, LogJsonOptions);
                int firstIndex = ResultLogList.Items.Count;
                _resultDetails[firstIndex] = (request, response);
                AppendLog($"[{DateTime.Now:HH:mm:ss}] {e.Item.ResultType,-13} {e.Item.PopupId} → {e.Response.Status}"
                          + (e.Response.Code != null ? $" {e.Response.Code}" : string.Empty));
                ResultLogList.SelectedIndex = firstIndex;
                if (e.Item.Score is double score)
                    QuizScoreText.Text = $"{e.Item.PopupId} · score: {score:0.##} · passed: {e.Item.Passed?.ToString().ToLowerInvariant()}";
                UpdateServerState();
            });
        }

        /// <summary>
        /// 목록 조회도 결과 전송처럼 로그 항목으로 남긴다. Header·Footer·폰트·content 등 서버가 내려주는
        /// 팝업 설정은 목록 응답에만 있으므로 응답 탭에서 확인·복사할 수 있게 한다.
        /// 요청은 실제 모드(PopupApiService)와 같은 GET /api/wpf/popups이며 본문이 없다.
        /// Demo에는 인증 토큰이 없어 Authorization·X-Dev-User-Id 헤더는 기록하지 않는다.
        /// 샘플 유형 선택은 Demo 화면 전용 필터라 요청 JSON이 아니라 로그 줄에만 표시한다.
        /// </summary>
        private void LogListQuery(string? popupType, WpfPopupListResponseDto response)
        {
            string request = JsonSerializer.Serialize(new
            {
                method = "GET",
                url = "/api/wpf/popups",
                headers = new Dictionary<string, string> { [ClientVersion.HeaderName] = ClientVersion.Value },
                body = (object?)null
            });
            int index = ResultLogList.Items.Count;
            _resultDetails[index] = (request, JsonSerializer.Serialize(response, LogJsonOptions));
            string ids = response.Popups.Count == 0 ? "표시할 팝업 없음" : string.Join(", ", response.Popups.Select(p => p.PopupId));
            AppendLog($"[{DateTime.Now:HH:mm:ss}] 목록 조회{(popupType == null ? string.Empty : $" ({popupType})")} → {ids}");
            ResultLogList.SelectedIndex = index;
            DetailTabs.SelectedIndex = 1;
        }

        private void ResultLogList_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (_resultDetails.TryGetValue(ResultLogList.SelectedIndex, out var details))
                ShowResultDetails(details);
            else
                ShowResultDetails(null);
        }

        private void ShowResultDetails((string Request, string Response)? details)
        {
            RequestJsonText.Text = details.HasValue ? FormatJson(details.Value.Request) : string.Empty;
            ResponseJsonText.Text = details.HasValue ? FormatJson(details.Value.Response) : string.Empty;
            CopyRequestButton.IsEnabled = CopyResponseButton.IsEnabled = details.HasValue;
            CopyStatusText.Text = details.HasValue ? "선택한 결과 · 텍스트 선택과 Ctrl+C로도 복사할 수 있습니다." : EmptyDetailText;
        }

        private static string FormatJson(string json)
        {
            using JsonDocument document = JsonDocument.Parse(json);
            return JsonSerializer.Serialize(document.RootElement, DisplayJsonOptions);
        }

        private void CopyJsonButton_Click(object sender, RoutedEventArgs e)
        {
            bool isRequest = sender is Button { Tag: "REQUEST" };
            string json = isRequest ? RequestJsonText.Text : ResponseJsonText.Text;
            if (string.IsNullOrEmpty(json)) return;
            try
            {
                Clipboard.SetText(json);
                CopyStatusText.Text = isRequest ? "요청 JSON을 복사했습니다." : "응답 JSON을 복사했습니다.";
            }
            catch (System.Runtime.InteropServices.ExternalException)
            {
                CopyStatusText.Text = "클립보드를 사용할 수 없습니다. 텍스트를 선택해 Ctrl+C로 다시 복사하세요.";
            }
        }

        private void AppendLog(string line)
        {
            ResultLogList.Items.Add(line);
            ResultLogList.ScrollIntoView(line);
        }

        private void UpdateServerState()
        {
            ServerStateText.Text = $"숨김 {_gateway.HiddenCount} · 완료 {_gateway.CompletedCount}";
        }
    }
}
