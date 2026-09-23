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
        /*
         * [설계 14 §5.6] 관리자 본문 폰트 크기 적용.
         * IMAGE 팝업의 본문 = 이미지 설명(ImageDescriptionTextStyle, 기본 14). 제목(22)은 그대로 둔다.
         */
        public void ApplyBodyFontSize(double fontSize)
        {
            ImageDescriptionText.FontSize = fontSize;
        }

        /*
         * 외부 이미지 또는 프로젝트 내부 이미지의
         * 경로를 저장한다.
         *
         * UserControl이 실제 화면에 표시된 뒤
         * 이미지를 불러오기 위해 사용한다.
         */
        private readonly string _imagePath;
        /*
         * 이미지 설명 영역 표시 여부
         *
         * true
         * 이미지 설명 영역을 표시한다.
         *
         * false
         * 이미지 설명 영역을 숨기고
         * 이미지가 남은 공간을 사용한다.
         */
        private readonly bool _showDescription;
        /*
         * 이미지 비율에 따라 추천되는
         * PopupWindow 크기를 외부에 전달하는 이벤트
         *
         * 첫 번째 double 값
         * 추천 팝업 너비
         *
         * 두 번째 double 값
         * 추천 팝업 높이
         */

        /*
         * 외부에서 직접 지정한 이미지 표시 너비다.
         *
         * null이면 이미지 원본 크기와 화면 크기를 기준으로
         * 기존 FitToImage 자동 계산을 사용한다.
         *
         * 값이 있으면 해당 너비를 PopupImage.Width에 적용한다.
         */
        private readonly double? _requestedImageWidth;

        /*
         * 외부에서 직접 지정한 이미지 표시 높이다.
         *
         * null이면 이미지 원본 비율과 화면 크기를 기준으로
         * 기존 FitToImage 자동 계산을 사용한다.
         *
         * 값이 있으면 해당 높이를 PopupImage.Height에 적용한다.
         */
        private readonly double? _requestedImageHeight;
        /*
         * 이미지 팝업 크기 계산 방식
         */
        private readonly ImagePopupSizeMode _sizeMode;

        /* ADAPTIVE/FIT_TO_IMAGE 공통 설명 배치 옵션. */
        private readonly ImageDescriptionPosition _descriptionPosition;

        /* 전체 콘텐츠 영역 중 이미지가 차지할 비율. */
        private readonly double _imageAreaRatio;

        /*
         * 이미지 크기와 레이아웃 계산이 완료되었을 때
         * PopupWindow에 추천 너비와 높이를 전달한다.
         *
         * 첫 번째 double
         * 추천 팝업 너비
         *
         * 두 번째 double
         * 추천 팝업 높이
         */
        public event Action<double, double>? RecommendedSizeChanged;

        /*
         * 
         * 
         * ImagePopupView 생성자
         *
         * imageTitle
         * 이미지 콘텐츠 상단에 표시할 제목
         *
         * imagePath
         * 외부 이미지 URL 또는 프로젝트 내부 이미지 경로
         *
         * imageDescription
         * 이미지 아래 또는 옆에 표시할 설명
         *
         * showDescription
         * 이미지 설명 영역 표시 여부
         *
         * sizeMode
         * 이미지 팝업 크기 결정 방식
         */
        public ImagePopupView(
            string imageTitle,
            string imagePath,
            string imageDescription,
            bool showDescription = true,
            ImagePopupSizeMode sizeMode =
                ImagePopupSizeMode.Adaptive,
            double? imageWidth = null,
            double? imageHeight = null,
            ImageDescriptionPosition descriptionPosition =
                ImageDescriptionPosition.Auto,
            double imageAreaRatio = 0.75)
        {
            /*
             * ImagePopupView.xaml에 작성된 화면을
             * 실제 WPF 객체로 생성한다.
             */
            InitializeComponent();

            /*
             * 이미지 경로가 비어 있으면
             * 이미지를 표시할 수 없으므로 예외를 발생시킨다.
             */
            if (string.IsNullOrWhiteSpace(imagePath))
            {
                throw new ArgumentException(
                    "이미지 경로가 비어 있습니다.",
                    nameof(imagePath));
            }

            /*
             * 이미지 경로를 저장한다.
             */
            _imagePath = imagePath;

            /*
             * 설명 표시 여부를 저장한다.
             */
            _showDescription = showDescription;

            /*
             * 이미지 팝업 크기 결정 방식을 저장한다.
             */
            _sizeMode = sizeMode;
            _descriptionPosition = descriptionPosition;
            _imageAreaRatio =
                double.IsFinite(imageAreaRatio)
                && imageAreaRatio >= 0.5
                && imageAreaRatio <= 0.9
                    ? imageAreaRatio
                    : 0.75;

            /*
             * 외부에서 이미지 너비를 전달한 경우
             * 유효한 양수인지 확인한다.
             *
             * NaN, 무한대, 0 이하 값은
             * WPF Width 속성에 적용할 수 없으므로
             * 즉시 예외를 발생시킨다.
             */
            if (imageWidth.HasValue &&
                (!double.IsFinite(imageWidth.Value) ||
                 imageWidth.Value <= 0))
            {
                throw new ArgumentOutOfRangeException(
                    nameof(imageWidth),
                    "이미지 너비는 0보다 큰 유한한 값이어야 합니다.");
            }

            /*
             * 이미지 너비에 NaN 또는 무한대가 전달되는 것을 방지한다.
             * .NET 구버전용 체크
             */
            /*if (imageWidth.HasValue &&
                (double.IsNaN(imageWidth.Value)
                 || double.IsInfinity(imageWidth.Value)
                 || imageWidth.Value <= 0))
            {
                throw new ArgumentOutOfRangeException(
                    nameof(imageWidth),
                    "이미지 너비는 0보다 큰 유한한 값이어야 합니다.");
            }
            */
            /*
             * 외부에서 이미지 높이를 전달한 경우
             * 유효한 양수인지 확인한다.
             */
            if (imageHeight.HasValue &&
                (!double.IsFinite(imageHeight.Value) ||
                 imageHeight.Value <= 0))
            {
                throw new ArgumentOutOfRangeException(
                    nameof(imageHeight),
                    "이미지 높이는 0보다 큰 유한한 값이어야 합니다.");
            }

            /*
             * 검증이 완료된 사용자 지정 이미지 크기를 저장한다.
             */
            _requestedImageWidth =
                imageWidth;

            _requestedImageHeight =
                imageHeight;
           

            /*
             * 전달받은 이미지 제목을 표시한다.
             */
            ImageTitleText.Text = imageTitle;

            /*
             * 전달받은 이미지 설명을 표시한다.
             */
            ImageDescriptionText.Text = imageDescription;

            /*
             * showDescription 값에 따라
             * 설명 컨테이너를 표시하거나 숨긴다.
             *
             * Collapsed를 사용하면 화면에서 사라지고
             * 레이아웃 공간도 차지하지 않는다.
             */
            DescriptionContainer.Visibility =
                _showDescription
                    ? Visibility.Visible
                    : Visibility.Collapsed;

            /*
             * 화면이 실제로 표시된 후
             * 외부 또는 내부 이미지를 불러온다.
             */
            Loaded += ImagePopupView_Loaded;
        }



        /*
         * ImagePopupView가 화면에 표시될 때 실행된다.
         *
         * 화면이 다시 로드될 때마다
         * 이미지가 중복 로드되지 않도록
         * 이벤트를 먼저 제거한다.
         */
        private void ImagePopupView_Loaded(
            object sender,
            RoutedEventArgs e)
        {
            /*
             * Loaded 이벤트가 중복 실행되지 않도록
             * 이벤트 연결을 해제한다.
             */
            Loaded -= ImagePopupView_Loaded;

            /*
             * 저장해둔 이미지 경로를 사용하여
             * 실제 이미지를 불러온다.
             */
            LoadImage(_imagePath);
        }

        /*
         * 외부 URL 또는 프로젝트 내부 이미지 경로를 사용하여
         * 이미지를 화면에 표시한다.
         *
         * imagePath
         * 이미지 URL 또는 이미지 파일 경로
         */
        private void LoadImage(string imagePath)
        {
            try
            {
                /*
                 * 문자열 이미지 경로를
                 * Uri 객체로 변환한다.
                 *
                 * RelativeOrAbsolute를 사용하므로
                 * HTTPS 주소와 프로젝트 내부 경로를
                 * 모두 사용할 수 있다.
                 */
                Uri imageUri =
                    new Uri(
                        imagePath,
                        UriKind.RelativeOrAbsolute);

                /*
                 * WPF에서 이미지를 표시하기 위한
                 * BitmapImage 객체를 생성한다.
                 */
                BitmapImage bitmapImage =
                    new BitmapImage();

                /*
                 * 외부 이미지 다운로드가 완료됐을 때
                 * 실행할 이벤트를 연결한다.
                 */
                bitmapImage.DownloadCompleted +=
                    BitmapImage_DownloadCompleted;

                /*
                 * 외부 이미지 다운로드에 실패했을 때
                 * 실행할 이벤트를 연결한다.
                 */
                bitmapImage.DownloadFailed +=
                    BitmapImage_DownloadFailed;

                /*
                 * BitmapImage 설정을 시작한다.
                 */
                bitmapImage.BeginInit();

                /*
                 * 동일한 URL의 이미지가 변경되었을 경우
                 * 기존 캐시 대신 새 이미지를 요청하도록 설정한다.
                 */
                bitmapImage.CreateOptions =
                    BitmapCreateOptions.IgnoreImageCache;

                /*
                * Adaptive 모드에서는 지나치게 큰 이미지를
                * 원본 해상도로 디코딩할 필요가 없으므로
                * 최대 디코딩 너비를 제한한다.
                *
                * FitToImage 모드에서는 원본 표시 크기를 확인해야 하므로
                * DecodePixelWidth를 지정하지 않는다.
                */
                if (_sizeMode == ImagePopupSizeMode.Adaptive)
                {
                    bitmapImage.DecodePixelWidth = 1400;
                }

                /*
                 * 실제 이미지 주소를 설정한다.
                 */
                bitmapImage.UriSource = imageUri;

                /*
                 * BitmapImage 설정을 완료한다.
                 *
                 * 외부 URL이면 이미지 다운로드가 시작된다.
                 */
                bitmapImage.EndInit();

                /*
                 * BitmapImage를 화면의 Image 컨트롤에 연결한다.
                 */
                PopupImage.Source = bitmapImage;

                /*
                 * 프로젝트 내부 Resource 이미지처럼
                 * 다운로드 과정 없이 즉시 로드된 이미지라면
                 * 바로 이미지 비율을 계산한다.
                 */
                if (!bitmapImage.IsDownloading)
                {
                    /*
                     * 이미지 크기와 비율을 읽어서
                     * 레이아웃을 변경한다.
                     */
                    ApplyAdaptiveLayout(bitmapImage);

                }
            }
            catch (Exception exception)
            {
                /*
                 * URI 변환이나 이미지 생성 과정에서
                 * 오류가 발생한 경우 오류 상태를 표시한다.
                 */
                ShowImageError(
                    $"이미지를 불러오지 못했습니다.\n{exception.Message}");
            }
        }

        /*
         * 외부 이미지 다운로드가 완료된 후 실행된다.
         *
         * 이 시점에는 PixelWidth와 PixelHeight를
         * 정상적으로 확인할 수 있다.
         */
        private void BitmapImage_DownloadCompleted(
            object? sender,
            EventArgs e)
        {
            /*
             * 이벤트를 발생시킨 객체가
             * BitmapImage인지 확인한다.
             */
            if (sender is not BitmapImage bitmapImage)
            {
                return;
            }

            /*
             * 다운로드가 완료된 이미지 크기를 사용하여
             * 자동 레이아웃을 적용한다.
             */
            ApplyAdaptiveLayout(bitmapImage);
        }

        /*
         * 외부 이미지 다운로드에 실패했을 때 실행된다.
         */
        private void BitmapImage_DownloadFailed(
            object? sender,
            ExceptionEventArgs e)
        {
            /*
             * 다운로드 실패 원인을 포함하여
             * 화면에 오류 메시지를 표시한다.
             */
            ShowImageError(
                $"외부 이미지를 다운로드하지 못했습니다.\n{e.ErrorException.Message}");
        }

        

        /*
         * 불러온 이미지의 크기와 비율을 확인하여
         * 현재 선택된 크기 모드에 맞는 레이아웃을 적용한다.
         */
        private void ApplyAdaptiveLayout(
            BitmapImage bitmapImage)
        {
            /*
             * 이미지 원본 픽셀 너비를 가져온다.
             */
            int imagePixelWidth =
                bitmapImage.PixelWidth;

            /*
             * 이미지 원본 픽셀 높이를 가져온다.
             */
            int imagePixelHeight =
                bitmapImage.PixelHeight;

            /*
             * 이미지 크기를 확인할 수 없는 경우
             * 기본 정사각형 레이아웃을 사용한다.
             */
            if (imagePixelWidth <= 0 || imagePixelHeight <= 0)
            {
                ApplySquareLayout();

                return;
            }

            /*
             * 이미지 가로세로 비율을 계산한다.
             */
            double imageRatio =
                (double)imagePixelWidth / imagePixelHeight;

            /*
             * FitToImage 모드여도 이미지 배치 자체는
             * 기존 가로형·세로형·정사각형 구조를 사용한다.
             *
             * 먼저 이미지 비율에 알맞은 레이아웃을 적용한다.
             */
            ImageDescriptionPosition resolvedPosition =
                ResolveDescriptionPosition(imageRatio);

            if (!_showDescription)
            {
                ApplySquareLayout();
            }
            else if (resolvedPosition == ImageDescriptionPosition.Right)
            {
                ApplyPortraitLayout();
            }
            else
            {
                ApplyLandscapeLayout();
            }

            /*
             * [2026-09-23-03] 크기 계산은 이미지 크기 모드별로 완전히 분리한다.
             *
             * FitToImage
             * imageWidth/imageHeight가 있으면 그 값이 1순위이고,
             * 없으면 원본 크기를 쓴다. 그 결과로 팝업 크기를 다시 계산해
             * RecommendedSizeChanged로 PopupWindow에 전달한다.
             *
             * Adaptive
             * 팝업 크기가 기준이므로 이미지는 남은 영역 안에 맞춘다.
             * imageWidth/imageHeight는 "최대 표시 크기"로만 쓰고
             * 팝업 크기는 건드리지 않는다.
             *
             * 이전에는 모드와 무관하게 TryApplyRequestedImageSize()가 먼저 실행돼
             * Adaptive에서도 지정 크기가 절대값으로 적용됐다. 그 결과 지정 크기가
             * 팝업 폭보다 크면 이미지 컨테이너가 영역을 넘쳐 이미지가 잘려 보였다.
             */
            if (_sizeMode == ImagePopupSizeMode.FitToImage)
            {
                bool requestedSizeApplied =
                    TryApplyRequestedImageSize(
                        bitmapImage);

                if (!requestedSizeApplied)
                {
                    ApplyFitToImageSize(
                        bitmapImage);
                }
            }
            else
            {
                ApplyAdaptiveImageSizing(
                    bitmapImage);
            }
        }

        /*
         * [2026-09-23-03] Adaptive 모드의 이미지 크기 처리다.
         *
         * 팝업 크기(FIXED/VIEWPORT_RATIO/FULLSCREEN 등 PopupOptions.SizeMode)가 기준이고,
         * 이미지는 레이아웃이 나눠 준 영역 안에 Stretch="Uniform"으로 맞춰진다.
         *
         * 명시적 Width/Height를 지우고 정렬을 Stretch로 되돌리는 이유는
         * 같은 View 인스턴스가 재사용되거나 이전 계산이 남아 있을 때
         * 고정 크기가 그대로 유지되는 것을 막기 위해서다.
         *
         * MaxWidth/MaxHeight에는 "원본 크기"와 "요청 크기" 중 작은 값을 넣는다.
         * - 원본 크기를 상한으로 두어 작은 이미지가 흐리게 확대되지 않게 한다.
         * - imageWidth/imageHeight가 있으면 그보다 크게 표시되지 않게 한다.
         * 영역이 상한보다 좁으면 Uniform 축소가 적용되므로 이미지는 항상 팝업 안에 들어온다.
         */
        private void ApplyAdaptiveImageSizing(
            BitmapImage bitmapImage)
        {
            /*
             * 이전 계산에서 남았을 수 있는 고정 크기를 해제한다.
             * double.NaN은 WPF에서 "크기 미지정(Auto)"을 뜻한다.
             */
            PopupImage.Width = double.NaN;
            PopupImage.Height = double.NaN;

            PopupImage.HorizontalAlignment =
                HorizontalAlignment.Stretch;

            PopupImage.VerticalAlignment =
                VerticalAlignment.Stretch;

            ImageContainer.Width = double.NaN;
            ImageContainer.Height = double.NaN;

            ImageContainer.HorizontalAlignment =
                HorizontalAlignment.Stretch;

            ImageContainer.VerticalAlignment =
                VerticalAlignment.Stretch;

            /*
             * 원본 이미지의 WPF 표시 크기(DIP)를 가져온다.
             * 값을 얻지 못하면 픽셀 크기를 대신 쓴다.
             */
            double originalWidth =
                bitmapImage.Width > 0
                    ? bitmapImage.Width
                    : bitmapImage.PixelWidth;

            double originalHeight =
                bitmapImage.Height > 0
                    ? bitmapImage.Height
                    : bitmapImage.PixelHeight;

            /*
             * 원본 크기를 확인할 수 없으면 상한을 두지 않는다.
             * 이 경우에도 Uniform 배치라 이미지가 영역을 넘치지는 않는다.
             */
            PopupImage.MaxWidth =
                ResolveAdaptiveMaximum(
                    originalWidth,
                    _requestedImageWidth);

            PopupImage.MaxHeight =
                ResolveAdaptiveMaximum(
                    originalHeight,
                    _requestedImageHeight);
        }

        /*
         * Adaptive 모드에서 사용할 한 축의 최대 표시 크기를 구한다.
         *
         * originalSize
         * 원본 이미지 크기. 0 이하이면 확인 실패로 본다.
         *
         * requestedSize
         * content의 imageWidth 또는 imageHeight. 없으면 null이다.
         */
        private static double ResolveAdaptiveMaximum(
            double originalSize,
            double? requestedSize)
        {
            bool hasOriginal =
                originalSize > 0;

            bool hasRequested =
                requestedSize.HasValue
                && requestedSize.Value > 0;

            if (hasOriginal && hasRequested)
            {
                return Math.Min(
                    originalSize,
                    requestedSize!.Value);
            }

            if (hasRequested)
            {
                return requestedSize!.Value;
            }

            if (hasOriginal)
            {
                return originalSize;
            }

            return double.PositiveInfinity;
        }

        /*
         * 설명 위치를 결정한다.
         * 명시값은 이미지 비율과 무관하게 사용하고 AUTO만 기존 비율 규칙을 따른다.
         */
        private ImageDescriptionPosition ResolveDescriptionPosition(double imageRatio)
        {
            if (_descriptionPosition != ImageDescriptionPosition.Auto)
            {
                return _descriptionPosition;
            }

            return imageRatio <= 0.8
                ? ImageDescriptionPosition.Right
                : ImageDescriptionPosition.Bottom;
        }

        /*
         * 가로형 이미지 레이아웃을 적용한다.
         *
         * 설명 표시
         * 이미지 위 / 설명 아래
         *
         * 설명 숨김
         * 이미지만 전체 공간 사용
         */
        private void ApplyLandscapeLayout()
        {
            /*
             * 가로형 레이아웃에서는
             * 첫 번째 열만 사용한다.
             */
            ContentFirstColumn.Width =
                new GridLength(
                    1,
                    GridUnitType.Star);

            /*
             * 두 번째 열은 사용하지 않는다.
             */
            ContentSecondColumn.Width =
                new GridLength(0);

            /*
             * 첫 번째 행은 이미지 영역으로 사용한다.
             */
            ContentFirstRow.Height =
                new GridLength(
                    _showDescription ? _imageAreaRatio : 1,
                    GridUnitType.Star);

            /*
             * 설명 표시 시 이미지/설명 영역을 먼저 분리한다.
             * 작은 창에서도 설명 때문에 이미지 영역이 임의로 눌리지 않는다.
             */
            ContentSecondRow.Height =
                _showDescription
                    ? new GridLength(1 - _imageAreaRatio, GridUnitType.Star)
                    : new GridLength(0);

            /*
             * 이미지 영역을 첫 번째 행,
             * 첫 번째 열에 배치한다.
             */
            Grid.SetRow(
                ImageContainer,
                0);

            Grid.SetColumn(
                ImageContainer,
                0);

            /*
             * 설명 영역을 두 번째 행,
             * 첫 번째 열에 배치한다.
             */
            Grid.SetRow(
                DescriptionContainer,
                1);

            Grid.SetColumn(
                DescriptionContainer,
                0);

            /*
             * 설명을 표시할 때만
             * 이미지와 설명 사이에 여백을 둔다.
             */
            DescriptionContainer.Margin =
                _showDescription
                    ? new Thickness(0, 14, 0, 0)
                    : new Thickness(0);

            /*
             * [2026-09-23-03] 이미지 최대 표시 크기와 팝업 추천 크기는
             * 여기서 정하지 않는다.
             *
             * 레이아웃 메서드는 행·열 구성과 여백 같은 "배치"만 담당하고,
             * 크기는 모드별 계산(ApplyAdaptiveImageSizing / ApplyFitToImageSize /
             * TryApplyRequestedImageSize)이 담당한다.
             *
             * 이전에는 여기서 820x430 같은 고정 상한과 920x680 같은 추천 팝업 크기를
             * 함께 지정했다. 팝업 실제 크기와 무관한 값이라 작은 팝업에서는
             * 이미지가 영역을 넘치고, Adaptive인데도 팝업 크기를 바꾸려 시도했다.
             */
        }

        /*
 * 세로형 이미지 레이아웃을 적용한다.
 *
 * 설명 표시
 * 이미지 왼쪽 / 설명 오른쪽
 *
 * 설명 숨김
 * 이미지가 전체 영역 사용
 */
        private void ApplyPortraitLayout()
        {
            /*
             * 첫 번째 행이 전체 높이를 사용한다.
             */
            ContentFirstRow.Height =
                new GridLength(
                    1,
                    GridUnitType.Star);

            /*
             * 세로형은 이미지와 설명을
             * 첫 번째 행에서 좌우로 배치하므로
             * 두 번째 행은 사용하지 않는다.
             */
            ContentSecondRow.Height =
                new GridLength(0);

            /*
             * 이미지 영역을 첫 번째 행,
             * 첫 번째 열에 배치한다.
             */
            Grid.SetRow(
                ImageContainer,
                0);

            Grid.SetColumn(
                ImageContainer,
                0);

            /*
             * 설명 영역도 첫 번째 행에 배치한다.
             */
            Grid.SetRow(
                DescriptionContainer,
                0);

            if (_showDescription)
            {
                /*
                 * 이미지 영역이 전체 가로 공간의
                 * 약 60%를 사용한다.
                 */
                ContentFirstColumn.Width =
                    new GridLength(
                        _imageAreaRatio,
                        GridUnitType.Star);

                /*
                 * 설명 영역이 전체 가로 공간의
                 * 약 40%를 사용한다.
                 */
                ContentSecondColumn.Width =
                    new GridLength(
                        1 - _imageAreaRatio,
                        GridUnitType.Star);

                /*
                 * 설명을 이미지 오른쪽 열에 배치한다.
                 */
                Grid.SetColumn(
                    DescriptionContainer,
                    1);

                /*
                 * 이미지와 설명 사이에
                 * 14픽셀 간격을 둔다.
                 */
                DescriptionContainer.Margin =
                    new Thickness(
                        14,
                        0,
                        0,
                        0);

                /*
                 * [2026-09-23-03] 이미지 최대 크기·추천 팝업 크기는
                 * 모드별 크기 계산에서 다룬다(ApplyLandscapeLayout 주석 참고).
                 */
            }
            else
            {
                /*
                 * 설명이 없으므로
                 * 첫 번째 열이 전체 너비를 사용한다.
                 */
                ContentFirstColumn.Width =
                    new GridLength(
                        1,
                        GridUnitType.Star);

                /*
                 * 두 번째 열은 사용하지 않는다.
                 */
                ContentSecondColumn.Width =
                    new GridLength(0);

                /*
                 * 숨겨진 설명 컨테이너를 첫 번째 열로 이동한다.
                 */
                Grid.SetColumn(
                    DescriptionContainer,
                    0);

                /*
                 * 설명이 없으므로 여백도 제거한다.
                 */
                DescriptionContainer.Margin =
                    new Thickness(0);

                /*
                 * [2026-09-23-03] 설명이 없는 경우에도 최대 크기는
                 * 모드별 크기 계산에서 결정한다.
                 */
            }
        }

        /*
         * 정사각형에 가까운 이미지 레이아웃을 적용한다.
         *
         * 배치
         * 이미지 위
         * 설명 아래
         */
        private void ApplySquareLayout()
        {
            /*
             * 첫 번째 열이 전체 공간을 사용한다.
             */
            ContentFirstColumn.Width =
                new GridLength(
                    1,
                    GridUnitType.Star);

            /*
             * 두 번째 열은 사용하지 않는다.
             */
            ContentSecondColumn.Width =
                new GridLength(0);

            /*
             * 첫 번째 행은 이미지 영역으로 사용한다.
             */
            ContentFirstRow.Height =
                new GridLength(
                    1,
                    GridUnitType.Star);

            /*
             * 설명이 있을 때만
             * 두 번째 행을 설명 영역으로 사용한다.
             */
            ContentSecondRow.Height =
                _showDescription
                    ? GridLength.Auto
                    : new GridLength(0);
            /*
             * 이미지 영역을 첫 번째 행,
             * 첫 번째 열에 배치한다.
             */
            Grid.SetRow(
                ImageContainer,
                0);

            Grid.SetColumn(
                ImageContainer,
                0);

            /*
             * 설명 영역을 두 번째 행,
             * 첫 번째 열에 배치한다.
             */
            Grid.SetRow(
                DescriptionContainer,
                1);

            Grid.SetColumn(
                DescriptionContainer,
                0);

            /*
             * 설명이 표시될 때만
             * 이미지 아래쪽에 여백을 적용한다.
             */
            DescriptionContainer.Margin =
                _showDescription
                    ? new Thickness(0, 14, 0, 0)
                    : new Thickness(0);

            /*
             * [2026-09-23-03] 이미지 최대 크기·추천 팝업 크기는
             * 모드별 크기 계산에서 다룬다(ApplyLandscapeLayout 주석 참고).
             */
        }


        /*
 * 이미지의 실제 표시 크기에 맞춰
 * 팝업 창의 추천 너비와 높이를 계산한다.
 *
 * 이미지가 화면보다 크면
 * 가로세로 비율을 유지하면서 자동 축소한다.
 */
        private void ApplyFitToImageSize(
            BitmapImage bitmapImage)
        {
            /*
             * BitmapImage.Width와 Height는
             * WPF에서 사용하는 DIP 단위의 이미지 크기다.
             *
             * 일반적인 96 DPI 이미지라면
             * 픽셀 크기와 거의 같은 값이 된다.
             *
             * 고해상도 DPI 정보가 포함된 이미지에서도
             * WPF 화면 크기에 맞는 값을 얻을 수 있으므로
             * PixelWidth보다 Width를 우선 사용한다.
             */
            double imageWidth =
                bitmapImage.Width;

            double imageHeight =
                bitmapImage.Height;

            /*
             * 일부 외부 이미지에서 Width 또는 Height를
             * 정상적으로 가져오지 못하는 경우를 대비한다.
             *
             * 값이 0 이하라면 픽셀 크기를 대신 사용한다.
             */
            if (imageWidth <= 0)
            {
                imageWidth =
                    bitmapImage.PixelWidth;
            }

            if (imageHeight <= 0)
            {
                imageHeight =
                    bitmapImage.PixelHeight;
            }

            /*
             * 이미지 크기를 정상적으로 가져오지 못한 경우
             * 0으로 나누는 오류를 방지하기 위해
             * 크기 계산을 중단한다.
             */
            if (imageWidth <= 0 ||
                imageHeight <= 0)
            {
                return;
            }

            /*
             * 현재 이미지의 가로세로 비율을 계산한다.
             */
            double imageRatio =
                imageWidth / imageHeight;

            /*
             * 설명이 이미지 오른쪽에 배치되는지 판단한다.
             *
             * [2026-09-23-03] 이전에는 비율 0.8 이하만 세로형으로 봤기 때문에
             * descriptionPosition을 RIGHT/BOTTOM으로 명시해도
             * 팝업 크기 계산은 비율 기준으로만 움직여 실제 배치와 어긋났다.
             * 배치를 정하는 ResolveDescriptionPosition()과 같은 기준을 쓴다.
             */
            bool isPortrait =
                ResolveDescriptionPosition(imageRatio)
                == ImageDescriptionPosition.Right;

            /*
             * 세로형 이미지이면서 설명을 표시하는 경우
             * 이미지 오른쪽에 설명 영역이 배치된다.
             *
             * 이 값은 설명 영역의 고정 너비다.
             */
            double descriptionWidth =
                isPortrait && _showDescription
                    ? 260
                    : 0;

            /*
             * ImageContainer에 실제 적용된
             * 왼쪽과 오른쪽 Padding의 합계를 가져온다.
             *
             * 예를 들어 XAML에서 Padding="12"라면:
             *
             * Left  12
             * Right 12
             * 합계  24
             *
             * Padding="0"으로 변경하면
             * 이 값도 자동으로 0이 된다.
             */
            double imageContainerHorizontalPadding =
                ImageContainer.Padding.Left
                + ImageContainer.Padding.Right;

            /*
             * ImageContainer에 실제 적용된
             * 위쪽과 아래쪽 Padding의 합계를 가져온다.
             */
            double imageContainerVerticalPadding =
                ImageContainer.Padding.Top
                + ImageContainer.Padding.Bottom;

            /*
             * ImageContainer의 왼쪽과 오른쪽
             * BorderThickness 합계를 계산한다.
             *
             * BorderThickness="1"이라면
             * 좌우 합계는 2가 된다.
             */
            double imageContainerHorizontalBorder =
                ImageContainer.BorderThickness.Left
                + ImageContainer.BorderThickness.Right;

            /*
             * ImageContainer의 위쪽과 아래쪽
             * BorderThickness 합계를 계산한다.
             */
            double imageContainerVerticalBorder =
                ImageContainer.BorderThickness.Top
                + ImageContainer.BorderThickness.Bottom;

            /*
             * ImageContainer 바깥쪽에 존재하는
             * PopupWindow 및 ImagePopupView의 좌우 공통 공간이다.
             *
             * 여기에는 ImageContainer의 Padding과 Border를
             * 포함하지 않는다.
             *
             * 기존 horizontalChromeSize 80에서
             * 이미지 컨테이너의 좌우 Padding 24를 분리한 기준으로
             * 56을 사용한다.
             */
            const double popupHorizontalChromeSize = 56;

            /*
             * 팝업 높이에서 이미지 컨테이너 바깥쪽에 존재하는
             * 헤더, 이미지 제목, 콘텐츠 여백, Footer 등의 공간이다.
             *
             * 이 값에도 ImageContainer의 Padding과 Border는
             * 포함하지 않고 별도로 계산한다.
             */
            double popupVerticalChromeSize;

            if (isPortrait && _showDescription)
            {
                /*
                 * 세로형 설명은 이미지 오른쪽에 있으므로
                 * 설명 영역으로 인해 팝업 높이가 크게 늘어나지 않는다.
                 */
                popupVerticalChromeSize = 190;
            }
            else
            {
                /*
                 * 가로형 및 정사각형에서 설명을 표시하면
                 * 설명 영역이 이미지 아래쪽에 배치되므로
                 * 팝업 높이에 설명 영역 크기를 추가한다.
                 */
                popupVerticalChromeSize =
                    _showDescription
                        ? 300
                        : 190;
            }

            /*
             * 이미지 바깥쪽에 필요한 전체 좌우 공간이다.
             *
             * 구성:
             *
             * PopupWindow 및 View 공통 좌우 공간
             * + ImageContainer 좌우 Padding
             * + ImageContainer 좌우 Border
             */
            double horizontalChromeSize =
                popupHorizontalChromeSize
                + imageContainerHorizontalPadding
                + imageContainerHorizontalBorder;

            /*
             * 이미지 바깥쪽에 필요한 전체 상하 공간이다.
             *
             * 구성:
             *
             * PopupWindow 헤더, 제목, Footer 등
             * + ImageContainer 상하 Padding
             * + ImageContainer 상하 Border
             */
            double verticalChromeSize =
                popupVerticalChromeSize
                + imageContainerVerticalPadding
                + imageContainerVerticalBorder;

            /*
             * 현재 모니터의 작업 영역을 가져온다.
             *
             * 작업 영역은 Windows 작업 표시줄을 제외한
             * 실제 사용 가능한 화면 영역이다.
             */
            double maximumWindowWidth =
                SystemParameters.WorkArea.Width * 0.9;

            double maximumWindowHeight =
                SystemParameters.WorkArea.Height * 0.9;

            /*
             * 팝업 내부에서 이미지가 사용할 수 있는
             * 최대 너비를 계산한다.
             *
             * 세로형 설명이 표시되는 경우에는
             * 팝업 오른쪽의 설명 영역 너비도 제외해야 한다.
             */
            double maximumImageWidth =
                Math.Max(
                    100,
                    maximumWindowWidth
                    - horizontalChromeSize
                    - descriptionWidth);

            /*
             * 팝업 내부에서 이미지가 사용할 수 있는
             * 최대 높이를 계산한다.
             */
            double maximumImageHeight =
                Math.Max(
                    100,
                    maximumWindowHeight
                    - verticalChromeSize);

            /*
             * 이미지가 화면보다 클 경우
             * 가로 기준으로 얼마나 축소해야 하는지 계산한다.
             */
            double widthScale =
                maximumImageWidth / imageWidth;

            /*
             * 이미지가 화면보다 클 경우
             * 세로 기준으로 얼마나 축소해야 하는지 계산한다.
             */
            double heightScale =
                maximumImageHeight / imageHeight;

            /*
             * 가로 배율과 세로 배율 중 작은 값을 사용해야
             * 이미지가 화면 바깥으로 벗어나지 않는다.
             *
             * 1을 포함했으므로
             * 원본보다 작은 이미지를 강제로 확대하지 않는다.
             */
            double imageScale =
                Math.Min(
                    1,
                    Math.Min(
                        widthScale,
                        heightScale));

            /*
             * 최종 화면 표시용 이미지 크기를 계산한다.
             */
            double displayImageWidth =
                imageWidth * imageScale;

            double displayImageHeight =
                imageHeight * imageScale;

            /*
             * FitToImage 모드에서는
             * 계산된 이미지 크기를 실제 Width와 Height로 지정한다.
             *
             * 이렇게 해야 부모 컨테이너가 더 크더라도
             * 이미지가 계산된 크기 그대로 표시된다.
             */
            PopupImage.Width =
                displayImageWidth;

            PopupImage.Height =
                displayImageHeight;

            PopupImage.MaxWidth =
                displayImageWidth;

            PopupImage.MaxHeight =
                displayImageHeight;

            /*
             * ImageContainer의 실제 크기를
             * 이미지 크기와 현재 적용된 Padding,
             * BorderThickness를 모두 포함하여 계산한다.
             *
             * Padding이 0이면 이미지와 Border 크기에 딱 맞고,
             * Padding 값을 늘리면 컨테이너 크기도 함께 증가한다.
             */
            ImageContainer.Width =
                displayImageWidth
                + ImageContainer.Padding.Left
                + ImageContainer.Padding.Right
                + ImageContainer.BorderThickness.Left
                + ImageContainer.BorderThickness.Right;

            ImageContainer.Height =
                displayImageHeight
                + ImageContainer.Padding.Top
                + ImageContainer.Padding.Bottom
                + ImageContainer.BorderThickness.Top
                + ImageContainer.BorderThickness.Bottom;

            /*
             * 부모 Grid가 더 넓더라도
             * ImageContainer 자체가 늘어나지 않도록
             * 중앙 정렬 상태로 유지한다.
             */
            ImageContainer.HorizontalAlignment =
                HorizontalAlignment.Center;

            ImageContainer.VerticalAlignment =
                VerticalAlignment.Center;

            /*
             * 이미지 영역이 고정 크기가 됐으므로
             * 그리드 행·열도 고정 크기 기준으로 맞춘다.
             */
            ApplyFitToImageGridSizing(
                isPortrait,
                descriptionWidth);

            /*
             * 최종 팝업 너비를 계산한다.
             *
             * 이미지 표시 너비
             * + 세로형 설명 영역 너비
             * + PopupWindow 및 View 좌우 공통 공간
             * + ImageContainer 좌우 Padding
             * + ImageContainer 좌우 Border
             */
            double recommendedWindowWidth =
                displayImageWidth
                + descriptionWidth
                + horizontalChromeSize;

            /*
             * 최종 팝업 높이를 계산한다.
             *
             * 이미지 표시 높이
             * + PopupWindow 헤더, 제목, Footer 등
             * + ImageContainer 상하 Padding
             * + ImageContainer 상하 Border
             */
            double recommendedWindowHeight =
                displayImageHeight
                + verticalChromeSize;

            /*
             * 팝업이 지나치게 작아져
             * 제목이나 닫기 버튼이 깨지는 것을 방지한다.
             */
            const double minimumWindowWidth = 280;
            const double minimumWindowHeight = 300;

            recommendedWindowWidth =
                Math.Max(
                    minimumWindowWidth,
                    recommendedWindowWidth);

            recommendedWindowHeight =
                Math.Max(
                    minimumWindowHeight,
                    recommendedWindowHeight);

            /*
             * 계산된 팝업 크기를 PopupWindow에 전달한다.
             */
            RecommendedSizeChanged?.Invoke(
                recommendedWindowWidth,
                recommendedWindowHeight);


        }

        /*
         * [2026-09-23-03] FitToImage 모드에서 그리드 행·열 크기를 맞춘다.
         *
         * FitToImage는 이미지 크기가 먼저 정해지고 팝업 크기가 그 뒤에 따라온다.
         * 그런데 배치 메서드는 Adaptive 기준으로 열·행을 Star(imageAreaRatio) 비율로
         * 나눠 두기 때문에, 고정 크기 ImageContainer가 비율로 계산된 칸보다 크면
         * 칸을 넘쳐 이미지가 잘려 보인다.
         *
         * 그래서 이미지 쪽 칸은 Auto(콘텐츠 크기)로, 설명 쪽 칸은
         * 팝업 크기 계산에 쓴 것과 같은 고정 너비로 맞춘다.
         *
         * isPortrait
         * 설명이 이미지 오른쪽에 배치되는 경우 true
         *
         * descriptionWidth
         * 오른쪽 설명 영역의 고정 너비. 설명을 숨기면 0이다.
         */
        private void ApplyFitToImageGridSizing(
            bool isPortrait,
            double descriptionWidth)
        {
            if (!_showDescription)
            {
                /*
                 * 설명이 없으면 이미지 칸이 전체를 쓰고
                 * ImageContainer는 중앙 정렬로 표시된다.
                 */
                return;
            }

            if (isPortrait)
            {
                /*
                 * 이미지 열은 콘텐츠(고정 크기 컨테이너) 크기를 그대로 쓰고,
                 * 설명 열은 팝업 너비 계산에 사용한 고정 너비를 쓴다.
                 */
                ContentFirstColumn.Width =
                    GridLength.Auto;

                ContentSecondColumn.Width =
                    new GridLength(
                        descriptionWidth,
                        GridUnitType.Pixel);

                return;
            }

            /*
             * 설명이 아래에 배치되는 경우에는
             * 이미지 행을 Auto로 두고 남는 높이를 설명 행이 쓰게 한다.
             */
            ContentFirstRow.Height =
                GridLength.Auto;

            ContentSecondRow.Height =
                new GridLength(
                    1,
                    GridUnitType.Star);
        }

        /*
         * 외부에서 지정한 이미지 크기를 적용하고
         * ImageContainer와 PopupWindow 크기도 함께 맞춘다.
         *
         * [2026-09-23-03] FitToImage 모드에서만 호출한다.
         * Adaptive는 팝업 크기가 기준이므로 지정 크기를 절대값으로 쓰지 않는다.
         *
         * 반환값:
         * true  = 지정 크기가 존재하여 적용함
         * false = 지정 크기가 없으므로 기존 자동 계산을 사용해야 함
         */
        private bool TryApplyRequestedImageSize(
            BitmapImage bitmapImage)
        {
            /*
             * 지정된 너비와 높이가 모두 없다면
             * 사용자 지정 크기를 적용할 수 없다.
             *
             * 이 경우 false를 반환하여
             * 기존 ApplyFitToImageSize()가 실행되도록 한다.
             */
            if (!_requestedImageWidth.HasValue &&
                !_requestedImageHeight.HasValue)
            {
                return false;
            }

            /*
             * 원본 이미지의 WPF 표시 크기를 가져온다.
             */
            double originalWidth =
                bitmapImage.Width;

            double originalHeight =
                bitmapImage.Height;

            /*
             * Width 또는 Height를 가져오지 못한 경우
             * 픽셀 크기를 대신 사용한다.
             */
            if (originalWidth <= 0)
            {
                originalWidth =
                    bitmapImage.PixelWidth;
            }

            if (originalHeight <= 0)
            {
                originalHeight =
                    bitmapImage.PixelHeight;
            }

            /*
             * 원본 이미지 크기가 정상적이지 않으면
             * 비율 계산을 할 수 없으므로 지정 크기 적용을 중단한다.
             */
            if (originalWidth <= 0 ||
                originalHeight <= 0)
            {
                return false;
            }

            /*
             * 원본 이미지의 가로세로 비율을 계산한다.
             */
            double originalRatio =
                originalWidth / originalHeight;

            double displayImageWidth;
            double displayImageHeight;

            /*
             * 너비와 높이가 모두 지정된 경우
             * 전달된 값을 그대로 사용한다.
             *
             * 이 경우 원본 이미지 비율과 다른 값을 전달하면
             * Image 컨트롤 영역의 비율도 달라질 수 있다.
             *
             * Stretch="Uniform"이면 실제 비트맵은 비율을 유지하므로
             * 내부에 여백이 생길 수 있다.
             */
            if (_requestedImageWidth.HasValue &&
                _requestedImageHeight.HasValue)
            {
                displayImageWidth =
                    _requestedImageWidth.Value;

                displayImageHeight =
                    _requestedImageHeight.Value;
            }
            /*
             * 너비만 지정된 경우
             * 원본 비율을 유지하도록 높이를 자동 계산한다.
             */
            else if (_requestedImageWidth.HasValue)
            {
                displayImageWidth =
                    _requestedImageWidth.Value;

                displayImageHeight =
                    displayImageWidth / originalRatio;
            }
            /*
             * 높이만 지정된 경우
             * 원본 비율을 유지하도록 너비를 자동 계산한다.
             */
            else
            {
                displayImageHeight =
                    _requestedImageHeight!.Value;

                displayImageWidth =
                    displayImageHeight * originalRatio;
            }

            /*
             * 0 이하의 크기가 전달되면
             * WPF 레이아웃 오류나 비정상적인 표시가 발생할 수 있으므로
             * 지정 크기 적용을 중단한다.
             */
            if (displayImageWidth <= 0 ||
                displayImageHeight <= 0)
            {
                return false;
            }

            /*
             * 이미지가 세로형인지, 즉 설명이 이미지 오른쪽에 배치되는지 판단한다.
             *
             * 오른쪽 배치이면 팝업 너비에 설명 영역 너비를 더해야 하므로
             * 화면 크기 보정과 추천 크기 계산 모두에서 이 값을 사용한다.
             */
            bool isPortrait =
                ResolveDescriptionPosition(originalRatio)
                == ImageDescriptionPosition.Right;

            double descriptionWidth =
                isPortrait && _showDescription
                    ? 260
                    : 0;

            /*
             * [2026-09-23-03] 지정 크기를 현재 모니터 작업 영역 안으로 보정한다.
             *
             * FitToImage는 이미지 크기에서 팝업 크기가 나오므로,
             * imageWidth/imageHeight에 화면보다 큰 값이 들어오면
             * 팝업이 화면 밖으로 밀려 Header·닫기 버튼을 누를 수 없게 된다.
             * 원본 크기 기준 자동 계산(ApplyFitToImageSize)에는 이미 같은 보정이 있는데
             * 지정 크기 경로에만 빠져 있었다.
             *
             * 보정 기준은 자동 계산과 동일하게 작업 영역의 90%이며,
             * 이미지 바깥쪽 여백(팝업 좌우 공통 공간, 컨테이너 Padding·Border,
             * 오른쪽 설명 영역)을 제외한 값을 상한으로 쓴다.
             */
            double maximumImageWidth =
                Math.Max(
                    100,
                    SystemParameters.WorkArea.Width * 0.9
                    - 56
                    - ImageContainer.Padding.Left
                    - ImageContainer.Padding.Right
                    - ImageContainer.BorderThickness.Left
                    - ImageContainer.BorderThickness.Right
                    - descriptionWidth);

            double maximumImageHeight =
                Math.Max(
                    100,
                    SystemParameters.WorkArea.Height * 0.9
                    - (isPortrait && _showDescription
                        ? 190
                        : _showDescription
                            ? 300
                            : 190)
                    - ImageContainer.Padding.Top
                    - ImageContainer.Padding.Bottom
                    - ImageContainer.BorderThickness.Top
                    - ImageContainer.BorderThickness.Bottom);

            /*
             * 가로·세로 중 더 많이 줄여야 하는 쪽에 맞춰 축소 배율을 정한다.
             * 1을 포함했으므로 화면에 들어오는 크기는 그대로 둔다.
             */
            double requestedScale =
                Math.Min(
                    1,
                    Math.Min(
                        maximumImageWidth / displayImageWidth,
                        maximumImageHeight / displayImageHeight));

            displayImageWidth *= requestedScale;

            displayImageHeight *= requestedScale;

            /*
             * 지정한 표시 크기를 Image 컨트롤에 직접 적용한다.
             */
            PopupImage.HorizontalAlignment =
                HorizontalAlignment.Center;

            PopupImage.VerticalAlignment =
                VerticalAlignment.Center;

            PopupImage.Width =
                displayImageWidth;

            PopupImage.Height =
                displayImageHeight;

            PopupImage.MaxWidth =
                displayImageWidth;

            PopupImage.MaxHeight =
                displayImageHeight;

            /*
             * ImageContainer의 전체 너비를 계산한다.
             *
             * 컨테이너 크기에는 이미지뿐 아니라
             * 좌우 Padding과 좌우 BorderThickness도 포함해야 한다.
             */
            double imageContainerWidth =
                displayImageWidth
                + ImageContainer.Padding.Left
                + ImageContainer.Padding.Right
                + ImageContainer.BorderThickness.Left
                + ImageContainer.BorderThickness.Right;

            /*
             * ImageContainer의 전체 높이를 계산한다.
             *
             * 컨테이너 크기에는 이미지뿐 아니라
             * 상하 Padding과 상하 BorderThickness도 포함해야 한다.
             */
            double imageContainerHeight =
                displayImageHeight
                + ImageContainer.Padding.Top
                + ImageContainer.Padding.Bottom
                + ImageContainer.BorderThickness.Top
                + ImageContainer.BorderThickness.Bottom;

            /*
             * 계산된 크기를 ImageContainer에 직접 적용한다.
             *
             * 이렇게 하면 부모 Grid가 넓더라도
             * ImageContainer가 불필요하게 늘어나지 않는다.
             */
            ImageContainer.Width =
                imageContainerWidth;

            ImageContainer.Height =
                imageContainerHeight;

            ImageContainer.HorizontalAlignment =
                HorizontalAlignment.Center;

            ImageContainer.VerticalAlignment =
                VerticalAlignment.Center;

            /*
             * 이미지 영역이 고정 크기가 됐으므로
             * 그리드 행·열도 고정 크기 기준으로 맞춘다.
             */
            ApplyFitToImageGridSizing(
                isPortrait,
                descriptionWidth);

            /*
             * PopupWindow와 ImagePopupView에서 사용하는
             * ImageContainer 바깥쪽 좌우 여백이다.
             *
             * ImageContainer의 Padding과 Border는
             * imageContainerWidth에 이미 포함돼 있으므로
             * 여기서는 외부 레이아웃 공간만 사용한다.
             */
            const double popupHorizontalOuterSize = 56;

            /*
             * 이미지 컨테이너 바깥쪽의 높이를 계산한다.
             *
             * 여기에는 팝업 헤더, 이미지 제목,
             * 콘텐츠 외부 여백, Footer 등이 포함된다.
             */
            double popupVerticalOuterSize;

            if (isPortrait && _showDescription)
            {
                /*
                 * 세로형 설명은 이미지 오른쪽에 있으므로
                 * 설명 높이를 별도로 크게 추가하지 않는다.
                 */
                popupVerticalOuterSize = 190;
            }
            else
            {
                /*
                 * 가로형 또는 정사각형에서 설명을 표시하면
                 * 설명 영역이 이미지 아래에 배치되므로
                 * 팝업 높이를 더 크게 확보한다.
                 */
                popupVerticalOuterSize =
                    _showDescription
                        ? 300
                        : 190;
            }

            /*
             * 최종 팝업 추천 너비를 계산한다.
             *
             * ImageContainer 전체 너비
             * + 세로형 설명 영역 너비
             * + 팝업 외부 좌우 공간
             */
            double recommendedWindowWidth =
                imageContainerWidth
                + descriptionWidth
                + popupHorizontalOuterSize;

            /*
             * 최종 팝업 추천 높이를 계산한다.
             *
             * ImageContainer 전체 높이
             * + 팝업 헤더, 제목, Footer 등의 외부 높이
             */
            double recommendedWindowHeight =
                imageContainerHeight
                + popupVerticalOuterSize;

            /*
             * 지나치게 작은 팝업으로 인해
             * 제목이나 닫기 버튼이 잘리는 것을 방지한다.
             */
            const double minimumWindowWidth = 280;
            const double minimumWindowHeight = 300;

            recommendedWindowWidth =
                Math.Max(
                    minimumWindowWidth,
                    recommendedWindowWidth);

            recommendedWindowHeight =
                Math.Max(
                    minimumWindowHeight,
                    recommendedWindowHeight);

            /*
             * 계산된 추천 크기를 PopupWindow에 전달한다.
             */
            RecommendedSizeChanged?.Invoke(
                recommendedWindowWidth,
                recommendedWindowHeight);

            return true;
        }


        /*
         * 이미지를 불러오지 못했을 때
         * 화면에 오류 메시지를 표시한다.
         */
        private void ShowImageError(
            string errorMessage)
        {
            /*
             * 정상적이지 않은 이미지가
             * 화면에 남지 않도록 제거한다.
             */
            PopupImage.Source = null;

            /*
             * 설명 영역에 오류 메시지를 표시한다.
             */
            ImageDescriptionText.Text =
                errorMessage;

            /*
             * 오류가 발생하면
             * 기본 정사각형 레이아웃을 적용한다.
             */
            ApplySquareLayout();
        }
    }
}