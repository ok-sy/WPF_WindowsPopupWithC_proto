using System.Collections.Generic;

namespace Popup.Dtos
{
    public class TextPopupContentDto
    {
        public string ContentTitle { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool ShowContentHeader { get; set; } = true;
        public string PlainText { get; set; } = string.Empty;
        // [설계 28] 서식 본문. 있으면 PlainText 대신 표시하고, 없으면(기존 데이터) PlainText를 표시한다.
        public List<PopupTextBlockDto>? TextBlocks { get; set; }
        public bool ShowPlainText { get; set; } = true;
        public string HighlightText { get; set; } = string.Empty;
        // [설계 18 L-4 — C-23] 표시 플래그 도입 전 행용 null fallback(문구가 있으면 표시)을 삭제했다.
        // 기존 행은 08 스크립트가 같은 규칙으로 플래그를 채웠다. 값이 없으면 표시하지 않는다.
        public bool ShowHighlight { get; set; }
        public string BottomDescription { get; set; } = string.Empty;
        public string BottomDescriptionUrl { get; set; } = string.Empty;
        public bool ShowBottomDescription { get; set; }
        // [2026-09-21 제거] MarkdownMode / MarkdownContent — markdown 모드를 쓰지 않기로 해 삭제. 서버 JSON에 남아 있어도 무시된다.
    }
}
