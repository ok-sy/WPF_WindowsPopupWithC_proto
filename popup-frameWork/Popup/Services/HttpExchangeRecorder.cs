using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net.Http;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;

namespace Popup.Services
{
    /// <summary>
    /// [설계 51-3] 실제로 주고받은 HTTP 요청·응답 1건. 값은 원문 그대로 두고, 화면 표시 때 <see cref="ToDisplayJson"/>가 마스킹한다.
    /// StatusCode가 null이면 응답을 받지 못한 경우(연결 실패·시간 초과·취소)이며 Error에 원인이 있다.
    /// </summary>
    public sealed record HttpExchangeRecord(
        DateTimeOffset StartedAt,
        string Method,
        string Url,
        IReadOnlyList<KeyValuePair<string, string>> RequestHeaders,
        string? RequestBody,
        int? StatusCode,
        string? ReasonPhrase,
        string? ResponseBody,
        long ElapsedMs,
        string? Error)
    {
        private static readonly JsonSerializerOptions DisplayJsonOptions = new()
        {
            WriteIndented = true,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        /* 마스킹 대상. 헤더는 이름, 본문은 JSON 속성 이름(대소문자 무시)으로 찾는다. */
        private static readonly HashSet<string> SecretHeaders = new(StringComparer.OrdinalIgnoreCase) { "Authorization" };
        private static readonly HashSet<string> SecretProperties = new(StringComparer.OrdinalIgnoreCase) { "accessToken", "refreshToken" };

        /// <summary>목록 한 줄 요약. 예: "POST /api/wpf/popups → 200 (35 ms)"</summary>
        public string Summary(string baseUrl)
        {
            string path = !string.IsNullOrEmpty(baseUrl) && Url.StartsWith(baseUrl, StringComparison.OrdinalIgnoreCase)
                ? Url[baseUrl.Length..] : Url;
            string outcome = StatusCode is int status ? $"{status} {ReasonPhrase}".Trim() : "응답 없음 — " + Error;
            return $"{Method} {path} → {outcome} ({ElapsedMs} ms)";
        }

        /// <summary>요청·응답 표시용 JSON. revealSecrets=false면 Authorization 헤더와 토큰 속성 값을 가린다.</summary>
        public (string Request, string Response) ToDisplayJson(bool revealSecrets)
        {
            JsonObject headers = new();
            foreach (var header in RequestHeaders)
            {
                headers[header.Key] = !revealSecrets && SecretHeaders.Contains(header.Key) ? MaskAuthorization(header.Value) : header.Value;
            }
            JsonObject request = new()
            {
                ["method"] = Method,
                ["url"] = Url,
                ["headers"] = headers,
                ["body"] = BodyNode(RequestBody, revealSecrets)
            };
            JsonObject response = new()
            {
                ["status"] = StatusCode,
                ["reason"] = ReasonPhrase,
                ["elapsedMs"] = ElapsedMs,
                ["error"] = Error,
                ["bodyKind"] = BodyKind(ResponseBody, StatusCode),
                ["body"] = BodyNode(ResponseBody, revealSecrets)
            };
            return (request.ToJsonString(DisplayJsonOptions), response.ToJsonString(DisplayJsonOptions));
        }

        /// <summary>
        /// [설계 51-3] 응답 본문 종류. 빈 응답·잘못된 JSON을 팝업 생성 오류와 구분해 화면에 보이기 위한 값이다.
        /// </summary>
        public static string BodyKind(string? body, int? statusCode)
        {
            if (statusCode == null) return "NO_RESPONSE";
            if (string.IsNullOrWhiteSpace(body)) return "EMPTY";
            return TryParse(body, out _) ? "JSON" : "INVALID_JSON";
        }

        internal static string MaskAuthorization(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return value;
            int space = value.IndexOf(' ');
            string scheme = space > 0 ? value[..space] + " " : string.Empty;
            int length = space > 0 ? value.Length - space - 1 : value.Length;
            return $"{scheme}******** (토큰 {length}자, 마스킹)";
        }

        private static JsonNode? BodyNode(string? body, bool revealSecrets)
        {
            if (string.IsNullOrEmpty(body)) return null;
            if (!TryParse(body, out JsonNode? node)) return JsonValue.Create(body);   // JSON이 아니면 원문 문자열
            if (!revealSecrets) MaskProperties(node);
            return node;
        }

        private static void MaskProperties(JsonNode? node)
        {
            switch (node)
            {
                case JsonObject obj:
                    foreach (string name in obj.Select(p => p.Key).ToList())
                    {
                        if (SecretProperties.Contains(name) && obj[name] is JsonValue value && value.TryGetValue(out string? text))
                            obj[name] = $"******** ({text.Length}자, 마스킹)";
                        else
                            MaskProperties(obj[name]);
                    }
                    break;
                case JsonArray array:
                    foreach (JsonNode? item in array) MaskProperties(item);
                    break;
            }
        }

        private static bool TryParse(string body, out JsonNode? node)
        {
            try
            {
                node = JsonNode.Parse(body);
                return true;
            }
            catch (JsonException)
            {
                node = null;
                return false;
            }
        }
    }

    /*
     * [설계 51-3·51-4] API Demo의 HTTP 관찰 지점. PopupApiService·WpfLoginClient가 받는 HttpClient 안쪽에 끼워
     * 기존 요청 경로(헤더 부착·401 재시도·426 처리·DTO 역직렬화)를 바꾸지 않고 실제로 전송한 요청과 받은 응답을 그대로 기록한다.
     * 응답 본문은 버퍼에 읽어 둔 뒤 호출자가 다시 읽을 수 있게 한다. 기록은 메모리 이벤트로만 넘기고 파일에 쓰지 않는다(토큰 평문 보호).
     */
    public sealed class HttpExchangeRecorder : DelegatingHandler
    {
        public HttpExchangeRecorder(HttpMessageHandler innerHandler) : base(innerHandler) { }

        /// <summary>요청 1건이 끝날 때마다(성공·HTTP 오류·통신 실패 모두) 발생한다. 스레드 풀에서 올 수 있다.</summary>
        public event Action<HttpExchangeRecord>? Recorded;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            DateTimeOffset startedAt = DateTimeOffset.Now;
            string? requestBody = request.Content == null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            List<KeyValuePair<string, string>> headers = request.Headers
                .Concat(request.Content?.Headers ?? Enumerable.Empty<KeyValuePair<string, IEnumerable<string>>>())
                .Select(h => new KeyValuePair<string, string>(h.Key, string.Join(", ", h.Value)))
                .ToList();
            Stopwatch stopwatch = Stopwatch.StartNew();
            try
            {
                HttpResponseMessage response = await base.SendAsync(request, cancellationToken);
                await response.Content.LoadIntoBufferAsync(cancellationToken);
                string responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
                Publish(new HttpExchangeRecord(startedAt, request.Method.Method, request.RequestUri?.ToString() ?? string.Empty,
                    headers, requestBody, (int)response.StatusCode, response.ReasonPhrase, responseBody, stopwatch.ElapsedMilliseconds, null));
                return response;
            }
            catch (Exception exception)
            {
                // HttpClient.Timeout도 이 토큰의 취소로 들어오므로 여기서는 시간 초과와 취소를 구분하지 않는다.
                string error = exception is OperationCanceledException
                    ? "시간 초과 또는 취소" : $"{exception.GetType().Name}: {exception.Message}";
                Publish(new HttpExchangeRecord(startedAt, request.Method.Method, request.RequestUri?.ToString() ?? string.Empty,
                    headers, requestBody, null, null, null, stopwatch.ElapsedMilliseconds, error));
                throw;
            }
        }

        private void Publish(HttpExchangeRecord record)
        {
            try
            {
                Recorded?.Invoke(record);
            }
            catch (Exception exception)
            {
                // 관찰 실패가 실제 요청 흐름을 바꾸지 않게 한다.
                Debug.WriteLine($"[API-DEMO] HTTP 기록 실패: {exception.Message}");
            }
        }
    }
}
