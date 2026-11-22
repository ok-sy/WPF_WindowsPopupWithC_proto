using System;
using System.Runtime.InteropServices;
using System.Windows.Interop;

namespace Popup.Services
{
    /*
     * POL-15 : 배포·실행 환경 — 개발 빌드 전용 탈출키
     * ■ 전역 단축키로 앱 종료
     * - in : onPressed(Action) 단축키를 눌렀을 때 실행할 동작(App.ExitAgent)
     * - out: DevEscapeHotkey(Dispose로 등록 해제) 또는 null(운영 빌드·등록 실패)
     * - 단축키: Ctrl + Alt + Shift + Q. Overlay·영상 시청 기준·화면 출구 없는 팝업 때문에 테스트 중 빠져나갈 수 없을 때 쓴다.
     * - 개발 빌드(BuildProfile.AllowsDevEscapeHotkey, POPUP_EXTERNAL_CONFIG)에서만 등록한다. 운영 빌드에는 들어가지 않는다.
     * - 포커스와 무관하게 동작하도록 Win32 RegisterHotKey를 메시지 전용 창(HWND_MESSAGE)에 건다.
     *   다른 프로그램이 같은 조합을 이미 쓰면 등록에 실패하고 null을 돌려준다(Debug 출력만 남김).
     */
    internal sealed class DevEscapeHotkey : IDisposable
    {
        private const int HotkeyId = 0x5045;          // 'PE'
        private const int WmHotkey = 0x0312;
        private const uint ModAlt = 0x0001, ModControl = 0x0002, ModShift = 0x0004, ModNoRepeat = 0x4000;
        private const uint VkQ = 0x51;
        private static readonly IntPtr HwndMessage = new(-3);

        public const string Gesture = "Ctrl+Alt+Shift+Q";

        private readonly HwndSource _source;
        private readonly Action _onPressed;

        private DevEscapeHotkey(HwndSource source, Action onPressed)
        {
            _source = source;
            _onPressed = onPressed;
            _source.AddHook(WndProc);
        }

        public static DevEscapeHotkey? TryRegister(Action onPressed)
        {
#if !POPUP_EXTERNAL_CONFIG
            return null;   // 운영 빌드(BuildProfile.AllowsDevEscapeHotkey=false)는 등록하지 않는다.
#else
            var source = new HwndSource(new HwndSourceParameters("PopupDevEscapeHotkey")
            {
                ParentWindow = HwndMessage,
                Width = 0,
                Height = 0,
                WindowStyle = 0,
            });
            if (!RegisterHotKey(source.Handle, HotkeyId, ModControl | ModAlt | ModShift | ModNoRepeat, VkQ))
            {
                System.Diagnostics.Debug.WriteLine($"[DEV] 탈출키 {Gesture} 등록 실패(Win32 {Marshal.GetLastWin32Error()})");
                source.Dispose();
                return null;
            }
            System.Diagnostics.Debug.WriteLine($"[DEV] 탈출키 {Gesture} 등록 — 누르면 앱을 종료합니다.");
            return new DevEscapeHotkey(source, onPressed);
#endif
        }

        private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == WmHotkey && wParam.ToInt32() == HotkeyId)
            {
                handled = true;
                System.Diagnostics.Debug.WriteLine($"[DEV] 탈출키 {Gesture} 입력 — 앱 종료");
                _onPressed();
            }
            return IntPtr.Zero;
        }

        public void Dispose()
        {
            UnregisterHotKey(_source.Handle, HotkeyId);
            _source.RemoveHook(WndProc);
            _source.Dispose();
        }

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool RegisterHotKey(IntPtr hWnd, int id, uint fsModifiers, uint vk);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern bool UnregisterHotKey(IntPtr hWnd, int id);
    }
}
