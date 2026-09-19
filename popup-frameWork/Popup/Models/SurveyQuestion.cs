using System.Collections.Generic;

namespace Popup.Models
{
    /// <summary>
    /// 설문 질문 하나의 정보를 저장한다.
    /// </summary>
    public class SurveyQuestion
    {
        /// <summary>
        /// 질문을 구분하는 고유 값이다.
        /// 서버에 응답을 보낼 때 어떤 질문의 답인지 구분하는 데 사용한다.
        /// </summary>
        public long QuestionId { get; set; }

        /// <summary>
        /// 화면에 표시할 질문 문구다.
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// 질문 아래에 표시할 추가 설명이다.
        /// 설명이 필요하지 않으면 비워두면 된다.
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// 질문의 입력 방식을 지정한다.
        /// Rating5, SingleChoice, MultipleChoice, Text 중 하나다.
        /// </summary>
        public SurveyQuestionType QuestionType { get; set; }

        /// <summary>
        /// 필수 응답 문항인지 지정한다.
        /// true면 답하지 않고 제출할 수 없다.
        /// </summary>
        public bool IsRequired { get; set; }
        

        /*
         * 해당 질문을 채점할지 지정한다.
         *
         * false
         * → 일반 설문 문항
         * → 사용자의 응답만 수집하고 점수는 계산하지 않는다.
         *
         * true
         * → 퀴즈 문항
         * → CorrectAnswers와 사용자 응답을 비교하여 채점한다.
         */
        public bool IsScored { get; set; }

        /// <summary>
        /// 객관식 질문에서 표시할 보기 목록이다.
        /// Rating5는 보기가 없으면 1~5점을 자동으로 생성한다.
        /// Text 질문에서는 사용하지 않는다.
        /// </summary>
        public List<SurveyOption> Options { get; set; } = new();

        /*
         * QuizMode에서 사용할 정답 목록이다.
         *
         * SingleChoice, Rating5
         * → 정답 값 하나를 넣는다.
         *
         * MultipleChoice
         * → 정답 값 여러 개를 넣는다.
         *
         * 일반 설문에서는 비워둔다.
         *
         * 여기에 들어가는 값은
         * SurveyOption.Text가 아니라 SurveyOption.Value다.
         */
        public List<string> CorrectAnswers { get; set; } = new();

        


    }
}
