using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Popup.Dtos
{
    /*
     * POL-06-01 : 문항·서식
     * ■ 설문·퀴즈 선택지 DTO
     * - SingleChoice / MultipleChoice 문항에서 공통으로 사용하는 선택지 하나.
     * - 식별자(OptionId)·답변 값(Value)과 표시 서식(TextBlocks)을 구분한다.
     */
    public class SurveyOptionDto
    {
        /* 설문 제출 시 서버에 다시 전달할 선택지 고유 ID */
        public long OptionId { get; set; }

        /*
         * 서버와 주고받을 실제 선택지 값
         *
         * 예:
         * PHONE
         * EMAIL
         * 1
         * 2
         */
        public string Value { get; set; } =
            string.Empty;

        /*
         * 사용자 화면에 표시할 선택지 문구
         */
        public string Text { get; set; } =
            string.Empty;

        // POL-06-01 : 문항·서식 — 선택지 표시 문구 서식(TEXT textBlocks와 같은 문단·구간 구조). 있으면 Text 대신 표시하고, 없거나 비었거나 깨졌으면 Text을 표시한다.
        [JsonConverter(typeof(LenientTextBlocksConverter))]
        public List<PopupTextBlockDto>? TextBlocks { get; set; }

        /*
         * POL-06-02 : 선택·제출
         * 정답 선택지 여부(WPF 로컬 채점용).
         * 서버 PopupOptionDto.isCorrect. QUIZ 팝업에만 내려오며 그 외에는 null(필드 생략)이다.
         * 선택형 문항은 선택한 선택지 집합이 isCorrect=true 집합과 정확히 같을 때만 정답이다.
         */
        public bool? IsCorrect { get; set; }
    }
}
