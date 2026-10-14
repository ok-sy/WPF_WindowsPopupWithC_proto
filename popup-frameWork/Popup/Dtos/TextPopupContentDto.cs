using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Popup.Dtos
{
    public class TextPopupContentDto
    {
        // [설계 37] ContentTitle·Description·ShowContentHeader 삭제 — 콘텐츠 제목·설명은 서식 본문(TextBlocks) 앞 문단으로 작성한다.
        public string PlainText { get; set; } = string.Empty;
        // [설계 28] 서식 본문. 있으면 PlainText 대신 표시하고, 없으면(기존 데이터) PlainText를 표시한다.
        // [설계 48-5] 서식 값 타입 오류는 그 값만 기본값으로, 글자를 읽을 수 없는 구조 오류는 plainText 표시로 처리한다.
        [JsonConverter(typeof(LenientTextBlocksConverter))]
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
