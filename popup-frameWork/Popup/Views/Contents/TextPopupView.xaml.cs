using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;

namespace Popup.Views.Contents
{
    public partial class TextPopupView : UserControl
    {
        /*
         * Visual Studio 미리보기 또는
         * 기존 코드에서 사용하는 기본 생성자
         */
        public TextPopupView()
        {
            /*
             * TextPopupView.xaml을 읽어서
             * 화면 요소를 생성한다.
             */
            InitializeComponent();
        }

        /*
         * 서버 DTO에서 전달받은 값으로
         * TEXT 팝업 화면을 구성하는 생성자
         *
         * [2026-09-21 제거] markdown 모드(markdownMode/markdownContent, 자체 markdown 렌더러)는 사용하지 않기로 해
         * 관련 매개변수·렌더링 코드를 삭제했다. TEXT 팝업은 plainText·highlightText·bottomDescription만 표시한다.
         */
        public TextPopupView(
            string contentTitle,
            string description,
            string highlightText,
            bool showHighlight,
            string bottomDescription,
            string bottomDescriptionUrl,
            bool showContentHeader,
            bool showPlainText,
            string plainText,
            bool showBottomDescription)
            {
                /*
                 * TextPopupView.xaml을 읽어서
                 * x:Name이 지정된 화면 요소를 생성한다.
                 *
                 * 이 코드보다 먼저 TextBlock에 접근하면
                 * 아직 객체가 만들어지지 않아 오류가 발생한다.
                 */
                InitializeComponent();

                /*
                 * DTO에서 전달받은 값을
                 * 화면의 각 TextBlock에 표시한다.
                 */
                ContentTitleText.Text =
                    contentTitle;

                ContentDescriptionText.Text =
                    description;

                ContentHeaderPanel.Visibility = showContentHeader
                    ? Visibility.Visible
                    : Visibility.Collapsed;

                PlainTextBlock.Text = plainText;
                PlainTextBlock.Visibility = showPlainText
                    ? Visibility.Visible
                    : Visibility.Collapsed;

                HighlightTextBlock.Text = highlightText;
                HighlightContainer.Visibility = showHighlight
                    ? Visibility.Visible
                    : Visibility.Collapsed;

                if (string.IsNullOrWhiteSpace(bottomDescription)) bottomDescription = bottomDescriptionUrl;
                BottomDescriptionText.Inlines.Clear();
                if (Uri.TryCreate(bottomDescriptionUrl?.Trim(), UriKind.Absolute, out Uri? linkUri)
                    && (linkUri.Scheme == Uri.UriSchemeHttp || linkUri.Scheme == Uri.UriSchemeHttps))
                {
                    var link = new Hyperlink(new Run(bottomDescription))
                    {
                        NavigateUri = linkUri,
                        ToolTip = linkUri.AbsoluteUri
                    };
                    link.RequestNavigate += (_, args) =>
                    {
                        args.Handled = true;
                        try
                        {
                            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
                            {
                                FileName = linkUri.AbsoluteUri,
                                UseShellExecute = true
                            });
                        }
                        catch (Exception)
                        {
                            MessageBox.Show(Window.GetWindow(this)!, "링크를 열지 못했습니다. 기본 브라우저 설정을 확인해 주세요.", "링크 오류",
                                MessageBoxButton.OK, MessageBoxImage.Warning);
                        }
                    };
                    BottomDescriptionText.Inlines.Add(link);
                }
                else BottomDescriptionText.Inlines.Add(new Run(bottomDescription));
                BottomDescriptionText.Visibility =
                    !showBottomDescription || string.IsNullOrWhiteSpace(bottomDescription)
                        ? Visibility.Collapsed
                        : Visibility.Visible;

            }
        }
}
