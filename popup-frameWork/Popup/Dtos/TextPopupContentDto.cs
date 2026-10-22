using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace Popup.Dtos
{
    /*
     * POL-03-01 : 저장·표시 경계
     * ■ TEXT 팝업 content DTO
     * - 서식 본문(TextBlocks)이 있으면 그것을, 없으면 PlainText를 표시한다. 강조 문구·하단 설명은 표시 플래그로 켠다.
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
        public string HighlightText { get; set; } = string.Empty;
        // POL-01-02 : 기본값의 적용 — 강조 문구 표시 여부. 값이 없으면 표시하지 않는다(문구 유무로 추정하지 않음).
        // 표시 플래그가 없던 기존 행은 08 스크립트가 같은 규칙으로 플래그를 채웠다.
        public bool ShowHighlight { get; set; }
        public string BottomDescription { get; set; } = string.Empty;
        public string BottomDescriptionUrl { get; set; } = string.Empty;
        public bool ShowBottomDescription { get; set; }
        // POL-03-01 : 저장·표시 경계 — MarkdownMode / MarkdownContent 필드는 없다(markdown 모드 미사용). 서버 JSON에 남아 있어도 무시된다.
    }
}
