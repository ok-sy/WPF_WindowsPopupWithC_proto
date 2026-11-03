using System;
using System.Diagnostics;

namespace Popup.Services
{
    /*
     * POL-15 : 배포·실행 환경
     * ■ 시작 옵션(트레이 표시·로그인 자동 시작)
     * - in : LaunchArguments(--tray) · 환경변수 WPF_POPUP_TRAY_ENABLED · WPF_POPUP_AUTOSTART_ENABLED
     * - out: StartupOptions(TrayEnabled, AutostartEnabled)
     * - 기본 실행은 트레이·관리 화면 없이 백그라운드에서 조회·결과 재전송만 한다(2026-10-28 결정, A-1 6번).
     *   우선순위: 명령행 옵션 > 환경변수 > 기본값. --tray는 환경변수 false보다 우선한다(명령행이 없을 때 환경변수를 false로 덮지 않음).
     *
     *   | 설정            | 환경변수                     | 기본값 | 명령행        |
     *   | 트레이 표시      | WPF_POPUP_TRAY_ENABLED      | false  | --tray → true |
     *   | 로그인 자동 시작 | WPF_POPUP_AUTOSTART_ENABLED | true   | 없음          |
     *
     * bool 값: true/false, 1/0, yes/no, on/off(대소문자·앞뒤 공백 무시). 그 밖의 값은 잘못된 값으로 보고 기본값을 쓴다(Debug 로그).
     * Demo 모드는 개발 화면을 다시 열 수단이 트레이뿐이라 이 값과 관계없이 트레이를 만든다(App에서 처리).
     */
    public sealed record StartupOptions(bool TrayEnabled, bool AutostartEnabled)
    {
        public const string TrayEnvironmentVariable = "WPF_POPUP_TRAY_ENABLED";
        public const string AutostartEnvironmentVariable = "WPF_POPUP_AUTOSTART_ENABLED";

        public static StartupOptions Resolve(LaunchArguments arguments, Func<string, string?>? readEnvironment = null)
        {
            ArgumentNullException.ThrowIfNull(arguments);
            readEnvironment ??= Environment.GetEnvironmentVariable;
            bool tray = arguments.Tray || (ParseBool(readEnvironment(TrayEnvironmentVariable), TrayEnvironmentVariable) ?? false);
            bool autostart = ParseBool(readEnvironment(AutostartEnvironmentVariable), AutostartEnvironmentVariable) ?? true;
            return new StartupOptions(tray, autostart);
        }

        /// <summary>환경변수 bool 값. 비어 있으면 null(미설정), 알 수 없는 값도 null(기본값 사용)로 돌려준다.</summary>
        public static bool? ParseBool(string? value, string name = "")
        {
            if (string.IsNullOrWhiteSpace(value)) return null;
            switch (value.Trim().ToLowerInvariant())
            {
                case "true": case "1": case "yes": case "on": return true;
                case "false": case "0": case "no": case "off": return false;
                default:
                    Debug.WriteLine($"[STARTUP] {name} 값 '{value}'을 알 수 없어 기본값을 씁니다.");
                    return null;
            }
        }
    }
}
