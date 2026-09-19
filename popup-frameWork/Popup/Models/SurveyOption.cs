namespace Popup.Models
{
    /// <summary>
    /// 객관식 질문에 표시되는 보기 하나를 나타낸다.
    /// </summary>
    public class SurveyOption
    {
        /// <summary>서버 POPUP_OPTION의 고유 ID다.</summary>
        public long OptionId { get; set; }

        /// <summary>
        /// 서버나 프로그램에서 사용하는 실제 값이다.
        /// 예: "1", "M", "EMAIL"
        /// </summary>
        public string Value { get; set; } = string.Empty;

        /// <summary>
        /// 화면에서 사용자에게 보여줄 문구다.
        /// 예: "매우 만족", "남성", "이메일"
        /// </summary>
        public string Text { get; set; } = string.Empty;
    }
}
