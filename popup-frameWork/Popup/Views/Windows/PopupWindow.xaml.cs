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
                 * Width와 Height 값을 그대로 사용한다.
                 */
                case PopupSizeMode.Fixed:
                    {
                        SizeToContent =
                            SizeToContent.Manual;

                        Width =
                            _options.Width;

                        Height =
                            _options.Height;

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
                 * 공통 PopupWindow를 현재 모니터 전체 크기로 표시한다.
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
                 */
                default:
                    {
                        SizeToContent =
                            SizeToContent.Manual;

                        Width =
                            _options.Width;

                        Height =
                            _options.Height;

                        break;
                    }
            }
        }

        /*
         * FULLSCREEN 모드에서 팝업이 열릴 모니터의 전체 영역을 구한다.
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
                Forms.Screen.FromHandle(
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
             * 진행률 API에서 완료 판정을 받기 전까지 닫지 않는다.
             *
             * TEXT나 SURVEY 등 다른 팝업의 기존 닫기 동작에는
             * 영향을 주지 않도록 VIDEO 콘텐츠에만 적용한다.
             */
            if (_options.Content is VideoPopupView videoPopupView &&
                !_options.AllowCloseBeforeComplete &&
                !_options.IsCompleted &&
                !videoPopupView.HasPlaybackFailed)
            {
                double requiredPercent =
                    Math.Clamp(
                        _options.CompletionRatio,
                        0,
                        1)
                    * 100;

                MessageBox.Show(
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
                MessageBox.Show(
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
        * 사용자가 선택한 "다시 보지 않기" 설정을
        * Java API를 통해 Oracle DB에 저장한다.
        */
        private async Task SaveDoNotShowAgainAsync()
        {
            /*
             * 체크박스가 표시되지 않거나
             * 사용자가 체크하지 않았다면
             * 서버 저장 없이 정상적으로 종료한다.
             */
            if (_options.ShowDoNotShowAgain == false ||
                DoNotShowAgainCheckBox.IsChecked != true)
            {
                return;
            }

            /*
             * 어떤 팝업을 숨길지 서버에 전달하려면
             * PopupId가 반드시 필요하다.
             */
            if (string.IsNullOrWhiteSpace(
                    _options.PopupId))
            {
                throw new InvalidOperationException(
                    "팝업 ID가 없어 다시 보지 않기를 저장할 수 없습니다.");
            }

            /*
             * MainWindow에서 서버 저장 콜백이
             * 설정되지 않은 경우 API를 호출할 수 없다.
             */
            if (_options.HidePopupAsync == null)
            {
                throw new InvalidOperationException(
                    "팝업 숨김 저장 기능이 설정되지 않았습니다.");
            }

            /*
             * 현재 정책은 30일 동안 숨김이다.
             */
            const int hideDays =
                30;

            /*
             * MainWindow에서 설정한 콜백을 호출하여
             * Java API와 Oracle DB에 숨김 상태를 저장한다.
             */
            await _options.HidePopupAsync(
                _options.PopupId,
                hideDays);
        }
    }
}
