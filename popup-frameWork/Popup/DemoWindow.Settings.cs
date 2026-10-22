using Popup.Dtos;
using Popup.Services;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;

namespace Popup
{
    /*
     * POL-14-02 : Demo 모드
     * ■ Demo 샘플 설정(인메모리 Demo)
     * - 샘플 목록을 게이트웨이에 등록하고, 선택한 샘플의 요약 표시와 상세옵션 편집(DemoOptionsWindow) 결과를 반영한다.
     */
    public partial class DemoWindow
    {
        private readonly Dictionary<string, PopupResponseDto> _configuredPopups = new();

        private void InitializeDemoSettings()
        {
            foreach (PopupResponseDto popup in DemoPopupDataService.CreatePopups())
            {
                _configuredPopups[popup.PopupId] = popup;
                _gateway.ConfigurePopup(popup);
            }
            UpdateScenarioSummary();
        }

        private string SelectedPopupId => (ScenarioCombo.SelectedItem as ComboBoxItem)?.Tag as string ?? "DEMO-TEXT-001";

        private void ScenarioCombo_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (ScenarioSummaryText != null) UpdateScenarioSummary();
        }

        private void UpdateScenarioSummary()
        {
            if (!_configuredPopups.TryGetValue(SelectedPopupId, out var popup)) return;
            string dimensions = popup.SizeMode == "RATIO" ? $"{popup.WidthRatio:P0} × {popup.HeightRatio:P0}"
                : popup.SizeMode == "FULLSCREEN" ? "전체화면" : $"{popup.Width ?? 900:0.##} × {popup.Height ?? 620:0.##}";
            // POL-04-01 : 공통 크기 입력 — IMAGE는 같은 너비·높이를 모드별로 해석한다(FIT_TO_IMAGE는 이미지 콘텐츠 영역, 생략 축은 원본 기준).
            if (popup.PopupType == "IMAGE" && popup.SizeMode != "FULLSCREEN")
                dimensions = $"{popup.Width?.ToString("0.##") ?? "원본"} × {popup.Height?.ToString("0.##") ?? "원본"}"
                    + (popup.Content.GetProperty("imageSizeMode").GetString() == "FIT_TO_IMAGE" ? " (이미지 콘텐츠 영역)" : " (팝업 창)");
            ScenarioSummaryText.Text = $"{popup.Title}\n창: {popup.SizeMode} · {dimensions}\n"
                + $"헤더 {(popup.ShowHeader ? "표시" : "숨김")} · 푸터 {(popup.ShowFooter ? "표시" : "숨김")}\n"
                + $"표시 방식: {popup.DisplayMode} · 순서 {popup.DisplayOrder}";
            if (popup.PopupType == "IMAGE")
                ScenarioSummaryText.Text += "\n이미지: " + popup.Content.GetProperty("imageSizeMode").GetString();
            // POL-03-01 : 저장·표시 경계 — TEXT 샘플은 서식 본문 사용 여부를 함께 보여 준다.
            if (popup.PopupType == "TEXT")
                ScenarioSummaryText.Text += "\n본문: " + (popup.Content.TryGetProperty("textBlocks", out var textBlocks)
                    && textBlocks.ValueKind == System.Text.Json.JsonValueKind.Array
                    ? $"서식 본문 {textBlocks.GetArrayLength()}문단" : "일반 텍스트");
            // POL-05-01 : 재생 경로 — 영상 샘플은 재생 위치 변경(Seek) 허용 여부를 함께 보여 준다. 생략 시 허용.
            bool hasVideo = popup.PopupType == "VIDEO" || (popup.Content.TryGetProperty("videoEnabled", out var videoEnabled)
                && videoEnabled.ValueKind == System.Text.Json.JsonValueKind.True);
            if (hasVideo)
                ScenarioSummaryText.Text += "\n영상: 재생 위치 변경 " + (popup.Content.TryGetProperty("allowSeek", out var seek)
                    && seek.ValueKind == System.Text.Json.JsonValueKind.False ? "제한" : "허용");
        }

        private bool CanEditOptions()
        {
            if (!_isLoading && !_popupManager.HasOpenPopups) return true;
            MessageBox.Show(this, "표시 중인 팝업을 닫은 뒤 옵션을 변경하세요.", "Demo 옵션", MessageBoxButton.OK, MessageBoxImage.Information);
            return false;
        }

        private void EditOptionsButton_Click(object sender, RoutedEventArgs e)
        {
            if (!CanEditOptions()) return;
            // POL-14-02 : Demo 모드 — 기본값 기준은 샘플 원본이다(탭별 복원·변경 표시). 편집은 복사본에서만 하고 적용할 때만 반영한다.
            PopupResponseDto original = DemoPopupDataService.CreatePopups().Single(p => p.PopupId == SelectedPopupId);
            var editor = new DemoOptionsWindow(_configuredPopups[SelectedPopupId], original) { Owner = this };
            if (editor.ShowDialog() != true || editor.Result == null) return;
            _configuredPopups[SelectedPopupId] = editor.Result;
            _gateway.ConfigurePopup(editor.Result);
            UpdateScenarioSummary();
            AppendLog("--- 옵션 적용: " + editor.Result.Title + " ---");
        }

        private void ResetOptionsButton_Click(object sender, RoutedEventArgs e)
        {
            if (!CanEditOptions()) return;
            var popup = DemoPopupDataService.CreatePopups().Single(p => p.PopupId == SelectedPopupId);
            _configuredPopups[popup.PopupId] = popup;
            _gateway.ConfigurePopup(popup);
            UpdateScenarioSummary();
            AppendLog("--- 옵션 기본값 복원: " + popup.Title + " ---");
        }

        private void OpenSelectedPopupButton_Click(object sender, RoutedEventArgs e)
        {
            string type = SelectedPopupId switch
            {
                "DEMO-VIDEO-QUIZ" => "VIDEO_QUIZ", "DEMO-FOOTER-LINK" => "FOOTER_LINK", "DEMO-SURVEY-PLAIN" => "SURVEY_PLAIN",
                _ => _configuredPopups[SelectedPopupId].PopupType
            };
            ShowDemoPopups(type);
        }
    }
}
