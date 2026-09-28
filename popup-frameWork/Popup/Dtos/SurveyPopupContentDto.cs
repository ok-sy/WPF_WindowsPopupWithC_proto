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
         * [설계 18 L-0 — C-8 삭제] 읽는 곳이 없던 ValidateRequiredQuestions 플래그를 삭제했다.
         * 필수 응답 검증은 SurveyPopupView가 문항별 SurveyQuestionDto.IsRequired로만 판단한다.
         * (Questions·PassingScore는 데모 JSON v3 전환(L-2) 전까지 구형 content fallback으로 유지)
         */
    }
}