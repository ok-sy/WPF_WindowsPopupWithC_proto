namespace Popup.Models
{
    /// <summary>
    /// VideoPopupView가 측정한 현재 영상 시청 상태다.
    /// 화면은 사용자 ID나 API 주소를 모르고 순수한 재생 정보만 전달한다.
    /// </summary>
    public class VideoProgressSnapshot
    {
        public decimal DurationSeconds { get; set; }
        public decimal PositionSeconds { get; set; }
        public decimal MaximumPositionSeconds { get; set; }
        public decimal WatchedSeconds { get; set; }
    }
}
