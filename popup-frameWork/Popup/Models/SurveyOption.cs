using System.Collections.Generic;

namespace Popup.Models
{
    /// <summary>
    /// 객관식 질문에 표시되는 보기 하나를 나타낸다.
    /// </summary>
    public class SurveyOption
    {
        /// <summary>서버 POPUP_OPTION의 고유 ID다.</summary>
        public long OptionId { get; set; }

        // [설계 50-B] 계약 필드 options[].value는 SurveyOptionDto.Value로 받기만 하고 화면·결과에서 쓰지 않아
        // 모델 복사본(Value)은 삭제했다. 응답은 OptionId로 보낸다.

        /// <summary>
        /// 화면에서 사용자에게 보여줄 문구다.
        /// 예: "매우 만족", "남성", "이메일"
        /// </summary>
        public string Text { get; set; } = string.Empty;

        /// <summary>[TODO55] 선택지 문구 서식. 있으면 Text 대신 표시하며 접근성 이름·채점·응답은 Text·OptionId를 그대로 쓴다.</summary>
        public List<Popup.Dtos.PopupTextBlockDto>? TextBlocks { get; set; }

        /// <summary>[설계 12 §4 — 로컬 채점] 정답 선택지 여부. 서버가 QUIZ에만 내려주며 그 외 null.</summary>
        public bool? IsCorrect { get; set; }
    }
}
