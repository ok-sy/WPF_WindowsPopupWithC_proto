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
         * [설계 18 L-0 — C-8 삭제] 읽는 곳이 없던 ValidateRequiredQuestions 플래그를 삭제했다.
         * 필수 응답 검증은 SurveyPopupView가 문항별 SurveyQuestionDto.IsRequired로만 판단한다.
         * [설계 18 L-2 — C-14·C-15 삭제] 문항과 통과 점수는 응답 최상위 questions / passingScore
         * (PopupResponseDto)로만 받는다. content 안의 구형 Questions·PassingScore는 삭제했다.
         */
    }
}