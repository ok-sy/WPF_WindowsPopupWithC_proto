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
         * RATING5
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
         * 정답 값 목록
         *
         * 로컬 테스트에서는 사용할 수 있지만
         * 운영 환경에서는 클라이언트로 내려주지 않는 게 안전하다.
         */
        public List<string> CorrectAnswers { get; set; } =
            new List<string>();
    }
}
