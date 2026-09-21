using System;
using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Popup.Services.Auth
{
    /// <summary>POST {BaseUrl}{LoginPath} 요청 본문. 필드명은 서버 WpfLoginRequest(camelCase)와 같다.</summary>
    public sealed class WpfLoginRequestDto
    {
        public string LogonId { get; set; } = string.Empty;
        public string ClassCode { get; set; } = string.Empty;
        public string LinkYn { get; set; } = "N";
    }

    /// <summary>로그인 응답. accessToken은 메모리에만 보관한다(설계 10 §5.3).</summary>
    public sealed class WpfLoginResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string TokenType { get; set; } = "Bearer";
        public DateTimeOffset ExpiresAt { get; set; }
    }

    /*
     * [역할 — 설계 10 §5.2] SsoClient가 얻은 사용자 식별값을 Zero 서버 프로토타입 로그인 API
     * (POST /p/api/wpf/auth/login)에 보내고 { accessToken, tokenType, expiresAt } 를 받는다.
     *
     * [추가 이유] 토큰 획득 방법을 PopupApiService에서 분리한다. PopupApiService는 IAuthHeaderProvider가 준 헤더 값만
     * 붙이고, 이 클래스는 로그인 API만 안다. 운영 전환 시(타 팀 통합 토큰) 이 클래스와 SsoAuthHeaderProvider만 바뀐다.
     *
     * [규칙] 이 HttpClient에는 Windows 자격 증명을 붙이지 않는다(UseDefaultCredentials 기본 false). 응답 토큰을 로그에 적지 않는다.
     */
    public sealed class WpfLoginClient
    {
        private static readonly HttpClient HttpClient = new()
        {
            Timeout = TimeSpan.FromSeconds(10)
        };

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        private readonly string _loginUrl;

        /// <param name="baseUrl">PopupApi.BaseUrl (예: http://localhost:8080/zero-rule-server/p)</param>
        /// <param name="loginPath">PopupApi.Auth.LoginPath (기본 /api/wpf/auth/login)</param>
        public WpfLoginClient(string baseUrl, string? loginPath)
        {
            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                throw new ArgumentException("팝업 API 주소가 필요합니다.", nameof(baseUrl));
            }
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

            Stopwatch stopwatch = Stopwatch.StartNew();
            using HttpResponseMessage response = await HttpClient.PostAsJsonAsync(_loginUrl, request, JsonOptions, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                string errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new HttpRequestException(
                    $"WPF 로그인 API 실패: {(int)response.StatusCode} {response.ReasonPhrase}\n{errorBody}",
                    null,
                    response.StatusCode);
            }

            WpfLoginResponseDto? body = await response.Content.ReadFromJsonAsync<WpfLoginResponseDto>(JsonOptions, cancellationToken);
            if (body == null || string.IsNullOrWhiteSpace(body.AccessToken))
            {
                throw new InvalidOperationException("WPF 로그인 API 응답에 accessToken이 없습니다.");
            }

            Debug.WriteLine($"[WPF-LOGIN] logonId={user.LogonId} expiresAt={body.ExpiresAt:O} ({stopwatch.ElapsedMilliseconds}ms)");
            return body;
        }
    }
}
