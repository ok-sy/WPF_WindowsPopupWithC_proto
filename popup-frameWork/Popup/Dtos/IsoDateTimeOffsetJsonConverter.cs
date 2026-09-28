using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Popup.Dtos
{
    /*
     * WPF API 날짜(ISO 8601 문자열)를 DateTimeOffset으로 변환한다.
     *
     * [설계 18 L-5 — C-22] 예전 이름은 FlexibleDateTimeOffsetJsonConverter였고, 서버 교체기에
     * zero-server가 내리던 Unix epoch 초 숫자도 받았다. WPF API 3개는 모두 ISO 문자열
     * (서버 WpfJson.DATE_TIME)로 내리고 계약서도 string(ISO)로 정의하므로 숫자 분기를 삭제했다.
     * 요청 본문에 쓰는 형식(ISO "O")은 그대로다.
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
