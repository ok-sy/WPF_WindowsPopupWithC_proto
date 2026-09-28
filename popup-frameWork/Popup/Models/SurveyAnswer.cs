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
        /// 객관식에서 사용자가 선택한 보기의 서버 OPTION_ID 목록이다.
        /// API 저장, QUIZ 채점, 필수 응답 검사가 모두 이 ID를 기준으로 한다.
        /// [설계 18 L-2] 구 데모 채점용이던 선택 값 목록(SelectedValues)은 삭제했다.
        /// </summary>
        public List<long> SelectedOptionIds { get; set; } = new();

        /// <summary>
        /// 주관식 질문에서 사용자가 입력한 내용이다.
        /// 객관식 질문에서는 비어 있다.
        /// </summary>
        public string TextAnswer { get; set; } = string.Empty;
    }
}
