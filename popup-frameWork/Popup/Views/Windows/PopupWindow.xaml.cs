using Popup.Models;
using System;
using System.Windows;
using System.Windows.Input;
using System.Threading.Tasks;
using Popup.Views.Contents;
using System.Windows.Interop;
using Forms = System.Windows.Forms;
namespace Popup.Views.Windows

{
    public partial class PopupWindow : Window
    {
        /*
         * PopupWindow 생성 시 사용할 설정 정보
         *
         * 생성자에서 전달받은 옵션을 저장해두고
         * 화면 초기화 시 사용한다.
         */
        private readonly PopupOptions _options;

        /*
         * PopupWindow 생성자
         *
         * options
         * 팝업 제목, 내용, 버튼 표시 여부 등
         * 팝업 생성에 필요한 설정 정보를 전달받는다.
         */
        public PopupWindow(PopupOptions options)
        {
            /*
             * PopupWindow.xaml을 읽어서
             * 화면 요소를 실제 객체로 만든다.
             */
            InitializeComponent();

            /*
             * 전달받은 옵션 객체가 null이면
             * 팝업을 생성할 수 없으므로 예외를 발생시킨다.
             */
            _options = options
                ?? throw new ArgumentNullException(nameof(options));

            /*
             * 전달받은 옵션 값을
             * 실제 화면에 적용한다.
             */
            ApplyOptions();
            ApplyPosition();
            Loaded += (_, _) => ApplyPosition();
            SizeChanged += (_, _) => ApplyPosition();

            if (_options.SizeMode
                == PopupSizeMode.Fullscreen)
            {
                SourceInitialized +=
                    PopupWindow_SourceInitialized;
            }
        }

        /*
         * PopupOptions에 설정된 값을
         * PopupWindow 화면에 적용한다.
         */
        private void ApplyOptions()
        {
            /*
             * 팝업 상단 제목을 설정한다.
             */
            PopupTitleText.Text = _options.Title;

            /*
             * 전달받은 UserControl을
             * ContentControl 안에 표시한다.
             */
            PopupContent.Content = _options.Content;

            /*
             * [2026-09-23-03] IMAGE 팝업의 FIT_TO_IMAGE 크기 계산 결과를 받는다.
             *
             * ImagePopupView는 이미지를 불러온 뒤 imageWidth/imageHeight 또는
             * 원본 크기를 기준으로 팝업 추천 크기를 계산해 이 이벤트로 알린다.
             * 그동안 이 이벤트를 구독하는 곳이 없어 FIT_TO_IMAGE로 설정해도
             * 팝업 크기는 PopupOptions 값 그대로였다.
             *
             * ADAPTIVE와 FILL은 팝업 크기가 기준이라 이 이벤트를 발생시키지 않으므로
             * 여기서 모드를 다시 확인할 필요는 없다.
             */
            if (_options.Content is ImagePopupView imagePopupView)
            {
                imagePopupView.RecommendedSizeChanged +=
                    ImagePopupView_RecommendedSizeChanged;
            }

            /*
             * 상단 X 버튼 표시 여부를 설정한다.
             */
            CloseButton.Visibility =
                _options.ShowCloseButton
                    ? Visibility.Visible
                    : Visibility.Collapsed;


            /*
             * Header 전체 표시 여부를 적용한다.
             *
             * Visibility만 Collapsed로 변경하면
             * 제목과 닫기 버튼은 보이지 않지만,
             * Header 전용 Grid 행 높이 48은 그대로 남을 수 있다.
             *
             * 따라서 HeaderArea의 표시 여부와
             * HeaderRow의 높이를 함께 변경한다.
             */
            HeaderArea.Visibility = _options.ShowHeader
                ? Visibility.Visible
                : Visibility.Collapsed;
            /*
             * 공통 Header가 없는 팝업에서도
             * 창 상단을 잡고 이동할 수 있도록
             * 투명한 드래그 영역의 표시 여부를 설정한다.
             *
             * ShowHeader = true
             * → 기존 HeaderArea에서 드래그하므로 숨긴다.
             *
             * ShowHeader = false
             * → HeaderlessDragArea를 표시한다.
             */
            HeaderlessDragArea.Visibility =
                _options.ShowHeader
                    ? Visibility.Collapsed
                    : Visibility.Visible;
            /*
             * ShowHeader가 true면
             * Header가 사용할 높이 48을 유지한다.
             *
             * ShowHeader가 false면
             * Header 행 높이를 0으로 만들어
             * Header가 차지하던 빈 공간까지 제거한다.
             */
            HeaderRow.Height = _options.ShowHeader
                ? new GridLength(48)
                : new GridLength(0);

            /*
             * 상단 X 닫기 버튼 표시 여부를 적용한다.
             *
             * Header 전체가 숨겨져 있으면
             * ShowCloseButton이 true여도 버튼은 표시되지 않는다.
             */
            CloseButton.Visibility =
                _options.ShowHeader && _options.ShowCloseButton
                    ? Visibility.Visible
                    : Visibility.Collapsed;


            /*
             * Footer 표시 여부를 적용한다.
             *
             * Visibility만 Collapsed로 변경하면
             * Footer 안의 버튼과 체크박스는 보이지 않지만,
             * Grid의 Footer 행 높이 64는 그대로 남을 수 있다.
             *
             * 그래서 FooterArea의 표시 여부와
             * FooterRow의 높이를 함께 변경해야 한다.
             */
            FooterArea.Visibility = _options.ShowFooter
                ? Visibility.Visible
                : Visibility.Collapsed;

            /*
             * ShowFooter가 true면
             * Footer가 사용할 높이 64를 유지한다.
             *
             * ShowFooter가 false면
             * Footer 행 높이를 0으로 만들어
             * Footer가 차지하던 빈 공간까지 완전히 제거한다.
             */
            FooterRow.Height = _options.ShowFooter
            ? new GridLength(64)
            : new GridLength(0);

            /*
             * '30일간 보지 않기' 체크박스
             * 표시 여부를 설정한다.
             */
            DoNotShowAgainCheckBox.Visibility =
                _options.ShowFooter && _options.ShowDoNotShowAgain
                    ? Visibility.Visible
                    : Visibility.Collapsed;

            FooterCloseButton.Visibility =
                _options.ShowCloseButton
                    ? Visibility.Visible
                    : Visibility.Collapsed;

            /*
             * [설계 14 §5] 관리자 설정 폰트 크기(Header/Footer/본문)를 적용한다.
             */
            ApplyFontSizes();

            /*
             * PopupOptions의 SizeMode에 따라
             * 팝업 크기를 계산해서 적용한다.
             */
            ApplyWindowSize();
        }

        /*
         * PopupOptions.SizeMode에 따라
         * PopupWindow의 실제 크기를 결정한다.
         */
        private void ApplyWindowSize()
        {
            /*
             * PopupWindow.xaml에는 Visual Studio 미리보기와
             * 기본 실행을 위한 최소 크기가 작성되어 있다.
             *
             * 이 값을 여기서 서버 설정으로 다시 지정하지 않으면
             * DB의 560 x 420 같은 크기가 XAML의 620 x 480에 막혀
             * 실제 창에 적용되지 않는다.
             */
            MinWidth =
                _options.MinimumWidth;

            MinHeight =
                _options.MinimumHeight;

            MaxWidth =
                _options.MaximumWidth;

            MaxHeight =
                _options.MaximumHeight;

            switch (_options.SizeMode)
            {
                /*
                 * 기존 고정 크기 방식
                 *
                 * [설계 11 §4·§5·§6] 예전에는 서버 Width/Height를 그대로 적용해, 작업 영역보다 큰 값
                 * (예: 5000 x 3000)이 내려오면 Header/Footer/닫기 버튼이 화면 밖으로 밀리고
                 * Topmost + Overlay 조합에서 사용자 PC 조작이 막힐 수 있었다.
                 * 이제 VIEWPORT_RATIO/AUTO처럼 현재 모니터 작업 영역(WorkArea, DIP 단위)을 기준으로
                 * 최종 상한을 두고, 안전 여백으로 작업 영역의 95%를 최대값으로 쓴다.
                 *
                 * 순서:
                 *   서버 Width/Height
                 *   → 서버 MaximumWidth/Height 적용
                 *   → 작업 영역 95% 상한 적용
                 *   → 최소값도 상한 이하로 보정(Minimum > 화면 최대일 때 Math.Clamp 예외 방지)
                 *   → 최종 Window 크기
                 *
                 * MinWidth/MaxWidth(Window 속성)도 같은 보정값으로 다시 지정한다.
                 * 그렇지 않으면 XAML/서버의 MinWidth가 보정된 Width보다 커서 WPF가 다시 키운다.
                 */
                case PopupSizeMode.Fixed:
                    {
                        SizeToContent =
                            SizeToContent.Manual;

                        Rect workArea =
                            SystemParameters.WorkArea;

                        double safeMaxWidth =
                            Math.Min(
                                _options.MaximumWidth,
                                workArea.Width * FixedSizeSafeAreaRatio);

                        double safeMaxHeight =
                            Math.Min(
                                _options.MaximumHeight,
                                workArea.Height * FixedSizeSafeAreaRatio);

                        double safeMinWidth =
                            Math.Min(
                                _options.MinimumWidth,
                                safeMaxWidth);

                        double safeMinHeight =
                            Math.Min(
                                _options.MinimumHeight,
                                safeMaxHeight);

                        MinWidth =
                            safeMinWidth;

                        MinHeight =
                            safeMinHeight;

                        MaxWidth =
                            safeMaxWidth;

                        MaxHeight =
                            safeMaxHeight;

                        Width =
                            Math.Clamp(
                                _options.Width,
                                safeMinWidth,
                                safeMaxWidth);

                        Height =
                            Math.Clamp(
                                _options.Height,
                                safeMinHeight,
                                safeMaxHeight);

                        break;
                    }

                /*
                 * 모니터 작업 영역의 비율로
                 * 팝업 크기를 계산한다.
                 */
                case PopupSizeMode.ViewportRatio:
                    {
                        SizeToContent =
                            SizeToContent.Manual;

                        Rect workArea =
                            SystemParameters.WorkArea;

                        /*
                         * 잘못된 비율이 들어와도
                         * 10%에서 100% 사이로 제한한다.
                         */
                        double widthRatio =
                            Math.Clamp(
                                _options.WidthRatio,
                                0.1,
                                1.0);

                        double heightRatio =
                            Math.Clamp(
                                _options.HeightRatio,
                                0.1,
                                1.0);

                        double calculatedWidth =
                            workArea.Width *
                            widthRatio;

                        double calculatedHeight =
                            workArea.Height *
                            heightRatio;

                        /*
                         * 최대 크기는 설정값뿐 아니라
                         * 실제 모니터 작업 영역도 넘지 않게 제한한다.
                         */
                        double maximumWidth =
                            Math.Min(
                                _options.MaximumWidth,
                                workArea.Width);

                        double maximumHeight =
                            Math.Min(
                                _options.MaximumHeight,
                                workArea.Height);

                        Width =
                            Math.Clamp(
                                calculatedWidth,
                                _options.MinimumWidth,
                                maximumWidth);

                        Height =
                            Math.Clamp(
                                calculatedHeight,
                                _options.MinimumHeight,
                                maximumHeight);

                        break;
                    }

                /*
                 * TEXT, IMAGE, VIDEO, SURVEY 등 콘텐츠 종류와 관계없이
                 * 공통 PopupWindow를 주 모니터 전체 크기로 표시한다.
                 * 실제 모니터 좌표는 Window 핸들이 만들어진 뒤 적용한다.
                 */
                case PopupSizeMode.Fullscreen:
                    {
                        SizeToContent =
                            SizeToContent.Manual;

                        MinWidth =
                            0;

                        MinHeight =
                            0;

                        MaxWidth =
                            double.PositiveInfinity;

                        MaxHeight =
                            double.PositiveInfinity;

                        WindowStartupLocation =
                            WindowStartupLocation.Manual;

                        WindowState =
                            WindowState.Normal;

                        Topmost =
                            true;

                        /*
                         * 일반 팝업의 24px 바깥 여백은 그림자를 보여주기
                         * 위한 투명 공간이다. 전체화면에서는 이 여백 때문에
                         * 뒤 화면과 작업표시줄이 보이므로 제거한다.
                         */
                        PopupOuterGrid.Margin =
                            new Thickness(0);

                        PopupBodyBorder.CornerRadius =
                            new CornerRadius(0);

                        PopupBodyBorder.BorderThickness =
                            new Thickness(0);

                        PopupBodyBorder.Effect =
                            null;

                        HeaderArea.CornerRadius =
                            new CornerRadius(0);

                        break;
                    }

                /*
                 * 콘텐츠 크기에 맞춰
                 * Window 크기를 자동으로 계산한다.
                 */
                case PopupSizeMode.Auto:
                    {
                        Rect workArea =
                            SystemParameters.WorkArea;

                        SizeToContent =
                            SizeToContent.WidthAndHeight;

                        MinWidth =
                            _options.MinimumWidth;

                        MinHeight =
                            _options.MinimumHeight;

                        MaxWidth =
                            Math.Min(
                                _options.MaximumWidth,
                                workArea.Width * 0.9);

                        MaxHeight =
                            Math.Min(
                                _options.MaximumHeight,
                                workArea.Height * 0.9);

                        break;
                    }

                /*
                 * 정의되지 않은 값이 들어온 경우
                 * 기존 고정 크기 방식으로 처리한다.
                 * [설계 11] Fixed와 같은 화면 초과 방어를 받도록 Fixed 분기로 보낸다.
                 */
                default:
                    {
                        goto case PopupSizeMode.Fixed;
                    }
            }
        }

        /*
         * [설계 11 §4] FIXED 크기의 화면 안전 여백. 작업 영역의 95%를 최대 크기로 쓴다.
         * (1920 x 1080 작업 영역이면 약 1824 x 1026)
         */
        private const double FixedSizeSafeAreaRatio = 0.95;

        /*
         * [2026-09-23-03] IMAGE 팝업 FIT_TO_IMAGE의 추천 크기를 창에 적용한다.
         *
         * 이미지 크기가 먼저 정해지고 팝업 크기가 그 결과로 나오는 모드이므로,
         * 여기서 서버가 준 Width/Height 대신 계산된 크기를 쓴다.
         *
         * 다만 서버 설정과 화면 밖으로 밀리는 문제는 그대로 막아야 하므로
         * FIXED와 같은 기준(PopupOptions의 Minimum/Maximum + 작업 영역 95%)으로
         * 보정한 뒤 적용하고, 크기가 바뀐 만큼 창을 다시 화면 중앙에 맞춘다.
         *
         * FULLSCREEN은 모니터 전체를 덮는 것이 목적이라 크기를 바꾸지 않는다.
         */
        private void ImagePopupView_RecommendedSizeChanged(
            double recommendedWidth,
            double recommendedHeight)
        {
            if (_options.SizeMode
                == PopupSizeMode.Fullscreen)
            {
                return;
            }

            Rect workArea =
                SystemParameters.WorkArea;

            double safeMaxWidth =
                Math.Min(
                    _options.MaximumWidth,
                    workArea.Width * FixedSizeSafeAreaRatio);

            double safeMaxHeight =
                Math.Min(
                    _options.MaximumHeight,
                    workArea.Height * FixedSizeSafeAreaRatio);

            double safeMinWidth =
                Math.Min(
                    _options.MinimumWidth,
                    safeMaxWidth);

            double safeMinHeight =
                Math.Min(
                    _options.MinimumHeight,
                    safeMaxHeight);

            /*
             * SizeToContent가 켜져 있으면(AUTO 모드) Width/Height 지정이 무시되므로
             * 수동 크기 지정으로 전환한다.
             */
            SizeToContent =
                SizeToContent.Manual;

            MinWidth = safeMinWidth;
            MinHeight = safeMinHeight;
            MaxWidth = safeMaxWidth;
            MaxHeight = safeMaxHeight;

            Width =
                Math.Clamp(
                    recommendedWidth,
                    safeMinWidth,
                    safeMaxWidth);

            Height =
                Math.Clamp(
                    recommendedHeight,
                    safeMinHeight,
                    safeMaxHeight);

            /*
             * 창이 이미 표시된 뒤 크기가 바뀌므로
             * 작업 영역 기준으로 선택한 위치에 다시 배치한다.
             */
            ApplyPosition();
        }

        public void ApplyPosition()
        {
            WindowStartupLocation = WindowStartupLocation.Manual;
            // WPF logical units; WorkArea always refers to the primary monitor.
            Rect area = SystemParameters.WorkArea;
            if (_options.SizeMode == PopupSizeMode.Fullscreen)
            {
                if (PresentationSource.FromVisual(this) == null) { Left = area.Left; Top = area.Top; }
                return;
            }
            double width = ActualWidth > 0 ? ActualWidth : Width;
            double height = ActualHeight > 0 ? ActualHeight : Height;
            if (!double.IsFinite(width) || !double.IsFinite(height)) return;
            double x = _options.Position switch
            {
                PopupPosition.TopLeft or PopupPosition.CenterLeft or PopupPosition.BottomLeft => 0,
                PopupPosition.TopRight or PopupPosition.CenterRight or PopupPosition.BottomRight => 1,
                _ => 0.5
            };
            double y = _options.Position switch
            {
                PopupPosition.TopLeft or PopupPosition.TopCenter or PopupPosition.TopRight => 0,
                PopupPosition.BottomLeft or PopupPosition.BottomCenter or PopupPosition.BottomRight => 1,
                _ => 0.5
            };
            Left = area.Left + Math.Max(0, area.Width - width) * x;
            Top = area.Top + Math.Max(0, area.Height - height) * y;
        }

        /*
         * [설계 14 §5] 관리자가 설정한 Header/Footer/본문 폰트 크기를 적용한다.
         *
         * - null(설정 없음)이면 아무것도 바꾸지 않아 XAML 기본값(Header 17, Footer 14, 본문은 View별)이 유지된다(§5.8).
         * - 값이 있으면 FontSizeMin~FontSizeMax로 최종 Clamp 한다(§5.7 — 서버 값을 그대로 신뢰하지 않음).
         * - Header: PopupTitleText.  Footer: "다시 보지 않기" 체크박스와 하단 닫기 버튼(§5.5 — Footer 공통 FontSize 하나).
         *   상단 X 버튼은 아이콘 성격이라 제외한다.
         * - 본문: 콘텐츠 View가 IBodyFontSizeAware를 구현하면 그 View에 위임한다(§5.6 — 유형별 본문 정의는 View가 안다).
         */
        private void ApplyFontSizes()
        {
            if (TryClampFontSize(_options.HeaderFontSize, out double headerFontSize))
            {
                PopupTitleText.FontSize = headerFontSize;
            }

            if (TryClampFontSize(_options.FooterFontSize, out double footerFontSize))
            {
                DoNotShowAgainCheckBox.FontSize = footerFontSize;
                FooterCloseButton.FontSize = footerFontSize;
            }

            if (TryClampFontSize(_options.BodyFontSize, out double bodyFontSize)
                && _options.Content is IBodyFontSizeAware bodyFontSizeAware)
            {
                bodyFontSizeAware.ApplyBodyFontSize(bodyFontSize);
            }
        }

        /// <summary>설정값이 있고 유한한 숫자이면 10~40으로 보정해 돌려준다. 없으면 false(기본 크기 유지).</summary>
        private static bool TryClampFontSize(double? configured, out double fontSize)
        {
            if (configured is double value && double.IsFinite(value) && value > 0)
            {
                fontSize = Math.Clamp(value, PopupOptions.FontSizeMin, PopupOptions.FontSizeMax);
                return true;
            }
            fontSize = 0;
            return false;
        }

        /*
         * FULLSCREEN 모드에서 주 모니터의 전체 영역을 구한다.
         *
         * WinForms Screen.Bounds는 실제 픽셀 단위이고,
         * WPF Window는 DIP 단위를 사용하므로 DPI 변환 후 적용한다.
         * WorkingArea 대신 Bounds를 사용하므로 작업표시줄도 덮는다.
         */
        private void PopupWindow_SourceInitialized(
            object? sender,
            EventArgs e)
        {
            SourceInitialized -=
                PopupWindow_SourceInitialized;

            WindowInteropHelper windowInteropHelper =
                new WindowInteropHelper(
                    this);

            Forms.Screen screen =
                Forms.Screen.PrimaryScreen ?? Forms.Screen.FromHandle(
                    windowInteropHelper.Handle);

            PresentationSource? presentationSource =
                PresentationSource.FromVisual(
                    this);

            if (presentationSource?.CompositionTarget == null)
            {
                return;
            }

            System.Windows.Media.Matrix fromDevice =
                presentationSource.CompositionTarget
                    .TransformFromDevice;

            Point topLeft =
                fromDevice.Transform(
                    new Point(
                        screen.Bounds.Left,
                        screen.Bounds.Top));

            Point bottomRight =
                fromDevice.Transform(
                    new Point(
                        screen.Bounds.Right,
                        screen.Bounds.Bottom));

            Left =
                topLeft.X;

            Top =
                topLeft.Y;

            Width =
                bottomRight.X
                - topLeft.X;

            Height =
                bottomRight.Y
                - topLeft.Y;
        }

        /*
         * 상단바 마우스 클릭 이벤트
         *
         * 상단바를 마우스로 누르고 움직이면
         * 팝업 창도 함께 이동한다.
         */
        private void Header_MouseLeftButtonDown(
            object sender,
            MouseButtonEventArgs e)
        {
            if (_options.SizeMode
                == PopupSizeMode.Fullscreen)
            {
                return;
            }

            if (e.LeftButton == MouseButtonState.Pressed)
            {
                DragMove();
            }
        }


        /*
 * 팝업의 닫기 버튼 또는 Header 닫기 버튼을 처리한다.
 */
        private async void CloseButton_Click(
            object sender,
            RoutedEventArgs e)
        {
            /*
             * 클릭된 닫기 버튼을 가져온다.
             */
            UIElement? clickedControl =
                sender as UIElement;

            if (clickedControl == null)
            {
                return;
            }

            /*
             * 상위 컨트롤로 클릭 이벤트가
             * 추가 전달되지 않도록 처리한다.
             */
            e.Handled =
                true;

            /*
             * 서버가 완료 전 닫기를 금지한 VIDEO 팝업은
             * 누적 시청 비율이 완료 기준에 도달하기 전까지 닫지 않는다.
             * [기준 4] 실시간 진행률 API가 없어졌으므로 VideoPopupView의 로컬 추정(HasReachedCompletion)을 쓴다.
             * 최종 완료 판정은 창이 닫힐 때 보내는 결과 항목으로 서버가 한다.
             *
             * TEXT나 SURVEY 등 다른 팝업의 기존 닫기 동작에는
             * 영향을 주지 않도록 VIDEO 콘텐츠에만 적용한다.
             */
            if (_options.Content is VideoPopupView videoPopupView &&
                !_options.AllowCloseBeforeComplete &&
                !_options.IsCompleted &&
                !videoPopupView.HasReachedCompletion(_options.CompletionRatio) &&
                !videoPopupView.HasPlaybackFailed)
            {
                double requiredPercent =
                    Math.Clamp(
                        _options.CompletionRatio,
                        0,
                        1)
                    * 100;

                MessageBox.Show(this,
                    $"이 영상은 {requiredPercent:0.##}% 이상 시청해야 " +
                    "닫을 수 있습니다.",
                    "필수 영상 시청",
                    MessageBoxButton.OK,
                    MessageBoxImage.Information);

                return;
            }

            /*
             * 저장 중 버튼을 다시 클릭해서
             * API가 중복 호출되는 것을 방지한다.
             */
            clickedControl.IsEnabled =
                false;

            try
            {
                /*
                 * 체크된 경우에만 서버에
                 * 30일 숨김 정보를 저장한다.
                 */
                await SaveDoNotShowAgainAsync();

                /*
                 * 저장이 성공했거나 저장할 필요가 없으면
                 * 현재 팝업을 닫는다.
                 */
                Close();
            }
            catch (Exception exception)
            {
                /*
                 * 서버 저장에 실패하면
                 * 팝업을 닫지 않고 오류를 표시한다.
                 */
                MessageBox.Show(this,
                    "다시 보지 않기 설정을 저장하지 못했습니다.\n\n" +
                    exception.Message,
                    "팝업 설정 저장 오류",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
            }
            finally
            {
                /*
                 * 저장 실패로 창이 남아 있을 경우
                 * 사용자가 다시 시도할 수 있도록 버튼을 활성화한다.
                 */
                clickedControl.IsEnabled =
                    true;
            }
        }

        /*
         * [기준 3·4] "다시 보지 않기" 처리.
         * 예전에는 닫기 직전에 숨김 API(/hide)를 직접 호출해 성공해야 창을 닫았다.
         * 이제 서버 호출은 하지 않고 체크 여부만 PopupOptions에 기록한다. 창이 닫히면 PopupManager가
         * HIDDEN 결과 항목을 만들어 결과 API로 1회 전송한다(전송 실패는 큐가 보관·재전송).
         * 메서드 이름·호출 위치는 기존 흐름(CloseButton_Click)을 유지하기 위해 그대로 두었다.
         */
        private Task SaveDoNotShowAgainAsync()
        {
            RecordDoNotShowAgainChoice();
            return Task.CompletedTask;
        }

        /*
         * 닫기 버튼 외의 경로(ESC, Alt+F4, 프로그램 종료)로 닫혀도 체크 상태가 결과에 반영되도록
         * Closing 시점에 한 번 더 기록한다.
         */
        protected override void OnClosing(System.ComponentModel.CancelEventArgs e)
        {
            RecordDoNotShowAgainChoice();
            base.OnClosing(e);
        }

        private void RecordDoNotShowAgainChoice()
        {
            _options.DoNotShowAgainChecked =
                _options.ShowDoNotShowAgain
                && DoNotShowAgainCheckBox.IsChecked == true;
        }
    }
}
