using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Popup.Dtos
{
    /*
     * POL-03-01 : 저장·표시 경계
     * ■ TEXT 팝업 content DTO
     * - 서식 본문(TextBlocks)이 있으면 그것을, 없으면 PlainText를 표시한다. 하단 설명은 표시 플래그로 켠다.
     */
    public class TextPopupContentDto
    {
        // POL-03-01 : 저장·표시 경계 — 별도 콘텐츠 제목·설명 필드는 없다. 제목·설명은 서식 본문(TextBlocks) 앞 문단으로 작성한다.
        public string PlainText { get; set; } = string.Empty;
        // POL-03-01 : 저장·표시 경계 — 서식 본문. 있으면 PlainText 대신 표시하고, 없으면(기존 데이터) PlainText를 표시한다.
        // 서식 값 타입 오류는 그 값만 기본값으로, 글자를 읽을 수 없는 구조 오류는 plainText 표시로 처리한다(LenientTextBlocksConverter).
        [JsonConverter(typeof(LenientTextBlocksConverter))]
        public List<PopupTextBlockDto>? TextBlocks { get; set; }
        public bool ShowPlainText { get; set; } = true;
        public string BottomDescription { get; set; } = string.Empty;
        public string BottomDescriptionUrl { get; set; } = string.Empty;
        public bool ShowBottomDescription { get; set; }
        // POL-03-01 : 저장·표시 경계 — MarkdownMode / MarkdownContent 필드는 없다(markdown 모드 미사용). 서버 JSON에 남아 있어도 무시된다.
        // POL-03-01 : 저장·표시 경계 — 강조 문구 HighlightText / ShowHighlight 필드는 삭제했다(2026-10-29). 기존 데이터에 남아 있어도 무시된다.
    }
}
