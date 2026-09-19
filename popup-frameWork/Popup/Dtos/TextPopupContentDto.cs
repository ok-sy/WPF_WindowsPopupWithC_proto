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
        public bool? MarkdownMode { get; set; }
        public string MarkdownContent { get; set; } = string.Empty;
    }
}
