using System;
using System.Diagnostics;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media.Imaging;

namespace Popup.Views.Contents
{
    /// <summary>
    /// IMAGE의 FILL 및 ORIGINAL 모드. ORIGINAL은 원본 픽셀 크기를 유지하고 왼쪽 위에서 자른다.
    /// </summary>
    public partial class ImageFillPopupView : UserControl
    {
        private readonly string _imagePath;
        private readonly string _linkUrl;
        private readonly bool _useOriginalSize;

        public ImageFillPopupView(string imagePath, string linkUrl, bool useOriginalSize = false)
        {
            InitializeComponent();

            if (string.IsNullOrWhiteSpace(imagePath))
            {
                throw new ArgumentException("이미지 경로가 비어 있습니다.", nameof(imagePath));
            }

            _imagePath = imagePath;
            _linkUrl = linkUrl ?? string.Empty;
            _useOriginalSize = useOriginalSize;
            if (_useOriginalSize)
            {
                PopupImage.Visibility = Visibility.Collapsed;
                OriginalCanvas.Visibility = Visibility.Visible;
            }

            if (!string.IsNullOrWhiteSpace(_linkUrl))
            {
                PopupImage.Cursor = Cursors.Hand;
                PopupImage.ToolTip = _linkUrl;
                OriginalImage.Cursor = Cursors.Hand;
                OriginalImage.ToolTip = _linkUrl;
            }

            Loaded += ImageFillPopupView_Loaded;
        }

        private void ImageFillPopupView_Loaded(object sender, RoutedEventArgs e)
        {
            Loaded -= ImageFillPopupView_Loaded;
            LoadImage(_imagePath);
        }

        private void LoadImage(string imagePath)
        {
            try
            {
                BitmapImage bitmapImage;

                if (imagePath.StartsWith("data:image/", StringComparison.OrdinalIgnoreCase))
                {
                    int commaIndex = imagePath.IndexOf(',');
                    if (commaIndex < 0)
                    {
                        throw new InvalidOperationException("올바른 Base64 이미지 형식이 아닙니다.");
                    }

                    string base64 = imagePath[(commaIndex + 1)..];
                    byte[] imageBytes = Convert.FromBase64String(base64);

                    using MemoryStream stream = new MemoryStream(imageBytes);
                    bitmapImage = new BitmapImage();
                    bitmapImage.BeginInit();
                    bitmapImage.CacheOption = BitmapCacheOption.OnLoad;
                    bitmapImage.StreamSource = stream;
                    bitmapImage.EndInit();
                    bitmapImage.Freeze();
                }
                else
                {
                    bitmapImage = new BitmapImage();
                    bitmapImage.BeginInit();
                    bitmapImage.CacheOption = BitmapCacheOption.OnLoad;
                    bitmapImage.CreateOptions = BitmapCreateOptions.IgnoreImageCache;
                    bitmapImage.UriSource = new Uri(imagePath, UriKind.RelativeOrAbsolute);
                    bitmapImage.EndInit();
                }

                PopupImage.Source = bitmapImage;
                if (_useOriginalSize)
                {
                    // 이미지 메타데이터 DPI와 무관하게 원본 1px를 1 DIP로 표시한다.
                    // Canvas의 DesiredSize는 이미지 크기를 따르지 않아 팝업이 커지지 않는다.
                    void ApplyOriginalSize()
                    {
                        OriginalImage.Source = bitmapImage;
                        OriginalImage.Width = bitmapImage.PixelWidth;
                        OriginalImage.Height = bitmapImage.PixelHeight;
                    }
                    if (bitmapImage.IsDownloading)
                        bitmapImage.DownloadCompleted += (_, _) => ApplyOriginalSize();
                    else
                        ApplyOriginalSize();
                }
            }
            catch (Exception exception)
            {
                MessageBox.Show(Window.GetWindow(this)!,
                    $"이미지를 불러오지 못했습니다.\n{exception.Message}",
                    "이미지 오류",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }

        private void PopupImage_MouseLeftButtonUp(object sender, MouseButtonEventArgs e)
        {
            if (string.IsNullOrWhiteSpace(_linkUrl))
            {
                return;
            }

            if (!Uri.TryCreate(_linkUrl, UriKind.Absolute, out Uri? uri)
                || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                MessageBox.Show(Window.GetWindow(this)!,
                    "클릭 연결 URL은 http 또는 https 주소만 사용할 수 있습니다.",
                    "링크 오류",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);
                return;
            }

            try
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = uri.AbsoluteUri,
                    UseShellExecute = true
                });
            }
            catch (Exception exception)
            {
                MessageBox.Show(Window.GetWindow(this)!,
                    $"링크를 열지 못했습니다.\n{exception.Message}",
                    "링크 오류",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }
    }
}
