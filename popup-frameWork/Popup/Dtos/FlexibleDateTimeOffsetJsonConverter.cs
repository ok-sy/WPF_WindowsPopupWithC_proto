using System;
using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Popup.Dtos
{
    /*
     * Java 서버 날짜를 DateTimeOffset으로 변환한다.
     *
     * 기존 popup-api의 ISO 8601 문자열과
     * zero-server의 Unix epoch 초 숫자를 모두 지원해서
     * 서버 교체 중에도 같은 WPF DTO를 사용할 수 있게 한다.
     */
    public class FlexibleDateTimeOffsetJsonConverter
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

            if (reader.TokenType == JsonTokenType.Number &&
                reader.TryGetDecimal(out decimal epochSeconds))
            {
                long wholeSeconds =
                    decimal.ToInt64(decimal.Truncate(epochSeconds));

                long fractionalTicks =
                    decimal.ToInt64(
                        decimal.Truncate(
                            (epochSeconds - wholeSeconds) *
                            TimeSpan.TicksPerSecond));

                return DateTimeOffset
                    .FromUnixTimeSeconds(wholeSeconds)
                    .AddTicks(fractionalTicks);
            }

            throw new JsonException(
                "날짜 값은 ISO 8601 문자열 또는 Unix epoch 초 숫자여야 합니다.");
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
