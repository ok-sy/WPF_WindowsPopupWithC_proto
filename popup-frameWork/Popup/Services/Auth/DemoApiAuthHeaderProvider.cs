using System;
using System.Diagnostics;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Popup.Services.Auth
{
    /*
     * POL-14-02 : Demo 모드
     * POL-15-02 : 인증·버전
     * ■ API Demo 인증 헤더 공급자
     * - in : ForToken(token) 직접 입력 토큰 · ForLogin(loginClient, loginBody) 로그인 요청 JSON
     * - out: Authorization 헤더 값 · LastLogin(마지막 로그인 응답) · 로그인 실패 예외는 그대로 전파
     * - API Demo 전용 인증 헤더 공급자. 두 경로를 구분한다.
     *   - 토큰 직접 입력: 입력한 값을 Authorization 헤더로 보낸다(스킴이 없으면 "Bearer "를 붙임). 401이어도 새 토큰을 만들 수 없어
     *     재시도는 같은 값으로 1회 나가고(PopupApiService 공통 경로) 실패가 화면에 남는다.
     *   - 로그인 후 토큰 사용: 입력한 로그인 요청 JSON으로 로그인 API를 호출해 받은 토큰을 메모리에만 보관한다.
     *     토큰이 없으면 첫 요청 직전에 로그인하고, 401이면 SsoAuthHeaderProvider와 같이 "401을 받은 토큰이 아직 현재 토큰일 때만"
     *     같은 로그인 본문으로 1회 재로그인한다. SSO 호출은 하지 않는다(로그인 본문을 직접 입력).
     * Demo는 실패 단계를 보여 주는 도구이므로 로그인 실패를 삼키지 않고 호출자에게 그대로 전파한다.
     * 토큰은 파일·로그에 남기지 않는다.
     */
    public sealed class DemoApiAuthHeaderProvider : IAuthHeaderProvider
    {
        private const string BearerPrefix = "Bearer ";

        private readonly WpfLoginClient? _loginClient;
        private readonly JsonElement _loginBody;
        private readonly SemaphoreSlim _loginGate = new(1, 1);
        private string? _authorization;

        private DemoApiAuthHeaderProvider(string? authorization, WpfLoginClient? loginClient, JsonElement loginBody)
        {
            _authorization = authorization;
            _loginClient = loginClient;
            _loginBody = loginBody;
        }

        /// <summary>토큰 직접 입력. 값이 비어 있으면 헤더를 붙이지 않는다.</summary>
        public static DemoApiAuthHeaderProvider ForToken(string? token)
            => new(NormalizeAuthorization(token), null, default);

        /// <summary>로그인 요청 JSON 객체로 로그인 API를 호출해 토큰을 얻는다.</summary>
        public static DemoApiAuthHeaderProvider ForLogin(WpfLoginClient loginClient, JsonElement loginBody)
        {
            ArgumentNullException.ThrowIfNull(loginClient);
            if (loginBody.ValueKind != JsonValueKind.Object)
                throw new ArgumentException("로그인 요청 본문은 JSON 객체여야 합니다.", nameof(loginBody));
            return new(null, loginClient, loginBody.Clone());
        }

        public bool UsesLogin => _loginClient != null;

        /// <summary>마지막 로그인 응답(토큰 포함). 화면은 길이·만료 시각만 보여 준다.</summary>
        public WpfLoginResponseDto? LastLogin { get; private set; }

        /// <summary>현재 보관 중인 토큰이 있는지(로그인 경로) 또는 입력값이 있는지(토큰 경로).</summary>
        public bool HasAuthorization => Volatile.Read(ref _authorization) != null;

        public async Task<string?> GetAuthorizationHeaderAsync(CancellationToken cancellationToken = default)
        {
            string? current = Volatile.Read(ref _authorization);
            if (current != null || _loginClient == null) return current;
            return await LoginCoreAsync(failedAuthorization: null, force: false, cancellationToken);
        }

        public async Task OnUnauthorizedAsync(string? failedAuthorizationHeader, CancellationToken cancellationToken = default)
        {
            if (_loginClient == null) return;   // 토큰 직접 입력은 갱신 수단이 없다.
            Debug.WriteLine("[API-DEMO] 401 → 같은 로그인 본문으로 재로그인");
            await LoginCoreAsync(failedAuthorizationHeader, force: false, cancellationToken);
        }

        /// <summary>"로그인" 버튼. 보관 토큰과 관계없이 지금 로그인해 토큰을 바꾼다.</summary>
        public async Task<WpfLoginResponseDto> LoginNowAsync(CancellationToken cancellationToken = default)
        {
            if (_loginClient == null) throw new InvalidOperationException("토큰 직접 입력 방식에서는 로그인하지 않습니다.");
            await LoginCoreAsync(failedAuthorization: null, force: true, cancellationToken);
            return LastLogin!;
        }

        /*
         * force=false, failed=null : 토큰이 없을 때만 로그인(첫 요청)
         * force=false, failed=X    : 현재 헤더가 X일 때만 로그인(401, 동시 401 중복 방지)
         * force=true               : 무조건 로그인("로그인" 버튼)
         */
        private async Task<string?> LoginCoreAsync(string? failedAuthorization, bool force, CancellationToken cancellationToken)
        {
            await _loginGate.WaitAsync(cancellationToken);
            try
            {
                string? current = _authorization;
                if (!force && current != null && !string.Equals(current, failedAuthorization, StringComparison.Ordinal))
                    return current;   // 이미 다른 요청이 갱신했다.

                WpfLoginResponseDto login = await _loginClient!.LoginAsync(_loginBody, cancellationToken);
                LastLogin = login;
                string scheme = string.IsNullOrWhiteSpace(login.TokenType) ? "Bearer" : login.TokenType.Trim();
                string authorization = $"{scheme} {login.AccessToken}";
                Volatile.Write(ref _authorization, authorization);
                return authorization;
            }
            finally
            {
                _loginGate.Release();
            }
        }

        /// <summary>입력한 토큰 문자열을 헤더 값으로 정리한다. 공백이 없으면 토큰만 넣은 것으로 보고 "Bearer "를 붙인다.</summary>
        internal static string? NormalizeAuthorization(string? token)
        {
            if (string.IsNullOrWhiteSpace(token)) return null;
            string value = token.Trim();
            return value.Contains(' ') ? value : BearerPrefix + value;
        }
    }
}
