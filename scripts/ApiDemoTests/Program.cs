using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Threading;
using Popup;
using Popup.Dtos;
using Popup.Models;
using Popup.Services;
using Popup.Services.Auth;
using Popup.Views.Windows;

/*
 * POL-14-02 : Demo 모드
 * POL-16-02 : 재현 가능한 검증
 * ■ API Demo(-Demo -Api) 회귀 검증(저장소 추적)
 * - in : 없음(실행 인자 사용 안 함)
 * - out: 콘솔 PASS 검사 건수 · 실패 시 Exception("FAIL: 메시지")
 * - 검사 항목(앞 번호는 검사 메시지의 태그와 같다):
 *  51-1 실행 인자 해석(-Demo·--demo·-Api 단독·대소문자·순서·모르는 인자)
 *  51-3 HTTP 기록 마스킹(Authorization·accessToken)·응답 본문 종류(EMPTY·INVALID_JSON·JSON·NO_RESPONSE)
 *  51-4~7 로컬 모의 HTTP 서버(HttpListener, localhost 임의 포트)에 실제 DemoWindow·PopupApiService·PopupResultQueue 경로로
 *       로그인→수동 조회(입력 JSON 본문)→TEXT 팝업 표시→닫기→결과 실제 전송→자동 다음 조회 없음,
 *       401 재로그인 1회 후 같은 요청 재전송, 결과 전송 실패 시 같은 resultId·본문 재전송·미전송 시 조회 보류,
 *       popup=null·빈 응답·잘못된 JSON·HTTP 500·팝업 생성 오류의 구분 기록, 연결별 결과 큐 파일 분리
 *  51-8 인메모리 Demo 화면 구성 유지
 *  54-2 모드 표시·모드별 하단 고정 실행 영역, 54-3~5 상세옵션 그룹 탭·조건부 표시(숨김/비활성+사유)·즉시 검증·변경 표시·탭별 기본값 복원,
 *       숨김 입력은 적용하지 않고 값 보존, 복사본 편집(원본 DTO 불변)
 *  54-6 연결 적용 후 연결 설정 접힘·대상/인증 요약, 54-7 로그 구분([조회]/[결과]/[로그인]), 54-8 실행 상태 표시
 * 개발계/검증계 실제 서버 확인은 이 검증의 범위가 아니다(수동 확인 항목).
 *   실행: dotnet run --project scripts/ApiDemoTests
 * 내부(internal·private) 멤버는 리플렉션으로 접근하므로 이름을 바꾸면 이 검증도 함께 고친다. 실제 창을 잠깐 띄운다.
 */
internal static class Program
{
    private const BindingFlags Flags = BindingFlags.Instance | BindingFlags.Static | BindingFlags.NonPublic | BindingFlags.Public;
    private static int _checks;

    private static void Check(bool condition, string message)
    {
        if (!condition) throw new Exception("FAIL: " + message);
        _checks++;
    }

    [STAThread]
    private static void Main()
    {
        // 창 이벤트·await 이후 코드가 UI 스레드에서 이어지도록 WPF 동기화 컨텍스트를 둔다(Application 없이 실행).
        SynchronizationContext.SetSynchronizationContext(new DispatcherSynchronizationContext(Dispatcher.CurrentDispatcher));
        CheckLaunchArguments();
        CheckRecordMasking();
        CheckLoginFailureText();
        CheckConnectionKey();
        CheckLoginRequestKey();
        CheckHttpCategory54();
        CheckInMemoryDemoLayout();
        CheckDemoOptions54();
        using MockServer server = new();
        CheckApiDemoFlow(server);
        CheckDemoLoginFlow(server);
        CheckLoginTokenSources(server);
        CheckDemoHeaderTokenLogin(server);
        Console.WriteLine($"PASS: {_checks} API demo checks (design 51, TODO54)");
    }

    private static void CheckLaunchArguments()
    {
        LaunchArguments Parse(params string[] args) => LaunchArguments.Parse(args);
        Check(Parse() == new LaunchArguments(false, false, false), "[51-1] no arguments");
        Check(Parse("--demo") == new LaunchArguments(true, false, false), "[51-1] --demo keeps in-memory demo");
        Check(Parse("-Demo", "-Api") == new LaunchArguments(true, true, false), "[51-1] -Demo -Api");
        Check(Parse("-API", "--DEMO") == new LaunchArguments(true, true, false), "[51-1] order and case are ignored");
        Check(Parse("-Api") == new LaunchArguments(false, true, false), "[51-1] -Api alone is parsed but not demo");
        Check(Parse("--restarted", "-demo", "C:\\path\\api", "api") == new LaunchArguments(true, false, false),
            "[51-1] unknown arguments and non-dash values are ignored");
        Check(Parse("-show-main").ShowMain && Parse("--show-main").ShowMain, "[51-1] show-main accepts single and double dash");
    }

    /// <summary>일반 모드 로그인 본문은 폐쇄망 p/api/auth/sso/login 요청 DTO와 같은 lgonId 키로 보낸다(C# 속성 이름 LogonId와 무관).</summary>
    private static void CheckLoginRequestKey()
    {
        string body = JsonSerializer.Serialize(new WpfLoginRequestDto { LogonId = "E1001", ClassCode = "A1" },
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        Check(body == "{\"lgonId\":\"E1001\",\"classCode\":\"A1\",\"linkYn\":\"N\"}", "[login] typed login body uses lgonId: " + body);
    }

    private static void CheckRecordMasking()
    {
        HttpExchangeRecord record = new(DateTimeOffset.Now, "POST", "http://h/p/api/wpf/auth/login",
            new[] { new KeyValuePair<string, string>("Authorization", "Bearer secret-token-123") },
            "{\"lgonId\":\"E1\"}", 200, "OK", "{\"accessToken\":\"tok-SECRET\",\"tokenType\":\"Bearer\"}", 5, null);
        var (request, response) = record.ToDisplayJson(revealSecrets: false);
        Check(!request.Contains("secret-token-123") && request.Contains("마스킹"), "[51-3] Authorization header is masked by default");
        Check(!response.Contains("tok-SECRET") && response.Contains("마스킹"), "[51-3] accessToken in response body is masked by default");
        var (revealedRequest, revealedResponse) = record.ToDisplayJson(revealSecrets: true);
        Check(revealedRequest.Contains("secret-token-123") && revealedResponse.Contains("tok-SECRET"), "[51-3] reveal shows plain values on screen");
        Check(record.Summary("http://h/p") == "POST /api/wpf/auth/login → 200 OK (5 ms)", "[51-3] summary uses path after base URL");
        Check(HttpExchangeRecord.BodyKind("", 200) == "EMPTY" && HttpExchangeRecord.BodyKind("{x", 200) == "INVALID_JSON"
              && HttpExchangeRecord.BodyKind("{}", 200) == "JSON" && HttpExchangeRecord.BodyKind(null, null) == "NO_RESPONSE",
            "[51-3] response body kind");
        Check(DemoApiAuthHeaderProviderNormalize("abc") == "Bearer abc" && DemoApiAuthHeaderProviderNormalize("Bearer abc") == "Bearer abc"
              && DemoApiAuthHeaderProviderNormalize(" ") == null, "[51-2] token input normalization");
    }

    private static string? DemoApiAuthHeaderProviderNormalize(string value)
        => (string?)typeof(DemoApiAuthHeaderProvider).GetMethod("NormalizeAuthorization", Flags)!.Invoke(null, new object?[] { value });

    private static void CheckHttpCategory54()
    {
        string Category(string url) => (string)typeof(DemoWindow).GetMethod("HttpCategory", Flags)!.Invoke(null, new object[] { url })!;
        Check(Category("http://h/p/api/wpf/popups") == "[조회]" && Category("http://h/p/api/wpf/popups/results") == "[결과]"
              && Category("http://h/p/api/wpf/auth/login") == "[로그인]" && Category("http://h/p/api/auth/sso/login") == "[로그인]" && Category("http://h/p/other") == "[HTTP]",
            "[54-7] request kind is derived from the path");
    }

    private static void CheckConnectionKey()
    {
        string Key(string url, string mode, string identity)
            => (string)typeof(DemoWindow).GetMethod("ComputeConnectionKey", Flags)!.Invoke(null, new object[] { url, mode, identity })!;
        string baseKey = Key("http://h/p", "LOGIN", "body");
        Check(baseKey == Key("HTTP://H/p/", "LOGIN", "body"), "[51-7] trailing slash and host case do not split the queue");
        Check(baseKey != Key("http://h2/p", "LOGIN", "body"), "[51-7] other base URL uses another queue");
        Check(baseKey != Key("http://h/p", "TOKEN", "body"), "[51-7] other auth mode uses another queue");
        Check(baseKey != Key("http://h/p", "LOGIN", "other"), "[51-7] other account uses another queue");
    }

    private static void CheckInMemoryDemoLayout()
    {
        DemoWindow window = new();
        Check(((FrameworkElement)window.FindName("ApiPanel")).Visibility == Visibility.Collapsed
              && ((FrameworkElement)window.FindName("InMemoryPanel")).Visibility == Visibility.Visible,
            "[51-8] in-memory demo keeps its panel and hides the API panel");
        Check(((FrameworkElement)window.FindName("InMemoryActionBar")).Visibility == Visibility.Visible
              && ((FrameworkElement)window.FindName("ApiActionBar")).Visibility == Visibility.Collapsed
              && ((TextBlock)window.FindName("ModeBadgeText")).Text == "로컬 샘플",
            "[54-2] in-memory demo shows its fixed action bar and the local mode badge");
        Check(((TextBlock)window.FindName("RunStateText")).Text == "대기" && ((Button)window.FindName("LocalRunButton")).IsEnabled,
            "[54-8] local demo starts idle with the run button enabled");
        window.Close();
    }

    /* POL-14-02 : Demo 모드 — 상세옵션 창: 그룹 탭, 조건부 표시, 즉시 검증, 변경 표시, 탭별 복원, 복사본 편집. */
    private static void CheckDemoOptions54()
    {
        PopupResponseDto Sample(string id) => DemoPopupDataService.CreatePopups().Single(p => p.PopupId == id);
        string[] Tabs(DemoOptionsWindow editor) => ((TabControl)typeof(DemoOptionsWindow).GetField("_tabs", Flags)!.GetValue(editor)!)
            .Items.Cast<TabItem>().Select(t => (string)t.Header).ToArray();
        Check(Tabs(new DemoOptionsWindow(Sample("DEMO-TEXT-001"))).SequenceEqual(new[] { "창·배치", "헤더·푸터", "콘텐츠", "완료·동작", "고급" }),
            "[54-3] TEXT options are grouped into tabs");
        Check(Tabs(new DemoOptionsWindow(Sample("DEMO-QUIZ-001"))).SequenceEqual(new[] { "창·배치", "헤더·푸터", "콘텐츠", "완료·동작", "문항·선택지", "고급" }),
            "[54-3] QUIZ adds the question tab");
        // 실화면 점검(2026-11-10): 입력칸 이름 = 라벨, Tab은 탭 내용 → 하단 버튼, 비활성 칸은 배경으로 구분
        {
            var named = new DemoOptionsWindow(Sample("DEMO-TEXT-001"));
            var namedDraft = (System.Text.Json.Nodes.JsonObject)typeof(DemoOptionsWindow).GetField("_draft", Flags)!.GetValue(named)!;
            var namedInputs = (System.Collections.IDictionary)typeof(DemoOptionsWindow).GetField("_inputs", Flags)!.GetValue(named)!;
            var widthBox = (TextBox)namedInputs[(namedDraft, "width")]!;
            var ratioBox = (TextBox)namedInputs[(namedDraft, "widthRatio")]!;
            Check(System.Windows.Automation.AutomationProperties.GetName(widthBox).StartsWith("고정 창 너비"), "[54-10] option inputs are named by their labels");
            Check(!widthBox.IsEnabled && widthBox.Background != ratioBox.Background, "[54-10] a disabled empty input looks different from an enabled one");
            var namedTabs = (TabControl)typeof(DemoOptionsWindow).GetField("_tabs", Flags)!.GetValue(named)!;
            Check(System.Windows.Input.KeyboardNavigation.GetTabIndex(namedTabs) < System.Windows.Input.KeyboardNavigation.GetTabIndex((DependencyObject)namedTabs.Parent is DockPanel dock ? dock.Children[1] : namedTabs),
                "[54-10] Tab order visits the tab content before the footer buttons");
        }
        // 실화면 점검(2026-11-10): 값이 없는(null) 문자열 칸(선택형 문항의 주관식 정답)을 비워 둔 상태를 '변경'으로 세지 않는다.
        foreach (string id in new[] { "DEMO-QUIZ-001", "DEMO-VIDEO-QUIZ" })
        {
            var fresh = new DemoOptionsWindow(Sample(id), Sample(id));
            var summary = (TextBlock)typeof(DemoOptionsWindow).GetField("_changeSummary", Flags)!.GetValue(fresh)!;
            Check(summary.Text == "모든 항목이 샘플 기본값과 같습니다.", $"[54-5] an untouched {id} shows no changed fields: {summary.Text}");
            var unchanged = (PopupResponseDto)typeof(DemoOptionsWindow).GetMethod("ReadResult", Flags)!.Invoke(fresh, null)!;
            Check(unchanged.Questions.All(q => q.CorrectAnswer == Sample(id).Questions.Single(o => o.QuestionId == q.QuestionId).CorrectAnswer),
                $"[54-5] applying an untouched {id} keeps empty answers as null");
        }

        PopupResponseDto sample = Sample("DEMO-TEXT-001");
        var editor = new DemoOptionsWindow(sample, Sample("DEMO-TEXT-001"));
        var draft = (System.Text.Json.Nodes.JsonObject)typeof(DemoOptionsWindow).GetField("_draft", Flags)!.GetValue(editor)!;
        var inputs = (System.Collections.IDictionary)typeof(DemoOptionsWindow).GetField("_inputs", Flags)!.GetValue(editor)!;
        Control Input(string key) => (Control)inputs[(draft, key)]!;
        StackPanel Row(string key) => (StackPanel)Input(key).Parent;
        TextBlock Note(string key) => (TextBlock)Row(key).Children[^1];
        TextBlock Changed(string key) => (TextBlock)((DockPanel)Row(key).Children[0]).Children[0];
        PopupResponseDto Read() => (PopupResponseDto)typeof(DemoOptionsWindow).GetMethod("ReadResult", Flags)!.Invoke(editor, null)!;
        bool ReadFails()
        {
            try { Read(); return false; }
            catch (TargetInvocationException exception) when (exception.InnerException is ArgumentException) { return true; }
        }

        // 같은 탭 상위 옵션 → 하위 숨김, 창 크기 방식 → 비활성 + 사유
        Check(Row("hideDays").Visibility == Visibility.Collapsed, "[54-4] hide days is hidden while do-not-show-again is off");
        Check(!Row("width").IsEnabled && Note("width").Visibility == Visibility.Visible && Note("width").Text.Contains("FIXED"),
            "[54-4] fixed width is disabled with a reason under RATIO");
        ((ComboBox)Input("sizeMode")).SelectedItem = "FIXED";
        Check(Row("width").IsEnabled && !Row("widthRatio").IsEnabled && Note("width").Visibility == Visibility.Collapsed,
            "[54-4] switching to FIXED enables width and disables the ratio");
        ((CheckBox)Input("showDoNotShowAgain")).IsChecked = true;
        Check(Row("hideDays").Visibility == Visibility.Visible, "[54-4] hide days appears right under do-not-show-again");

        // 즉시 검증·변경 표시
        ((TextBox)Input("hideDays")).Text = "0";
        Check(Note("hideDays").Visibility == Visibility.Visible && Note("hideDays").Text.Contains("1~3650") && ReadFails(),
            "[54-5] invalid hide days is reported while typing and blocks apply");
        ((TextBox)Input("hideDays")).Text = "9";
        Check(Note("hideDays").Visibility == Visibility.Collapsed && Changed("hideDays").Visibility == Visibility.Visible
              && Changed("sizeMode").Visibility == Visibility.Visible && Changed("title").Visibility == Visibility.Collapsed,
            "[54-5] valid input clears the error and changed fields are marked");

        // 숨긴 입력은 적용하지 않지만 값은 보존
        ((CheckBox)Input("showDoNotShowAgain")).IsChecked = false;
        PopupResponseDto hidden = Read();
        Check(hidden.HideDays == sample.HideDays && !hidden.ShowDoNotShowAgain && hidden.SizeMode == "FIXED",
            "[54-4] a hidden child input is not applied");
        ((CheckBox)Input("showDoNotShowAgain")).IsChecked = true;
        Check(((TextBox)Input("hideDays")).Text == "9", "[54-4] hiding keeps the typed child value");

        // 다른 탭 설정 → 비활성 + 사유, 같은 탭 하위 → 숨김
        ((CheckBox)Input("showFooter")).IsChecked = false;
        Check(!Row("showLater").IsEnabled && Note("showLater").Text.Contains("푸터 표시") && Row("footerAction").Visibility == Visibility.Collapsed,
            "[54-4] footer off disables cross-tab footer actions with a reason and hides same-tab footer inputs");
        ((CheckBox)Input("showFooter")).IsChecked = true;

        // 탭별 기본값 복원: 완료·동작만 되돌리고 창·배치 변경은 유지
        var tabs = (TabControl)typeof(DemoOptionsWindow).GetField("_tabs", Flags)!.GetValue(editor)!;
        TabItem completion = tabs.Items.Cast<TabItem>().Single(t => (string)t.Header == "완료·동작");
        typeof(DemoOptionsWindow).GetMethod("ResetTab", Flags)!.Invoke(editor, new object[] { completion });
        Check(((CheckBox)Input("showDoNotShowAgain")).IsChecked == sample.ShowDoNotShowAgain
              && ((TextBox)Input("hideDays")).Text == (sample.HideDays?.ToString() ?? "")
              && Changed("showDoNotShowAgain").Visibility == Visibility.Collapsed
              && (string)((ComboBox)Input("sizeMode")).SelectedItem == "FIXED",
            "[54-5] tab reset restores only that tab's fields");

        // 복사본 편집: 원본 DTO는 그대로
        Check(sample.SizeMode == "RATIO" && !sample.ShowDoNotShowAgain, "[54-5] editing never touches the original sample");
        editor.Close();
    }

    private static string Describe(string? body) => (string)typeof(WpfLoginClient).GetMethod("DescribeFailure", Flags)!.Invoke(null, new object?[] { body })!;

    private static void CheckLoginFailureText()
    {
        string business = Describe("{\"msgId\":\"FW00000009\",\"msgCn\":\"불일치\"}");
        Check(business.Contains("FW00000009") && business.Contains("계정 권한"), "[R-08] business failure with HTTP 200 shows the server message");
        Check(Describe("").Contains("빈 응답"), "[R-08] empty login response is identified");
        Check(Describe("{\"a\":1}").Contains("형식 불일치"), "[R-08] unexpected login response shape is identified");
        Check(Describe("<html>").Contains("JSON이 아닌"), "[R-08] non-JSON login response is identified");
    }

    /* 일반 실행 로그인: 폐쇄망 SSO 로그인처럼 토큰이 응답 헤더로 와도, 프로토타입처럼 본문으로 와도 동작해야 한다. */
    private static void CheckLoginTokenSources(MockServer server)
    {
        WpfLoginResponseDto Login(string mode, string path = "/api/auth/sso/login")
        {
            server.SsoLoginMode = mode;
            return Task.Run(() => new WpfLoginClient(server.BaseUrl, path).LoginAsync(new SsoUserInfo("E1001", "A1"))).GetAwaiter().GetResult();
        }
        WpfLoginResponseDto header = Login("HEADER");
        Check(header.AccessToken == server.ValidToken && header.TokenType == "Bearer" && header.ExpiresAt == default, "[login-token] token is read from the response header with a profile body");
        Check(server.SsoLoginBodies[^1].Contains("\"lgonId\":\"E1001\"") && server.SsoLoginBodies[^1].Contains("\"classCode\":\"A1\"") && server.SsoLoginBodies[^1].Contains("\"linkYn\":\"N\""), "[login-token] sso login receives lgonId, classCode and linkYn");
        Check(Login("BOTH").AccessToken == server.ValidToken, "[login-token] header token wins over the body token");
        Check(Login("BEARER").AccessToken == server.ValidToken, "[login-token] a Bearer prefix in the header is not doubled");
        WpfLoginResponseDto body = Login("BODY");
        Check(body.AccessToken == server.ValidToken && body.ExpiresAt != default, "[login-token] body accessToken still works without the header");
        foreach (string mode in new[] { "NONE", "EMPTY", "INVALID" })
        {
            try { Login(mode); Check(false, $"[login-token] {mode} must fail"); }
            catch (WpfLoginFailedException failed) { Check(failed.Message.Contains("토큰이 없습니다"), $"[login-token] {mode} reports a missing token"); }
        }
        // 일반 실행 경로: SSO 1회 → 로그인 → 헤더 토큰, 401은 SSO 없이 재로그인
        server.SsoLoginMode = "HEADER";
        int ssoBefore = server.SsoGetCount;
        SsoAuthHeaderProvider provider = new(new SsoClient(server.BaseUrl + "/sso"), new WpfLoginClient(server.BaseUrl, "/api/auth/sso/login"));
        string? first = Task.Run(() => provider.GetAuthorizationHeaderAsync()).GetAwaiter().GetResult();
        Check(first == "Bearer " + server.ValidToken && server.SsoGetCount == ssoBefore + 1, "[login-token] SSO provider sends the header token as Bearer");
        Task.Run(() => provider.OnUnauthorizedAsync(first)).GetAwaiter().GetResult();
        string? renewed = Task.Run(() => provider.GetAuthorizationHeaderAsync()).GetAwaiter().GetResult();
        Check(renewed != first && renewed == "Bearer " + server.ValidToken && server.SsoGetCount == ssoBefore + 1, "[login-token] 401 logs in again with the header token and no second SSO call");
    }

    /* API Demo 로그인 방식도 같은 클라이언트라 폐쇄망 SSO 로그인 경로와 헤더 토큰으로 조회까지 이어진다. */
    private static void CheckDemoHeaderTokenLogin(MockServer server)
    {
        server.SsoLoginMode = "HEADER";
        server.PopupMode = "NULL";
        DemoWindow window = new(new PopupClientSettings { DemoMode = true, DemoApi = true, BaseUrl = server.BaseUrl, AuthMode = "SsoPrototype", AuthLoginPath = "/api/auth/sso/login" });
        window.Show();
        ((TextBox)window.FindName("ApiLoginBodyText")).Text = "{\"lgonId\":\"E1001\",\"classCode\":\"A1\",\"linkYn\":\"N\"}";
        Query(window);
        Check(server.PopupRequests[^1].Authorization == "Bearer " + server.ValidToken && Logs(window).Any(l => l.Contains("popup=null")), "[login-token] API demo login mode queries with the header token");
        Check(((TextBlock)window.FindName("ApiStepText")).Text.Contains("✓ 로그인"), "[login-token] API demo marks the header token login as success");
        window.Close();
    }

    /* 인증 방식은 로그인(JSON)·토큰 직접 입력 2가지. 일반 로그인 → 조회 → 표시 → 결과 → 수동 다음 조회와 입력·오류·마스킹·연결 변경을 본다. */
    private static void CheckDemoLoginFlow(MockServer server)
    {
        string LoginJson(string id) => JsonSerializer.Serialize(new { lgonId = id, classCode = "A1", linkYn = "N" });
        server.PopupMode = "TEXT";
        server.ResultMode = "ACCEPTED";
        server.CredentialMode = "OK";
        int popupRequestsBefore = server.PopupRequests.Count;
        int resultsBefore = server.ResultBodies.Count;
        PopupClientSettings settings = new()
        {
            DemoMode = true, DemoApi = true, BaseUrl = server.BaseUrl, AuthMode = "None", AuthLoginPath = "/api/demo/login"
        };
        DemoWindow window = new(settings);
        window.Show();
        ComboBox mode = (ComboBox)window.FindName("ApiAuthModeCombo");
        Check(mode.Items.Cast<ComboBoxItem>().Select(item => (string)item.Tag).SequenceEqual(new[] { "LOGIN", "TOKEN" }) && mode.SelectedIndex == 0, "[auth-mode] only login and direct token remain, login selected when settings say None");
        TextBox loginBody = (TextBox)window.FindName("ApiLoginBodyText");
        TextBlock error = (TextBlock)window.FindName("ApiInputErrorText");
        TextBlock steps = (TextBlock)window.FindName("ApiStepText");
        Expander queryExpander = (Expander)window.FindName("ApiQueryExpander");
        bool Shown(string name) => ((FrameworkElement)window.FindName(name)).Visibility == Visibility.Visible;
        Check(Shown("ApiLoginPanel") && !Shown("ApiTokenPanel") && Shown("ApiLoginButton"), "[U-02] login mode shows its inputs");
        Check(!queryExpander.IsExpanded && ((TextBox)window.FindName("ApiQueryBodyText")).Text == "{}", "[query-json] query JSON is collapsed with the empty object default");

        // 입력 검증은 요청 없이 입력란 근처에 표시한다.
        int loginsBefore = server.CredentialBodies.Count;
        loginBody.Text = "{ broken";
        ClickLogin(window);
        Check(error.Visibility == Visibility.Visible && error.Text.Contains("로그인 요청 JSON") && server.CredentialBodies.Count == loginsBefore, "[U-05] invalid login JSON is rejected before any request");
        int popupsBeforeInvalid = server.PopupRequests.Count;
        ((TextBox)window.FindName("ApiQueryBodyText")).Text = "[1]";
        Query(window);
        Check(queryExpander.IsExpanded && ((TextBlock)window.FindName("ApiQueryErrorText")).Visibility == Visibility.Visible && server.PopupRequests.Count == popupsBeforeInvalid, "[query-json] invalid query JSON expands the section and shows the error");
        ((TextBox)window.FindName("ApiQueryBodyText")).Text = "{}";

        // 거절된 계정: HTTP 200이어도 실패로 구분하고 입력을 펼친다.
        loginBody.Text = LoginJson("wrong-user");
        ClickLogin(window);
        Pump(() => server.CredentialBodies.Count == loginsBefore + 1 && !IsBusy(window));
        Pump(() => false, 100);
        Check(error.Visibility == Visibility.Collapsed && Logs(window).Any(l => l.Contains("로그인 실패") && l.Contains("FW00000009")), "[R-08] rejected account shows a login failure, not success");
        Check(((Expander)window.FindName("ApiConnectionExpander")).IsExpanded && steps.Text.Contains("✕ 로그인"), "[U-06] failed login is marked and its inputs stay open");
        server.CredentialMode = "500";
        ClickLogin(window);
        Pump(() => server.CredentialBodies.Count == loginsBefore + 2 && !IsBusy(window));
        Pump(() => false, 100);
        Check(Logs(window).Any(l => l.Contains("HTTP 오류 500")), "[R-08] login HTTP 500 is identified");
        server.CredentialMode = "NO_TOKEN";
        loginBody.Text = LoginJson("master");
        ClickLogin(window);
        Pump(() => server.CredentialBodies.Count == loginsBefore + 3 && !IsBusy(window));
        Pump(() => false, 100);
        Check(Logs(window).Any(l => l.Contains("토큰이 없습니다")), "[R-08] missing token header is identified");

        // 정상 로그인
        server.CredentialMode = "OK";
        ClickLogin(window);
        Pump(() => server.CredentialBodies.Count == loginsBefore + 4 && !IsBusy(window));
        Pump(() => false, 100);
        Check(server.CredentialBodies[^1].Contains("\"lgonId\":\"master\"") && server.CredentialBodies[^1].Contains("\"classCode\":\"A1\""), "[R-02] login posts the entered JSON");
        Check(Logs(window).Any(l => l.Contains("[로그인] 성공")) && !((Expander)window.FindName("ApiConnectionExpander")).IsExpanded, "[U-07] login collapses the settings");
        Check(steps.Text.Contains("✓ 연결") && steps.Text.Contains("✓ 로그인") && steps.Text.Contains("✓ 인증 준비") && steps.Text.Contains("최근 HTTP 200"), "[U-06] steps show login success and the last HTTP status: " + steps.Text);

        // 조회 → 표시 → 결과 → 다음 조회는 수동
        Query(window);
        var request = server.PopupRequests[^1];
        Check(request.Authorization == "Bearer " + server.ValidToken && string.IsNullOrEmpty(request.DevUserId), "[R-03] query sends the login token and no dev user header");
        Check(OpenPopups(window).Count == 1 && steps.Text.Contains("✓ 팝업 조회") && steps.Text.Contains("✓ 표시"), "[R-05] popup is shown and the steps follow: " + steps.Text);
        CloseShownPopup(window);
        Pump(() => server.ResultBodies.Count == resultsBefore + 1 && !IsBusy(window));
        Pump(() => ((TextBlock)window.FindName("ApiStepText")).Text.Contains("✓ 결과 전송"));
        Check(steps.Text.Contains("✓ 결과 전송") && server.PopupRequests.Count == popupRequestsBefore + 1, "[R-07] AVAILABLE does not trigger an automatic next query");
        server.PopupMode = "NULL";
        Query(window);
        Check(server.PopupRequests.Count == popupRequestsBefore + 2 && Logs(window).Any(l => l.Contains("popup=null")) && steps.Text.Contains("- 표시"), "[R-04] popup=null is a normal result");

        // 401 → 같은 로그인 본문으로 1회 재로그인 후 재시도
        int loginsBeforeRetry = server.CredentialBodies.Count;
        server.InvalidateToken();
        Query(window);
        Check(server.CredentialBodies.Count == loginsBeforeRetry + 1 && server.PopupRequests[^1].Authorization == "Bearer " + server.ValidToken, "[R-09] 401 logs in once and retries");

                Dictionary<int, HttpExchangeRecord> details = (Dictionary<int, HttpExchangeRecord>)typeof(DemoWindow).GetField("_httpDetails", Flags)!.GetValue(window)!;
        Check(details.Values.Any(r => r.Url.EndsWith("/api/demo/login")), "[R-11] login exchange is recorded");
        Check(Logs(window).All(l => !l.Contains(server.ValidToken!)), "[U-04] logs do not contain the token");

        // 연결 변경: 이전 인증 초기화(재로그인), 새 큐
        object? queue = typeof(DemoWindow).GetProperty("ApiQueue", Flags)!.GetValue(window);
        int loginsBeforeChange = server.CredentialBodies.Count;
        loginBody.Text = LoginJson("other-user");
        Query(window);
        Check(server.CredentialBodies.Count == loginsBeforeChange + 1 && server.CredentialBodies[^1].Contains("other-user"), "[U-08] changing the account logs in again");
        Check(!ReferenceEquals(queue, typeof(DemoWindow).GetProperty("ApiQueue", Flags)!.GetValue(window)), "[U-08] changing the account replaces the result queue");

        // 토큰 직접 입력은 로그인 없이 동작
        int loginsBeforeToken = server.CredentialBodies.Count;
        mode.SelectedItem = mode.Items.Cast<ComboBoxItem>().Single(item => (string)item.Tag == "TOKEN");
        Pump(() => true);
        Check(!Shown("ApiLoginPanel") && !Shown("ApiLoginButton") && Shown("ApiTokenPanel"), "[R-10] token mode shows only the token input");
        ((PasswordBox)window.FindName("ApiTokenBox")).Password = server.ValidToken!;
        Query(window);
        Check(server.CredentialBodies.Count == loginsBeforeToken && server.PopupRequests[^1].Authorization == "Bearer " + server.ValidToken, "[R-10] token mode does not call the login API");
        window.Close();
    }

    private static bool IsBusy(DemoWindow window) => (bool)typeof(DemoWindow).GetProperty("IsApiBusy", Flags)!.GetValue(window)!;

    private static void ClickLogin(DemoWindow window)
    {
        ((Button)window.FindName("ApiLoginButton")).RaiseEvent(new RoutedEventArgs(Button.ClickEvent));
        Pump(() => true);
    }

    private static void CheckApiDemoFlow(MockServer server)
    {
        PopupClientSettings settings = new()
        {
            DemoMode = true, DemoApi = true, BaseUrl = server.BaseUrl, AuthMode = "SsoPrototype", AuthLoginPath = "/api/wpf/auth/login", DevUserId = "E-SETTINGS"
        };
        DemoWindow window = new(settings);
        window.Show();
        Check(((FrameworkElement)window.FindName("ApiPanel")).Visibility == Visibility.Visible
              && ((FrameworkElement)window.FindName("InMemoryPanel")).Visibility == Visibility.Collapsed,
            "[51-8] API demo shows the API panel and hides in-memory controls");
        Check(((FrameworkElement)window.FindName("ApiActionBar")).Visibility == Visibility.Visible
              && ((FrameworkElement)window.FindName("InMemoryActionBar")).Visibility == Visibility.Collapsed
              && ((TextBlock)window.FindName("ModeBadgeText")).Text == "API 연결",
            "[54-2] API demo shows the query action bar outside the scroll area and the API mode badge");
        ((TextBox)window.FindName("ApiLoginBodyText")).Text = "{\"lgonId\":\"E1001\",\"classCode\":\"A1\",\"linkYn\":\"N\"}";
        Check(window.FindName("ApiDevUserIdText") == null, "[dev-header] API demo has no X-Dev-User-Id input");
        ((TextBox)window.FindName("ApiQueryBodyText")).Text = "{\"probe\":1}";

        // 1) 로그인 → 수동 조회(입력 JSON 본문 그대로) → 팝업 표시
        Query(window);
        PopupResultQueue queue = (PopupResultQueue)typeof(DemoWindow).GetProperty("ApiQueue", Flags)!.GetValue(window)!;
        Check(queue.CountPending() == 0, "[메모리 큐] a newly applied connection starts with an empty in-memory queue");
        Check(server.LoginBodies.Count == 1 && server.LoginBodies[0].Contains("\"lgonId\":\"E1001\""), "[51-2] login API receives the entered login JSON");
        Check(server.PopupRequests.Count == 1 && server.PopupRequests[0].Body == "{\"probe\":1}", "[51-2] query sends the entered JSON body as-is");
        Check(server.PopupRequests[0].Authorization == "Bearer tok-1" && server.PopupRequests[0].ClientVersion == ClientVersion.Value,
            "[51-4] query uses the login token and the client version header");
        Check(OpenPopups(window).Count == 1, "[51-5] the response popup is shown through PopupManager");
        Check(!((Button)window.FindName("ApiQueryButton")).IsEnabled, "[51-5] query button is disabled while a popup is shown");
        Check(Logs(window).Any(l => l.Contains("deliveryId=DLV-1") && l.Contains("pollingIntervalSeconds=1800") && l.Contains("타이머 미시작")),
            "[51-5] query log shows ids and pollingIntervalSeconds without starting a timer");
        Check(TokenMaskedInDetails(window), "[51-3] login response token is masked in the HTTP log details");
        Check(!((Expander)window.FindName("ApiConnectionExpander")).IsExpanded
              && ((TextBlock)window.FindName("ApiConnectionSummaryText")).Text.Contains(server.BaseUrl)
              && ((TextBlock)window.FindName("ApiConnectionSummaryText")).Text.Contains("토큰 보관")
              && !((TextBlock)window.FindName("ApiConnectionSummaryText")).Text.Contains("tok-1"),
            "[54-6] applied connection collapses its settings and the summary shows target and auth state without the token");
        Check(((TextBlock)window.FindName("RunStateText")).Text.StartsWith("팝업 표시 중"), "[54-8] run state shows the popup is open");
        Check(Logs(window).Any(l => l.Contains("[로그인] POST")) && Logs(window).Any(l => l.Contains("[조회] POST")),
            "[54-7] HTTP log lines are labeled by request kind");

        // 2) 닫기 → 결과 실제 전송, nextStatus=AVAILABLE이어도 자동 다음 조회 없음
        CloseShownPopup(window);
        Pump(() => server.ResultBodies.Count == 1);
        using (JsonDocument result = JsonDocument.Parse(server.ResultBodies[0]))
        {
            Check(result.RootElement.GetProperty("deliveryId").GetString() == "DLV-1"
                  && result.RootElement.GetProperty("popupId").GetString() == "API-TEXT-1"
                  && result.RootElement.GetProperty("resultType").GetString() == "CLOSED",
                "[51-6] CLOSED result is sent with the server popupId/deliveryId");
        }
        Pump(() => Logs(window).Any(l => l.Contains("nextStatus=AVAILABLE") && l.Contains("수동 모드")));
        Pump(() => false, 800);
        Check(server.PopupRequests.Count == 1, "[51-6] AVAILABLE does not start an automatic next query");
        Check(((Button)window.FindName("ApiQueryButton")).IsEnabled, "[51-5] query button is enabled again after close");
        Check(Logs(window).Any(l => l.Contains("[결과] POST")) && ((TextBlock)window.FindName("RunStateText")).Text == "대기",
            "[54-7·8] result request is labeled and the run state returns to idle");

        // 3) 401 → 같은 로그인 본문으로 재로그인 1회 → 같은 요청 재전송
        server.InvalidateToken();
        Query(window);
        Check(server.LoginBodies.Count == 2 && server.PopupRequests.Count == 3
              && server.PopupRequests[1].Authorization == "Bearer tok-1" && server.PopupRequests[2].Authorization == "Bearer tok-2"
              && server.PopupRequests[2].Body == "{\"probe\":1}",
            "[51-7] 401 re-login once and resend the same query body");
        Check(OpenPopups(window).Count == 1, "[51-7] popup is shown after the re-login retry");

        // 4) 결과 전송 실패 → 보관 → 다음 조회 전 같은 resultId·본문 재전송, 미전송이면 조회 보류
        server.ResultMode = "500";
        CloseShownPopup(window);
        Pump(() => server.ResultBodies.Count == 2);
        Pump(() => Logs(window).Any(l => l.Contains("미종결 결과 있음")));
        Check(queue.CountPending() == 1, "[51-7] failed result stays in the connection's in-memory queue");
        int popupRequests = server.PopupRequests.Count;
        Query(window);
        Check(server.ResultBodies.Count == 3 && server.ResultBodies[2] == server.ResultBodies[1],
            "[51-7] retry sends the same resultId and body");
        Check(server.PopupRequests.Count == popupRequests && Logs(window).Any(l => l.Contains("조회하지 않았습니다")),
            "[51-7] query is held while an unsettled result remains");
        server.ResultMode = "ACCEPTED";
        typeof(DemoWindow).GetMethod("ApiFlushButton_Click", Flags)!.Invoke(window, new object?[] { null, new RoutedEventArgs() });
        Pump(() => server.ResultBodies.Count == 4);
        Pump(() => queue.CountPending() == 0);
        Check(server.ResultBodies[3] == server.ResultBodies[1] && queue.CountPending() == 0,
            "[51-7] manual resend uses the same body and settles the queue");

        // 5) 정상 대상 없음·빈 응답·잘못된 JSON·HTTP 500·팝업 생성 오류를 구분해 기록
        foreach ((string mode, string expected) in new[]
                 {
                     ("NULL", "popup=null — 표시 대상 없음(정상)"), ("EMPTY", "빈 응답 본문"), ("INVALID", "잘못된 JSON"),
                     ("500", "HTTP 오류 500"), ("BADTYPE", "[오류] 팝업 생성")
                 })
        {
            server.PopupMode = mode;
            Query(window);
            Check(Logs(window).Any(l => l.Contains(expected)), $"[51-3] {mode} response is logged as '{expected}'");
            Check(OpenPopups(window).Count == 0, $"[51-5] {mode} response shows no popup");
        }

        // 6) 잘못된 입력 JSON은 요청을 보내지 않는다
        int before = server.PopupRequests.Count;
        ((TextBox)window.FindName("ApiQueryBodyText")).Text = "[1,2]";
        Query(window);
        Check(server.PopupRequests.Count == before && Logs(window).Any(l => l.Contains("JSON 객체")), "[51-2] non-object query JSON is not sent");

        // 7) 연결 변경(사용자 변경, 미전송 없음) → 새 메모리 결과 큐
        ((TextBox)window.FindName("ApiQueryBodyText")).Text = "{}";
        ((TextBox)window.FindName("ApiLoginBodyText")).Text = "{\"lgonId\":\"E2002\",\"classCode\":\"A1\",\"linkYn\":\"N\"}";
        server.PopupMode = "NULL";
        Query(window);
        var otherQueue = (PopupResultQueue)typeof(DemoWindow).GetProperty("ApiQueue", Flags)!.GetValue(window)!;
        Check(!ReferenceEquals(otherQueue, queue) && otherQueue.CountPending() == 0
              && server.LoginBodies.Count == 3 && server.LoginBodies[^1].Contains("E2002")
              && server.PopupRequests.All(r => string.IsNullOrEmpty(r.DevUserId)),
            "[51-7] changed connection uses a new in-memory queue and token, and API demo never sends X-Dev-User-Id");
        window.Close();
    }

    private static void Query(DemoWindow window)
    {
        Task task = (Task)typeof(DemoWindow).GetMethod("QueryApiAsync", Flags)!.Invoke(window, null)!;
        Pump(() => task.IsCompleted, 15000);
        task.GetAwaiter().GetResult();
        Pump(() => false, 100);   // 관찰 로그(BeginInvoke) 반영
    }

    private static HashSet<PopupWindow> OpenPopups(DemoWindow window)
    {
        object manager = typeof(DemoWindow).GetField("_popupManager", Flags)!.GetValue(window)!;
        return (HashSet<PopupWindow>)manager.GetType().GetField("_openWindows", Flags)!.GetValue(manager)!;
    }

    private static void CloseShownPopup(DemoWindow window)
    {
        PopupWindow popup = OpenPopups(window).Single();
        Pump(() => false, 200);   // ContentRendered(표시 시각) 반영
        typeof(PopupWindow).GetMethod("CloseByApp", Flags)!.Invoke(popup, null);
        Pump(() => OpenPopups(window).Count == 0);
    }

    private static List<string> Logs(DemoWindow window)
        => ((ListBox)window.FindName("ResultLogList")).Items.Cast<object>().Select(i => i.ToString() ?? string.Empty).ToList();

    private static bool TokenMaskedInDetails(DemoWindow window)
    {
        var details = (Dictionary<int, HttpExchangeRecord>)typeof(DemoWindow).GetField("_httpDetails", Flags)!.GetValue(window)!;
        HttpExchangeRecord login = details.Values.First(r => r.Url.EndsWith("/auth/login"));
        HttpExchangeRecord query = details.Values.First(r => r.Url.EndsWith("/api/wpf/popups"));
        var (_, loginResponse) = login.ToDisplayJson(false);
        var (queryRequest, _) = query.ToDisplayJson(false);
        return !loginResponse.Contains("tok-1") && !queryRequest.Contains("tok-1") && queryRequest.Contains("마스킹");
    }

    private static void Pump(Func<bool> until, int timeoutMs = 8000)
    {
        Stopwatch stopwatch = Stopwatch.StartNew();
        while (!until())
        {
            if (stopwatch.ElapsedMilliseconds > timeoutMs)
            {
                if (timeoutMs >= 1000) throw new TimeoutException("조건 대기 시간 초과");
                return;
            }
            DispatcherFrame frame = new();
            Dispatcher.CurrentDispatcher.BeginInvoke(DispatcherPriority.Background, () => frame.Continue = false);
            Dispatcher.PushFrame(frame);
            Thread.Sleep(10);
        }
    }

    /* 계약서 3.x 형태의 응답만 흉내 내는 로컬 모의 서버. 판정 로직은 없다. */
    private sealed class MockServer : IDisposable
    {
        private readonly HttpListener _listener = new();
        private readonly object _lock = new();
        private int _loginCount;
        private string? _validToken;

        public MockServer()
        {
            int port = FreePort();
            _listener.Prefixes.Add($"http://localhost:{port}/");
            _listener.Start();
            BaseUrl = $"http://localhost:{port}/p";
            _ = Task.Run(LoopAsync);
        }

        public string BaseUrl { get; }
        public List<string> LoginBodies { get; } = new();
        public List<(string Body, string? Authorization, string? ClientVersion, string? DevUserId)> PopupRequests { get; } = new();
        public List<string> ResultBodies { get; } = new();
        public volatile string PopupMode = "TEXT";
        public volatile string ResultMode = "ACCEPTED";
        public volatile string CredentialMode = "OK";
        public List<string> CredentialBodies { get; } = new();
        public string? ValidToken { get { lock (_lock) return _validToken; } }
        public volatile string SsoLoginMode = "HEADER";
        public List<string> SsoLoginBodies { get; } = new();
        public int SsoGetCount;

        public void InvalidateToken()
        {
            lock (_lock) _validToken = null;
        }

        private async Task LoopAsync()
        {
            while (_listener.IsListening)
            {
                HttpListenerContext context;
                try { context = await _listener.GetContextAsync(); }
                catch { return; }
                try { Handle(context); }
                catch (Exception exception) { Console.Error.WriteLine("mock server: " + exception); }
            }
        }

        private void Handle(HttpListenerContext context)
        {
            string body = new StreamReader(context.Request.InputStream, Encoding.UTF8).ReadToEnd();
            string path = context.Request.Url!.AbsolutePath;
            string authorization = context.Request.Headers["Authorization"] ?? string.Empty;
            switch (path)
            {
                case "/p/api/wpf/auth/login":
                    lock (_lock)
                    {
                        LoginBodies.Add(body);
                        _loginCount++;
                        _validToken = $"tok-{_loginCount}";
                        Write(context, 200, JsonSerializer.Serialize(new
                        {
                            accessToken = _validToken, tokenType = "Bearer", expiresAt = DateTimeOffset.Now.AddMinutes(10)
                        }));
                    }
                    return;
                case "/p/sso":
                    Interlocked.Increment(ref SsoGetCount);
                    context.Response.StatusCode = 200;
                    context.Response.ContentType = "text/xml";
                    byte[] xml = Encoding.UTF8.GetBytes("<RESULT><MAIN_USER_ID>E1001</MAIN_USER_ID><MAIN_USER_CLASSI_CODE>A1</MAIN_USER_CLASSI_CODE></RESULT>");
                    context.Response.OutputStream.Write(xml);
                    context.Response.Close();
                    return;
                case "/p/api/auth/sso/login":
                    {
                        string token;
                        lock (_lock)
                        {
                            SsoLoginBodies.Add(body);
                            _loginCount++;
                            token = $"sso-{_loginCount}";
                            if (SsoLoginMode is "HEADER" or "BOTH" or "BEARER" or "BODY") _validToken = token;
                        }
                        string headerValue = SsoLoginMode == "BEARER" ? "Bearer " + token : token;
                        if (SsoLoginMode is "HEADER" or "BOTH" or "BEARER") context.Response.Headers["x-custom-authorization"] = headerValue;
                        switch (SsoLoginMode)
                        {
                            case "BOTH": Write(context, 200, "{\"accessToken\":\"body-token\"}"); return;
                            case "BODY": Write(context, 200, JsonSerializer.Serialize(new { accessToken = token, tokenType = "Bearer", expiresAt = DateTimeOffset.Now.AddMinutes(10) })); return;
                            case "EMPTY": Write(context, 200, string.Empty); return;
                            case "INVALID": Write(context, 200, "<html>"); return;
                            case "NONE": Write(context, 200, "{\"msgId\":\"FW00000009\",\"msgCn\":\"fail\"}"); return;
                            default: Write(context, 200, "{\"msgId\":\"BE00000006\",\"body\":{\"profile\":{}}}"); return;
                        }
                    }
                case "/p/api/demo/login":
                    lock (_lock) CredentialBodies.Add(body);
                    if (CredentialMode == "500") { Write(context, 500, "{}"); return; }
                    using (JsonDocument login = JsonDocument.Parse(body))
                    {
                        if (CredentialMode == "OK" && login.RootElement.GetProperty("lgonId").GetString() != "wrong-user")
                        {
                            lock (_lock)
                            {
                                _loginCount++;
                                _validToken = $"cred-{_loginCount}";
                                context.Response.Headers["x-custom-authorization"] = _validToken;
                            }
                            Write(context, 200, "{\"msgId\":\"BE00000006\"}");
                        }
                        else if (CredentialMode == "NO_TOKEN") Write(context, 200, "{}");
                        else Write(context, 200, "{\"msgId\":\"FW00000009\",\"msgCn\":\"mismatch\"}");
                    }
                    return;
                case "/p/api/wpf/popups":
                    lock (_lock)
                    {
                        PopupRequests.Add((body, context.Request.Headers["Authorization"], context.Request.Headers[ClientVersion.HeaderName],
                            context.Request.Headers["X-Dev-User-Id"]));
                        if (_validToken == null || authorization != "Bearer " + _validToken)
                        {
                            Write(context, 401, "{\"code\":\"WPF_UNAUTHORIZED\",\"message\":\"token expired\"}");
                            return;
                        }
                    }
                    switch (PopupMode)
                    {
                        case "NULL": Write(context, 200, "{\"pollingIntervalSeconds\":1800,\"popup\":null}"); return;
                        case "EMPTY": Write(context, 200, string.Empty); return;
                        case "INVALID": Write(context, 200, "{\"popup\": {"); return;
                        case "500": Write(context, 500, "{\"code\":\"WPF_INTERNAL\",\"message\":\"boom\"}"); return;
                        default: Write(context, 200, PopupJson(PopupMode == "BADTYPE" ? "UNKNOWN_TYPE" : null)); return;
                    }
                case "/p/api/wpf/popups/results":
                    lock (_lock) ResultBodies.Add(body);
                    if (ResultMode == "500")
                    {
                        Write(context, 500, "{\"code\":\"WPF_INTERNAL\",\"message\":\"down\"}");
                        return;
                    }
                    string resultId = JsonDocument.Parse(body).RootElement.GetProperty("resultId").GetString()!;
                    Write(context, 200, JsonSerializer.Serialize(new { resultId, status = "ACCEPTED", nextStatus = "AVAILABLE" }));
                    return;
                default:
                    Write(context, 404, string.Empty);
                    return;
            }
        }

        private static string PopupJson(string? overrideType)
        {
            PopupResponseDto popup = DemoPopupDataService.CreatePopups().First(p => p.PopupType == "TEXT");
            popup.PopupId = "API-TEXT-1";
            popup.DeliveryId = "DLV-1";
            popup.UseBackgroundOverlay = false;
            if (overrideType != null) popup.PopupType = overrideType;
            return JsonSerializer.Serialize(new { pollingIntervalSeconds = 1800, popup },
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
        }

        private static void Write(HttpListenerContext context, int status, string body)
        {
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/json";
            byte[] bytes = Encoding.UTF8.GetBytes(body);
            context.Response.ContentLength64 = bytes.Length;
            context.Response.OutputStream.Write(bytes);
            context.Response.Close();
        }

        private static int FreePort()
        {
            var listener = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            int port = ((IPEndPoint)listener.LocalEndpoint).Port;
            listener.Stop();
            return port;
        }

        public void Dispose()
        {
            _listener.Stop();
            _listener.Close();
        }
    }
}
