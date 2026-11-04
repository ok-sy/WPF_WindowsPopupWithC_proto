using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Popup.Services.Auth
{
    /// <summary>ID/비밀번호 로그인 실패. 서버가 200으로 돌려준 업무 오류와 토큰 누락을 HTTP 오류와 구분한다.</summary>
    public sealed class DemoCredentialLoginException : Exception
    {
        public DemoCredentialLoginException(string message) : base(message) { }
    }

    /*
     * POL-14-02 : Demo 모드
     * POL-15-02 : 인증·버전
     * ■ API Demo 일반 로그인 클라이언트
     * - in : baseUrl(string) · loginPath(string?, 기본 /api/auth/login) · LoginAsync(lgonId, passwd)
     * - out: WpfLoginResponseDto(AccessToken = 응답 헤더의 토큰) · 실패는 DemoCredentialLoginException·HttpRequestException·WpfClientVersionException
     * - 관리자 웹과 같은 일반 로그인 POST /p/api/auth/login을 호출한다. 이 API는 토큰을 본문이 아니라 응답 헤더
     *   x-custom-authorization으로 주고, 실패도 HTTP 200 + 업무 메시지(msgId·msgCn)로 돌려준다. 그래서 성공은 헤더의
     *   토큰 유무로만 판단한다. 본문 메시지 코드는 환경의 메시지 데이터에 따라 달라지므로 성공 판단에 쓰지 않는다.
     * [경계] API Demo 전용이다. 일반 실행의 SSO·프로토타입 로그인(WpfLoginClient)과 섞지 않는다.
     * [규칙] 비밀번호와 토큰을 로그·예외 문구에 넣지 않는다. 비밀번호를 파일·설정에 저장하지 않는다.
     */
    public sealed class DemoCredentialLoginClient
    {
        public const string DefaultLoginPath = "/api/auth/login";
        public const string TokenHeaderName = "x-custom-authorization";
        private const string BearerPrefix = "Bearer ";

        private readonly HttpClient _httpClient;

        public DemoCredentialLoginClient(string baseUrl, string? loginPath, HttpClient httpClient)
        {
            if (string.IsNullOrWhiteSpace(baseUrl)) throw new ArgumentException("팝업 API 주소가 필요합니다.", nameof(baseUrl));
            ArgumentNullException.ThrowIfNull(httpClient);
            _httpClient = httpClient;
            string path = string.IsNullOrWhiteSpace(loginPath) ? DefaultLoginPath : loginPath.Trim();
            LoginUrl = baseUrl.Trim().TrimEnd('/') + "/" + path.TrimStart('/');
        }

        public string LoginUrl { get; }

        public async Task<WpfLoginResponseDto> LoginAsync(string logonId, string password, CancellationToken cancellationToken = default)
        {
            using HttpRequestMessage request = new(HttpMethod.Post, LoginUrl)
            {
                Content = JsonContent.Create(new { lgonId = logonId, passwd = password })
            };
            request.Headers.TryAddWithoutValidation(ClientVersion.HeaderName, ClientVersion.Value);

            using HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken);
            string body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                WpfClientVersionException? versionException = WpfClientVersionException.TryCreate(response, body);
                if (versionException != null) throw versionException;
                throw new HttpRequestException($"로그인 API 실패: {(int)response.StatusCode} {response.ReasonPhrase}", null, response.StatusCode);
            }

            string? token = null;
            if (response.Headers.TryGetValues(TokenHeaderName, out var values))
            {
                foreach (string value in values)
                {
                    if (!string.IsNullOrWhiteSpace(value)) { token = value.Trim(); break; }
                }
            }
            if (token == null) throw new DemoCredentialLoginException(DescribeFailure(body));
            if (token.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase)) token = token[BearerPrefix.Length..].Trim();
            return new WpfLoginResponseDto { AccessToken = token, TokenType = "Bearer" };
        }

        /// <summary>토큰이 없는 응답의 안내 문구. JSON이 아니면 형식이 맞지 않는다고 알려 준다.</summary>
        internal static string DescribeFailure(string? body)
        {
            const string NoToken = $"응답 헤더 {TokenHeaderName}에 토큰이 없습니다";
            if (string.IsNullOrWhiteSpace(body)) return NoToken + "(빈 응답).";
            try
            {
                using JsonDocument document = JsonDocument.Parse(body);
                if (document.RootElement.ValueKind != JsonValueKind.Object) return NoToken + "(응답 형식 불일치).";
                string? id = Text(document.RootElement, "msgId");
                string? message = Text(document.RootElement, "msgCn");
                return id == null && message == null
                    ? NoToken + "(응답 형식 불일치)."
                    : $"{NoToken}. 아이디·비밀번호 또는 계정 권한을 확인하세요(서버 응답 {id} {message}).";
            }
            catch (JsonException)
            {
                return NoToken + "(JSON이 아닌 응답).";
            }
        }

        private static string? Text(JsonElement element, string name)
            => element.TryGetProperty(name, out JsonElement value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }
}
