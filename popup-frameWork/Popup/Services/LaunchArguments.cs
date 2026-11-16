using System;
using System.Collections.Generic;
using System.Linq;

namespace Popup.Services
{
    /*
     * POL-14-02 : Demo 모드
     * ■ 실행 인자
     * - in : Parse(arguments) 명령줄 인자(실행 파일 경로 제외)
     * - out: LaunchArguments(Demo, Api, ShowMain, Tray) · Current 현재 프로세스 인자 해석 결과 · ResolveDemo 설정과 합친 실행 모드
     * - 실행 인자 해석. 단일 하이픈(-Demo)·이중 하이픈(--demo)을 같은 이름으로 보고 대소문자를 구분하지 않는다.
     *
     *   (인자 없음)        : appsettings PopupApi.DemoMode 값에 따름(false면 일반 실행 — 실제 API·자동 조회)
     *   -Demo / --demo     : 인메모리 Demo(서버 없이 샘플 팝업). appsettings DemoMode=true와 같은 효과
     *   -Demo -Api         : API Demo. Demo 화면에서 개발계/검증계 API를 수동 호출한다. 자동 조회 없음
     *   -Api 단독          : 설정 DemoMode=true면 API Demo. 아니면 일반 실행이 이미 실제 API를 쓰므로 효과가 없다(무시). Demo로 바꾸지 않는다
     *   -show-main         : 일반 실행에서 관리 화면을 숨기지 않고 시작(SSO 로그인 테스트용)
     *   --tray             : 트레이 아이콘 표시(상태·진단용). 기본 실행은 트레이 없음. 환경변수 WPF_POPUP_TRAY_ENABLED보다 우선(StartupOptions)
     *
     * 설정(설계 51-11): PopupApi.DemoMode(bool) + PopupApi.DemoType("InMemory" | "Api", 없거나 빈 값이면 InMemory).
     *   DemoMode=true + DemoType=Api 이면 인자 없이 API Demo. DemoMode=false + DemoType=Api 는 설정 오류(예외).
     *   모르는 DemoType 값도 설정 오류다.
     * 우선순위(ResolveDemo): 실행 인자가 설정보다 우선한다.
     *   -Demo -Api → API Demo, -Demo → 인메모리 Demo(설정 DemoType=Api여도). 이때 설정의 Demo 항목은 보지 않는다.
     *   -Api 단독 → 설정 DemoMode=true면 API Demo(기존처럼 인자가 설정을 보강), 아니면 무시.
     *   인자 없음 → 설정(DemoMode·DemoType)대로.
     * 인자 순서는 상관없고, 모르는 인자(CrashGuard의 --restarted 등)는 여기서 무시한다.
     */
    public sealed record LaunchArguments(bool Demo, bool Api, bool ShowMain, bool Tray = false)
    {
        public static LaunchArguments Current { get; } = Parse(Environment.GetCommandLineArgs().Skip(1));

        public static LaunchArguments Parse(IEnumerable<string> arguments)
        {
            HashSet<string> names = new(StringComparer.OrdinalIgnoreCase);
            foreach (string argument in arguments)
            {
                string trimmed = argument?.Trim() ?? string.Empty;
                // "-" 또는 "--"로 시작하는 인자만 이름으로 본다(경로 등 일반 문자열 제외).
                if (!trimmed.StartsWith('-')) continue;
                names.Add(trimmed.TrimStart('-'));
            }
            return new LaunchArguments(names.Contains("demo"), names.Contains("api"), names.Contains("show-main"), names.Contains("tray"));
        }

        /*
         * POL-14-02 : Demo 모드 — 실행 인자와 appsettings(DemoMode·DemoType)로 실행 모드를 정한다(설계 51-11).
         * - in : configuredDemoMode(PopupApi.DemoMode) · configuredDemoType(PopupApi.DemoType, null·빈 값은 InMemory)
         * - out: (DemoMode, DemoApi). 설정 충돌·모르는 DemoType이면 InvalidOperationException.
         */
        public (bool DemoMode, bool DemoApi) ResolveDemo(bool configuredDemoMode, string? configuredDemoType)
        {
            if (Demo)
            {
                return (true, Api);
            }

            string type = (configuredDemoType ?? string.Empty).Trim();
            bool typeApi = type.Equals(DemoTypeApi, StringComparison.OrdinalIgnoreCase);
            if (type.Length > 0 && !typeApi && !type.Equals(DemoTypeInMemory, StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"PopupApi.DemoType '{type}'은(는) 알 수 없는 값입니다. {DemoTypeInMemory} 또는 {DemoTypeApi}만 사용할 수 있습니다.");
            }
            if (!configuredDemoMode && typeApi)
            {
                throw new InvalidOperationException(
                    "PopupApi.DemoType=Api는 PopupApi.DemoMode=true일 때만 쓸 수 있습니다. API Demo를 쓰려면 DemoMode=true로, 일반 실행이면 DemoType을 비우거나 InMemory로 두세요.");
            }
            return configuredDemoMode ? (true, typeApi || Api) : (false, false);
        }

        public const string DemoTypeInMemory = "InMemory";
        public const string DemoTypeApi = "Api";
    }
}
