using System;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Popup.Services.Auth
{
    /// <summary>
    /// API Demo SSO 프로세스 모드의 SSO 단계 실패(설계 51-12). Kind로 인증 실패·호출 실패·통신 실패·응답 해석 실패·시간 초과를 구분한다.
    /// 로그인 API 단계 실패(HTTP 오류·토큰 없음·426)는 이 예외로 감싸지 않고 원래 예외 그대로 전파한다.
    /// </summary>
    public sealed class DemoSsoException : Exception
    {
        public DemoSsoException(string kind, string message, Exception innerException) : base(message, innerException) => Kind = kind;

        /// <summary>AUTH(SSO 401·403) · HTTP(그 밖의 비성공 응답) · NETWORK(응답 없음) · PARSE(XML·필수 태그) · TIMEOUT</summary>
        public string Kind { get; }
    }

    /*
     * POL-14-02 : Demo 모드
     * POL-15-02 : 인증·버전
     * ■ API Demo 인증 헤더 공급자
     * - in : ForLogin(loginClient, loginBody) 입력 모드(로그인 요청 JSON) · ForSso(ssoClient, loginClient) SSO 프로세스 모드(설계 51-12)
     * - out: Authorization 헤더 값 · LastLogin(마지막 로그인 응답) · LastSsoUser(SSO 모드 마지막 사용자) · 실패 예외는 그대로 전파
     * - API Demo 전용 인증 헤더 공급자. 두 모드 모두 로그인 API로 받은 토큰을 메모리에만 보관한다.
     *   - 입력 모드: 입력한 로그인 요청 JSON으로 로그인 API를 호출한다. SSO 호출은 하지 않는다.
     *   - SSO 프로세스 모드: appsettings PopupApi.Auth.SsoUrl(화면에서 수정 불가)을 GET(Windows 통합 인증)
     *     → MAIN_USER_ID·MAIN_USER_CLASSI_CODE → 로그인 API → 토큰. 일반 실행(SsoAuthHeaderProvider)과 같은 SsoClient·WpfLoginClient를 쓴다.
     *     SSO GET은 이 연결의 첫 로그인과 "로그인" 버튼에서만 하고, 401 재로그인은 보관한 사용자 정보로 로그인 API만 다시 부른다
     *     (일반 실행과 같은 정책). SSO 단계 실패는 DemoSsoException으로 감싸 로그인 API 실패와 구분한다.
     *   토큰이 없으면 첫 요청 직전에 로그인하고, 401이면 SsoAuthHeaderProvider와 같이 "401을 받은 토큰이 아직 현재 토큰일 때만" 1회 재로그인한다.
     * Demo는 실패 단계를 보여 주는 도구이므로 로그인 실패를 삼키지 않고 호출자에게 그대로 전파한다.
     * 토큰은 파일·로그에 남기지 않는다. 토큰 직접 입력·헤더 없음 방식은 설계 51-12에서 제거했다.
     */
    public sealed class DemoApiAuthHeaderProvider : IAuthHeaderProvider
    {
        /* refreshIdentity=true면 SSO 모드에서 SSO GET을 다시 한다("로그인" 버튼). 입력 모드는 무시한다. */
        private readonly Func<DemoApiAuthHeaderProvider, bool, CancellationToken, Task<WpfLoginResponseDto>> _login;
        private readonly SemaphoreSlim _loginGate = new(1, 1);
        private string? _authorization;

        private DemoApiAuthHeaderProvider(Func<DemoApiAuthHeaderProvider, bool, CancellationToken, Task<WpfLoginResponseDto>> login, bool usesSso)
        {
            _login = login;
            UsesSso = usesSso;
        }

        /// <summary>입력 모드: 로그인 요청 JSON 객체로 로그인 API를 호출해 토큰을 얻는다.</summary>
        public static DemoApiAuthHeaderProvider ForLogin(WpfLoginClient loginClient, JsonElement loginBody)
        {
            ArgumentNullException.ThrowIfNull(loginClient);
            if (loginBody.ValueKind != JsonValueKind.Object)
                throw new ArgumentException("로그인 요청 본문은 JSON 객체여야 합니다.", nameof(loginBody));
            JsonElement body = loginBody.Clone();
            return new((_, _, cancellationToken) => loginClient.LoginAsync(body, cancellationToken), usesSso: false);
        }

        /// <summary>SSO 프로세스 모드: SSO GET → 사용자 정보 → 로그인 API. 401 재로그인은 보관한 사용자 정보만 쓴다.</summary>
        public static DemoApiAuthHeaderProvider ForSso(SsoClient ssoClient, WpfLoginClient loginClient)
        {
            ArgumentNullException.ThrowIfNull(ssoClient);
            ArgumentNullException.ThrowIfNull(loginClient);
            return new(async (self, refreshIdentity, cancellationToken) =>
            {
                SsoUserInfo? user = self.LastSsoUser;
                if (user == null || refreshIdentity)
                {
                    user = await GetSsoUserAsync(ssoClient, cancellationToken);
                    self.LastSsoUser = user;
                }
                return await loginClient.LoginAsync(user, cancellationToken);
            }, usesSso: true);
        }

        /* SSO GET 실패를 단계별로 감싼다. 호출자가 취소한 경우는 그대로 둔다. */
        private static async Task<SsoUserInfo> GetSsoUserAsync(SsoClient ssoClient, CancellationToken cancellationToken)
        {
            try
            {
                return await ssoClient.GetUserAsync(cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (OperationCanceledException exception)
            {
                throw new DemoSsoException("TIMEOUT", $"SSO 시간 초과 — {ssoClient.SsoUrl} 응답을 받지 못했습니다.", exception);
            }
            catch (HttpRequestException exception) when (exception.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
            {
                throw new DemoSsoException("AUTH", $"SSO 인증 실패(HTTP {(int)exception.StatusCode!}) — Windows 통합 인증이 거절됐습니다. {exception.Message}", exception);
            }
            catch (HttpRequestException exception) when (exception.StatusCode != null)
            {
                throw new DemoSsoException("HTTP", $"SSO 호출 실패(HTTP {(int)exception.StatusCode}) — {exception.Message}", exception);
            }
            catch (HttpRequestException exception)
            {
                throw new DemoSsoException("NETWORK", $"SSO 통신 실패(응답 없음) — {ssoClient.SsoUrl}: {exception.Message}", exception);
            }
            catch (InvalidOperationException exception)
            {
                throw new DemoSsoException("PARSE", "SSO 응답 해석 실패 — " + exception.Message, exception);
            }
        }

        /// <summary>SSO 프로세스 모드이면 true.</summary>
        public bool UsesSso { get; }

        /// <summary>SSO 모드에서 마지막으로 SSO GET으로 얻은 사용자(사번·구분 코드). 입력 모드는 null.</summary>
        public SsoUserInfo? LastSsoUser { get; private set; }

        /// <summary>마지막 로그인 응답(토큰 포함). 화면은 길이·만료 시각만 보여 준다.</summary>
        public WpfLoginResponseDto? LastLogin { get; private set; }

        /// <summary>현재 보관 중인 토큰이 있는지.</summary>
        public bool HasAuthorization => Volatile.Read(ref _authorization) != null;

        public async Task<string?> GetAuthorizationHeaderAsync(CancellationToken cancellationToken = default)
        {
            string? current = Volatile.Read(ref _authorization);
            if (current != null) return current;
            return await LoginCoreAsync(failedAuthorization: null, force: false, refreshIdentity: false, cancellationToken);
        }

        public async Task OnUnauthorizedAsync(string? failedAuthorizationHeader, CancellationToken cancellationToken = default)
        {
            Debug.WriteLine(UsesSso ? "[API-DEMO] 401 → 보관한 SSO 사용자로 재로그인(SSO 재호출 없음)" : "[API-DEMO] 401 → 같은 로그인 본문으로 재로그인");
            await LoginCoreAsync(failedAuthorizationHeader, force: false, refreshIdentity: false, cancellationToken);
        }

        /// <summary>"로그인" 버튼. 보관 토큰과 관계없이 지금 로그인해 토큰을 바꾼다. SSO 모드는 SSO GET부터 다시 한다.</summary>
        public async Task<WpfLoginResponseDto> LoginNowAsync(CancellationToken cancellationToken = default)
        {
            await LoginCoreAsync(failedAuthorization: null, force: true, refreshIdentity: true, cancellationToken);
            return LastLogin!;
        }

        /*
         * force=false, failed=null : 토큰이 없을 때만 로그인(첫 요청)
         * force=false, failed=X    : 현재 헤더가 X일 때만 로그인(401, 동시 401 중복 방지)
         * force=true               : 무조건 로그인("로그인" 버튼)
         */
        private async Task<string?> LoginCoreAsync(string? failedAuthorization, bool force, bool refreshIdentity, CancellationToken cancellationToken)
        {
            await _loginGate.WaitAsync(cancellationToken);
            try
            {
                string? current = _authorization;
                if (!force && current != null && !string.Equals(current, failedAuthorization, StringComparison.Ordinal))
                    return current;   // 이미 다른 요청이 갱신했다.

                WpfLoginResponseDto login = await _login(this, refreshIdentity, cancellationToken);
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
    }
}
