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
    }
}
