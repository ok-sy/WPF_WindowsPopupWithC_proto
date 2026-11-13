namespace Popup.Services
{
    /*
     * POL-15 : 배포·실행 환경 — [설계 75] 개발·운영 빌드 설정 분리
     * ■ 외부 설정 허용 여부(컴파일 시 결정)
     * - in : 컴파일 상수 POPUP_EXTERNAL_CONFIG (Popup.csproj의 PopupAllowExternalConfig=true일 때만 정의)
     * - out: AllowsExternalConfiguration(bool)
     *
     *   | 설정 경로                     | 개발 빌드(true)          | 운영 빌드(false, 기본) |
     *   | EXE 옆 appsettings.json       | 있으면 우선 적용          | 읽지 않음(내장만)      |
     *   | 앱 설정용 환경변수             | 기존 우선순위 유지        | 읽지 않음              |
     *   |  (POPUP_DEV_USER_ID, WPF_POPUP_TRAY_ENABLED, WPF_POPUP_AUTOSTART_ENABLED)                  |
     *
     * - Debug 구성은 기본 true(F5 개발 실행·launchSettings 환경변수 유지), Release 구성은 기본 false.
     *   Release에서 개발 EXE가 필요하면 명시적으로 -p:PopupAllowExternalConfig=true 를 준다
     *   (scripts/build-wpf-offline.ps1 -DevConfig).
     * - 명령행 인자(-Demo·-Api·--tray)는 이 분리 대상이 아니다(설계 75 결정: 기존 인자 유지).
     * - Windows·.NET 런타임이 쓰는 일반 환경변수(DOTNET_*, WebView2 등)는 범위 밖이다.
     */
    public static class BuildProfile
    {
#if POPUP_EXTERNAL_CONFIG
        public const bool AllowsExternalConfiguration = true;
        public const string Name = "Dev";
#else
        public const bool AllowsExternalConfiguration = false;
        public const string Name = "Prod";
#endif
    }
}
