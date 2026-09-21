using System.Net;
using System.Security.Principal;
using System.Text;

/*
 * [설계 10 — 로컬 검증용] 사내 SSO 임시(모의) 서버.
 *
 * 역할: WPF SsoClient(HttpClientHandler.UseDefaultCredentials = true)가 GET 하는 SSO 주소를 흉내 낸다.
 *   1) 기본은 실제 SSO처럼 Windows 통합 인증(Negotiate) 도전을 한다 → WPF가 현재 로그인 계정으로 응답하는 경로까지 검증.
 *      (--anonymous 를 주면 도전 없이 200)
 *   2) 응답은 MAIN_USER_ID(사번)·MAIN_USER_CLASSI_CODE(사용자 구분) 태그를 담은 XML.
 *      값은 인자(--user / --class)로 지정하며 기본 E1001 / A1 (db/oracle/02 샘플 사용자).
 *      --user windows 이면 인증된 Windows 계정 이름(DOMAIN\name 의 name)을 사번으로 돌려준다.
 *   3) --fail 이면 모든 요청에 401 (WPF T7 "SSO 실패 시 로그인 UI 없이 다음 조회에서 재시도" 확인용).
 *
 * 사용자 진위 검증이 없는 프로토타입 전용이며 운영·개발 서버에 배포하지 않는다. 외부 패키지 없음.
 *
 * 실행 예:
 *   dotnet run --project popup-frameWork/MockSso                        → http://localhost:8099/  (어떤 경로든 같은 XML)
 *   dotnet run --project popup-frameWork/MockSso -- --port 8099 --user E1001 --class A1
 *   dotnet run --project popup-frameWork/MockSso -- --anonymous          (Negotiate 도전 없이 200)
 *   dotnet run --project popup-frameWork/MockSso -- --fail               (항상 401)
 * 확인:  curl.exe -v --negotiate -u : http://localhost:8099/sso/encriptloginprocess.aspx
 * WPF appsettings: "Auth": { "Mode": "SsoPrototype", "SsoUrl": "http://localhost:8099/sso/encriptloginprocess.aspx" }
 *
 * 참고: HttpListener는 관리자가 아니면 URL 예약이 필요할 수 있다.
 *   netsh http add urlacl url=http://localhost:8099/ user=%USERDOMAIN%\%USERNAME%
 */

int port = 8099;
string userId = "E1001";
string classCode = "A1";
bool anonymous = false;
bool fail = false;

for (int i = 0; i < args.Length; i++)
{
    switch (args[i].ToLowerInvariant())
    {
        case "--port": port = int.Parse(args[++i]); break;
        case "--user": userId = args[++i]; break;
        case "--class": classCode = args[++i]; break;
        case "--anonymous": anonymous = true; break;
        case "--fail": fail = true; break;
        case "-h":
        case "--help":
            Console.WriteLine("MockSso [--port 8099] [--user E1001|windows] [--class A1] [--anonymous] [--fail]");
            return 0;
        default:
            Console.Error.WriteLine($"unknown argument: {args[i]}");
            return 2;
    }
}

using HttpListener listener = new();
listener.Prefixes.Add($"http://localhost:{port}/");
// 실제 SSO와 같이 Negotiate(Kerberos/NTLM) 도전. --anonymous 이면 도전 없음.
listener.AuthenticationSchemes = anonymous ? AuthenticationSchemes.Anonymous : AuthenticationSchemes.Negotiate;

try
{
    listener.Start();
}
catch (HttpListenerException exception)
{
    Console.Error.WriteLine($"listen failed on http://localhost:{port}/ : {exception.Message}");
    Console.Error.WriteLine("관리자 권한으로 실행하거나 netsh http add urlacl 로 URL을 예약하십시오.");
    return 1;
}

Console.WriteLine($"mock SSO listening on http://localhost:{port}/  (auth={(anonymous ? "anonymous" : "Negotiate")}, user={userId}, class={classCode}, fail={fail})");
Console.WriteLine("Ctrl+C 로 종료");

using CancellationTokenSource cts = new();
Console.CancelKeyPress += (_, e) => { e.Cancel = true; cts.Cancel(); listener.Stop(); };

while (!cts.IsCancellationRequested)
{
    HttpListenerContext context;
    try
    {
        context = await listener.GetContextAsync();
    }
    catch (Exception) when (cts.IsCancellationRequested)
    {
        break;
    }
    catch (HttpListenerException exception)
    {
        Console.Error.WriteLine($"accept error: {exception.Message}");
        continue;
    }

    _ = Task.Run(() => Handle(context));
}

Console.WriteLine("mock SSO stopped");
return 0;

void Handle(HttpListenerContext context)
{
    HttpListenerRequest request = context.Request;
    HttpListenerResponse response = context.Response;
    string stamp = DateTime.Now.ToString("HH:mm:ss.fff");
    string windowsUser = context.User?.Identity?.Name ?? "(anonymous)";
    string authType = context.User?.Identity?.AuthenticationType ?? "-";

    try
    {
        if (fail)
        {
            Console.WriteLine($"{stamp} {request.HttpMethod} {request.RawUrl} -> 401 (--fail) windowsUser={windowsUser}");
            response.StatusCode = 401;
            response.AddHeader("WWW-Authenticate", "Negotiate");
            WriteText(response, "text/plain; charset=utf-8", "Unauthorized");
            return;
        }

        string effectiveUserId = userId;
        if (string.Equals(userId, "windows", StringComparison.OrdinalIgnoreCase))
        {
            // DOMAIN\name → name. 인증되지 않았으면(anonymous) 빈 값 → WPF 쪽 "태그 비어 있음" 오류 경로 확인용.
            int slash = windowsUser.LastIndexOf('\\');
            effectiveUserId = windowsUser == "(anonymous)" ? "" : (slash >= 0 ? windowsUser[(slash + 1)..] : windowsUser);
        }

        // 실제 SSO 응답 규격이 확정되면 이 XML 형태를 맞춘다. WPF SsoClient는 태그 이름을 대소문자·네임스페이스 무시로 찾는다.
        string xml = new StringBuilder()
            .AppendLine("<?xml version=\"1.0\" encoding=\"utf-8\"?>")
            .AppendLine("<ROOT>")
            .AppendLine("  <RESULT>SUCCESS</RESULT>")
            .AppendLine($"  <MAIN_USER_ID>{Escape(effectiveUserId)}</MAIN_USER_ID>")
            .AppendLine($"  <MAIN_USER_CLASSI_CODE>{Escape(classCode)}</MAIN_USER_CLASSI_CODE>")
            .AppendLine($"  <WINDOWS_USER>{Escape(windowsUser)}</WINDOWS_USER>")
            .AppendLine($"  <AUTH_TYPE>{Escape(authType)}</AUTH_TYPE>")
            .AppendLine($"  <SERVER_TIME>{DateTimeOffset.Now:O}</SERVER_TIME>")
            .AppendLine("</ROOT>")
            .ToString();

        Console.WriteLine($"{stamp} {request.HttpMethod} {request.RawUrl} -> 200 MAIN_USER_ID={effectiveUserId} MAIN_USER_CLASSI_CODE={classCode} windowsUser={windowsUser} auth={authType}");
        response.StatusCode = 200;
        WriteText(response, "text/xml; charset=utf-8", xml);
    }
    catch (Exception exception)
    {
        Console.Error.WriteLine($"{stamp} handler error: {exception.Message}");
        try { response.StatusCode = 500; response.Close(); } catch { /* ignore */ }
    }
}

static void WriteText(HttpListenerResponse response, string contentType, string body)
{
    byte[] bytes = Encoding.UTF8.GetBytes(body);
    response.ContentType = contentType;
    response.ContentLength64 = bytes.Length;
    response.OutputStream.Write(bytes, 0, bytes.Length);
    response.Close();
}

static string Escape(string value)
    => value.Replace("&", "&amp;").Replace("<", "&lt;").Replace(">", "&gt;");
