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
     *
     * Overlay는 팝업마다 만들지 않고 PopupManager가 한 세트만 유지한다.
     *
     * [2026-09-19 수정 — 사용자 시연 피드백]
     *  - "배경을 눌러도 팝업이 뒤로 가리면 안 된다": Overlay가 클릭으로 활성화되면 Topmost 창끼리 z-순서가 바뀌어
     *    팝업이 Overlay 뒤로 갈 수 있었다. WS_EX_NOACTIVATE + WM_MOUSEACTIVATE → MA_NOACTIVATEANDEAT 로
     *    Overlay는 절대 활성화되지 않고 클릭을 삼킨다(배경 차단은 그대로). 클릭 시 BackgroundClicked 이벤트로
     *    PopupManager가 팝업 창을 다시 맨 앞으로 올린다.
     *  - "작업 관리자·작업 표시줄에 창이 여러 개": ShowInTaskbar=false(WS_EX_TOOLWINDOW)에 더해 제목을 비우고
     *    소유자(owner)를 팝업 창의 소유자로 두어 앱 창 목록에 잡히지 않게 한다.
     *  - "특정 모니터에 Overlay가 안 생긴다": WPF가 Show 과정에서 창 크기·위치를 다시 적용해 SourceInitialized의
     *    SetWindowPos 결과가 덮일 수 있다. Show 뒤와 Loaded 뒤에 모니터 물리 영역으로 다시 맞춘다.
     */
    public sealed class BackgroundOverlayManager
    {
        private readonly List<Window> _overlayWindows = new();

        /* 배경 어두움 정도. 0.0 = 완전 투명, 1.0 = 완전 불투명 */
        public double Opacity { get; set; } = 0.45;

        /// <summary>Overlay 창(어느 모니터든)이 클릭됐을 때. PopupManager가 팝업을 다시 맨 앞으로 올린다.</summary>
        public event EventHandler? BackgroundClicked;

        /// <summary>Overlay 창의 소유자(작업 표시줄·Alt+Tab·작업 관리자 목록에서 숨기기 위해). 없으면 소유자 없음.</summary>
        public Window? Owner { get; set; }

        public bool IsVisible => _overlayWindows.Count > 0;

        /* 현재 Windows가 인식한 모든 모니터에 Overlay를 하나씩 생성한다. */
        public void Show()
        {
            if (IsVisible)
            {
                return;
            }

            double overlayOpacity = Math.Clamp(Opacity, 0.0, 1.0);

            foreach (Forms.Screen screen in Forms.Screen.AllScreens)
            {
                Forms.Screen currentScreen = screen;
                Window overlayWindow = new()
                {
                    Title = string.Empty,
                    WindowStyle = WindowStyle.None,
                    ResizeMode = ResizeMode.NoResize,
                    ShowInTaskbar = false,
                    ShowActivated = false,
                    Focusable = false,
                    Topmost = true,
                    // Window.Opacity는 AllowsTransparency=true일 때만 적용된다. 원본은 이 설정이 없어 Overlay가
                    // 설정값과 무관하게 완전 불투명(검정)으로 떴다. 실행 캡처(2026-09-19)로 확인해 수정.
                    AllowsTransparency = true,
                    Background = Brushes.Black,
                    Opacity = overlayOpacity,
                    WindowStartupLocation = WindowStartupLocation.Manual,
                    // 초기 크기를 모니터 영역으로 두어 WPF 기본 크기(가로세로 NaN → 시스템 기본)로 뜨는 순간을 없앤다.
                    Left = currentScreen.Bounds.Left,
                    Top = currentScreen.Bounds.Top,
                    Width = currentScreen.Bounds.Width,
                    Height = currentScreen.Bounds.Height
                };
                // 소유자가 보이지 않으면(실서버 모드의 숨겨진 MainWindow) 소유 관계를 두지 않는다 — 기존 팝업 창 규칙과 동일
                if (Owner != null && Owner.IsVisible)
                {
                    overlayWindow.Owner = Owner;
                }

                overlayWindow.SourceInitialized += (sender, eventArgs) =>
                {
                    IntPtr handle = new WindowInteropHelper(overlayWindow).Handle;
                    // 활성화되지 않는 도구 창으로 만든다(Alt+Tab·작업 표시줄 제외, 클릭해도 포커스를 가져가지 않음).
                    int exStyle = GetWindowLong(handle, GWL_EXSTYLE);
                    SetWindowLong(handle, GWL_EXSTYLE, exStyle | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW);
                    // 클릭은 삼키되(배경 차단) 활성화는 하지 않는다 → 팝업의 z-순서·포커스 유지
                    HwndSource.FromHwnd(handle)?.AddHook(OverlayWndProc);
                    FitToScreen(handle, currentScreen);
                };
                overlayWindow.Loaded += (sender, eventArgs) =>
                    FitToScreen(new WindowInteropHelper(overlayWindow).Handle, currentScreen);
                overlayWindow.PreviewMouseDown += (sender, eventArgs) =>
                {
                    eventArgs.Handled = true;
                    BackgroundClicked?.Invoke(this, EventArgs.Empty);
                };

                _overlayWindows.Add(overlayWindow);
                overlayWindow.Show();
                FitToScreen(new WindowInteropHelper(overlayWindow).Handle, currentScreen);
            }
        }

        /* 생성했던 모든 모니터 Overlay를 닫는다. */
        public void Close()
        {
            foreach (Window overlayWindow in _overlayWindows)
            {
                overlayWindow.Close();
            }
            _overlayWindows.Clear();
        }

        /*
         * Screen.Bounds는 물리 픽셀 좌표이고 WPF Window 좌표는 DPI에 따라 DIP로 변환될 수 있다.
         * Win32 SetWindowPos로 실제 모니터의 물리 픽셀 영역에 정확히 맞추고, 활성화 없이 최상위로 둔다.
         */
        private static void FitToScreen(IntPtr handle, Forms.Screen screen)
        {
            if (handle == IntPtr.Zero) return;
            SetWindowPos(handle, HWND_TOPMOST,
                screen.Bounds.Left, screen.Bounds.Top, screen.Bounds.Width, screen.Bounds.Height,
                SWP_NOACTIVATE | SWP_SHOWWINDOW);
        }

        /* WM_MOUSEACTIVATE에 MA_NOACTIVATEANDEAT: 창을 활성화하지 않고 클릭도 뒤로 보내지 않는다. */
        private IntPtr OverlayWndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == WM_MOUSEACTIVATE)
            {
                handled = true;
                BackgroundClicked?.Invoke(this, EventArgs.Empty);
                return new IntPtr(MA_NOACTIVATEANDEAT);
            }
            return IntPtr.Zero;
        }

        private static readonly IntPtr HWND_TOPMOST = new(-1);
        private const int GWL_EXSTYLE = -20;
        private const int WS_EX_TOOLWINDOW = 0x00000080;
        private const int WS_EX_NOACTIVATE = 0x08000000;
        private const int WM_MOUSEACTIVATE = 0x0021;
        private const int MA_NOACTIVATEANDEAT = 4;
        private const uint SWP_NOACTIVATE = 0x0010;
        private const uint SWP_SHOWWINDOW = 0x0040;

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int x, int y, int width, int height, uint flags);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern int GetWindowLong(IntPtr hWnd, int index);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern int SetWindowLong(IntPtr hWnd, int index, int newLong);
    }
}
