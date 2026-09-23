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
         * 서버 JSON 값과 의미([2026-09-23-03] 기준):
         *
         * ADAPTIVE
         * 팝업 width/height가 기준이다. 이미지는 팝업이 배정한 영역 안에
         * 비율을 유지한 채 맞춰진다. imageWidth/imageHeight는 최대 표시 크기로만 쓰고
         * 팝업 크기는 바꾸지 않는다.
         *
         * FIT_TO_IMAGE
         * 이미지 크기가 기준이다. imageWidth/imageHeight가 있으면 1순위로 쓰고
         * 없으면 원본 크기를 쓴 다음, 그 결과로 팝업 width/height를 다시 계산한다.
         *
         * FILL
         * 팝업 width/height가 기준이다. 이미지가 영역을 꽉 채우며
         * 제목·설명 없이 전체 배경형으로 표시된다(ImageFillPopupView 사용).
         *
         * FIXED
         * 과거 값이다. ADAPTIVE와 동일하게 처리한다.
         */
        public string ImageSizeMode { get; set; } =
            "FIXED";

        /*
         * 이미지 표시 영역에 사용할 요청 너비
         *
         * 값이 없거나 0이면
         * 이미지 원본 또는 기본 설정을 사용한다.
         *
         * ADAPTIVE에서는 최대 표시 너비,
         * FIT_TO_IMAGE에서는 실제 표시 너비로 사용한다.
         */
        public double ImageWidth { get; set; }

        /*
         * 이미지 표시 영역에 사용할 요청 높이
         *
         * ImageWidth와 같은 기준으로 적용한다.
         */
        public double ImageHeight { get; set; }

        /*
         * 설명 영역 배치 방식.
         * AUTO: 이미지 비율에 따라 RIGHT/BOTTOM 자동 선택
         * RIGHT: 이미지 오른쪽 / BOTTOM: 이미지 아래
         * ADAPTIVE/FIT_TO_IMAGE에서 공통으로 사용한다.
         */
        public string DescriptionPosition { get; set; } = "AUTO";

        /*
         * 이미지/설명 영역 비율. 0.75면 이미지 75%, 설명 25%.
         * 0.5~0.9 범위 밖의 값은 WPF에서 기본값 0.75로 보정한다.
         */
        public double ImageAreaRatio { get; set; } = 0.75;

        /*
         * 이미지를 클릭했을 때 이동할 외부 URL
         *
         * 연결할 URL이 없으면 빈 문자열을 사용한다.
         */
        public string LinkUrl { get; set; } =
            string.Empty;
    }
}