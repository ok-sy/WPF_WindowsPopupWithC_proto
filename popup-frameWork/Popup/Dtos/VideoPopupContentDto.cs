namespace Popup.Dtos
{
    /*
     * VIDEO 팝업의 content 영역을 담는 DTO
     *
     * 서버 JSON의 영상 관련 값을
     * VideoPopupView 생성에 필요한 형태로 전달한다.
     */
    public class VideoPopupContentDto
    {
        /*
         * 영상 콘텐츠 내부 제목
         *
         * PopupWindow 공통 Header 제목과는 별개다.
         */
        public string VideoTitle { get; set; } =
            string.Empty;

        /*
         * 영상 파일 경로 또는 영상 URL
         *
         * 예:
         * C:\Videos\education.mp4
         * https://example.com/video.mp4
         * https://www.youtube.com/watch?v=...
         */
        public string VideoUrl { get; set; } =
            string.Empty;

        /*
         * 영상 아래에 표시할 설명
         */
        public string Description { get; set; } =
            string.Empty;

        /*
         * 영상 설명 영역 표시 여부
         */
        public bool ShowDescription { get; set; } =
            true;

        /*
         * 영상 컨트롤바 표시 여부
         *
         * 현재 VideoPopupView가 항상 컨트롤바를 사용한다면
         * 나중에 연결하기 전까지는 DTO에만 보관한다.
         */
        public bool ShowControls { get; set; } =
            true;

        /*
         * 사용자가 영상 전체화면 기능을
         * 사용할 수 있는지 여부
         */
        public bool AllowFullScreen { get; set; } =
            true;

        /*
         * 사용자가 배속을 변경할 수 있는지 여부
         */
        public bool AllowPlaybackRateChange { get; set; } =
            true;

        /*
         * 영상 시작 시 자동 재생 여부
         */
        public bool AutoPlay { get; set; }

        /*
         * 영상 반복 재생 여부
         */
        public bool IsLoop { get; set; }

        /*
         * 기본 음량
         *
         * 0.0
         * → 음소거
         *
         * 1.0
         * → 최대 음량
         */
        public double DefaultVolume { get; set; } =
            0.7;

        /*
         * 영상 시청 완료로 인정할 최소 비율
         *
         * 예:
         * 0.9
         * → 전체 영상의 90% 이상 재생 시 완료 처리
         */
        public double CompletionRatio { get; set; } =
            0.9;

        /*
         * 영상 완료 전 팝업을 닫을 수 있는지 여부
         */
        public bool AllowCloseBeforeCompletion { get; set; } =
            true;
    }
}