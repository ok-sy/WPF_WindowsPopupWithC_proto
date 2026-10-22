using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Popup.Dtos
{
    /*
     * POL-06-01 : 문항·서식
     * ■ SURVEY·QUIZ content DTO
     * - SURVEY 또는 QUIZ 팝업의 content 영역 전체를 담는다.
     * - 일반 설문과 퀴즈가 같은 SurveyPopupView를 사용하므로 공통 DTO 하나로 처리한다.
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

        // POL-06-01 : 문항·서식 — 콘텐츠 제목 서식(TEXT textBlocks와 같은 문단·구간 구조). 있으면 SurveyTitle 대신 표시하고, 없거나 비었거나 깨졌으면 SurveyTitle을 표시한다.
        [JsonConverter(typeof(LenientTextBlocksConverter))]
        public List<PopupTextBlockDto>? SurveyTitleBlocks { get; set; }

        // POL-06-01 : 문항·서식 — 콘텐츠 설명 서식(TEXT textBlocks와 같은 문단·구간 구조). 있으면 Description 대신 표시하고, 없거나 비었거나 깨졌으면 Description을 표시한다.
        [JsonConverter(typeof(LenientTextBlocksConverter))]
        public List<PopupTextBlockDto>? DescriptionBlocks { get; set; }

        /*
         * POL-06-02 : 선택·제출
         * 필수 응답 검증은 SurveyPopupView가 문항별 SurveyQuestionDto.IsRequired로만 판단한다(별도 ValidateRequiredQuestions 플래그 없음).
         * 문항과 통과 점수는 응답 최상위 questions / passingScore(PopupResponseDto)로만 받는다. content 안의 Questions·PassingScore는 읽지 않는다.
         */
    }
}