using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;
using Forms = System.Windows.Forms;

namespace Popup.Managers
{
    /*
     * 팝업이 표시되는 동안 모든 모니터의 배경을 덮는 Overlay를 관리한다.
     *
     * 목적
     * 1. 팝업 바깥쪽 배경을 반투명하게 어둡게 표시한다.
     * 2. Overlay Window가 마우스 입력을 받도록 하여
     *    뒤쪽 바탕화면이나 다른 프로그램으로 클릭이 전달되지 않게 한다.
     * 3. 키보드 입력은 차단하지 않는다.
     *    Alt+Tab 같은 키보드 제어는 이후 별도 기능으로 분리한다.
     *
     * Overlay는 팝업마다 만들지 않고 PopupManager가 한 세트만 유지한다.
     * 따라서 SIMULTANEOUS 팝업 여러 개가 떠도 Overlay가 중첩되지 않는다.
     */
    public sealed class BackgroundOverlayManager
    {
        private readonly List<Window> _overlayWindows = new();

        /*
         * 배경 어두움 정도다.
         * 0.0 = 완전 투명
         * 1.0 = 완전 불투명
         */
        public double Opacity { get; set; } = 0.45;

        public bool IsVisible =>
            _overlayWindows.Count > 0;

        /*
         * 현재 Windows가 인식한 모든 모니터에 Overlay를 하나씩 생성한다.
         */
        public void Show()
        {
            if (IsVisible)
            {
                return;
            }

            double overlayOpacity =
                Math.Clamp(Opacity, 0.0, 1.0);

            foreach (Forms.Screen screen in Forms.Screen.AllScreens)
            {
                Forms.Screen currentScreen = screen;

                Window overlayWindow =
                    new Window
                    {
                        WindowStyle = WindowStyle.None,
                        ResizeMode = ResizeMode.NoResize,
                        ShowInTaskbar = false,
                        ShowActivated = false,
                        Focusable = false,
                        Topmost = true,
                        Background = Brushes.Black,
                        Opacity = overlayOpacity,
                        WindowStartupLocation = WindowStartupLocation.Manual
                    };

                /*
                 * Screen.Bounds는 물리 픽셀 좌표이고 WPF Window 좌표는
                 * DPI에 따라 DIP로 변환될 수 있다.
                 * SourceInitialized 이후 Win32 SetWindowPos를 사용해
                 * 실제 모니터의 물리 픽셀 영역에 정확히 맞춘다.
                 */
                overlayWindow.SourceInitialized +=
                    (sender, eventArgs) =>
                    {
                        IntPtr handle =
                            new WindowInteropHelper(overlayWindow).Handle;

                        SetWindowPos(
                            handle,
                            HWND_TOPMOST,
                            currentScreen.Bounds.Left,
                            currentScreen.Bounds.Top,
                            currentScreen.Bounds.Width,
                            currentScreen.Bounds.Height,
                            SWP_NOACTIVATE | SWP_SHOWWINDOW);
                    };

                _overlayWindows.Add(overlayWindow);
                overlayWindow.Show();
            }
        }

        /*
         * 생성했던 모든 모니터 Overlay를 닫는다.
         */
        public void Close()
        {
            foreach (Window overlayWindow in _overlayWindows)
            {
                overlayWindow.Close();
            }

            _overlayWindows.Clear();
        }

        private static readonly IntPtr HWND_TOPMOST =
            new IntPtr(-1);

        private const uint SWP_NOACTIVATE = 0x0010;
        private const uint SWP_SHOWWINDOW = 0x0040;

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool SetWindowPos(
            IntPtr hWnd,
            IntPtr hWndInsertAfter,
            int x,
            int y,
            int width,
            int height,
            uint flags);
    }
}
