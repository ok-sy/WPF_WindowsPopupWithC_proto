using System;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Popup.Services
{
    /*
     * [역할 — 설계 13 §3·§4] WPF 실행 버전을 한 곳에서 읽어 모든 서버 요청에 X-Client-Version 헤더로 붙인다.
     *
     * [버전 기준] csproj의 <Version>(= AssemblyInformationalVersion, 예: 1.0.0). 배포 버전을 관리하기 쉽고
     *   빌드용 AssemblyVersion 정책과 분리되므로 설계 13 §3 권장대로 InformationalVersion을 쓴다.
     *   "+커밋해시" 같은 접미어가 붙어 있으면 잘라 숫자 버전만 보낸다.
     *
     * [적용 위치] PopupApiService.SendWithAuthAsync(목록·결과), WpfLoginClient.LoginAsync(로그인). 화면 코드는 모른다.
     */
    public static class ClientVersion
    {
        public const string HeaderName = "X-Client-Version";

        private static readonly Lazy<string> Current = new(ReadVersion);

        /// <summary>실행 중인 WPF 버전 문자열(예: "1.0.0"). 읽을 수 없으면 "0.0.0".</summary>
        public static string Value => Current.Value;

        private static string ReadVersion()
        {
            Assembly assembly = typeof(ClientVersion).Assembly;
            string? informational = assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?
                .InformationalVersion;
            string raw = string.IsNullOrWhiteSpace(informational)
                ? assembly.GetName().Version?.ToString(3) ?? "0.0.0"
                : informational;
            int plus = raw.IndexOf('+');
            return (plus > 0 ? raw[..plus] : raw).Trim();
        }
    }

    /*
     * [설계 13 §7·§8] 서버가 426 Upgrade Required 로 요청을 차단했을 때 던지는 예외.
     *
     * [추가 이유] 426은 401(재로그인 후 1회 재전송)·네트워크 오류(다음 주기에 재시도)와 구분해야 한다.
     *   - 재로그인하지 않는다.
     *   - 같은 API를 무한 재시도하지 않는다(MainWindow가 주기 조회를 멈추고 업데이트 안내).
     *   - pending 결과는 삭제하지 않는다(PopupResultQueue.FlushAsync가 보관 유지).
     * 서버 응답 본문 { code, message, clientVersion, minimumSupportedVersion, latestVersion } 을 담는다.
     */
    public sealed class WpfClientVersionException : HttpRequestException
    {
        public WpfClientVersionException(string message, WpfClientVersionErrorDto? detail)
            : base(message, null, HttpStatusCode.UpgradeRequired)
        {
            Detail = detail;
        }

        public WpfClientVersionErrorDto? Detail { get; }

        /// <summary>사용자 안내 문구(설계 13 §8 예시 형식).</summary>
        public string UserMessage =>
            "현재 프로그램 버전은 더 이상 지원되지 않습니다.\n최신 버전으로 업데이트 후 다시 실행해주세요.\n\n" +
            $"현재 버전: {Detail?.ClientVersion ?? ClientVersion.Value}\n" +
            $"최소 지원 버전: {Detail?.MinimumSupportedVersion ?? "-"}\n" +
            $"최신 버전: {Detail?.LatestVersion ?? "-"}";

        /// <summary>응답이 426이면 본문을 읽어 예외를 만든다. 아니면 null.</summary>
        public static WpfClientVersionException? TryCreate(HttpResponseMessage response, string body)
        {
            if (response.StatusCode != HttpStatusCode.UpgradeRequired)
            {
                return null;
            }
            WpfClientVersionErrorDto? detail = null;
            try
            {
                detail = JsonSerializer.Deserialize<WpfClientVersionErrorDto>(
                    body, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            }
            catch (JsonException)
            {
                // 본문이 JSON이 아니면 상세 없이 처리한다.
            }
            return new WpfClientVersionException(
                $"WPF 클라이언트 버전 미지원(426): {detail?.Message ?? body}", detail);
        }
    }

    /// <summary>426 응답 본문. 서버 WpfClientVersionInterceptor가 만든다.</summary>
    public sealed class WpfClientVersionErrorDto
    {
        public string? Code { get; set; }
        public string? Message { get; set; }
        public string? ClientVersion { get; set; }
        public string? MinimumSupportedVersion { get; set; }
        public string? LatestVersion { get; set; }
        [JsonIgnore] public bool IsVersionError => string.Equals(Code, "CLIENT_VERSION_NOT_SUPPORTED", StringComparison.OrdinalIgnoreCase);
    }
}
