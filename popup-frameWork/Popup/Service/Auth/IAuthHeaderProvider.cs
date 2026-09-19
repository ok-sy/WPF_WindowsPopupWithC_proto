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
     *   분리해 둔다. 나중에 사내 SSO를 붙일 때는 이 인터페이스의 구현체 하나(SsoAuthHeaderProvider)만 추가하고
     *   appsettings의 PopupApi.Auth.Mode를 바꾸면 된다. 지금 시점에 인증이 실제로 동작할 필요는 없다.
     *
     * [현재 구현체]
     *   - NoAuthHeaderProvider     : 헤더를 붙이지 않음 (서버 통합 토큰 필터 적용 전 기본값, 데모 모드)
     *   - StaticAuthHeaderProvider : appsettings의 고정 문자열을 그대로 전달 (연동 테스트용)
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
        Task OnUnauthorizedAsync(CancellationToken cancellationToken = default) => Task.CompletedTask;
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
