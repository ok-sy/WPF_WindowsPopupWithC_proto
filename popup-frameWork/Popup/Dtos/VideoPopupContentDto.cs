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
         * [관리자 웹 옵션 정합성 — 2026-09-20] 아래 ShowControls·AllowFullScreen·AllowPlaybackRateChange·
         * AutoPlay·IsLoop·DefaultVolume 는 관리자 웹 "영상 재생" 섹션의 값이며, PopupFactory 가
         * VideoPopupView 생성자로 전달해 실제 재생 동작에 적용한다(이전에는 DTO 에만 보관되고 무시됐다).
         * JSON 에 키가 없을 때의 기본값은 웹 편집기의 기본 표시(autoPlay·isLoop 꺼짐, 나머지 켜짐)와 같다.
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
         * [설계 27] 진행바로 재생 위치를 변경(Seek)할 수 있는지 여부
         * false여도 진행률·시간 표시는 유지하고 앞/뒤 이동만 막는다.
         */
        public bool AllowSeek { get; set; } =
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
         * [설계 18 L-0 — C-7 삭제] content 안의 CompletionRatio·AllowCloseBeforeCompletion을 삭제했다.
         * 완료 비율과 완료 전 닫기 허용 여부는 계약 v3.0 §8.3대로 팝업 최상위 값
         * (PopupResponseDto.CompletionRatio·AllowCloseBeforeComplete)만 읽으며, content 쪽 값은 읽는 곳이 없었다.
         */
    }
}