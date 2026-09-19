using Microsoft.Win32;

namespace Popup.Services
{
    /*
     * 현재 Windows 사용자의 로그인 자동 실행 등록을 관리한다.
     *
     * HKCU를 사용하므로 관리자 권한이 필요하지 않고,
     * 다른 Windows 사용자에게는 영향을 주지 않는다.
     */
    public class WindowsStartupService
    {
        private const string RunRegistryKeyPath =
            @"Software\Microsoft\Windows\CurrentVersion\Run";

        private const string StartupValueName =
            "OksyPopupClient";

        /*
         * 현재 실행 중인 Popup.exe가 자동 실행 대상으로
         * 정확하게 등록되어 있는지 확인한다.
         */
        public bool IsEnabled()
        {
            using RegistryKey? runRegistryKey =
                Registry.CurrentUser.OpenSubKey(
                    RunRegistryKeyPath,
                    writable: false);

            string? registeredCommand =
                runRegistryKey?.GetValue(
                    StartupValueName)
                as string;

            return string.Equals(
                registeredCommand,
                CreateCurrentExecutableCommand(),
                StringComparison.OrdinalIgnoreCase);
        }

        /*
         * enabled가 true이면 현재 Popup.exe 경로를 등록하고,
         * false이면 기존 등록값을 제거한다.
         */
        public void SetEnabled(
            bool enabled)
        {
            using RegistryKey runRegistryKey =
                Registry.CurrentUser.CreateSubKey(
                    RunRegistryKeyPath,
                    writable: true)
                ?? throw new InvalidOperationException(
                    "Windows 자동 실행 레지스트리 키를 열 수 없습니다.");

            if (enabled)
            {
                runRegistryKey.SetValue(
                    StartupValueName,
                    CreateCurrentExecutableCommand(),
                    RegistryValueKind.String);

                return;
            }

            runRegistryKey.DeleteValue(
                StartupValueName,
                throwOnMissingValue: false);
        }

        /*
         * 설치 경로에 공백이 있어도 정상 실행되도록
         * 실행 파일 전체 경로를 큰따옴표로 감싼다.
         */
        private static string CreateCurrentExecutableCommand()
        {
            string executablePath =
                Environment.ProcessPath
                ?? throw new InvalidOperationException(
                    "현재 Popup.exe 실행 경로를 확인할 수 없습니다.");

            return
                $"\"{executablePath}\"";
        }
    }
}
