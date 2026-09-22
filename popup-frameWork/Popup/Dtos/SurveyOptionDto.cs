namespace Popup.Dtos
{
    /*
     * 설문 또는 퀴즈의 선택지 하나를 담는 DTO
     *
     * SingleChoice
     * MultipleChoice
     * Rating5
     *
     * 문항에서 공통으로 사용한다.
     */
    public class SurveyOptionDto
    {
        /* 설문 제출 시 서버에 다시 전달할 선택지 고유 ID */
        public long OptionId { get; set; }

        /*
         * 서버와 주고받을 실제 선택지 값
         *
         * 예:
         * PHONE
         * EMAIL
         * 1
         * 2
         */
        public string Value { get; set; } =
            string.Empty;

        /*
         * 사용자 화면에 표시할 선택지 문구
         */
        public string Text { get; set; } =
            string.Empty;

        /*
         * [설계 12 §4 — 로컬 채점] 정답 선택지 여부.
         * 서버 PopupOptionDto.isCorrect. QUIZ 팝업에만 내려오며 그 외에는 null(필드 생략)이다.
         * 선택형 문항은 선택한 선택지 집합이 isCorrect=true 집합과 정확히 같을 때만 정답이다.
         */
        public bool? IsCorrect { get; set; }
    }
}
