using System.Collections.Generic;

namespace Popup.Models
{
    /// <summary>
    /// POL-06-01 : 문항·서식
    /// POL-06-02 : 선택·제출
    /// ■ 설문 질문 하나의 정보를 저장한다(PopupFactory가 SurveyQuestionDto에서 변환).
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

        /// <summary>POL-06-01 : 문항·서식 — 문항 제목·설명 서식. 있으면 Title·Description 대신 표시한다.</summary>
        public List<Popup.Dtos.PopupTextBlockDto>? TitleBlocks { get; set; }
        public List<Popup.Dtos.PopupTextBlockDto>? DescriptionBlocks { get; set; }

        /// <summary>
        /// 질문의 입력 방식을 지정한다.
        /// SingleChoice, MultipleChoice, Text 중 하나다.
        /// </summary>
        public SurveyQuestionType QuestionType { get; set; }

        /* 선택지 가로 배치 여부(optionLayout에서 변환) */
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
         * POL-06-02 : 선택·제출
         * 선택형 정답은 Options[].IsCorrect로만 판단한다(보기 value 목록으로 정답을 담지 않음).
         */

        /*
         * POL-06-02 : 선택·제출 — 로컬 채점용 서버 문항 배점(questionScore). null이면 0점.
         */
        public double? QuestionScore { get; set; }

        /*
         * POL-06-02 : 선택·제출 — 로컬 채점용 서술형 문항 정답과 일치 모드(EXACT/CONTAINS). 서버 규칙(PopupQuestionRules.matchesText)과 같다.
         */
        public string? CorrectAnswer { get; set; }
        public string? AnswerMatchMode { get; set; }

        /*
         * POL-06-02 : 선택·제출
         * 서버 문항의 minSelections·maxSelections(SURVEY 복수 선택 전용, null = 제한 없음).
         */
        public int? ConfiguredMinSelections { get; set; }
        public int? ConfiguredMaxSelections { get; set; }

        /*
         * POL-06-02 : 선택·제출
         * 복수 선택 문항의 최대 선택 수. QUIZ는 정답 선택지 수(서버가 QUIZ에만 options[].isCorrect를 내려준다),
         * 정답 키가 없는 SURVEY는 서버가 정한 maxSelections, 둘 다 없으면 null(제한 없음)이다.
         */
        public int? MaxSelections
        {
            get
            {
                if (QuestionType != SurveyQuestionType.MultipleChoice) return null;
                int correct = 0;
                foreach (SurveyOption option in Options)
                    if (option.IsCorrect == true) correct++;
                return correct > 0 ? correct : ConfiguredMaxSelections;
            }
        }

        /*
         * POL-06-02 : 선택·제출
         * 복수 선택 문항의 최소 선택 수. SURVEY의 minSelections만 쓰고 QUIZ(정답 키가 있는 문항)는 null이다.
         * 필수 문항은 max(1, 최소)개 이상, 선택 문항은 0개 또는 최소 이상이어야 제출할 수 있다.
         */
        public int? MinSelections
        {
            get
            {
                if (QuestionType != SurveyQuestionType.MultipleChoice) return null;
                foreach (SurveyOption option in Options)
                    if (option.IsCorrect == true) return null;
                return ConfiguredMinSelections;
            }
        }

        /* POL-06-02 : 선택·제출 — 응답 완료 여부(선택 수 count 기준). 필수 판정에 쓴다. */
        public bool IsAnsweredBy(int selectedCount, string? textAnswer) =>
            QuestionType == SurveyQuestionType.Text
                ? !string.IsNullOrWhiteSpace(textAnswer)
                : selectedCount >= System.Math.Max(1, MinSelections ?? 1);

        /* POL-06-02 : 선택·제출 — 선택했지만 최소 선택 수에 못 미쳤는지(필수·선택 문항 모두 제출 불가). */
        public bool IsBelowMinimum(int selectedCount) =>
            MinSelections is int min && selectedCount > 0 && selectedCount < min;
    }
}
