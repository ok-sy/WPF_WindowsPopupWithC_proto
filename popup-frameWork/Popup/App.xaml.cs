using System;
using System.ComponentModel;
using System.Linq;
using System.Drawing;
using System.Threading;
using System.Windows;
using Popup.Services;
using Forms = System.Windows.Forms;

namespace Popup
{
    /*
     * ■ WPF 앱 진입점(시작·트레이·종료)
     * - in : 실행 인자(-Demo / -Api / --show-main / --tray / --restarted) · 환경변수 WPF_POPUP_TRAY_ENABLED·WPF_POPUP_AUTOSTART_ENABLED
     * - out: 없음(단일 실행 잠금·(선택)트레이 아이콘·MainWindow 또는 DemoWindow 표시·최초 실행 자동 시작 등록)
     * - WPF 프로그램 전체의 시작과 종료를 관리한다.
     *   POL-15 : 배포·실행 환경 — 일반 실행은 트레이·관리 화면 없이 백그라운드에서 조회·결과 재전송만 한다(A-1 6번).
     *   트레이는 --tray 또는 WPF_POPUP_TRAY_ENABLED=true일 때만 만든다(상태·진단용). Demo 모드는 개발 화면을 다시 열 수단이라 항상 만든다.
     *   일반 사용자용 종료 명령(--exit)·트레이 외 종료 메뉴는 두지 않는다(2026-11-03 결정 C). Windows 종료·로그오프 처리는 유지한다.
     */
    public partial class App : Application
    {
        /*
         * 같은 Windows 로그인 세션에서 사용하는 고정 Mutex 이름이다.
         * Local 접두어를 사용하므로 다른 원격 세션과는 구분된다.
         */
        private const string SingleInstanceMutexName =
            @"Local\OksyPopupClient.SingleInstance";

        private Mutex? _singleInstanceMutex;

        private bool _ownsSingleInstanceMutex;

        private readonly WindowsStartupService
            _windowsStartupService =
                new WindowsStartupService();

        private MainWindow? _mainWindow;

        private DemoWindow? _demoWindow;

        private Forms.NotifyIcon? _trayIcon;

        private Forms.ToolStripMenuItem?
            _runOnWindowsStartupMenuItem;

        private bool _isExiting;

        /// <summary>POL-15 : 배포·실행 환경 — 시작 옵션(트레이 표시·자동 시작). OnStartup에서 정한다.</summary>
        private StartupOptions _startupOptions = new(TrayEnabled: false, AutostartEnabled: true);

        /// <summary>
        /// POL-02-02 : 종료 제어
        /// POL-12-01 : 종결과 보관
        /// 앱 종료 중인지. 트레이 종료·426 안내 종료(ExitAgent)와 Windows 로그오프·종료(OnSessionEnding)에서 true가 된다.
        /// 이때는 팝업 닫기를 취소하지 않고(영상 완료 전 제한·Overlay 키보드 닫기 차단 미적용) 결과 저장 실패도 메모리에 남긴다.
        /// </summary>
        public bool IsExiting => _isExiting;

        /*
         * API 모드는 관리용 MainWindow를 화면 밖에서 한 번 표시한 뒤 숨긴다(트레이는 --tray일 때만).
         * Demo Mode는 사용자가 팝업 종류를 고를 수 있도록 선택 화면을 유지한다.
         */
        protected override void OnStartup(
            StartupEventArgs e)
        {
            base.OnStartup(e);

            /*
             * [실행 순서 1/6]
             * Popup.exe의 실제 시작점이다.
             *
             * 이 메서드가 끝나기 전에 MainWindow를 생성하고 Show()를 한 번 호출한다.
             * 그 다음 흐름은 MainWindow.xaml.cs의 MainWindow_Loaded()로 이어진다.
             *
             * 소스를 처음 읽는 경우:
             *   App.OnStartup()
             *     → new MainWindow()
             *     → MainWindow_Loaded()
             * 순서로 따라가면 된다.
             */

            /*
             * [방어 로직] 처리되지 않은 예외로 프로세스가 죽지 않도록 전역 핸들러를 가장 먼저 설치한다.
             * UI 예외는 로그 후 계속 실행, 치명적 예외는 로그 후 자동 재시작(10분 내 3회 제한). CrashGuard 참고.
             */
            CrashGuard.Install(this);

            /*
             * 첫 번째 실행만 이름이 지정된 Mutex의 소유자가 된다.
             *
             * 이미 실행 중인 Popup.exe가 있다면 createdNew가 false이므로
             * 두 번째 프로세스는 트레이 아이콘이나 타이머를 만들지 않고
             * 즉시 종료한다. 이로써 팝업 조회와 표시가 중복되지 않는다.
             *
             * [방어 로직] CrashGuard가 자동 재시작한 프로세스(--restarted)는 죽어 가는 부모가 Mutex를 아직
             * 쥐고 있을 수 있으므로 최대 5초(250ms×20) 동안 획득을 재시도한다.
             */
            bool restarted = e.Args.Any(a => a.Equals(CrashGuard.RestartedArgument, StringComparison.OrdinalIgnoreCase));
            bool createdNew = false;
            for (int attempt = 0; attempt < (restarted ? 20 : 1); attempt++)
            {
                _singleInstanceMutex?.Dispose();
                _singleInstanceMutex =
                    new Mutex(
                        initiallyOwned: true,
                        name: SingleInstanceMutexName,
                        createdNew: out createdNew);
                if (createdNew) break;
                Thread.Sleep(250);
            }

            if (!createdNew)
            {
                _singleInstanceMutex?.Dispose();
                _singleInstanceMutex =
                    null;

                Shutdown();
                return;
            }

            _ownsSingleInstanceMutex =
                true;

            LaunchArguments arguments = LaunchArguments.Parse(e.Args);
            _startupOptions = StartupOptions.Resolve(arguments);

            _mainWindow =
                new MainWindow();

            _mainWindow.Closing +=
                MainWindow_Closing;

            // POL-15 : 배포·실행 환경 — 트레이는 선택 기능. Demo는 숨긴 개발 화면을 다시 여는 유일한 수단이라 항상 만든다.
            if (_mainWindow.IsDemoMode || _startupOptions.TrayEnabled)
            {
                CreateTrayIcon();
            }

            /*
             * Show를 호출해야 MainWindow.Loaded가 발생하여
             * Framework 8의 자동 API 조회가 실행된다.
             */
            if (_mainWindow.IsDemoMode)
            {
                // POL-14-02 : Demo 모드 — -Demo -Api면 API Demo 설정을 넘긴다(null이면 인메모리 Demo).
                _demoWindow = new DemoWindow(_mainWindow.ApiDemoSettings);
                if (_mainWindow.DemoAuthTestSettings is { } authTestSettings)
                {
                    _demoWindow.EnableAuthTest(authTestSettings);
                }
                _demoWindow.Closing +=
                    DemoWindow_Closing;

                MainWindow = _demoWindow;
                _demoWindow.Show();
            }
            else
            {
                MainWindow = _mainWindow;
                if (!arguments.ShowMain)
                {
                    PrepareHiddenStartup(_mainWindow);
                }
                _mainWindow.Show();
                /*
                 * POL-15-02 : 인증·버전
                 * [로그인 테스트] 실행 인자 --show-main 이면 관리 화면을 숨기지 않고 띄운 채 시작한다.
                 * "SSO 로그인 테스트"·"팝업 다시 조회" 버튼을 트레이 메뉴 없이 바로 누를 수 있어 SSO/로그인 확인에 쓴다.
                 * 인자가 없으면 화면 밖에서 한 번 표시(Loaded로 자동 조회 시작) 후 숨긴다. 트레이는 --tray일 때만 있다.
                 */
                if (!arguments.ShowMain)
                {
                    _mainWindow.Hide();
                    RestoreStartupPosition(_mainWindow);
                }

                // POL-15 : 배포·실행 환경 — 사용자 세션 첫 일반 실행에서 HKCU 자동 시작 1회 등록(이후 사용자 해제 존중).
                WindowsStartupService.AutostartOutcome outcome = _windowsStartupService.ApplyFirstRunPolicy(_startupOptions.AutostartEnabled);
                System.Diagnostics.Debug.WriteLine($"[STARTUP] tray={_startupOptions.TrayEnabled} autostart={_startupOptions.AutostartEnabled} → {outcome}");
                if (_runOnWindowsStartupMenuItem != null)
                {
                    _runOnWindowsStartupMenuItem.Checked = _windowsStartupService.IsEnabled();
                }
            }
        }

        /*
         * POL-15 : 배포·실행 환경
         * 숨겨 시작하는 관리 화면은 Loaded(자동 조회 시작)를 위해 Show()를 한 번 해야 한다. 화면 밖·비활성·작업 표시줄 없이 띄워
         * 사용자에게 깜빡이지 않게 하고, 숨긴 뒤에는 가운데 위치로 되돌려 --tray "관리 화면 열기" 때 정상 위치에 보이게 한다.
         */
        private static void PrepareHiddenStartup(Window window)
        {
            window.WindowStartupLocation = WindowStartupLocation.Manual;
            window.ShowActivated = false;
            window.ShowInTaskbar = false;
            window.Left = -32000;
            window.Top = -32000;
        }

        private static void RestoreStartupPosition(Window window)
        {
            Rect area = SystemParameters.WorkArea;
            double width = double.IsNaN(window.Width) ? window.ActualWidth : window.Width;
            double height = double.IsNaN(window.Height) ? window.ActualHeight : window.Height;
            window.Left = area.Left + Math.Max(0, (area.Width - width) / 2);
            window.Top = area.Top + Math.Max(0, (area.Height - height) / 2);
            window.ShowActivated = true;
        }

        /*
         * Windows 알림 영역에 표시할 트레이 아이콘과 메뉴를 만든다.
         */
        private void CreateTrayIcon()
        {
            Forms.ContextMenuStrip trayMenu =
                new Forms.ContextMenuStrip();

            trayMenu.Items.Add(
                "관리 화면 열기",
                null,
                ShowMainWindowMenuItem_Click);

            trayMenu.Items.Add(
                "팝업 다시 조회",
                null,
                RefreshPopupsMenuItem_Click);

            _runOnWindowsStartupMenuItem =
                new Forms.ToolStripMenuItem(
                    "Windows 시작 시 자동 실행")
                {
                    Checked =
                        _windowsStartupService.IsEnabled(),
                    CheckOnClick =
                        false
                };

            _runOnWindowsStartupMenuItem.Click +=
                RunOnWindowsStartupMenuItem_Click;

            trayMenu.Items.Add(
                _runOnWindowsStartupMenuItem);

            trayMenu.Items.Add(
                new Forms.ToolStripSeparator());

            trayMenu.Items.Add(
                "종료",
                null,
                ExitMenuItem_Click);

            _trayIcon =
                new Forms.NotifyIcon
                {
                    Icon =
                        SystemIcons.Information,
                    Text =
                        "Popup 알림",
                    ContextMenuStrip =
                        trayMenu,
                    Visible =
                        true
                };

            _trayIcon.DoubleClick +=
                ShowMainWindowMenuItem_Click;
        }

        /*
         * 트레이 메뉴에서 현재 사용자 로그인 자동 실행을 켜거나 끈다.
         * 등록 결과를 다시 조회한 뒤 체크 표시를 갱신한다.
         */
        private void RunOnWindowsStartupMenuItem_Click(
            object? sender,
            EventArgs e)
        {
            if (_runOnWindowsStartupMenuItem == null)
            {
                return;
            }

            try
            {
                bool enableStartup =
                    !_windowsStartupService.IsEnabled();

                _windowsStartupService.SetEnabled(
                    enableStartup);

                _runOnWindowsStartupMenuItem.Checked =
                    _windowsStartupService.IsEnabled();
            }
            catch (Exception exception)
            {
                System.Windows.MessageBox.Show(
                    "Windows 자동 실행 설정을 변경할 수 없습니다.\n\n" +
                    exception.Message,
                    "자동 실행 설정 오류",
                    MessageBoxButton.OK,
                    MessageBoxImage.Error);
            }
        }

        /*
         * 트레이 아이콘을 더블클릭하거나 메뉴를 선택하면
         * 숨겨 둔 관리 화면을 다시 표시한다.
         */
        private void ShowMainWindowMenuItem_Click(
            object? sender,
            EventArgs e)
        {
            if (_demoWindow != null)
            {
                /*
                 * POL-14-02 : Demo 모드 — 작업 표시줄 표시를 함께 되돌린다.
                 *
                 * DemoWindow_Closing이 창을 숨기면서 ShowInTaskbar를 false로 두기 때문에,
                 * 여기서 복구하지 않으면 X로 닫았다 다시 연 Demo Mode 창은
                 * 화면에는 보이지만 작업 표시줄에 버튼이 없는 상태가 된다.
                 * 아래 API 모드 분기에도 같은 복구가 있다.
                 */
                _demoWindow.ShowInTaskbar =
                    true;

                _demoWindow.Show();

                if (_demoWindow.WindowState
                    == WindowState.Minimized)
                {
                    _demoWindow.WindowState =
                        WindowState.Normal;
                }

                _demoWindow.Activate();
                return;
            }

            if (_mainWindow == null)
            {
                return;
            }

            _mainWindow.ShowInTaskbar =
                true;

            _mainWindow.Show();

            if (_mainWindow.WindowState
                == WindowState.Minimized)
            {
                _mainWindow.WindowState =
                    WindowState.Normal;
            }

            _mainWindow.Activate();
        }

        /*
         * 관리 화면을 열지 않고도 서버에서 팝업을 다시 조회한다.
         */
        private async void RefreshPopupsMenuItem_Click(
            object? sender,
            EventArgs e)
        {
            if (_demoWindow != null)
            {
                _demoWindow.RefreshFromTray();
                return;
            }

            if (_mainWindow != null)
            {
                await _mainWindow
                    .RefreshPopupsAsync();
            }
        }

        /*
         * 관리창의 X를 누르면 프로세스를 종료하지 않고
         * 트레이로 다시 숨긴다.
         */
        private void MainWindow_Closing(
            object? sender,
            CancelEventArgs e)
        {
            if (_isExiting
                || _mainWindow == null)
            {
                return;
            }

            e.Cancel =
                true;

            _mainWindow.ShowInTaskbar =
                false;

            _mainWindow.Hide();
        }

        /*
         * Demo Mode 선택 화면도 API 모드의 MainWindow와 동일하게
         * X 버튼에서는 실제 Close하지 않고 트레이로 숨긴다.
         *
         * WPF Window는 한 번 Close되면 같은 인스턴스에 Show()를 다시 호출할 수 없으므로,
         * DemoWindow를 닫은 뒤 트레이의 "관리 화면 열기"를 누르면
         * InvalidOperationException이 발생하던 문제를 방지한다.
         */
        private void DemoWindow_Closing(
            object? sender,
            CancelEventArgs e)
        {
            if (_isExiting
                || _demoWindow == null)
            {
                return;
            }

            e.Cancel =
                true;

            _demoWindow.ShowInTaskbar =
                false;

            _demoWindow.Hide();
        }

        /*
         * 트레이의 종료 메뉴를 선택했을 때만 아이콘과 창을 정리하고
         * WPF 프로세스를 완전히 종료한다.
         */
        private void ExitMenuItem_Click(
            object? sender,
            EventArgs e)
        {
            ExitAgent();
        }

        /*
         * POL-15-02 : 인증·버전
         * ■ 앱 정상 종료
         * - in : 없음 · out: 없음(종료 플래그·트레이 정리 후 Shutdown)
         * - 트레이 종료와 426(클라이언트 최소 버전 거절) 안내 닫기가 같은 정상 종료 경로를 사용한다.
         */
        public void ExitAgent()
        {
            if (_isExiting) return;
            BeginExit();

            _mainWindow?.Close();
            _demoWindow?.Close();
            Shutdown();
        }

        /*
         * POL-02-02 : 종료 제어
         * Windows 로그오프·종료. 종료 플래그를 세워 팝업 닫기 제한을 풀고 닫힘 결과를 저장·보관하게 한다
         * (처리하지 않으면 닫기 제한이 그대로 적용되고 취소된 닫기의 결과가 저장되지 않는다).
         * 취소하지 않으면 WPF가 이어서 Application.Shutdown을 호출하므로 여기서는 종료 플래그와 트레이 정리만 한다
         * (ExitAgent와 같은 종료 상태, Shutdown은 WPF가 수행).
         */
        protected override void OnSessionEnding(SessionEndingCancelEventArgs e)
        {
            base.OnSessionEnding(e);
            if (!e.Cancel)
            {
                BeginExit();
            }
        }

        // 종료 플래그를 세우고 트레이 아이콘을 정리한다. ExitAgent와 OnSessionEnding이 함께 쓴다.
        private void BeginExit()
        {
            _isExiting =
                true;

            if (_runOnWindowsStartupMenuItem != null)
            {
                _runOnWindowsStartupMenuItem.Click -=
                    RunOnWindowsStartupMenuItem_Click;

                _runOnWindowsStartupMenuItem =
                    null;
            }

            if (_trayIcon != null)
            {
                _trayIcon.Visible =
                    false;

                _trayIcon.Dispose();
                _trayIcon =
                    null;
            }
        }

        /*
         * 앱이 정상 종료될 때 단일 실행 잠금을 해제한다.
         * 이후 Popup.exe를 다시 실행하면 새 프로세스가 첫 실행이 된다.
         */
        protected override void OnExit(
            ExitEventArgs e)
        {
            if (_ownsSingleInstanceMutex
                && _singleInstanceMutex != null)
            {
                _singleInstanceMutex.ReleaseMutex();
                _ownsSingleInstanceMutex =
                    false;
            }

            _singleInstanceMutex?.Dispose();
            _singleInstanceMutex =
                null;

            base.OnExit(e);
        }
    }
}
