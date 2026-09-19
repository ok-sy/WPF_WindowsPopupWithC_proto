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
            bool showBottomDescription,
            bool? markdownMode,
            string markdownContent)
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

                bool useMarkdown = markdownMode == true
                    || (markdownMode == null
                        && !string.IsNullOrWhiteSpace(markdownContent));

                PlainTextBlock.Text = plainText;
                PlainTextBlock.Visibility = !useMarkdown && showPlainText
                    ? Visibility.Visible
                    : Visibility.Collapsed;

                HighlightTextBlock.Text = highlightText;
                HighlightContainer.Visibility = !useMarkdown && showHighlight
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
                            MessageBox.Show("링크를 열지 못했습니다. 기본 브라우저 설정을 확인해 주세요.", "링크 오류",
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

                MarkdownPanel.Visibility = useMarkdown
                    ? Visibility.Visible
                    : Visibility.Collapsed;
                if (useMarkdown)
                {
                    RenderMarkdown(markdownContent);
                }
            }

        private void RenderMarkdown(string markdown)
        {
            MarkdownPanel.Children.Clear();
            foreach (string sourceLine in (markdown ?? string.Empty).Replace("\r", string.Empty).Split('\n'))
            {
                string line = sourceLine.TrimEnd();
                TextBlock block = new TextBlock
                {
                    TextWrapping = TextWrapping.Wrap,
                    Margin = new Thickness(0, 0, 0, 8),
                    FontSize = 15
                };

                string content = line;
                if (line.StartsWith("### "))
                {
                    block.FontSize = 17;
                    block.FontWeight = FontWeights.SemiBold;
                    content = line.Substring(4);
                }
                else if (line.StartsWith("## "))
                {
                    block.FontSize = 20;
                    block.FontWeight = FontWeights.Bold;
                    content = line.Substring(3);
                }
                else if (line.StartsWith("# "))
                {
                    block.FontSize = 24;
                    block.FontWeight = FontWeights.Bold;
                    content = line.Substring(2);
                }
                else if (line.StartsWith("- ") || line.StartsWith("* "))
                {
                    content = "• " + line.Substring(2);
                    block.Margin = new Thickness(14, 0, 0, 6);
                }

                AddInlineMarkdown(block, content);
                MarkdownPanel.Children.Add(block);
            }
        }

        private static void AddInlineMarkdown(TextBlock block, string content)
        {
            int position = 0;
            while (position < content.Length)
            {
                int boldStart = content.IndexOf("**", position, StringComparison.Ordinal);
                int codeStart = content.IndexOf('`', position);
                int tokenStart = boldStart < 0
                    ? codeStart
                    : codeStart < 0 ? boldStart : Math.Min(boldStart, codeStart);
                if (tokenStart < 0)
                {
                    block.Inlines.Add(new Run(content.Substring(position)));
                    break;
                }
                if (tokenStart > position)
                {
                    block.Inlines.Add(new Run(content.Substring(position, tokenStart - position)));
                }

                if (tokenStart == codeStart)
                {
                    int codeEnd = content.IndexOf('`', codeStart + 1);
                    if (codeEnd < 0)
                    {
                        block.Inlines.Add(new Run(content.Substring(codeStart)));
                        break;
                    }
                    block.Inlines.Add(new Run(content.Substring(
                        codeStart + 1, codeEnd - codeStart - 1))
                    {
                        FontFamily = new System.Windows.Media.FontFamily("Consolas"),
                        Background = new System.Windows.Media.SolidColorBrush(
                            System.Windows.Media.Color.FromRgb(238, 241, 245))
                    });
                    position = codeEnd + 1;
                    continue;
                }

                int boldEnd = content.IndexOf("**", boldStart + 2, StringComparison.Ordinal);
                if (boldEnd < 0)
                {
                    block.Inlines.Add(new Run(content.Substring(boldStart)));
                    break;
                }
                block.Inlines.Add(new Run(content.Substring(boldStart + 2, boldEnd - boldStart - 2))
                {
                    FontWeight = FontWeights.Bold
                });
                position = boldEnd + 2;
            }
        }
        }
}
