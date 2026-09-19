using System.Collections.Generic;

namespace Popup.Models
{
    /// <summary>
    /// 사용자가 질문 하나에 입력한 응답을 저장한다.
    /// </summary>
    public class SurveyAnswer
    {
        /// <summary>
        /// 어떤 질문에 대한 답인지 구분하는 값이다.
        /// SurveyQuestion의 QuestionId와 연결된다.
        /// </summary>
        public long QuestionId { get; set; }

        /// <summary>
        /// 객관식에서 사용자가 선택한 값 목록이다.
        ///
        /// Rating5:
        /// "1" ~ "5" 중 하나가 들어간다.
        ///
        /// SingleChoice:
        /// 선택한 값 하나가 들어간다.
        ///
        /// MultipleChoice:
        /// 선택한 값 여러 개가 들어갈 수 있다.
        /// </summary>
        public List<string> SelectedValues { get; set; } = new();

        /// <summary>
        /// 객관식에서 사용자가 선택한 보기의 서버 OPTION_ID 목록이다.
        /// API는 화면 표시용 Value가 아니라 이 ID로 선택 보기를 저장한다.
        /// </summary>
        public List<long> SelectedOptionIds { get; set; } = new();

        /// <summary>
        /// 주관식 질문에서 사용자가 입력한 내용이다.
        /// 객관식 질문에서는 비어 있다.
        /// </summary>
        public string TextAnswer { get; set; } = string.Empty;
    }
}
