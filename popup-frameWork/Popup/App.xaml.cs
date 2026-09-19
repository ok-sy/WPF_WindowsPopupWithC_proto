using System.ComponentModel;
using System.Drawing;
using System.Threading;
using System.Windows;
using Popup.Services;
using Forms = System.Windows.Forms;

namespace Popup
{
    /*
     * WPF 프로그램 전체의 시작과 종료를 관리한다.
     *
     * MainWindow를 직접 시작 화면으로 사용하지 않고,
     * Windows 트레이 아이콘을 프로그램의 기본 진입점으로 사용한다.
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

        /*
         * API 모드는 관리용 MainWindow를 한 번 표시한 뒤 트레이로 숨긴다.
         * Demo Mode는 사용자가 팝업 종류를 고를 수 있도록 선택 화면을 유지한다.
         */
        protected override void OnStartup(
            StartupEventArgs e)
        {
            base.OnStartup(e);

            /*
             * 첫 번째 실행만 이름이 지정된 Mutex의 소유자가 된다.
             *
             * 이미 실행 중인 Popup.exe가 있다면 createdNew가 false이므로
             * 두 번째 프로세스는 트레이 아이콘이나 타이머를 만들지 않고
             * 즉시 종료한다. 이로써 팝업 조회와 표시가 중복되지 않는다.
             */
            _singleInstanceMutex =
                new Mutex(
                    initiallyOwned: true,
                    name: SingleInstanceMutexName,
                    createdNew: out bool createdNew);

            if (!createdNew)
            {
                _singleInstanceMutex.Dispose();
                _singleInstanceMutex =
                    null;

                Shutdown();
                return;
            }

            _ownsSingleInstanceMutex =
                true;

            _mainWindow =
                new MainWindow();

            _mainWindow.Closing +=
                MainWindow_Closing;

            CreateTrayIcon();

            /*
             * Show를 호출해야 MainWindow.Loaded가 발생하여
             * Framework 8의 자동 API 조회가 실행된다.
             */
            if (_mainWindow.IsDemoMode)
            {
                _demoWindow = new DemoWindow();
                MainWindow = _demoWindow;
                _demoWindow.Show();
            }
            else
            {
                MainWindow = _mainWindow;
                _mainWindow.Show();
                _mainWindow.Hide();
            }
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
                _demoWindow.Show();
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
                _demoWindow.ShowDemoPopups();
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
         * 트레이의 종료 메뉴를 선택했을 때만 아이콘과 창을 정리하고
         * WPF 프로세스를 완전히 종료한다.
         */
        private void ExitMenuItem_Click(
            object? sender,
            EventArgs e)
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

            _mainWindow?.Close();
            _demoWindow?.Close();
            Shutdown();
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
