using System;
using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;

namespace Popup.Services.Auth
{
    /// <summary>
    /// POST {BaseUrl}{LoginPath} 요청 본문. 전송 키는 폐쇄망 로그인 API(p/api/auth/sso/login) 요청 DTO와 같은
    /// lgonId·classCode·linkYn이다. C# 속성 이름(LogonId)은 내부 이름이라 바꾸지 않고 전송 키만 지정한다.
    /// </summary>
    public sealed class WpfLoginRequestDto
    {
        [JsonPropertyName("lgonId")]
        public string LogonId { get; set; } = string.Empty;
        public string ClassCode { get; set; } = string.Empty;
        public string LinkYn { get; set; } = "N";
    }

    /// <summary>로그인 응답. accessToken은 메모리에만 보관한다.</summary>
    public sealed class WpfLoginResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string TokenType { get; set; } = "Bearer";
        public DateTimeOffset ExpiresAt { get; set; }
    }

    /// <summary>2xx 응답이지만 토큰이 없는 로그인 실패. 폐쇄망 로그인은 실패도 HTTP 200과 업무 메시지로 돌려줄 수 있다.</summary>
    public sealed class WpfLoginFailedException : InvalidOperationException
    {
        public WpfLoginFailedException(string message) : base(message) { }
    }

    /*
     * POL-15-02 : 인증·버전
     * ■ WPF 로그인 API 클라이언트
     * - in : baseUrl(string) PopupApi.BaseUrl · loginPath(string?, 기본 /api/wpf/auth/login) · httpClient(HttpClient?)
     * - out: LoginAsync → WpfLoginResponseDto · 예외: WpfClientVersionException(426), HttpRequestException(비성공), WpfLoginFailedException(accessToken 없음)
     * - [역할] SsoClient가 얻은 사용자 식별값을 Zero 서버 프로토타입 로그인 API
     * (POST /p/api/wpf/auth/login)에 보내고 { accessToken, tokenType, expiresAt } 를 받는다.
     *
     * [추가 이유] 토큰 획득 방법을 PopupApiService에서 분리한다. PopupApiService는 IAuthHeaderProvider가 준 헤더 값만
     * 붙이고, 이 클래스는 로그인 API만 안다. 운영 전환 시(타 팀 통합 토큰) 이 클래스와 SsoAuthHeaderProvider만 바뀐다.
     *
     * [토큰 위치] 응답 헤더 x-custom-authorization을 먼저 읽고, 없으면 본문 accessToken을 쓴다.
     *   - 폐쇄망 p/api/auth/sso/login: 본문은 프로필 메시지이고 토큰은 헤더로 온다. 실패도 HTTP 200일 수 있다.
     *   - 로컬 프로토타입 p/api/wpf/auth/login: 본문 { accessToken, tokenType, expiresAt }.
     *   헤더 토큰은 만료 시각을 주지 않으므로 ExpiresAt은 기본값이다. 갱신은 401 재로그인과 정기 재로그인이 맡고 만료 시각으로 판단하지 않는다.
     *
     * [규칙] 이 HttpClient에는 Windows 자격 증명을 붙이지 않는다(UseDefaultCredentials 기본 false). 응답 토큰을 로그에 적지 않는다.
     */
    public sealed class WpfLoginClient
    {
        // [변경 지점] 서버 custom.auth-header.user-refresh-token-header를 바꾸면 이 값과 관리자 웹 HTTP_TOKEN_HEADER도 함께 바꾼다.
        /// <summary>토큰을 담는 응답 헤더(서버 custom.auth-header.user-refresh-token-header).</summary>
        public const string TokenHeaderName = "x-custom-authorization";
        private const string BearerPrefix = "Bearer ";

        private static readonly HttpClient HttpClient = new()
        {
            // [변경 지점] 로그인 요청 제한 시간. 설정값이 아니라 코드 상수다.
            Timeout = TimeSpan.FromSeconds(10)
        };

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private readonly string _loginUrl;
        private readonly HttpClient _httpClient;

        /// <param name="baseUrl">PopupApi.BaseUrl (예: http://localhost:8080/zero-rule-server/p)</param>
        /// <param name="loginPath">PopupApi.Auth.LoginPath (기본 /api/wpf/auth/login)</param>
        public WpfLoginClient(string baseUrl, string? loginPath, HttpClient? httpClient = null)
        {
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                throw new ArgumentException("팝업 API 주소가 필요합니다.", nameof(baseUrl));
            }
            _httpClient = httpClient ?? HttpClient;
            // [변경 지점] 기본 로그인 경로. 환경별 값은 appsettings Auth.LoginPath로 지정한다(폐쇄망 /api/auth/sso/login).
            string path = string.IsNullOrWhiteSpace(loginPath) ? "/api/wpf/auth/login" : loginPath.Trim();
            _loginUrl = baseUrl.Trim().TrimEnd('/') + "/" + path.TrimStart('/');
        }

        public string LoginUrl => _loginUrl;

        /// <summary>로그인 API를 호출한다. 2xx가 아니거나 본문에 accessToken이 없으면 예외.</summary>
        public async Task<WpfLoginResponseDto> LoginAsync(SsoUserInfo user, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(user);

            WpfLoginRequestDto request = new()
            {
                LogonId = user.LogonId,
                ClassCode = user.ClassCode,
                LinkYn = "N"
            };
            return await SendLoginAsync(request, user.LogonId, cancellationToken);
        }

        /// <summary>
        /// POL-14-02 : Demo 모드 — API Demo 전용. 입력한 로그인 요청 JSON 객체를 본문으로 그대로 보낸다. 버전 헤더·426·응답 검증은 위와 같다.
        /// </summary>
        public Task<WpfLoginResponseDto> LoginAsync(JsonElement requestBody, CancellationToken cancellationToken = default)
        {
            if (requestBody.ValueKind != JsonValueKind.Object)
                throw new ArgumentException("로그인 요청 본문은 JSON 객체여야 합니다.", nameof(requestBody));
            string logonId = requestBody.TryGetProperty("lgonId", out JsonElement value) && value.ValueKind == JsonValueKind.String
                ? value.GetString() ?? string.Empty : "(미입력)";
            return SendLoginAsync(requestBody, logonId, cancellationToken);
        }

        private async Task<WpfLoginResponseDto> SendLoginAsync(object request, string logonIdForLog, CancellationToken cancellationToken)
        {
            Stopwatch stopwatch = Stopwatch.StartNew();
            /*
             * POL-15-02 : 인증·버전
             * 로그인(최초 서버 접점)에도 X-Client-Version을 보낸다. 서버가 로그인 경로까지 검사하면(저장소 서버는 /p/api/wpf/**만 검사해
             * 프로토타입 로그인만 해당, /p/api/auth/sso/login은 첫 팝업 조회에서 426) 지원 종료 버전은 토큰 발급 전에 426으로
             * 차단되어 이후 팝업 조회가 시작되지 않는다. 426은 WpfClientVersionException으로 구분해 던진다(재로그인 금지).
             */
            using HttpRequestMessage httpRequest = new(HttpMethod.Post, _loginUrl)
            {
                Content = JsonContent.Create(request, options: JsonOptions)
            };
            httpRequest.Headers.TryAddWithoutValidation(ClientVersion.HeaderName, ClientVersion.Value);

            using HttpResponseMessage response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                string errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                WpfClientVersionException? versionException = WpfClientVersionException.TryCreate(response, errorBody);
                if (versionException != null)
                {
                    throw versionException;
                }
                throw new HttpRequestException(
                    $"WPF 로그인 API 실패: {(int)response.StatusCode} {response.ReasonPhrase}\n{errorBody}",
                    null,
                    response.StatusCode);
            }

            string responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            WpfLoginResponseDto body = ReadToken(response, responseBody)
                ?? throw new WpfLoginFailedException(DescribeFailure(responseBody));

            Debug.WriteLine($"[WPF-LOGIN] lgonId={logonIdForLog} expiresAt={body.ExpiresAt:O} ({stopwatch.ElapsedMilliseconds}ms)");
            return body;
        }

        /* 헤더 토큰 우선, 없으면 본문 accessToken. 둘 다 없으면 null. */
        private static WpfLoginResponseDto? ReadToken(HttpResponseMessage response, string responseBody)
        {
            if (response.Headers.TryGetValues(TokenHeaderName, out var values))
            {
                foreach (string value in values)
                {
                    if (string.IsNullOrWhiteSpace(value)) continue;
                    string token = value.Trim();
                    if (token.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase)) token = token[BearerPrefix.Length..].Trim();
                    if (token.Length > 0) return new WpfLoginResponseDto { AccessToken = token, TokenType = "Bearer" };
                }
            }
            try
            {
                WpfLoginResponseDto? body = string.IsNullOrWhiteSpace(responseBody) ? null : JsonSerializer.Deserialize<WpfLoginResponseDto>(responseBody, JsonOptions);
                return body == null || string.IsNullOrWhiteSpace(body.AccessToken) ? null : body;
            }
            catch (JsonException)
            {
                return null;
            }
        }

        /// <summary>토큰이 없는 2xx 응답의 안내 문구. 토큰을 담지 않는다.</summary>
        internal static string DescribeFailure(string? body)
        {
            const string NoToken = $"로그인 응답에 토큰이 없습니다(헤더 {TokenHeaderName}, 본문 accessToken)";
            if (string.IsNullOrWhiteSpace(body)) return NoToken + " — 빈 응답.";
            try
            {
                using JsonDocument document = JsonDocument.Parse(body);
                if (document.RootElement.ValueKind != JsonValueKind.Object) return NoToken + " — 응답 형식 불일치.";
                string? id = Text(document.RootElement, "msgId");
                string? message = Text(document.RootElement, "msgCn");
                return id == null && message == null
                    ? NoToken + " — 응답 형식 불일치."
                    : $"{NoToken}. 입력값 또는 계정 권한을 확인하세요(서버 응답 {id} {message}).";
            }
            catch (JsonException)
            {
                return NoToken + " — JSON이 아닌 응답.";
            }
        }

        private static string? Text(JsonElement element, string name)
            => element.TryGetProperty(name, out JsonElement value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;
    }
}
