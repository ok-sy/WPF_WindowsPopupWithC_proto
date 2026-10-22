using Popup.Dtos;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;

namespace Popup.Views.Contents
{
    /*
     * POL-03-01 : 저장·표시 경계
     * ■ TEXT 팝업 콘텐츠 뷰
     * - in : 강조 문구·하단 설명·하단 설명 URL·일반 본문 문자열과 각 표시 여부 · textBlocks(IReadOnlyList<PopupTextBlockDto>?) 서식 본문
     * - out: 화면: 서식 본문(없으면 일반 본문)·강조 문구·하단 설명(http/https URL이면 링크)
     * - 서식 본문이 있으면 PopupRichText로 문단·Run을 표시하고 일반 본문은 숨긴다. HTML/XAML 문자열은 로드하지 않는다.
     */
    public partial class TextPopupView : UserControl, IBodyFontSizeAware
    {
        /*
         * POL-01-01 : 공통 옵션의 위치
         * POL-01-02 : 기본값의 적용
         * ■ 관리자 본문 폰트 크기 적용
         * - in : fontSize(double) PopupWindow가 10~40으로 보정한 크기
         * - out: 없음 · 본문 TextBlock들의 FontSize·LineHeight 변경
         * TEXT 팝업의 본문 = 일반 텍스트·서식 본문·강조 문구·하단 설명(BodyTextStyle, 기본 15).
         * LineHeight(기본 24 = 15 × 1.6)는 같은 비율로 맞춘다.
         */
        public void ApplyBodyFontSize(double fontSize)
        {
            double lineHeight = Math.Round(fontSize * 1.6);
            // POL-01-02 : 기본값의 적용 — 서식 본문 문단도 기본 크기를 따른다. 구간에 지정한 크기(Run.FontSize)는 그대로 유지된다.
            foreach (TextBlock textBlock in new[] { PlainTextBlock, HighlightTextBlock, BottomDescriptionText }
                         .Concat(RichTextPanel.Children.OfType<TextBlock>()))
            {
                textBlock.FontSize = fontSize;
                textBlock.LineHeight = lineHeight;
            }
            // POL-03-01 : 저장·표시 경계 — 기본 크기를 따르는 기울임 구간이 커졌을 수 있으므로 오른쪽 여유를 다시 맞춘다.
            foreach (TextBlock paragraph in RichTextPanel.Children.OfType<TextBlock>()) PopupRichText.ReserveItalicOverhang(paragraph);
        }

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
         * ■ TEXT 팝업 화면 구성 생성자
         * - in : highlightText/showHighlight · bottomDescription/bottomDescriptionUrl/showBottomDescription
         *        · plainText/showPlainText · textBlocks(서식 본문, 선택)
         * - out: 없음 · 화면 요소 값·표시 여부 설정
         * - 서버 DTO에서 전달받은 값으로 TEXT 팝업 화면을 구성한다.
         *   markdown 모드는 없다. TEXT 팝업은 서식 본문(또는 plainText)·highlightText·bottomDescription만 표시한다.
         *   하단 설명이 비어 있으면 URL을 문구로 쓰고, http/https URL이면 기본 브라우저로 여는 링크로 만든다.
         */
        public TextPopupView(
            string highlightText,
            bool showHighlight,
            string bottomDescription,
            string bottomDescriptionUrl,
            bool showPlainText,
            string plainText,
            bool showBottomDescription,
            IReadOnlyList<PopupTextBlockDto>? textBlocks = null)
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
                // POL-03-01 : 저장·표시 경계 — TEXT 전용 콘텐츠 제목·설명 영역은 없다. 제목·설명은 서식 본문 앞 문단으로 표시된다.
                PlainTextBlock.Text = plainText;
                PlainTextBlock.Visibility = showPlainText
                    ? Visibility.Visible
                    : Visibility.Collapsed;

                /*
                 * POL-03-01 : 저장·표시 경계
                 * 서식 본문이 있으면 문단·Run으로 표시하고 일반 본문은 숨긴다.
                 * 서식 본문이 없는 기존 데이터는 위 plainText 표시를 그대로 쓴다.
                 */
                List<TextBlock> paragraphs = PopupRichText.CreateParagraphs(textBlocks, (Style)FindResource("BodyTextStyle"));
                if (paragraphs.Count > 0)
                {
                    foreach (TextBlock paragraph in paragraphs) RichTextPanel.Children.Add(paragraph);
                    RichTextPanel.Visibility = PlainTextBlock.Visibility;
                    PlainTextBlock.Visibility = Visibility.Collapsed;
                }

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
