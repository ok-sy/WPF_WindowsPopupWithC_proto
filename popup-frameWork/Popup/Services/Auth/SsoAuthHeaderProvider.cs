using System;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace Popup.Services.Auth
{
    /// <summary>"SSO 로그인 테스트"의 단계별 결과. 토큰 값 자체는 담지 않는다(길이만).</summary>
    public sealed record SsoLoginTestResult(
        Uri SsoUrl,
        SsoUserInfo User,
        long SsoElapsedMs,
        string LoginUrl,
        string TokenType,
        int TokenLength,
        DateTimeOffset ExpiresAt,
        long LoginElapsedMs);

    /*
     * [역할 — 설계 10 §5.3·§5.4] IAuthHeaderProvider의 SSO 프로토타입 구현체.
     *
     *   WPF 시작
     *     → GetAuthorizationHeaderAsync(): 토큰이 없으면 SsoClient(Negotiate) → WpfLoginClient → 토큰 메모리 보관
     *     → "Bearer {token}" 반환
     *   서버 401
     *     → OnUnauthorizedAsync(실패한 헤더): 메모리 _lastUser로 로그인 API만 → 새 토큰 (PopupApiService가 같은 요청을 1회 재전송)
     *   1시간 주기 (StartPeriodicLogin)
     *     → PeriodicTimer → 메모리 _lastUser로 로그인 API만 → 토큰 교체 (실패해도 현재 토큰을 지우지 않음)
     *   ※ [설계 10 §14.1 확정] SSO GET은 프로세스 시작 후 최초 1회만. 사용자 정보도 메모리에만 두고 파일에 저장하지 않는다.
     *
     * [추가 이유] 서버 프로토타입 토큰은 10분 뒤 만료된다. 만료를 클라이언트가 미리 계산해 갱신하면 "401 → 재로그인 → 원 요청
     * 재전송" 경로가 실제로 검증되지 않으므로, 이 구현은 만료 시각을 진단용으로만 기억하고 갱신은 401 또는 정기 주기에만 한다.
     *
     * [동시성 — T5] 여러 요청이 동시에 401을 받아도 실제 SSO·로그인은 한 번만 한다. SemaphoreSlim으로 직렬화하고,
     * 잠금 안에서 "현재 토큰이 401을 받은 그 토큰과 여전히 같은가"를 비교해 이미 갱신됐으면 건너뛴다.
     *
     * [규칙] 토큰·만료·사용자 정보는 이 객체의 필드에만 있다(파일·Registry·appsettings 저장 금지). 로그인 UI 없음.
     * 토큰 값을 로그에 남기지 않는다.
     */
    public sealed class SsoAuthHeaderProvider : IAuthHeaderProvider, IDisposable
    {
        private const string BearerPrefix = "Bearer ";

        private readonly SsoClient _ssoClient;
        private readonly WpfLoginClient _loginClient;

        /* SSO·로그인 호출을 직렬화한다. 동시 401 → 로그인 1회. */
        private readonly SemaphoreSlim _loginGate = new(1, 1);

        /* 정기 재로그인 루프와 진행 중인 로그인을 앱 종료 시 함께 취소한다. */
        private readonly CancellationTokenSource _lifetime = new();

        /* 메모리 상태. _loginGate 안에서만 쓰고, 읽기는 Volatile로 최신 값을 본다. */
        private string? _accessToken;
        private DateTimeOffset? _expiresAt;
        private SsoUserInfo? _lastUser;
        private Task? _periodicLoop;

        public SsoAuthHeaderProvider(SsoClient ssoClient, WpfLoginClient loginClient)
        {
            _ssoClient = ssoClient ?? throw new ArgumentNullException(nameof(ssoClient));
            _loginClient = loginClient ?? throw new ArgumentNullException(nameof(loginClient));
        }

        /// <summary>진단용. 서버가 알려준 현재 토큰 만료 시각(없으면 null). 갱신 판단에는 쓰지 않는다.</summary>
        public DateTimeOffset? ExpiresAt => _expiresAt;

        /// <summary>진단용. 마지막으로 SSO에서 얻은 사용자(없으면 null).</summary>
        public SsoUserInfo? LastUser => _lastUser;

        public bool HasToken => Volatile.Read(ref _accessToken) != null;

        /// <summary>
        /// 토큰이 있으면 "Bearer {token}". 없으면(최초 실행·이전 로그인 실패) 로그인을 시도하고, 그래도 없으면 null
        /// (헤더 없이 요청 → 서버 401 → OnUnauthorizedAsync에서 한 번 더 시도).
        /// </summary>
        public async Task<string?> GetAuthorizationHeaderAsync(CancellationToken cancellationToken = default)
        {
            /*
             * [실행 순서 3/6 — 인증 흐름]
             * PopupApiService가 API를 보내기 직전에 이 메서드를 호출한다.
             * (첫 GET /p/api/wpf/popups 안에서 호출되므로 SSO·로그인은 "첫 API 호출 시점"에 일어난다.)
             *
             * 토큰 없음(프로세스 시작 후 첫 호출):
             *   SsoClient(SSO GET 1회) → WpfLoginClient → accessToken·_lastUser 메모리 저장
             *
             * 토큰 있음:
             *   "Bearer {token}"만 반환
             *
             * 반환값은 PopupApiService.SendWithAuthAsync()에서
             * Authorization 헤더로 그대로 붙는다.
             */
            string? token = Volatile.Read(ref _accessToken);
            if (token == null)
            {
                token = await LoginAsync(failedToken: null, force: false, cancellationToken);
            }
            return token == null ? null : BearerPrefix + token;
        }

        /// <summary>
        /// 401 처리. 401을 받은 요청이 보냈던 토큰이 아직 현재 토큰이면 재로그인한다(이미 다른 요청이 바꿨으면 건너뜀).
        /// 실패하면 예외를 삼키고 토큰을 그대로 둔다 — 재전송이 다시 401을 받아 호출자에게 인증 오류로 전달된다.
        /// </summary>
        public async Task OnUnauthorizedAsync(string? failedAuthorizationHeader, CancellationToken cancellationToken = default)
        {
            /*
             * [401 복구 지점]
             * PopupApiService가 401을 받았을 때 호출한다.
             * 여기서 인증을 갱신한 뒤 PopupApiService가 원래 method/url/body를 1회 다시 보낸다.
             *
             * 중요:
             * failedAuthorizationHeader는 "401을 받은 그 요청이 사용한 토큰"이다.
             * 동시에 여러 요청이 401이어도 이미 다른 요청이 토큰을 갱신했다면
             * 불필요한 중복 로그인을 건너뛸 수 있다.
             *
             * [설계 10 §14.1] 재로그인은 최초 SSO GET에서 얻은 _lastUser로 로그인 API만 다시 호출한다(SSO 재호출 없음).
             * LoginAsync() 참고.
             */
            string? failedToken = StripBearer(failedAuthorizationHeader);
            await LoginAsync(failedToken, force: false, cancellationToken);
        }

        /// <summary>
        /// [로그인 테스트 — 관리 화면 "SSO 로그인 테스트" 버튼] SSO GET → XML 파싱 → 로그인 API를 지금 한 번 수행하고
        /// 단계별 결과(사용자 값·만료 시각·소요 시간)를 돌려준다. 성공하면 얻은 토큰을 현재 토큰으로 교체한다.
        /// 예외를 삼키지 않고 그대로 던져 어느 단계에서 실패했는지 호출자가 보여줄 수 있게 한다.
        /// </summary>
        public async Task<SsoLoginTestResult> TestLoginAsync(CancellationToken cancellationToken = default)
        {
            using CancellationTokenSource linked =
                CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, _lifetime.Token);
            await _loginGate.WaitAsync(linked.Token);
            try
            {
                Stopwatch ssoWatch = Stopwatch.StartNew();
                SsoUserInfo user = await _ssoClient.GetUserAsync(linked.Token);
                ssoWatch.Stop();

                Stopwatch loginWatch = Stopwatch.StartNew();
                WpfLoginResponseDto login = await _loginClient.LoginAsync(user, linked.Token);
                loginWatch.Stop();

                _lastUser = user;
                _expiresAt = login.ExpiresAt;
                Volatile.Write(ref _accessToken, login.AccessToken);

                return new SsoLoginTestResult(
                    _ssoClient.SsoUrl, user, ssoWatch.ElapsedMilliseconds,
                    _loginClient.LoginUrl, login.TokenType, login.AccessToken.Length, login.ExpiresAt, loginWatch.ElapsedMilliseconds);
            }
            finally
            {
                _loginGate.Release();
            }
        }

        /// <summary>
        /// [설계 10 §4.2·§5.4] 정기 재로그인 루프를 시작한다. interval이 0 이하이면 시작하지 않는다.
        /// 루프 안의 실패는 무시한다(현재 토큰 유지, 다음 API 요청의 401이 즉시 재인증을 유도).
        /// </summary>
        public void StartPeriodicLogin(TimeSpan interval)
        {
            if (interval <= TimeSpan.Zero || _periodicLoop != null)
            {
                return;
            }
            _periodicLoop = RunPeriodicLoginAsync(interval, _lifetime.Token);
        }

        private async Task RunPeriodicLoginAsync(TimeSpan interval, CancellationToken cancellationToken)
        {
            try
            {
                using PeriodicTimer timer = new(interval);
                while (await timer.WaitForNextTickAsync(cancellationToken))
                {
                    Debug.WriteLine($"[SSO-AUTH] 정기 재로그인 ({interval.TotalMinutes:0}분 주기)");
                    try
                    {
                        await LoginAsync(failedToken: null, force: true, cancellationToken);
                    }
                    catch (WpfClientVersionException exception)
                    {
                        // [설계 13] 정기 재로그인이 426이면 루프를 멈춘다(무한 재시도 금지). 안내는 다음 조회의 426이 담당한다.
                        Debug.WriteLine($"[SSO-AUTH] 정기 재로그인 중단(426): {exception.Message}");
                        return;
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // 앱 종료. 정상 흐름.
            }
        }

        /*
         * 실제 SSO → 로그인 → 토큰 교체. 반환값은 현재 토큰(실패 시 기존 토큰 또는 null).
         *   force=false, failedToken=null : 토큰이 없을 때만 로그인 (최초 실행)
         *   force=false, failedToken=X    : 현재 토큰이 X일 때만 로그인 (401 처리, 동시 401 중복 방지)
         *   force=true                    : 무조건 로그인 (정기 주기)
         */
        private async Task<string?> LoginAsync(string? failedToken, bool force, CancellationToken cancellationToken)
        {
            using CancellationTokenSource linked =
                CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, _lifetime.Token);

            await _loginGate.WaitAsync(linked.Token);
            try
            {
                string? current = _accessToken;
                if (!force && current != null && !string.Equals(current, failedToken, StringComparison.Ordinal))
                {
                    // 다른 요청이 이미 새 토큰으로 바꿨다(또는 최초 로그인이 방금 끝났다). 그 토큰을 그대로 쓴다.
                    Debug.WriteLine("[SSO-AUTH] 토큰이 이미 갱신되어 재로그인을 건너뜁니다.");
                    return current;
                }

                /*
                 * [설계 10 §14.1 — 2026-09-21 확정] SSO GET은 프로세스 시작 후 최초 1회만.
                 * 얻은 MAIN_USER_ID/MAIN_USER_CLASSI_CODE는 _lastUser(메모리)에 두고, 401 재로그인·1시간 정기 갱신은
                 * 그 값으로 로그인 API만 다시 호출한다. 프로세스가 끝나면 _lastUser도 사라져 다음 실행에서 SSO GET 1회.
                 * (관리 화면 "SSO 로그인 테스트"는 SSO 통신 확인용이라 TestLoginAsync에서 매번 SSO를 호출한다.)
                 */
                SsoUserInfo? user = _lastUser;
                bool ssoCalled = false;
                if (user == null)
                {
                    user = await _ssoClient.GetUserAsync(linked.Token);
                    _lastUser = user;
                    ssoCalled = true;
                }
                WpfLoginResponseDto login = await _loginClient.LoginAsync(user, linked.Token);

                _expiresAt = login.ExpiresAt;
                Volatile.Write(ref _accessToken, login.AccessToken);
                Debug.WriteLine($"[SSO-AUTH] 토큰 갱신 logonId={user.LogonId} expiresAt={login.ExpiresAt:O} (SSO {(ssoCalled ? "호출" : "재호출 없음")}, 이전 토큰 {(current == null ? "없음" : "교체")})");
                return login.AccessToken;
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (WpfClientVersionException)
            {
                // [설계 13 §9] 로그인 단계에서 버전 차단(426): 삼키지 않고 그대로 올려 호출자(MainWindow)가 업데이트 안내를 하게 한다.
                //   토큰이 없는 상태로 조회를 계속해도 서버 인터셉터가 다시 426을 주므로 재시도 의미가 없다.
                throw;
            }
            catch (Exception exception)
            {
                // [T7] SSO 401·네트워크 오류·태그 없음·로그인 API 오류: UI를 띄우지 않고 기존 상태를 유지한다.
                Debug.WriteLine($"[SSO-AUTH] 로그인 실패: {exception.GetType().Name}: {exception.Message}");
                return _accessToken;
            }
            finally
            {
                _loginGate.Release();
            }
        }

        private static string? StripBearer(string? authorizationHeader)
        {
            if (string.IsNullOrWhiteSpace(authorizationHeader))
            {
                return null;
            }
            string value = authorizationHeader.Trim();
            return value.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase)
                ? value[BearerPrefix.Length..].Trim()
                : value;
        }

        /// <summary>정기 재로그인 루프를 멈추고 메모리 토큰을 지운다. 앱 종료 시 호출.</summary>
        public void Dispose()
        {
            if (!_lifetime.IsCancellationRequested)
            {
                _lifetime.Cancel();
            }
            Volatile.Write(ref _accessToken, null);
            _expiresAt = null;
            // _lifetime 은 Dispose 하지 않는다: 진행 중인 LoginAsync가 CreateLinkedTokenSource로 아직 참조할 수 있다(앱 종료 직전에만 호출됨).
        }
    }
}
