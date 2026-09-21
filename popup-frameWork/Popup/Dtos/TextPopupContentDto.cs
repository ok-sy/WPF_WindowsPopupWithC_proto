namespace Popup.Dtos
{
    public class TextPopupContentDto
    {
        public string ContentTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool ShowContentHeader { get; set; } = true;
        public string PlainText { get; set; } = string.Empty;
        public bool ShowPlainText { get; set; } = true;
        public string HighlightText { get; set; } = string.Empty;
        public bool? ShowHighlight { get; set; }
        public string BottomDescription { get; set; } = string.Empty;
        public string BottomDescriptionUrl { get; set; } = string.Empty;
        public bool? ShowBottomDescription { get; set; }
        // [2026-09-21 제거] MarkdownMode / MarkdownContent — markdown 모드를 쓰지 않기로 해 삭제. 서버 JSON에 남아 있어도 무시된다.
    }
}
