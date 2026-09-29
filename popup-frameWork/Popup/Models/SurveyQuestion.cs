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
        /// SingleChoice, MultipleChoice, Text 중 하나다.
        /// </summary>
        public SurveyQuestionType QuestionType { get; set; }

        public bool HorizontalOptions { get; set; }

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
         * → 보기의 IsCorrect(서술형은 CorrectAnswer)와 사용자 응답을 비교하여 채점한다.
         */
        public bool IsScored { get; set; }

        /// <summary>
        /// 객관식 질문에서 표시할 보기 목록이다.
        /// Text 질문에서는 사용하지 않는다.
        /// </summary>
        public List<SurveyOption> Options { get; set; } = new();

        /*
         * [설계 18 L-2 — C-16] 보기 value 목록으로 정답을 담던 CorrectAnswers를 삭제했다.
         * 선택형 정답은 Options[].IsCorrect로만 판단한다.
         */

        /*
         * [설계 12 §4 — 로컬 채점] 서버 문항 배점(questionScore). null이면 0점(설계 18 L-2 — C-17).
         */
        public double? QuestionScore { get; set; }

        /*
         * [설계 12 §4 — 로컬 채점] 서술형 문항 정답과 일치 모드(EXACT/CONTAINS). 서버 규칙(PopupQuestionRules.matchesText)과 같다.
         */
        public string? CorrectAnswer { get; set; }
        public string? AnswerMatchMode { get; set; }
    }
}
