using Popup.Dtos;
using System;
using System.Text;

namespace Popup.Services
{
    /*
     * POL-12-04 : 통합 복구 주기 (TODO45 장애 결과, 2026-11-11)
     * ■ 장애 결과 생성
     * - in : 확보한 deliveryId·popupId(없으면 null) · 오류 설명
     * - out: resultCode=400·resultDesc(UTF-8 1,000 Byte 이하) 결과 항목. resultType은 null(임의 CLOSED 금지)
     * - 받은 조회 응답을 처리하지 못한 경우(빈 본문·JSON 오류·표시 변환 실패)에 만든다. 사용자 처리 결과가 아니라
     *   서버는 완료·숨김을 바꾸지 않고, deliveryId가 있으면 그 전달 건만 오류로 종료한다.
     *   resultId·본문은 여기서 한 번 확정되고 재전송 때 다시 만들지 않는다.
     */
    public static class PopupErrorResult
    {
        /// <summary>장애 결과 코드(조회 응답 처리 불가).</summary>
        public const int ResponseUnprocessable = 400;

        /// <summary>resultDesc 최대 길이(UTF-8 Byte). 저장 규격 VARCHAR2(1000 BYTE).</summary>
        public const int MaxDescBytes = 1000;

        public static WpfResultItemDto Create(string? deliveryId, string? popupId, string description)
        {
            return new WpfResultItemDto
            {
                DeliveryId = string.IsNullOrWhiteSpace(deliveryId) ? null : deliveryId.Trim(),
                PopupId = string.IsNullOrWhiteSpace(popupId) ? null : popupId.Trim(),
                ResultType = null,
                ResultCode = ResponseUnprocessable,
                ResultDesc = TruncateUtf8(string.IsNullOrWhiteSpace(description) ? "응답 처리 실패" : description.Trim(), MaxDescBytes),
                ClosedAt = DateTimeOffset.Now
            };
        }

        /// <summary>
        /// UTF-8 maxBytes 이하로 자른다. 문자(서로게이트 쌍 포함)를 중간에서 자르지 않는다.
        /// 앞쪽에 핵심 오류·JSON 위치를 두므로 뒤를 자른다.
        /// </summary>
        public static string TruncateUtf8(string text, int maxBytes)
        {
            if (Encoding.UTF8.GetByteCount(text) <= maxBytes) return text;
            var builder = new StringBuilder();
            int bytes = 0;
            foreach (Rune rune in text.EnumerateRunes())
            {
                int length = rune.Utf8SequenceLength;
                if (bytes + length > maxBytes) break;
                builder.Append(rune.ToString());
                bytes += length;
            }
            return builder.ToString();
        }
    }
}
