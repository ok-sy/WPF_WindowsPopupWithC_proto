using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace Popup.Services
{
    /*
     * [역할] 프로그램이 예외로 "뻗는" 상황에 대한 방어 로직.
     *
     * [추가 이유 — 사용자 요청 "프로그램 뻗었을 때 방어로직"]
     *   WPF 팝업 클라이언트는 사용자 PC에서 트레이로 상시 실행된다. 처리되지 않은 예외 하나로 프로세스가 죽으면
     *   이후 팝업이 전혀 뜨지 않고, 미전송 결과 큐도 다음 실행까지 멈춘다. 다음 세 층으로 방어한다.
     *
     *   1) UI 스레드 예외(DispatcherUnhandledException)
     *      → 크래시 로그를 남기고 Handled=true 로 프로세스를 살린다. 팝업 하나가 실패해도 트레이·주기 조회는 계속된다.
     *   2) 비동기 작업의 관찰되지 않은 예외(TaskScheduler.UnobservedTaskException)
     *      → 로그만 남기고 SetObserved() 로 종료를 막는다.
     *   3) 그 외 치명적 예외(AppDomain.UnhandledException — 백그라운드 스레드 등, 프로세스가 반드시 종료됨)
     *      → 로그를 남기고 같은 인자로 자기 자신을 다시 실행한다(자동 재시작).
     *        재시작 폭주를 막기 위해 최근 10분 내 재시작이 3회 이상이면 재시작하지 않는다.
     *
     * [로그] %LOCALAPPDATA%\Popup\logs\crash-yyyyMMdd.log (하루 1파일, 예외 전체 스택). 토큰·사번은 기록하지 않는다.
     * [주의] 단일 인스턴스 Mutex는 프로세스 종료 시 OS가 해제하므로 재시작된 프로세스가 정상적으로 첫 실행이 된다.
     *        단, 부모 프로세스가 완전히 종료되기 전에 자식이 뜨면 Mutex 충돌로 자식이 바로 종료될 수 있어
     *        자식은 --restarted 인자를 받아 시작 시 최대 5초 동안 Mutex 획득을 재시도한다(App.OnStartup 참고).
     */
    public static class CrashGuard
    {
        public const string RestartedArgument = "--restarted";

        private static readonly string LogDirectory = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Popup", "logs");
        private static readonly string RestartMarkerPath = Path.Combine(LogDirectory, "restart-history.txt");

        private const int MaxRestartsPerWindow = 3;
        private static readonly TimeSpan RestartWindow = TimeSpan.FromMinutes(10);

        private static bool _installed;

        /// <summary>App.OnStartup 맨 앞에서 한 번 호출한다.</summary>
        public static void Install(Application application)
        {
            if (_installed) return;
            _installed = true;

            application.DispatcherUnhandledException += OnDispatcherUnhandledException;
            TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;
            AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
        }

        private static void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
        {
            Log("UI 스레드 예외 (프로세스 유지)", e.Exception);
            e.Handled = true;   // 프로세스를 살린다. 실패한 팝업 창만 영향을 받는다.
            try
            {
                MessageBox.Show(
                    "팝업 처리 중 오류가 발생했습니다. 프로그램은 계속 실행됩니다.\n\n" + e.Exception.Message,
                    "팝업 오류", MessageBoxButton.OK, MessageBoxImage.Warning);
            }
            catch
            {
                // 메시지 표시조차 실패하면 조용히 넘긴다(로그는 이미 남김).
            }
        }

        private static void OnUnobservedTaskException(object? sender, UnobservedTaskExceptionEventArgs e)
        {
            Log("비동기 작업 예외 (관찰되지 않음, 프로세스 유지)", e.Exception);
            e.SetObserved();
        }

        private static void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            Exception? exception = e.ExceptionObject as Exception;
            Log("치명적 예외 (프로세스 종료 예정)", exception);
            if (e.IsTerminating)
            {
                TryRestart();
            }
        }

        /// <summary>최근 10분 내 재시작이 3회 미만이면 같은 인자로 자기 자신을 다시 실행한다.</summary>
        private static void TryRestart()
        {
            try
            {
                Directory.CreateDirectory(LogDirectory);
                DateTime now = DateTime.Now;
                var recent = File.Exists(RestartMarkerPath)
                    ? File.ReadAllLines(RestartMarkerPath)
                        .Select(line => DateTime.TryParse(line, out DateTime t) ? t : DateTime.MinValue)
                        .Where(t => now - t < RestartWindow)
                        .ToList()
                    : new System.Collections.Generic.List<DateTime>();
                if (recent.Count >= MaxRestartsPerWindow)
                {
                    Log($"재시작 중단: 최근 {RestartWindow.TotalMinutes}분 내 {recent.Count}회 재시작", null);
                    return;
                }
                recent.Add(now);
                File.WriteAllLines(RestartMarkerPath, recent.Select(t => t.ToString("O")));

                string? exePath = Environment.ProcessPath;
                if (string.IsNullOrEmpty(exePath)) return;
                string arguments = string.Join(" ",
                    Environment.GetCommandLineArgs().Skip(1)
                        .Where(a => !a.Equals(RestartedArgument, StringComparison.OrdinalIgnoreCase))
                        .Select(a => a.Contains(' ') ? "\"" + a + "\"" : a)
                        .Append(RestartedArgument));
                Process.Start(new ProcessStartInfo(exePath, arguments) { UseShellExecute = true });
                Log("자동 재시작 실행: " + arguments, null);
            }
            catch (Exception restartException)
            {
                Log("자동 재시작 실패", restartException);
            }
        }

        /// <summary>크래시 로그 기록. 어떤 상황에서도 예외를 던지지 않는다.</summary>
        public static void Log(string title, Exception? exception)
        {
            try
            {
                Directory.CreateDirectory(LogDirectory);
                string path = Path.Combine(LogDirectory, $"crash-{DateTime.Now:yyyyMMdd}.log");
                string entry = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] {title}" + Environment.NewLine
                               + (exception?.ToString() ?? "(예외 정보 없음)") + Environment.NewLine + Environment.NewLine;
                File.AppendAllText(path, entry);
                Debug.WriteLine(entry);
            }
            catch
            {
                // 로그 실패는 무시한다.
            }
        }
    }
}
