using System;
using System.Collections.Generic;
using System.Linq;

namespace Popup.Services
{
    /*
     * POL-14-02 : Demo 모드
     * ■ 실행 인자
     * - in : Parse(arguments) 명령줄 인자(실행 파일 경로 제외)
     * - out: LaunchArguments(Demo, Api, ShowMain) · Current 현재 프로세스 인자 해석 결과
     * - 실행 인자 해석. 단일 하이픈(-Demo)·이중 하이픈(--demo)을 같은 이름으로 보고 대소문자를 구분하지 않는다.
     *
     *   (인자 없음)        : appsettings PopupApi.DemoMode 값에 따름(false면 일반 실행 — 실제 API·자동 조회)
     *   -Demo / --demo     : 인메모리 Demo(서버 없이 샘플 팝업). appsettings DemoMode=true와 같은 효과
     *   -Demo -Api         : API Demo. Demo 화면에서 개발계/검증계 API를 수동 호출한다. 자동 조회 없음
     *   -Api 단독          : 일반 실행이 이미 실제 API를 쓰므로 효과가 없다(무시). Demo로 바꾸지 않는다
     *   -show-main         : 일반 실행에서 관리 화면을 숨기지 않고 시작(SSO 로그인 테스트용)
     *
     * 우선순위: Demo 여부 = -Demo 인자 또는 appsettings DemoMode. API Demo = Demo 여부이면서 -Api 인자.
     * appsettings DemoMode=true에 -Api만 붙여도 API Demo가 된다(인자가 설정을 보강). 설정 파일만으로 API Demo를 켜는 항목은 두지 않는다.
     * 인자 순서는 상관없고, 모르는 인자(CrashGuard의 --restarted 등)는 여기서 무시한다.
     */
    public sealed record LaunchArguments(bool Demo, bool Api, bool ShowMain)
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
            return new LaunchArguments(names.Contains("demo"), names.Contains("api"), names.Contains("show-main"));
        }
    }
}
