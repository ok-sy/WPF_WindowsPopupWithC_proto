using Microsoft.Win32;
using System;
using System.IO;
using System.Security.Principal;

namespace Popup.Services
{
    /*
     * POL-15 : 배포·실행 환경
     * ■ Windows 로그인 자동 실행 등록
     * - in : SetEnabled(enabled) 등록/해제 · ApplyFirstRunPolicy(autostartEnabled) 최초 실행 1회 등록 정책
     * - out: IsEnabled() 현재 실행 파일 경로로 등록되어 있는지(bool) · AutostartOutcome · 예외: InvalidOperationException(Run 키를 열 수 없음)
     * - 현재 Windows 사용자의 로그인 자동 실행 등록을 관리한다.
     *
     * HKCU를 사용하므로 관리자 권한이 필요하지 않고, 다른 Windows 사용자에게는 영향을 주지 않는다.
     *
     * [최초 실행 1회 등록 — 2026-11-03 결정(A-1 6번)]
     *   - 사용자 세션의 첫 일반 실행에서 HKCU Run에 "<EXE 전체 경로>"(따옴표, --tray 없음)를 등록하고, 등록 이력을
     *     HKCU\Software\OksyPopupClient\AutostartInitialized(=1)로 남긴다.
     *   - 이력이 있으면 다시 등록하지 않는다. 사용자가 Run 값을 지우거나 작업 관리자에서 사용 안 함으로 바꿔도 되돌리지 않는다.
     *   - WPF_POPUP_AUTOSTART_ENABLED=false면 이 앱 소유 값(OksyPopupClient)만 지운다. 이력은 남겨 나중에 true로 바꿔도 강제 재등록하지 않는다.
     *   - 임시 경로(%TEMP%)·빌드 출력(\bin\ 아래)·SYSTEM 계정 실행은 등록하지 않고 이력도 남기지 않는다(설치 위치에서 다시 실행될 때 등록).
     *   - 트레이 메뉴(--tray)의 "Windows 시작 시 자동 실행" 토글은 사용자 선택이라 이력을 함께 남긴다.
     */
    public class WindowsStartupService
    {
        public const string DefaultRunRegistryKeyPath = @"Software\Microsoft\Windows\CurrentVersion\Run";
        public const string DefaultStateRegistryKeyPath = @"Software\OksyPopupClient";
        public const string StartupValueName = "OksyPopupClient";
        public const string InitializedValueName = "AutostartInitialized";

        /// <summary>최초 실행 정책 적용 결과.</summary>
        public enum AutostartOutcome { Registered, AlreadyInitialized, Removed, SkippedTemporaryPath, SkippedSystemAccount, Failed }

        private readonly string _runKeyPath;
        private readonly string _stateKeyPath;
        private readonly Func<string?> _processPath;
        private readonly Func<bool> _isSystemAccount;

        public WindowsStartupService()
            : this(DefaultRunRegistryKeyPath, DefaultStateRegistryKeyPath, () => Environment.ProcessPath,
                () => WindowsIdentity.GetCurrent().IsSystem)
        {
        }

        /// <summary>검증용: HKCU 아래 다른 키·실행 경로·계정 판정을 쓴다.</summary>
        public WindowsStartupService(string runKeyPath, string stateKeyPath, Func<string?> processPath, Func<bool> isSystemAccount)
        {
            _runKeyPath = runKeyPath;
            _stateKeyPath = stateKeyPath;
            _processPath = processPath;
            _isSystemAccount = isSystemAccount;
        }

        /// <summary>현재 실행 파일이 자동 실행 대상으로 정확하게 등록되어 있는지 확인한다.</summary>
        public bool IsEnabled()
        {
            using RegistryKey? runRegistryKey = Registry.CurrentUser.OpenSubKey(_runKeyPath, writable: false);
            string? registeredCommand = runRegistryKey?.GetValue(StartupValueName) as string;
            return string.Equals(registeredCommand, CreateCurrentExecutableCommand(), StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>등록 이력(AutostartInitialized)이 있는지.</summary>
        public bool IsInitialized()
        {
            using RegistryKey? stateKey = Registry.CurrentUser.OpenSubKey(_stateKeyPath, writable: false);
            return stateKey?.GetValue(InitializedValueName) is int value && value == 1;
        }

        /// <summary>
        /// 사용자 선택(트레이 메뉴)으로 등록/해제한다. enabled면 현재 EXE 경로를 등록, 아니면 이 앱 값을 지운다.
        /// 사용자가 직접 정한 것이므로 등록 이력도 남긴다.
        /// </summary>
        public void SetEnabled(bool enabled)
        {
            using RegistryKey runRegistryKey = OpenRunKeyForWrite();
            if (enabled)
                runRegistryKey.SetValue(StartupValueName, CreateCurrentExecutableCommand(), RegistryValueKind.String);
            else
                runRegistryKey.DeleteValue(StartupValueName, throwOnMissingValue: false);
            MarkInitialized();
        }

        /*
         * 최초 실행 1회 등록 정책. 일반 실행(App, Demo 제외) 시작 때 한 번 부른다. 실패해도 예외를 밖으로 던지지 않는다.
         */
        public AutostartOutcome ApplyFirstRunPolicy(bool autostartEnabled)
        {
            try
            {
                if (!autostartEnabled)
                {
                    using RegistryKey? runKey = Registry.CurrentUser.OpenSubKey(_runKeyPath, writable: true);
                    runKey?.DeleteValue(StartupValueName, throwOnMissingValue: false);
                    return AutostartOutcome.Removed;
                }
                if (IsInitialized()) return AutostartOutcome.AlreadyInitialized;
                if (_isSystemAccount()) return AutostartOutcome.SkippedSystemAccount;
                if (IsTemporaryPath(_processPath())) return AutostartOutcome.SkippedTemporaryPath;

                using (RegistryKey runRegistryKey = OpenRunKeyForWrite())
                {
                    runRegistryKey.SetValue(StartupValueName, CreateCurrentExecutableCommand(), RegistryValueKind.String);
                }
                MarkInitialized();
                return AutostartOutcome.Registered;
            }
            catch (Exception exception)
            {
                System.Diagnostics.Debug.WriteLine($"[STARTUP] 자동 시작 등록 정책 적용 실패: {exception.Message}");
                return AutostartOutcome.Failed;
            }
        }

        /// <summary>임시 폴더(%TEMP%) 또는 빌드 출력(\bin\ 폴더 아래) 경로면 true. 경로를 알 수 없어도 true(등록하지 않음).</summary>
        public static bool IsTemporaryPath(string? executablePath)
        {
            if (string.IsNullOrWhiteSpace(executablePath)) return true;
            string full = Path.GetFullPath(executablePath);
            string temp = Path.GetFullPath(Path.GetTempPath());
            if (full.StartsWith(temp, StringComparison.OrdinalIgnoreCase)) return true;
            return full.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}", StringComparison.OrdinalIgnoreCase);
        }

        private RegistryKey OpenRunKeyForWrite() =>
            Registry.CurrentUser.CreateSubKey(_runKeyPath, writable: true)
            ?? throw new InvalidOperationException("Windows 자동 실행 레지스트리 키를 열 수 없습니다.");

        private void MarkInitialized()
        {
            using RegistryKey stateKey = Registry.CurrentUser.CreateSubKey(_stateKeyPath, writable: true)
                ?? throw new InvalidOperationException("자동 시작 등록 이력 레지스트리 키를 열 수 없습니다.");
            stateKey.SetValue(InitializedValueName, 1, RegistryValueKind.DWord);
        }

        /*
         * 설치 경로에 공백이 있어도 정상 실행되도록 실행 파일 전체 경로를 큰따옴표로 감싼다. 기본 등록 명령에는 --tray를 넣지 않는다.
         */
        private string CreateCurrentExecutableCommand()
        {
            string executablePath = _processPath()
                ?? throw new InvalidOperationException("현재 Popup.exe 실행 경로를 확인할 수 없습니다.");
            return $"\"{executablePath}\"";
        }
    }
}
