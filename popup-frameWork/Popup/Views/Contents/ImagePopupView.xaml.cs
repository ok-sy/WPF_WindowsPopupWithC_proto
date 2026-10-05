using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Popup.Models;

namespace Popup.Views.Contents
{
    public partial class ImagePopupView : UserControl, IBodyFontSizeAware
    {
        private readonly string _imagePath;
        private readonly ImagePopupSizeMode _sizeMode;
        private readonly double? _requestedImageWidth;
        private readonly double? _requestedImageHeight;
        private readonly bool _keepAspectRatio;
        private readonly bool _showDescription;
        private BitmapSource? _bitmap;
        private double _maximumContentWidth = double.PositiveInfinity;
        private double _maximumContentHeight = double.PositiveInfinity;
        private Size _lastRecommendation;
        public event Action<double, double>? RecommendedSizeChanged;
        public bool NeedsNaturalWindowSize => _sizeMode == ImagePopupSizeMode.FitToImage
            || !_requestedImageWidth.HasValue || !_requestedImageHeight.HasValue;
        public double? RequestedWindowWidth => _sizeMode == ImagePopupSizeMode.Adaptive ? _requestedImageWidth : null;
        public double? RequestedWindowHeight => _sizeMode == ImagePopupSizeMode.Adaptive ? _requestedImageHeight : null;

        public void SetAvailableBounds(double width, double height)
        {
            _maximumContentWidth = Math.Max(1, width);
            _maximumContentHeight = Math.Max(1, height);
            _lastRecommendation = default;
            UpdateLayoutForImage();
        }

        public ImagePopupView(string imageTitle, string imagePath, string imageDescription,
            bool showDescription = true, ImagePopupSizeMode sizeMode = ImagePopupSizeMode.Adaptive,
            double? imageWidth = null, double? imageHeight = null, bool keepAspectRatio = true)
        {
            InitializeComponent();
            if (string.IsNullOrWhiteSpace(imagePath)) throw new ArgumentException("이미지 경로가 비어 있습니다.", nameof(imagePath));
            ValidateDimension(imageWidth, nameof(imageWidth));
            ValidateDimension(imageHeight, nameof(imageHeight));
            _imagePath = imagePath;
            _sizeMode = sizeMode;
            _requestedImageWidth = imageWidth;
            _requestedImageHeight = imageHeight;
            _keepAspectRatio = keepAspectRatio;
            _showDescription = showDescription;
            ImageTitleText.Text = imageTitle;
            ImageTitleText.Visibility = string.IsNullOrWhiteSpace(imageTitle) ? Visibility.Collapsed : Visibility.Visible;
            ImageDescriptionText.Text = imageDescription;
            DescriptionContainer.Visibility = showDescription && !string.IsNullOrWhiteSpace(imageDescription)
                ? Visibility.Visible : Visibility.Collapsed;
            Loaded += OnLoaded;
            SizeChanged += (_, _) => UpdateLayoutForImage();
            var descriptor = System.ComponentModel.DependencyPropertyDescriptor.FromProperty(TextBlock.TextProperty, typeof(TextBlock));
            EventHandler onTextChanged = (_, _) => UpdateLayoutForImage();
            descriptor.AddValueChanged(ImageTitleText, onTextChanged);
            descriptor.AddValueChanged(ImageDescriptionText, onTextChanged);
            Unloaded += (_, _) => {
                descriptor.RemoveValueChanged(ImageTitleText, onTextChanged);
                descriptor.RemoveValueChanged(ImageDescriptionText, onTextChanged);
            };
        }

        private static void ValidateDimension(double? value, string name)
        {
            if (value.HasValue && (!double.IsFinite(value.Value) || value.Value <= 0))
                throw new ArgumentOutOfRangeException(name, "크기는 0보다 큰 유한한 값이어야 합니다.");
        }

        public void ApplyBodyFontSize(double fontSize)
        {
            ImageDescriptionText.FontSize = fontSize;
            UpdateLayoutForImage();
        }

        private void OnLoaded(object sender, RoutedEventArgs e)
        {
            Loaded -= OnLoaded;
            try
            {
                var bitmap = new BitmapImage();
                bitmap.DownloadCompleted += (_, _) => SetBitmap(bitmap);
                bitmap.DownloadFailed += (_, args) => ShowImageError(args.ErrorException.Message);
                bitmap.BeginInit();
                bitmap.CacheOption = BitmapCacheOption.OnLoad;
                bitmap.CreateOptions = BitmapCreateOptions.IgnoreImageCache;
                bitmap.UriSource = new Uri(_imagePath, UriKind.RelativeOrAbsolute);
                bitmap.EndInit();
                PopupImage.Source = bitmap;
                if (!bitmap.IsDownloading) SetBitmap(bitmap);
            }
            catch (Exception exception) { ShowImageError(exception.Message); }
        }

        private void SetBitmap(BitmapSource bitmap)
        {
            _bitmap = bitmap;
            PopupImage.Source = bitmap;
            UpdateLayoutForImage();
        }

        // Locked input is normalized using width first, including inconsistent two-axis API input.
        // BitmapSource.Width/Height are original DIP dimensions, respecting embedded DPI.
        public static Size ResolveDisplaySize(Size natural, double? width, double? height, bool keepAspectRatio)
        {
            ValidateDimension(width, nameof(width));
            ValidateDimension(height, nameof(height));
            if (!double.IsFinite(natural.Width) || !double.IsFinite(natural.Height) || natural.Width <= 0 || natural.Height <= 0)
                throw new ArgumentOutOfRangeException(nameof(natural));
            if (!keepAspectRatio) return new Size(width ?? natural.Width, height ?? natural.Height);
            double ratio = natural.Width / natural.Height;
            if (width.HasValue) return new Size(width.Value, width.Value / ratio);
            if (height.HasValue) return new Size(height.Value * ratio, height.Value);
            return natural;
        }

        private void UpdateLayoutForImage()
        {
            if (_bitmap == null) return;
            ImageTitleText.Visibility = string.IsNullOrWhiteSpace(ImageTitleText.Text) ? Visibility.Collapsed : Visibility.Visible;
            DescriptionContainer.Visibility = _showDescription && !string.IsNullOrWhiteSpace(ImageDescriptionText.Text)
                ? Visibility.Visible : Visibility.Collapsed;
            var natural = new Size(_bitmap.Width, _bitmap.Height);
            Size display = _sizeMode == ImagePopupSizeMode.FitToImage
                ? ResolveDisplaySize(natural, _requestedImageWidth, _requestedImageHeight, _keepAspectRatio)
                : natural;
            if (_sizeMode == ImagePopupSizeMode.FitToImage)
            {
                PopupImage.Width = display.Width;
                PopupImage.Height = display.Height;
                PopupImage.Stretch = _keepAspectRatio ? Stretch.Uniform : Stretch.Fill;
                PopupImage.HorizontalAlignment = HorizontalAlignment.Center;
                PopupImage.VerticalAlignment = VerticalAlignment.Center;
            }
            else
            {
                // Preserve no-upscale behavior; legacy image size limits no longer apply.
                PopupImage.MaxWidth = natural.Width;
                PopupImage.MaxHeight = natural.Height;
                PopupImage.Stretch = Stretch.Uniform;
            }
            double width = ActualWidth > 0 ? ActualWidth : display.Width + 2;
            ImageTitleText.Measure(new Size(Math.Max(1, width), double.PositiveInfinity));
            double titleHeight = ImageTitleText.Visibility == Visibility.Visible ? ImageTitleText.DesiredSize.Height : 0;
            double availableHeight = ActualHeight > 0 ? ActualHeight : display.Height + titleHeight;
            DescriptionContainer.MaxHeight = Math.Max(1, Math.Min(display.Height, availableHeight - titleHeight) * 0.3);
            if (!NeedsNaturalWindowSize) return;
            // Measure at target width; current window size must not feed back into recommendations.
            double targetWidth = display.Width + ImageContainer.BorderThickness.Left + ImageContainer.BorderThickness.Right;
            double measurementWidth = Math.Min(_maximumContentWidth, RequestedWindowWidth ?? targetWidth);
            ImageTitleText.Measure(new Size(measurementWidth, double.PositiveInfinity));
            double targetTitle = ImageTitleText.Visibility == Visibility.Visible ? ImageTitleText.DesiredSize.Height : 0;
            ImageDescriptionText.Measure(new Size(Math.Max(1, measurementWidth - DescriptionContainer.Padding.Left
                - DescriptionContainer.Padding.Right - 2), double.PositiveInfinity));
            double description = DescriptionContainer.Visibility == Visibility.Visible
                ? Math.Min(ImageDescriptionText.DesiredSize.Height + DescriptionContainer.Padding.Top
                    + DescriptionContainer.Padding.Bottom + 2, Math.Min(display.Height, _maximumContentHeight) * 0.3) + DescriptionContainer.Margin.Top : 0;
            var recommended = new Size(targetWidth, display.Height + 2 + targetTitle + description);
            if (Math.Abs(recommended.Width - _lastRecommendation.Width) < 0.5
                && Math.Abs(recommended.Height - _lastRecommendation.Height) < 0.5) return;
            _lastRecommendation = recommended;
            RecommendedSizeChanged?.Invoke(recommended.Width, recommended.Height);
        }

        private void ShowImageError(string message)
        {
            PopupImage.Source = null;
            ImageDescriptionText.Text = $"이미지를 불러오지 못했습니다.\n{message}";
            DescriptionContainer.Visibility = Visibility.Visible;
        }
    }
}
