using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Effects;

namespace Popup.Views.Windows;

/// <summary>
/// 안내창 표시 형식. Default는 기존 공통 안내(검은 외곽선 1.2 DIP),
/// QuizCompletion은 퀴즈 완료 안내(외곽선 없이 섀도우로 흰 퀴즈 배경과 구분).
/// </summary>
public enum PopupAlertStyle
{
    Default,
    QuizCompletion
}

/*
 * POL-06-02 : 선택·제출
 * ■ 팝업 공통 안내 모달
 * - in : owner(Window?) 표시 중이면 가운데 기준 창 · message·title(string) · buttonText(string, 기본 "확인")
 *        · showHeading(bool, 기본 true) false면 title을 본문 위 굵은 제목으로 그리지 않는다(창 이름 Window.Title로만 남아 스크린리더·자동화가 찾을 수 있음).
 *        · style(PopupAlertStyle, 기본 Default) QuizCompletion은 단독 QUIZ·VIDEO+QUIZ 완료 안내에만 쓴다.
 * - out: 없음(Show는 닫힐 때까지 대기) · CreateDialog는 표시 전 Window를 돌려준다.
 * - 팝업의 제출·채점 안내에 사용하는 공통 모달. 테두리 없는 최상위 창이며 확인 버튼(Enter/Esc)으로 닫는다.
 * - QuizCompletion: 흰 판(모서리 22)에만 DropShadowEffect를 걸고 본문은 형제 레이어로 올려 글자가 효과 경로로 흐려지지 않게 한다.
 *   투명 창 둘레에 ShadowMargin만큼 여백을 두어 그림자가 창 경계에서 잘리지 않게 하고, 창 너비도 그만큼 늘려 흰 판 너비(430)는 기존과 같다.
 *   섀도우 초기값: 검정·불투명도 0.16·BlurRadius 20·ShadowDepth 4(아래 방향). 최종 수치는 Windows 실화면에서 확정한다.
 */
public static class PopupAlert
{
    internal const double PlateWidth = 430;
    internal const double ShadowOpacity = 0.16;
    internal const double ShadowBlurRadius = 20;
    internal const double ShadowDepth = 4;
    /// <summary>그림자 번짐(Blur)과 아래 방향 깊이(Depth)를 모두 담는 투명 여백. 사방 같은 값이라 흰 판이 창 가운데에 남는다.</summary>
    internal const double ShadowMargin = ShadowBlurRadius + ShadowDepth;

    public static void Show(Window? owner, string message, string title, string buttonText = "확인", bool showHeading = true,
        PopupAlertStyle style = PopupAlertStyle.Default)
    {
        CreateDialog(owner, message, title, buttonText, showHeading, style).ShowDialog();
    }

    internal static Window CreateDialog(Window? owner, string message, string title, string buttonText = "확인", bool showHeading = true,
        PopupAlertStyle style = PopupAlertStyle.Default)
    {
        bool completion = style == PopupAlertStyle.QuizCompletion;
        var dialog = new Window
        {
            Title = title, Width = completion ? PlateWidth + ShadowMargin * 2 : PlateWidth, SizeToContent = SizeToContent.Height,
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
        if (showHeading)
        {
            panel.Children.Add(new TextBlock { Text = title, FontSize = 25, FontWeight = FontWeights.Bold,
                Foreground = Brushes.Black, TextWrapping = TextWrapping.Wrap });
        }
        panel.Children.Add(new TextBlock { Text = message, FontSize = 15, Foreground = Brushes.Black,
            TextWrapping = TextWrapping.Wrap, Margin = new Thickness(0, showHeading ? 18 : 0, 0, 26), LineHeight = 24 });
        var button = new Button { Content = buttonText, IsDefault = true, IsCancel = true,
            HorizontalAlignment = HorizontalAlignment.Right, Style = (Style)dialog.FindResource("ActionButtonStyle") };
        button.Click += (_, _) => dialog.Close();
        panel.Children.Add(button);

        if (!completion)
        {
            dialog.Content = new Border { Background = Brushes.White, BorderBrush = Brushes.Black,
                BorderThickness = new Thickness(1.2), CornerRadius = new CornerRadius(22), Child = panel };
            return dialog;
        }

        var plate = new Border
        {
            Background = Brushes.White, CornerRadius = new CornerRadius(22),
            Effect = new DropShadowEffect
            {
                Color = Colors.Black, Opacity = ShadowOpacity, BlurRadius = ShadowBlurRadius,
                ShadowDepth = ShadowDepth, Direction = 270
            }
        };
        var body = new Border { Background = Brushes.Transparent, CornerRadius = new CornerRadius(22), Child = panel };
        var root = new Grid { Margin = new Thickness(ShadowMargin) };
        root.Children.Add(plate);
        root.Children.Add(body);
        dialog.Content = root;
        return dialog;
    }
}
