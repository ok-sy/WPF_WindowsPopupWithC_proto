using System;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using System.Xml.Linq;

namespace Popup.Services.Auth
{
    /// <summary>사내 SSO XML에서 읽은 사용자 식별값. 서버 로그인 API의 입력이 된다.</summary>
    public sealed record SsoUserInfo(string LogonId, string ClassCode);

    /*
     * [역할 — 설계 10 §5.1] 사내 SSO 주소를 Windows 통합 인증(Negotiate/Kerberos·NTLM)으로 GET 하고,
     * 응답 XML에서 MAIN_USER_ID(사번)·MAIN_USER_CLASSI_CODE(사용자 구분)를 꺼낸다.
     *
     * [추가 이유] curl.exe --negotiate -u : SSO_URL 이 정상 동작함을 확인했으므로 브라우저 쿠키·WebView2 로그인 화면
     * 없이 Windows 로그인 사용자의 자격 증명으로 SSO 정보를 얻는다. C#에서는 HttpClientHandler.UseDefaultCredentials = true
     * 가 같은 역할을 한다(서버가 WWW-Authenticate: Negotiate 로 도전하면 현재 로그인 계정으로 응답).
     *
     * [규칙] 로그인 UI를 띄우지 않는다. SSO 실패(401·네트워크 오류·태그 없음)는 예외로 알리고 호출자가 다음 조회에서 재시도한다.
     * 태그 이름은 대소문자·XML 네임스페이스와 무관하게 찾는다(SSO 응답 규격이 확정되면 여기만 손본다).
     */
    public sealed class SsoClient
    {
        public const string UserIdTag = "MAIN_USER_ID";
        public const string ClassCodeTag = "MAIN_USER_CLASSI_CODE";

        private readonly Uri _ssoUrl;

        /*
         * Windows 통합 인증용 HttpClient. UseDefaultCredentials = true 가 핵심이다.
         * PopupApiService의 HttpClient와 분리한다(그쪽은 자격 증명을 절대 보내지 않고 Bearer 토큰만 붙인다).
         */
        private readonly HttpClient _httpClient;

        public SsoClient(string ssoUrl, TimeSpan? timeout = null)
        {
            if (string.IsNullOrWhiteSpace(ssoUrl) || !Uri.TryCreate(ssoUrl.Trim(), UriKind.Absolute, out Uri? uri))
            {
                throw new ArgumentException("PopupApi.Auth.SsoUrl 값이 비어 있거나 절대 URL이 아닙니다.", nameof(ssoUrl));
            }
            _ssoUrl = uri;

            HttpClientHandler handler = new()
            {
                UseDefaultCredentials = true,      // Windows 로그인 사용자 자격 증명으로 Negotiate 응답
                PreAuthenticate = true,            // 한 번 도전받은 뒤에는 처음부터 인증 헤더를 보낸다
                AllowAutoRedirect = true
            };
            _httpClient = new HttpClient(handler)
            {
                Timeout = timeout ?? TimeSpan.FromSeconds(10)
            };
        }

        public Uri SsoUrl => _ssoUrl;

        /// <summary>SSO를 호출해 사용자 식별값을 얻는다. 실패하면 예외(HttpRequestException·InvalidOperationException 등).</summary>
        public async Task<SsoUserInfo> GetUserAsync(CancellationToken cancellationToken = default)
        {
            Stopwatch stopwatch = Stopwatch.StartNew();
            using HttpResponseMessage response = await _httpClient.GetAsync(_ssoUrl, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"SSO 호출 실패: {(int)response.StatusCode} {response.ReasonPhrase} ({_ssoUrl})",
                    null,
                    response.StatusCode);
            }

            string xml = await response.Content.ReadAsStringAsync(cancellationToken);
            SsoUserInfo user = Parse(xml);
            Debug.WriteLine($"[SSO] {_ssoUrl.Host} → logonId={user.LogonId} classCode={user.ClassCode} ({stopwatch.ElapsedMilliseconds}ms)");
            return user;
        }

        /// <summary>
        /// SSO XML → SsoUserInfo. 태그 이름은 대소문자·네임스페이스를 무시하고 문서 전체에서 찾는다.
        /// 필수 태그가 없거나 비어 있으면 InvalidOperationException.
        /// </summary>
        public static SsoUserInfo Parse(string xml)
        {
            if (string.IsNullOrWhiteSpace(xml))
            {
                throw new InvalidOperationException("SSO 응답 본문이 비어 있습니다.");
            }

            XDocument document;
            try
            {
                document = XDocument.Parse(xml);
            }
            catch (System.Xml.XmlException exception)
            {
                throw new InvalidOperationException("SSO 응답이 XML 형식이 아닙니다: " + exception.Message, exception);
            }

            string logonId = ReadRequired(document, UserIdTag);
            string classCode = ReadRequired(document, ClassCodeTag);
            return new SsoUserInfo(logonId, classCode);
        }

        private static string ReadRequired(XDocument document, string tagName)
        {
            string? value = document.Descendants()
                .Where(element => string.Equals(element.Name.LocalName, tagName, StringComparison.OrdinalIgnoreCase))
                .Select(element => element.Value?.Trim())
                .FirstOrDefault(text => !string.IsNullOrEmpty(text));

            return value ?? throw new InvalidOperationException($"SSO 응답에 {tagName} 태그가 없거나 비어 있습니다.");
        }
    }
}
