using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;

namespace Popup.Views.Windows;

/*
 * POL-06-02 : 선택·제출
 * ■ 팝업 공통 안내 모달
 * - in : owner(Window?) 표시 중이면 가운데 기준 창 · message·title(string) · buttonText(string, 기본 "확인")
 * - out: 없음(Show는 닫힐 때까지 대기) · CreateDialog는 표시 전 Window를 돌려준다.
 * - 팝업의 제출·채점 안내에 사용하는 공통 모달. 테두리 없는 최상위 창이며 확인 버튼(Enter/Esc)으로 닫는다.
 */
public static class PopupAlert
{
    public static void Show(Window? owner, string message, string title, string buttonText = "확인")
    {
        CreateDialog(owner, message, title, buttonText).ShowDialog();
    }

    internal static Window CreateDialog(Window? owner, string message, string title, string buttonText = "확인")
    {
        var dialog = new Window
        {
            Title = title, Width = 430, SizeToContent = SizeToContent.Height,
            WindowStyle = WindowStyle.None, ResizeMode = ResizeMode.NoResize,
            AllowsTransparency = true, Background = Brushes.Transparent,
            ShowInTaskbar = false, Topmost = true,
            WindowStartupLocation = owner?.IsVisible == true ? WindowStartupLocation.CenterOwner : WindowStartupLocation.CenterScreen
        };
        if (owner?.IsVisible == true) dialog.Owner = owner;
        dialog.Resources.MergedDictionaries.Add(new ResourceDictionary
        {
            Source = new System.Uri("/popupSample;component/Views/Windows/PopupStyles.xaml", System.UriKind.Relative)
        });
        var panel = new StackPanel { Margin = new Thickness(30) };
        panel.Children.Add(new TextBlock { Text = title, FontSize = 25, FontWeight = FontWeights.Bold,
            Foreground = Brushes.Black, TextWrapping = TextWrapping.Wrap });
        panel.Children.Add(new TextBlock { Text = message, FontSize = 15, Foreground = Brushes.Black,
            TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, 18, 0, 26), LineHeight = 24 });
        var button = new Button { Content = buttonText, IsDefault = true, IsCancel = true,
            HorizontalAlignment = HorizontalAlignment.Right, Style = (Style)dialog.FindResource("ActionButtonStyle") };
        button.Click += (_, _) => dialog.Close();
        panel.Children.Add(button);
        dialog.Content = new Border { Background = Brushes.White, BorderBrush = Brushes.Black,
            BorderThickness = new Thickness(2), CornerRadius = new CornerRadius(22), Child = panel };
        return dialog;
    }
}
