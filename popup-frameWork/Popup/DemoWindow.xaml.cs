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
                ShowDemoPopups(popupType);
            }
        }

        private void ResetServerButton_Click(object sender, RoutedEventArgs e)
        {
            _gateway.Reload();
            UpdateServerState();
            AppendLog("--- 서버 상태 초기화 (숨김·완료·영수증 삭제) ---");
        }

        private void ClearLogButton_Click(object sender, RoutedEventArgs e) => ResultLogList.Items.Clear();

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

                List<PopupOptions> popupOptions = _popupService.CreatePopupOptions(response.Popups);
                foreach (PopupOptions options in popupOptions)
                {
                    options.ReportResultAsync = _resultQueue.EnqueueAndSendAsync;
                    options.ReportResultImmediateAsync = _resultQueue.SendImmediateAsync;
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
