using System.Collections.Generic;

namespace Popup.Models
{
    /// <summary>
    /// POL-06-01 : 문항·서식
    /// ■ 객관식 질문에 표시되는 보기 하나를 나타낸다.
    /// </summary>
    public class SurveyOption
    {
        /// <summary>서버 POPUP_OPTION의 고유 ID다.</summary>
        public long OptionId { get; set; }

        // POL-06-01 : 문항·서식 — 계약 필드 options[].value는 SurveyOptionDto.Value로 받기만 하고 화면·결과에서 쓰지 않아
        // 모델에는 Value를 두지 않는다. 응답은 OptionId로 보낸다.

        /// <summary>
        /// 화면에서 사용자에게 보여줄 문구다.
        /// 예: "매우 만족", "남성", "이메일"
        /// </summary>
        public string Text { get; set; } = string.Empty;

        /// <summary>POL-06-01 : 문항·서식 — 선택지 문구 서식. 있으면 Text 대신 표시하며 접근성 이름·채점·응답은 Text·OptionId를 그대로 쓴다.</summary>
        public List<Popup.Dtos.PopupTextBlockDto>? TextBlocks { get; set; }

        /// <summary>POL-06-02 : 선택·제출 — 로컬 채점용 정답 선택지 여부. 서버가 QUIZ에만 내려주며 그 외 null.</summary>
        public bool? IsCorrect { get; set; }
    }
}
