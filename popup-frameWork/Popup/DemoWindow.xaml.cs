using Popup.Dtos;
using Popup.Managers;
using Popup.Models;
using Popup.Services;
using System.Windows;
using System.Windows.Controls;

namespace Popup
{
    /// <summary>Java API 없이 샘플 팝업을 확인하는 전용 화면이다.</summary>
    public partial class DemoWindow : Window
    {
        private readonly PopupManager _popupManager;
        private readonly PopupService _popupService;

        public DemoWindow()
        {
            InitializeComponent();
            _popupManager = new PopupManager(this);
            _popupService = new PopupService();
        }

        private void OpenAllPopupsButton_Click(object sender, RoutedEventArgs e) =>
            ShowDemoPopups();

        private void OpenPopupButton_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button { Tag: string popupType })
            {
                ShowDemoPopups(popupType);
            }
        }

        public void ShowDemoPopups(string? popupType = null)
        {
            try
            {
                IEnumerable<PopupResponseDto> popupDtos =
                    DemoPopupDataService.CreatePopups(
                        popupType);

                List<PopupOptions> popupOptions = _popupService.CreatePopupOptions(popupDtos);
                _popupManager.ShowRange(popupOptions);
            }
            catch (Exception exception)
            {
                MessageBox.Show(
                    "Demo Mode 팝업을 만드는 중 오류가 발생했습니다.\n\n" + exception.Message,
                    "Demo Mode 오류",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
            }
        }
    }
}
