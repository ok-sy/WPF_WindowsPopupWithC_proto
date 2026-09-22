using System.Threading;
using System.Threading.Tasks;

namespace Popup.Services.Auth
{
    /*
     * [역할] 서버 요청에 붙일 Authorization 헤더 값을 제공하는 확장 지점이다.
     *
     * [추가 이유 — 기준 6]
     *   서버 토큰 인증은 관리자 웹과 WPF가 공유하는 통합 토큰으로 다른 팀이 개발 중이며, 사내 SSO 규격도
     *   아직 확정되지 않았다. PopupApiService가 인증 방식을 전혀 몰라도 되도록 "헤더 값 공급"만 인터페이스로
     *   분리해 둔다. 구현체를 바꾸고 appsettings의 PopupApi.Auth.Mode만 바꾸면 인증 방식이 바뀐다.
     *
     * [현재 구현체]
     *   - NoAuthHeaderProvider     : 헤더를 붙이지 않음 (서버 통합 토큰 필터 적용 전 기본값, 데모 모드)
     *   - StaticAuthHeaderProvider : appsettings의 고정 문자열을 그대로 전달 (연동 테스트용)
     *   - SsoAuthHeaderProvider    : [설계 10] 사내 SSO(Negotiate) → 서버 프로토타입 로그인 → 메모리 토큰. 401이면 재로그인.
     *
     * [규칙] 토큰은 파일에 저장하지 않고 메모리에만 둔다. 요청 본문·쿼리에 userId를 넣지 않는다(서버가 인증 정보로 식별).
     */
    public interface IAuthHeaderProvider
    {
        /// <summary>
        /// Authorization 헤더 값(예: "Bearer eyJ...")을 돌려준다. null 또는 빈 문자열이면 헤더를 붙이지 않는다.
        /// </summary>
        Task<string?> GetAuthorizationHeaderAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// 서버가 401을 돌려줬을 때 PopupApiService가 1회 호출한다. 토큰을 재발급할 수 있는 구현체는 여기서 갱신한다.
        /// 기본 구현은 아무 것도 하지 않는다(재시도해도 같은 값이 나감).
        /// </summary>
        /// <param name="failedAuthorizationHeader">
        /// [설계 10 T5] 401을 받은 요청이 실제로 보냈던 Authorization 헤더 값(없었으면 null). 여러 요청이 동시에 401을
        /// 받아도 구현체가 "이미 다른 요청이 그 토큰을 새 토큰으로 바꿨는지"를 비교해 재로그인을 한 번만 수행할 수 있게 한다.
        /// </param>
        Task OnUnauthorizedAsync(string? failedAuthorizationHeader, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    /// <summary>헤더를 붙이지 않는다. 통합 토큰 필터가 적용되기 전 개발·데모 기본값.</summary>
    public sealed class NoAuthHeaderProvider : IAuthHeaderProvider
    {
        public Task<string?> GetAuthorizationHeaderAsync(CancellationToken cancellationToken = default)
            => Task.FromResult<string?>(null);
    }

    /// <summary>
    /// appsettings(PopupApi.Auth.StaticHeader)의 문자열을 그대로 보낸다. "Bearer ..." 전체를 적는다.
    /// 통합 토큰 연동 테스트에서 미리 발급받은 토큰을 붙여 볼 때 쓴다. 운영 배포 시 비운다.
    /// </summary>
    public sealed class StaticAuthHeaderProvider : IAuthHeaderProvider
    {
        private readonly string? _headerValue;

        public StaticAuthHeaderProvider(string? headerValue)
        {
            _headerValue = string.IsNullOrWhiteSpace(headerValue) ? null : headerValue.Trim();
        }

        public Task<string?> GetAuthorizationHeaderAsync(CancellationToken cancellationToken = default)
            => Task.FromResult(_headerValue);
    }
}
