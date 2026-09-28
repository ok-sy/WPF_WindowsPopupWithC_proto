using Popup.Dtos;
using Popup.Services.Auth;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;

namespace Popup.Services
{
    /*
     * Java Spring Boot 팝업 API와 통신하는 서비스다.
     *
     * 이 클래스는 다음 역할만 담당한다.
     *
     * 1. Java 서버에 HTTP 요청을 보낸다.
     * 2. 서버가 반환한 JSON을 받는다.
     * 3. JSON을 PopupResponseDto 목록으로 변환한다.
     *
     * PopupWindow를 만들거나 화면에 표시하는 역할은
     * PopupService와 PopupManager가 담당한다.
     *
     * [설계 18 L-0 — C-2·C-3 삭제] WPF Client API 계약 v3.0이 WPF가 쓰는 API를
     * 로그인·목록 조회·결과 일괄 전송 3개로 통일했다(docs/interfaces/POPUP_INTERFACE_SPEC.md).
     * 그래서 호출부가 없던 구 동작별 API 메서드(GetAvailablePopupsAsync, HidePopupAsync,
     * SubmitResponseAsync, SaveVideoProgressAsync, RecordPopupEventAsync, GetPopupStatusesAsync —
     * /api/popups?userId= 계열)와 그 전용 헬퍼(PostAsync, EnsureSuccessAsync, BuildPopupUrl,
     * ValidatePopupAndUser), "구 서버 호환용" 안내 주석을 삭제했다. 남은 공개 메서드는
     * GetWpfPopupsAsync·PostResultsAsync 두 개이며 로그인 API는 SsoAuthHeaderProvider가 호출한다.
     */
    public class PopupApiService : IPopupGateway
    {
        /*
         * Java Spring Boot 서버의 기본 주소다.
         *
         * 개발·테스트·운영 환경마다
         * 다른 주소를 사용할 수 있도록
         * 생성자에서 값을 전달받는다.
         */
        private readonly string
            _baseUrl;


        /*
         * 서버에 HTTP 요청을 보내는 객체다.
         *
         * HttpClient를 요청마다 새로 만들면
         * 네트워크 연결이 불필요하게 계속 생성될 수 있다.
         *
         * 따라서 프로그램 전체에서 같은 객체를
         * 재사용할 수 있도록 static으로 선언한다.
         */
        private static readonly HttpClient HttpClient =
            new HttpClient
            {
                /*
                 * 서버가 응답하지 않을 때
                 * 무한정 기다리지 않도록 제한 시간을 설정한다.
                 */
                Timeout =
                    TimeSpan.FromSeconds(10)
            };

        /*
         * 서버 JSON을 C# DTO로 변환할 때 사용하는 옵션이다.
         */
        private readonly JsonSerializerOptions
            _jsonOptions;

        /*
 * PopupApiService 생성자다.
 *
 * baseUrl
 * → Java Spring Boot 팝업 API의 기본 주소
 *
 * 예:
 * http://localhost:8080/zero-rule-server/p
 * https://zero-rule.company.com/zero-rule-server/p
 */
        /*
         * [추가 — 기준 6] Authorization 헤더 값을 공급하는 확장 지점이다.
         * 통합 토큰(타 팀)·사내 SSO 규격이 확정되면 구현체만 교체한다. 이 클래스는 토큰 획득 방법을 모른다.
         */
        private readonly IAuthHeaderProvider _authHeaderProvider;

        /*
         * [추가 — 개발 전용] 서버 개발 프로파일(custom.wpf-popup.dev-user-header=true)에서만 의미가 있는
         * X-Dev-User-Id 헤더 값이다. 통합 토큰 필터 적용 전 사용자를 지정해 조회·결과 API를 검증한다.
         * 운영 배포 시 비워 두며, 비어 있으면 헤더를 붙이지 않는다.
         */
        private readonly string? _devUserId;

        public PopupApiService(
            string baseUrl,
            IAuthHeaderProvider? authHeaderProvider = null,
            string? devUserId = null)
        {
            _authHeaderProvider = authHeaderProvider ?? new NoAuthHeaderProvider();
            _devUserId = string.IsNullOrWhiteSpace(devUserId) ? null : devUserId.Trim();
            /*
             * API 주소가 없으면
             * 서버 요청 주소를 만들 수 없으므로
             * 객체 생성을 중단한다.
             */
            if (string.IsNullOrWhiteSpace(
                    baseUrl))
            {
                throw new ArgumentException(
                    "팝업 API 주소가 필요합니다.",
                    nameof(baseUrl));
            }

            /*
             * 전달받은 API 주소의 앞뒤 공백과
             * 마지막 슬래시를 제거한다.
             *
             * 예:
             * http://localhost:8080/zero-rule-server/p/
             *
             * 변경:
             * http://localhost:8080/zero-rule-server/p
             *
             * 이후 /api/popups를 붙였을 때
             * //api/popups가 되는 것을 방지한다.
             */
            _baseUrl =
                baseUrl
                    .Trim()
                    .TrimEnd('/');

            /*
             * Java JSON은 camelCase를 사용하고
             * C# DTO 속성은 PascalCase를 사용한다.
             *
             * JSON:
             * popupId
             *
             * C#:
             * PopupId
             */
            _jsonOptions =
                new JsonSerializerOptions
                {
                    /*
                     * Java 서버가 보내는 camelCase JSON과
                     * C#의 PascalCase 속성을 연결한다.
                     */
                    PropertyNameCaseInsensitive =
                        true,

                    /*
                     * C# DTO를 Java 서버로 보낼 때
                     * 속성명을 camelCase로 변환한다.
                     *
                     * ResultId
                     * → resultId
                     *
                     * ClientRequestId
                     * → clientRequestId
                     */
                    PropertyNamingPolicy =
                        JsonNamingPolicy.CamelCase
                };

            /*
             * WPF API(계약서 v3.x)의 날짜는 ISO 8601(+오프셋) 문자열이다.
             * [설계 18 L-5 — C-22] 서버 교체기의 epoch 초 숫자 허용은 삭제했다.
             */
            _jsonOptions.Converters.Add(
                new IsoDateTimeOffsetJsonConverter());
        }

        /*
         * =====================================================================
         * [WPF API — 기준 2·3·4·6] /p/api/wpf/**
         *
         * 아래 두 메서드가 WPF 클라이언트가 호출하는 팝업 API의 전부다(로그인 API는 SsoAuthHeaderProvider).
         * 사용자 ID를 보내지 않는다. 서버가 인증 헤더(IAuthHeaderProvider가 준 값)로 사용자를 식별한다.
         * =====================================================================
         */

        /// <summary>
        /// 서버가 노출 판단(활성·기간·대상·숨김·완료)을 끝낸 최종 팝업 목록을 조회한다.
        /// 공통 옵션·content·문항·선택지가 한 응답에 들어 있어 추가 호출이 없다.
        /// </summary>
        public Task<WpfPopupListResponseDto> GetWpfPopupsAsync()
            => SendWithAuthAsync<WpfPopupListResponseDto>(
                HttpMethod.Get, $"{_baseUrl}/api/wpf/popups", body: null);

        /// <summary>
        /// 팝업 처리 결과(닫기·숨김·제출·영상 시청)를 일괄 전송한다. PopupResultQueue가 호출한다.
        /// HTTP 성공만으로 항목 성공을 판단하지 않고 응답 results[].status를 본다.
        /// </summary>
        public Task<WpfResultResponseDto> PostResultsAsync(WpfResultRequestDto request)
        {
            ArgumentNullException.ThrowIfNull(request);
            if (request.Results == null || request.Results.Count == 0)
            {
                throw new ArgumentException("전송할 결과 항목이 없습니다.", nameof(request));
            }
            return SendWithAuthAsync<WpfResultResponseDto>(
                HttpMethod.Post, $"{_baseUrl}/api/wpf/popups/results", request);
        }

        /// <summary>
        /// [기준 6] 공통 전송 경로. 인증 헤더 부착과 401 재시도를 한 곳에서 처리한다.
        ///  1. IAuthHeaderProvider.GetAuthorizationHeaderAsync() 값이 있으면 Authorization 헤더로 붙인다.
        ///  2. 개발용 사번(_devUserId)이 설정되어 있으면 X-Dev-User-Id 헤더를 붙인다.
        ///  3. 401이면 OnUnauthorizedAsync(실패한 헤더)로 토큰 갱신 기회를 준 뒤 같은 method/url/body로 1회만 재시도한다.
        ///     [설계 10 §5.6] body 객체(예: WpfResultRequestDto)를 그대로 다시 직렬화하므로 resultId·clientRequestId가 유지된다.
        ///     실패한 헤더 값을 넘기는 이유: 동시 401에서 구현체가 "이미 갱신된 토큰인지" 비교해 재로그인을 1회로 줄인다(T5).
        /// 응답 본문이 WPF 오류 JSON({code,message})이면 메시지에 코드를 포함해 예외를 만든다.
        /// </summary>
        private async Task<TResponse> SendWithAuthAsync<TResponse>(
            HttpMethod method,
            string requestUrl,
            object? body,
            bool retried = false)
        {
            /*
             * [실행 순서 4/6]
             * 신규 WPF API의 공통 HTTP 전송 지점.
             *
             * 흐름:
             *   IAuthHeaderProvider
             *     → Authorization 헤더 생성
             *     → 서버 요청
             *     → 401이면 OnUnauthorizedAsync()
             *     → 동일 method / URL / body를 딱 1회 재전송
             *
             * 결과 전송에서 body 객체를 그대로 재사용하므로
             * WpfResultItemDto.ResultId도 유지된다.
             */
            using HttpRequestMessage request = new(method, requestUrl);
            if (body != null)
            {
                request.Content = JsonContent.Create(body, options: _jsonOptions);
            }

            /*
             * [설계 13 §2·§4] 모든 WPF → 서버 요청에 실행 버전을 붙인다. 서버 인터셉터가 최소 지원 버전과 비교해
             * 미달이면 426으로 차단한다(Authorization 확인과 별개). 화면 코드는 이 헤더를 모른다.
             */
            request.Headers.TryAddWithoutValidation(ClientVersion.HeaderName, ClientVersion.Value);

            string? authorization = await _authHeaderProvider.GetAuthorizationHeaderAsync();
            if (!string.IsNullOrWhiteSpace(authorization))
            {
                request.Headers.TryAddWithoutValidation("Authorization", authorization);
            }
            if (_devUserId != null)
            {
                request.Headers.TryAddWithoutValidation("X-Dev-User-Id", _devUserId);
            }

            using HttpResponseMessage response = await HttpClient.SendAsync(request);

            /*
             * [설계 13 §8] 426은 401 재로그인 경로에 넣지 않는다. 재시도 없이 전용 예외로 올려
             * 호출자(MainWindow·PopupResultQueue)가 업데이트 안내·전송 중단(pending 보존)을 하게 한다.
             */
            if (response.StatusCode == HttpStatusCode.UpgradeRequired)
            {
                string errorBody = await response.Content.ReadAsStringAsync();
                throw WpfClientVersionException.TryCreate(response, errorBody)!;
            }

            if (response.StatusCode == HttpStatusCode.Unauthorized && !retried)
            {
                Debug.WriteLine($"[API] 401 {method} {requestUrl} → 인증 갱신 후 1회 재전송");
                await _authHeaderProvider.OnUnauthorizedAsync(authorization);
                return await SendWithAuthAsync<TResponse>(method, requestUrl, body, retried: true);
            }

            await EnsureWpfSuccessAsync(response);

            return await response.Content.ReadFromJsonAsync<TResponse>(_jsonOptions)
                   ?? throw new InvalidOperationException("WPF 팝업 API 응답 본문이 비어 있습니다.");
        }

        /// <summary>WPF API 오류 본문 {code, message, timestamp}를 읽어 HttpRequestException에 담는다.</summary>
        private static async Task EnsureWpfSuccessAsync(HttpResponseMessage response)
        {
            if (response.IsSuccessStatusCode)
            {
                return;
            }

            string errorBody = await response.Content.ReadAsStringAsync();
            string detail = errorBody;
            try
            {
                WpfErrorResponseDto? error = JsonSerializer.Deserialize<WpfErrorResponseDto>(
                    errorBody, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (error != null && !string.IsNullOrWhiteSpace(error.Code))
                {
                    detail = $"[{error.Code}] {error.Message}";
                }
            }
            catch (JsonException)
            {
                // 오류 본문이 JSON이 아니면 원문 그대로 사용한다.
            }

            throw new HttpRequestException(
                $"WPF 팝업 API 요청 실패: {(int)response.StatusCode} {response.ReasonPhrase}\n{detail}",
                null,
                response.StatusCode);
        }
    }
}
