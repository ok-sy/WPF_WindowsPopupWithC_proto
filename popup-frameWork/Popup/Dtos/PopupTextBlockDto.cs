using System.Collections.Generic;

namespace Popup.Dtos
{
    /*
     * [설계 28] TEXT 본문 서식(content.textBlocks)의 문단.
     * runs의 text를 순서대로 이으면 문단 본문이 되고, 문단 사이는 줄바꿈이다. 문단 내부 줄바꿈은 text의 \n이다.
     */
    public class PopupTextBlockDto
    {
        public string Alignment { get; set; } = "LEFT";
        public List<PopupTextRunDto> Runs { get; set; } = new();
    }

    /*
     * 같은 서식이 이어진 글자 묶음. 서식 값은 허용 목록(서버 PopupRichText.java·관리자 popupRichText.ts와 동일)만 표시에 반영한다.
     */
    public class PopupTextRunDto
    {
        public string Text { get; set; } = string.Empty;
        public bool Bold { get; set; }
        public bool Italic { get; set; }
        public bool Underline { get; set; }
        public string? Color { get; set; }
        public double? Size { get; set; }
        public string? Font { get; set; }
    }
}
