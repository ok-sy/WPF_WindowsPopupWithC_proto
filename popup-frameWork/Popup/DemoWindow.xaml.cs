using Popup.Dtos;
using Popup.Managers;
using Popup.Models;
using Popup.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
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
        private static readonly JsonSerializerOptions LogJsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
        };

        private readonly PopupManager _popupManager;
        private readonly PopupService _popupService;
        private readonly DemoPopupGateway _gateway;
        private readonly PopupResultQueue _resultQueue;

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
            UpdateServerState();
        }

        private void OpenAllPopupsButton_Click(object sender, RoutedEventArgs e) => ShowDemoPopups();

        private void OpenPopupButton_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button { Tag: string popupType })
            {
                if (popupType == "IMAGE_ORIGINAL")
                {
                    ImageModeCombo.SelectedIndex = 0;
                    popupType = "IMAGE";
                }
                ShowDemoPopups(popupType);
            }
        }

        private void ResetServerButton_Click(object sender, RoutedEventArgs e)
        {
            _gateway.Reload();
            UpdateServerState();
            AppendLog("--- 서버 상태 초기화 (숨김·완료·영수증 삭제) ---");
        }

        private void ClearLogButton_Click(object sender, RoutedEventArgs e)
        {
            ResultLogList.Items.Clear();
            QuizScoreText.Text = "퀴즈 완료 후 score / passed가 여기에 표시됩니다.";
        }

        /// <summary>
        /// 실제 모드의 MainWindow.LoadAndShowAvailablePopupsAsync와 같은 순서:
        /// 미전송 큐 flush → 목록 조회(숨김·완료 제외) → PopupOptions 변환 → 결과 훅 연결 → 표시.
        /// </summary>
        public async void ShowDemoPopups(string? popupType = null)
        {
            try
            {
                if (_popupManager.HasOpenPopups)
                {
                    MessageBox.Show("표시 중인 팝업이 있습니다. 먼저 닫아 주세요.", "Demo Mode",
                        MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }

                await _resultQueue.FlushAsync();
                WpfPopupListResponseDto response = await _gateway.GetWpfPopupsAsync(popupType);
                if (response.Popups.Count == 0)
                {
                    MessageBox.Show(
                        "표시할 팝업이 없습니다. (숨김·완료 상태이면 '서버 상태 초기화'를 누르세요)",
                        "Demo Mode", MessageBoxButton.OK, MessageBoxImage.Information);
                    return;
                }

                bool needsLink = response.Popups.Any(p => p.PopupId == "DEMO-FOOTER-LINK"
                    || (p.PopupId == "DEMO-VIDEO-QUIZ" && VideoQuizLinkCheck.IsChecked == true));
                string linkText = FooterLinkInput.Text.Trim();
                if (needsLink && (!Uri.TryCreate(linkText, UriKind.Absolute, out var link)
                    || (link.Scheme != Uri.UriSchemeHttp && link.Scheme != Uri.UriSchemeHttps)
                    || string.IsNullOrWhiteSpace(link.Host)))
                {
                    MessageBox.Show(this, "바로가기 URL에 http 또는 https 주소를 입력해 주세요.", "Demo Mode",
                        MessageBoxButton.OK, MessageBoxImage.Warning);
                    return;
                }
                double completionRatio = double.Parse(
                    (VideoCompletionCombo.SelectedItem as ComboBoxItem)?.Tag as string ?? "0.8",
                    System.Globalization.CultureInfo.InvariantCulture);
                foreach (PopupResponseDto popup in response.Popups)
                {
                    if (popup.PopupId is not ("DEMO-FOOTER-LINK" or "DEMO-VIDEO-QUIZ")) continue;
                    JsonObject content = JsonNode.Parse(popup.Content.GetRawText())!.AsObject();
                    bool useLink = popup.PopupId == "DEMO-FOOTER-LINK" || VideoQuizLinkCheck.IsChecked == true;
                    content["footerAction"] = useLink ? "LINK_AND_CLOSE" : "CLOSE";
                    content["footerLinkUrl"] = useLink ? linkText : string.Empty;
                    popup.Content = JsonSerializer.SerializeToElement(content);
                    if (popup.PopupId == "DEMO-VIDEO-QUIZ") popup.CompletionRatio = completionRatio;
                }

                string[] layouts = {
                    (Question1LayoutCombo.SelectedItem as ComboBoxItem)?.Tag as string ?? "VERTICAL",
                    (Question2LayoutCombo.SelectedItem as ComboBoxItem)?.Tag as string ?? "VERTICAL"
                };
                foreach (PopupResponseDto popup in response.Popups.Where(p => p.PopupType == "IMAGE"))
                {
                    JsonObject content = JsonNode.Parse(popup.Content.GetRawText())!.AsObject();
                    content["imageSizeMode"] = (ImageModeCombo.SelectedItem as ComboBoxItem)?.Tag as string ?? "ORIGINAL";
                    popup.Content = JsonSerializer.SerializeToElement(content);
                }
                foreach (PopupResponseDto popup in response.Popups.Where(p => p.PopupType is "SURVEY" or "QUIZ"))
                {
                    for (int i = 0; i < Math.Min(layouts.Length, popup.Questions.Count); i++)
                        popup.Questions[i].OptionLayout = layouts[i];
                    JsonObject content = JsonNode.Parse(popup.Content.GetRawText())!.AsObject();
                    if (content["questions"] is JsonArray questions)
                        for (int i = 0; i < Math.Min(layouts.Length, questions.Count); i++)
                            questions[i]!["optionLayout"] = layouts[i];
                    popup.Content = JsonSerializer.SerializeToElement(content);
                }
                AppendLog($"--- 문항별 배치: 1번 {layouts[0]}, 2번 {layouts[1]} ---");
                List<PopupOptions> popupOptions = _popupService.CreatePopupOptions(response.Popups);
                foreach (PopupOptions options in popupOptions)
                {
                    // [설계 12] 운영 코드(MainWindow)와 같은 훅: 로컬 큐 저장 → 창 닫기 → 백그라운드 전송(데모 게이트웨이)
                    options.EnqueueResultAsync = _resultQueue.EnqueueAsync;
                    options.FlushResultsInBackground = _resultQueue.FlushInBackground;
                }
                AppendLog($"--- 목록 조회: {string.Join(", ", response.Popups.Select(p => p.PopupId))} ---");
                _popupManager.ShowRange(popupOptions);
            }
            catch (Exception exception)
            {
                MessageBox.Show(
                    "Demo Mode 팝업을 만드는 중 오류가 발생했습니다.\n\n" + exception.Message,
                    "Demo Mode 오류", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private void Gateway_ResultProcessed(object? sender, (WpfResultItemDto Item, WpfResultItemResponseDto Response) e)
        {
            Dispatcher.Invoke(() =>
            {
                AppendLog($"[{DateTime.Now:HH:mm:ss}] {e.Item.ResultType,-13} {e.Item.PopupId} → {e.Response.Status}"
                          + (e.Response.Code != null ? $" {e.Response.Code}" : string.Empty));
                AppendLog("  요청: " + JsonSerializer.Serialize(e.Item, LogJsonOptions));
                AppendLog("  응답: " + JsonSerializer.Serialize(e.Response, LogJsonOptions));
                if (e.Item.Score is double score)
                    QuizScoreText.Text = $"{e.Item.PopupId} · score: {score:0.##} · passed: {e.Item.Passed?.ToString().ToLowerInvariant()}";
                UpdateServerState();
            });
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
