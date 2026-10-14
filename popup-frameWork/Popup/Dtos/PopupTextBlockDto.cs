using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Popup.Dtos
{
    /*
     * [설계 28] TEXT 본문 서식(content.textBlocks)의 문단.
     * runs의 text를 순서대로 이으면 문단 본문이 되고, 문단 사이는 줄바꿈이다. 문단 내부 줄바꿈은 text의 \n이다.
     */
    public class PopupTextBlockDto
    {
        public string Alignment { get; set; } = "LEFT";
        public List<PopupTextRunDto> Runs { get; set; } = new();
    }

    /*
     * 같은 서식이 이어진 글자 묶음. 서식 허용 정책은 서버가 검증하고, WPF는 표시 가능한 값만 반영한다(설계 48, PopupRichText.cs).
     */
    public class PopupTextRunDto
    {
        public string Text { get; set; } = string.Empty;
        public bool Bold { get; set; }
        public bool Italic { get; set; }
        public bool Underline { get; set; }
        public string? Color { get; set; }
        public double? Size { get; set; }
        public string? Font { get; set; }
    }

    /*
     * [설계 48-5] textBlocks 역직렬화 경계. 일반 역직렬화는 서식 값 하나의 JSON 타입 오류(예: size가 문자열)로
     * content 전체 변환을 실패시켜 팝업이 표시되지 않으므로, 이 속성만 직접 읽는다.
     *   - 서식 값 타입 오류(alignment·bold·italic·underline·color·size·font): 그 값만 기본값으로 둔다.
     *   - null 문단·null 구간: 글자가 없으므로 건너뛴다.
     *   - 글자를 읽을 수 없는 구조 오류(textBlocks가 배열이 아님, 문단·구간이 객체가 아님, runs가 배열이 아님,
     *     text가 문자열이 아님): 일부 글자만 빠진 서식 본문 대신 서식 본문 전체를 쓰지 않고(null)
     *     서버가 같은 본문에서 파생한 plainText를 표시한다.
     * plainText 등 content의 다른 값 자체가 타입 오류면 기존과 같이 content 변환 오류(팝업 조회 오류 처리)다.
     */
    public sealed class LenientTextBlocksConverter : JsonConverter<List<PopupTextBlockDto>?>
    {
        public override List<PopupTextBlockDto>? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            using JsonDocument document = JsonDocument.ParseValue(ref reader);
            return ReadBlocks(document.RootElement);
        }

        public override void Write(Utf8JsonWriter writer, List<PopupTextBlockDto>? value, JsonSerializerOptions options) =>
            JsonSerializer.Serialize(writer, value, options);

        internal static List<PopupTextBlockDto>? ReadBlocks(JsonElement blocks)
        {
            if (blocks.ValueKind != JsonValueKind.Array) return null;
            var result = new List<PopupTextBlockDto>();
            foreach (JsonElement block in blocks.EnumerateArray())
            {
                if (block.ValueKind == JsonValueKind.Null) continue;
                if (block.ValueKind != JsonValueKind.Object || !TryGet(block, "runs", out JsonElement runs) || runs.ValueKind != JsonValueKind.Array)
                    return null;
                var dto = new PopupTextBlockDto { Alignment = String(block, "alignment") ?? "LEFT" };
                foreach (JsonElement run in runs.EnumerateArray())
                {
                    if (run.ValueKind == JsonValueKind.Null) continue;
                    if (run.ValueKind != JsonValueKind.Object || !TryGet(run, "text", out JsonElement text) || text.ValueKind != JsonValueKind.String)
                        return null;
                    dto.Runs.Add(new PopupTextRunDto
                    {
                        Text = text.GetString()!,
                        Bold = True(run, "bold"),
                        Italic = True(run, "italic"),
                        Underline = True(run, "underline"),
                        Color = String(run, "color"),
                        Size = TryGet(run, "size", out JsonElement size) && size.ValueKind == JsonValueKind.Number && size.TryGetDouble(out double value) ? value : null,
                        Font = String(run, "font"),
                    });
                }
                result.Add(dto);
            }
            return result;
        }

        /* 서버 응답은 camelCase지만 기존 역직렬화(PropertyNameCaseInsensitive)와 같게 이름 대소문자를 구분하지 않는다. */
        private static bool TryGet(JsonElement element, string name, out JsonElement value)
        {
            foreach (JsonProperty property in element.EnumerateObject())
            {
                if (string.Equals(property.Name, name, StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }
            value = default;
            return false;
        }

        private static string? String(JsonElement element, string name) =>
            TryGet(element, name, out JsonElement value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;

        private static bool True(JsonElement element, string name) =>
            TryGet(element, name, out JsonElement value) && value.ValueKind == JsonValueKind.True;
    }
}
