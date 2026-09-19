namespace Popup.Dtos
{
    /*
     * IMAGE 팝업의 content 영역을 담는 DTO
     *
     * 서버 JSON의 content 내부 값을
     * ImagePopupView 생성에 필요한 값으로 전달한다.
     */
    public class ImagePopupContentDto
    {
        /*
         * 이미지 콘텐츠 내부 제목
         *
         * PopupWindow 공통 Header 제목과는 별개다.
         */
        public string ImageTitle { get; set; } =
            string.Empty;

        /*
         * 표시할 이미지 경로 또는 URL
         *
         * 예:
         * https://example.com/image.jpg
         * C:\Images\notice.png
         */
        public string ImageUrl { get; set; } =
            string.Empty;

        /*
         * 이미지 아래 또는 오른쪽에 표시할 설명
         */
        public string Description { get; set; } =
            string.Empty;

        /*
         * 이미지 설명 영역 표시 여부
         */
        public bool ShowDescription { get; set; } =
            true;

        /*
         * 이미지 팝업 크기 계산 방식
         *
         * 서버 JSON 예:
         * FIXED
         * FIT_TO_IMAGE
         */
        public string ImageSizeMode { get; set; } =
            "FIXED";

        /*
         * 이미지 표시 영역에 사용할 요청 너비
         *
         * 값이 없거나 0이면
         * 이미지 원본 또는 기본 설정을 사용한다.
         */
        public double ImageWidth { get; set; }

        /*
         * 이미지 표시 영역에 사용할 요청 높이
         */
        public double ImageHeight { get; set; }

        /*
         * 이미지를 클릭했을 때 이동할 외부 URL
         *
         * 연결할 URL이 없으면 빈 문자열을 사용한다.
         */
        public string LinkUrl { get; set; } =
            string.Empty;
    }
}