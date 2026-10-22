namespace Popup.Dtos
{
    /*
     * POL-04-01 : 공통 크기 입력
     * ■ IMAGE 팝업 content DTO
     * - 크기는 content.width/height가 아니라 최상위 popup.width/height(PopupResponseDto)다.
     *   구 서버가 보낸 content.width/height는 PopupFactory가 최상위 축이 없을 때만 호환 경로로 읽는다.
     */
    public class ImagePopupContentDto
    {
        /* 이미지 제목(대체 문구) */
        public string ImageTitle { get; set; } = string.Empty;
        /* 이미지 주소 */
        public string ImageUrl { get; set; } = string.Empty;
        /* 이미지 아래 설명 */
        public string Description { get; set; } = string.Empty;
        /* 설명 표시 여부. 기본 true */
        public bool ShowDescription { get; set; } = true;
        /* POL-04-02 : 모드별 기준 — ADAPTIVE / FIT_TO_IMAGE / ORIGINAL. 기본 ADAPTIVE */
        public string ImageSizeMode { get; set; } = "ADAPTIVE";
        /* POL-04-03 : 비율·상한 — FIT_TO_IMAGE 비율 고정(Uniform) 여부. 기본 true */
        public bool KeepAspectRatio { get; set; } = true;
    }
}
