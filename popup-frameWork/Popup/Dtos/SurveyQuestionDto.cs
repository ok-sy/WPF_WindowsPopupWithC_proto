using System.Collections.Generic;

namespace Popup.Dtos
{
    /*
     * 설문 또는 퀴즈의 질문 하나를 담는 DTO
     *
     * 서버 JSON의 questions 배열 안에 들어가는
     * 문항 한 건과 대응한다.
     */
    public class SurveyQuestionDto
    {
        /*
         * 질문 고유 번호
         *
         * 응답 제출 시 어떤 질문의 답인지
         * 구분하는 데 사용한다.
         */
        public long QuestionId { get; set; }

        public string? OptionLayout { get; set; } = "VERTICAL";

        /*
         * 화면에 표시할 질문 제목
         */
        public string Title { get; set; } =
            string.Empty;

        /*
         * 질문 제목 아래에 표시할 부가 설명
         */
        public string Description { get; set; } =
            string.Empty;

        /*
         * 질문 유형
         *
         * 서버 JSON 예:
         * SINGLE_CHOICE
         * MULTIPLE_CHOICE
         * TEXT
         */
        public string QuestionType { get; set; } =
            string.Empty;

        /*
         * 필수 응답 여부
         */
        public bool IsRequired { get; set; }

        /*
         * 객관식 또는 평가형 문항의 선택지 목록
         *
         * 주관식 문항은 빈 배열로 전달한다.
         */
        public List<SurveyOptionDto> Options { get; set; } =
            new List<SurveyOptionDto>();

        /*
         * 퀴즈에서 채점 대상인지 여부
         *
         * 일반 설문에서는 false로 사용한다.
         */
        public bool IsScored { get; set; }

        /*
         * [설계 18 L-2 — C-16 삭제] 구 데모 JSON의 정답 값 목록(correctAnswers)을 삭제했다.
         * 정답은 options[].isCorrect / correctAnswer / answerMatchMode 로만 받는다.
         */

        /*
         * [설계 12 §4 — 로컬 채점] 문항 배점.
         * 서버 PopupQuestionDto.questionScore. 정답이면 이 점수를 전부 얻고 부분 점수는 없다(서버 gradeAnswer와 같은 규칙).
         * null이면 0점으로 계산한다(설계 18 L-2 — C-17. 서버는 QUIZ 저장 시 배점을 필수로 검증한다).
         */
        public double? QuestionScore { get; set; }

        /*
         * [설계 12 §4 — 로컬 채점] 서술형(TEXT) 문항의 정답 문자열과 일치 모드(EXACT / CONTAINS).
         * 서버가 QUIZ 팝업에만 내려주며(WpfPopupService), SURVEY·비채점 문항에서는 null이다.
         */
        public string? CorrectAnswer { get; set; }
        public string? AnswerMatchMode { get; set; }
    }
}
