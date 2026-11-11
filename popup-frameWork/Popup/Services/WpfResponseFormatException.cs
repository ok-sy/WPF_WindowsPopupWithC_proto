using System;
using System.Text.Json;

namespace Popup.Services
{
    /*
     * POL-12-04 : 통합 복구 주기 (TODO45 장애 결과, 2026-11-11)
     * ■ HTTP 2xx 응답 본문을 처리하지 못함(빈 본문·JSON 구문/형식 오류)
     * - Detail: 오류 내용과 JSON 위치(Path·Line·BytePosition). 원본 JSON 전체는 담지 않는다.
     * - DeliveryId·PopupId: 본문이 JSON 구문으로는 읽히면 popup.deliveryId·popup.popupId를 확보한 값(없으면 null).
     * InvalidOperationException을 상속해 결과 큐의 '잘못된 2xx 응답' 상한 처리와 기존 빈 본문 처리 경로를 그대로 탄다.
     * 팝업 조회에서 나면 MainWindow가 장애 결과(resultCode=400)를 만든다.
     */
    public sealed class WpfResponseFormatException : InvalidOperationException
    {
        public string Detail { get; }
        public string? DeliveryId { get; }
        public string? PopupId { get; }

        public WpfResponseFormatException(string detail, string? deliveryId, string? popupId, Exception? inner = null)
            : base("WPF 팝업 API 응답을 처리하지 못했습니다: " + detail, inner)
        {
            Detail = detail;
            DeliveryId = deliveryId;
            PopupId = popupId;
        }

        /// <summary>본문을 JSON 문서로 읽을 수 있으면 popup.deliveryId·popup.popupId를 꺼낸다. 구문 오류면 둘 다 null.</summary>
        public static (string? DeliveryId, string? PopupId) TryReadPopupIds(string? body)
        {
            if (string.IsNullOrWhiteSpace(body)) return (null, null);
            try
            {
                using JsonDocument document = JsonDocument.Parse(body);
                if (document.RootElement.ValueKind != JsonValueKind.Object) return (null, null);
                JsonElement popup = default;
                foreach (JsonProperty property in document.RootElement.EnumerateObject())
                {
                    if (property.Name.Equals("popup", StringComparison.OrdinalIgnoreCase)) popup = property.Value;
                }
                if (popup.ValueKind != JsonValueKind.Object) return (null, null);
                return (ReadString(popup, "deliveryId"), ReadString(popup, "popupId"));
            }
            catch (JsonException)
            {
                return (null, null);
            }
        }

        private static string? ReadString(JsonElement element, string name)
        {
            foreach (JsonProperty property in element.EnumerateObject())
            {
                if (property.Name.Equals(name, StringComparison.OrdinalIgnoreCase)
                    && property.Value.ValueKind == JsonValueKind.String)
                {
                    string? value = property.Value.GetString();
                    return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
                }
            }
            return null;
        }
    }
}
