using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Popup.Dtos
{
    /*
     * POL-09-01 : 3 API 순서
     * ■ ISO 날짜 JSON 변환기
     * - in : reader(Utf8JsonReader) 날짜 문자열 토큰 · value(DateTimeOffset) 직렬화 값
     * - out: DateTimeOffset · 예외: JsonException(문자열이 아니거나 형식 오류)
     * - WPF API 날짜(ISO 8601 문자열, 서버 WpfJson.DATE_TIME)를 DateTimeOffset으로 읽고, 요청 본문에는 ISO "O" 형식으로 쓴다.
     *   Unix epoch 숫자 입력은 받지 않는다(계약이 string(ISO)이므로 숫자 분기는 두지 않는다).
     */
    public class IsoDateTimeOffsetJsonConverter
        : JsonConverter<DateTimeOffset>
    {
        public override DateTimeOffset Read(
            ref Utf8JsonReader reader,
            Type typeToConvert,
            JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.String)
            {
                string? value = reader.GetString();

                if (DateTimeOffset.TryParse(
                        value,
                        CultureInfo.InvariantCulture,
                        DateTimeStyles.None,
                        out DateTimeOffset parsedValue))
                {
                    return parsedValue;
                }

                throw new JsonException(
                    $"날짜 문자열 형식이 올바르지 않습니다: {value}");
            }

            throw new JsonException(
                "날짜 값은 ISO 8601 문자열이어야 합니다.");
        }

        public override void Write(
            Utf8JsonWriter writer,
            DateTimeOffset value,
            JsonSerializerOptions options)
        {
            writer.WriteStringValue(
                value.ToString("O", CultureInfo.InvariantCulture));
        }
    }
}
