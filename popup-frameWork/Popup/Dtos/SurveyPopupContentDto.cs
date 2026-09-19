using System.Collections.Generic;

namespace Popup.Dtos
{
    /*
     * SURVEY 또는 QUIZ 팝업의
     * content 영역 전체를 담는 DTO
     *
     * 일반 설문과 퀴즈가 같은
     * SurveyPopupView를 사용하므로
     * 공통 DTO 하나로 처리한다.
     */
    public class SurveyPopupContentDto
    {
        /*
         * 설문 또는 퀴즈 콘텐츠 내부 제목
         *
         * PopupWindow 공통 Header 제목과는 별개다.
         */
        public string SurveyTitle { get; set; } =
            string.Empty;

        /*
         * 제목 아래에 표시할 설명
         */
        public string Description { get; set; } =
            string.Empty;

        /*
         * 설문 또는 퀴즈에 표시할 문항 목록
         */
        public List<SurveyQuestionDto> Questions { get; set; } =
            new List<SurveyQuestionDto>();

        /*
         * 퀴즈 통과 점수
         *
         * 일반 설문에서는 사용하지 않는다.
         *
         * 예:
         * 80
         * → 80점 이상일 때 통과
         */
        public double PassingScore { get; set; }

        /*
         * 사용자가 제출하기 전에
         * 모든 필수 문항에 응답해야 하는지 여부
         * 
         * 현재 SurveyPopupView에서는
         * SurveyQuestionDto.IsRequired를 기준으로
         * 필수 문항 검증을 하고 있으므로
         * 나중에 정책 확장이 필요할 때 사용한다.
         */
        public bool ValidateRequiredQuestions { get; set; } =
            true;
    }
}