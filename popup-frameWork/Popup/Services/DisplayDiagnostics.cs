using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows;
using System.Windows.Interop;
using System.Windows.Media;
using Forms = System.Windows.Forms;

namespace Popup.Services
{
    /*
     * POL-02-01 : 창 구조 — 다중 모니터·화면 변경 진단(설계 76)
     * ■ 화면 변경 진단 로그
     * - in : Log(stage, windows) 기록 시점 이름·대상 창 목록(팝업·Overlay, 창별 추가 정보 Detail)
     * - out: %LOCALAPPDATA%\Popup\logs\display-yyyyMMdd.log 한 덩어리 추가. 어떤 경우에도 예외를 던지지 않는다.
     * - VM 복귀·잠금 해제·해상도/배율 변경 때 기존 팝업·Overlay가 어긋나는 문제를 실환경에서 확인하려고 남긴다.
     *   기록 내용: 시각·시점(이벤트 이름, 보정 전/후, 1초 뒤), 모니터별 장치명·Bounds·WorkingArea·주 모니터 여부(물리 픽셀),
     *   창별 종류·WPF 좌표(DIP)·실제 창 사각형(물리 픽셀)·DPI 배율·추가 정보(팝업은 userPlacement: 끌어 옮긴 위치 DIP 또는 none).
     * - appsettings Logging.DisplayDiagnosticsEnabled=false면 파일을 쓰지 않는다(Enabled). 재배치 동작은 설정과 관계없이 그대로다.
     * - 사용자 정보·팝업 내용은 남기지 않는다. 팝업이나 Overlay가 표시 중일 때 화면 변경 이벤트가 오면만 기록하므로 양이 적다.
     */
    public static class DisplayDiagnostics
    {
        /// <summary>로그 폴더. 테스트는 임시 폴더로 바꾼다.</summary>
        internal static string LogDirectory { get; set; } = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Popup", "logs");

        internal static string CurrentLogPath => Path.Combine(LogDirectory, $"display-{DateTime.Now:yyyyMMdd}.log");

        /// <summary>display-yyyyMMdd.log 기록 여부(appsettings Logging.DisplayDiagnosticsEnabled, 기본 true). MainWindow가 설정을 읽은 뒤 넣는다.</summary>
        public static bool Enabled { get; set; } = true;

        public static void Log(string stage, IEnumerable<(string Kind, Window Window, string? Detail)> windows)
        {
            if (!Enabled) return;
            try
            {
                StringBuilder entry = new();
                entry.Append('[').Append(DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss.fff")).Append("] ").AppendLine(stage);
                foreach (Forms.Screen screen in Forms.Screen.AllScreens)
                {
                    entry.Append("  screen ").Append(screen.DeviceName).Append(screen.Primary ? " (primary)" : string.Empty)
                        .Append(" bounds=").Append(Format(screen.Bounds))
                        .Append(" work=").AppendLine(Format(screen.WorkingArea));
                }
                foreach ((string kind, Window window, string? detail) in windows)
                {
                    entry.Append("  ").Append(kind).Append(' ')
                        .Append(window.IsVisible ? "visible" : "hidden")
                        .Append(" dip=").Append(Format(window.Left, window.Top, window.ActualWidth, window.ActualHeight));
                    IntPtr handle = new WindowInteropHelper(window).Handle;
                    if (handle != IntPtr.Zero && GetWindowRect(handle, out NativeRect rect))
                    {
                        entry.Append(" px=").Append(Format(rect.Left, rect.Top, rect.Right - rect.Left, rect.Bottom - rect.Top))
                            .Append(" monitor=").Append(Forms.Screen.FromHandle(handle).DeviceName);
                    }
                    if (PresentationSource.FromVisual(window) != null)
                    {
                        entry.Append(" dpiScale=").Append(VisualTreeHelper.GetDpi(window).DpiScaleX.ToString("0.##"));
                    }
                    if (!string.IsNullOrEmpty(detail)) entry.Append(' ').Append(detail);
                    entry.AppendLine();
                }
                string text = entry.ToString();
                Debug.Write(text);
                Directory.CreateDirectory(LogDirectory);
                File.AppendAllText(CurrentLogPath, text + Environment.NewLine);
            }
            catch
            {
                // 진단 로그 실패는 무시한다(팝업 동작에 영향 없음).
            }
        }

        private static string Format(System.Drawing.Rectangle r) => Format(r.Left, r.Top, r.Width, r.Height);

        private static string Format(double left, double top, double width, double height)
            => $"{left:0.#},{top:0.#} {width:0.#}x{height:0.#}";

        [StructLayout(LayoutKind.Sequential)]
        private struct NativeRect
        {
            public int Left, Top, Right, Bottom;
        }

        [DllImport("user32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GetWindowRect(IntPtr hWnd, out NativeRect rect);
    }
}
