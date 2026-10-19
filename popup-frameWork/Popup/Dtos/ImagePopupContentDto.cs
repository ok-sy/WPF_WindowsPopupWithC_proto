namespace Popup.Dtos
{
    // [TODO58] 크기는 content.width/height가 아니라 최상위 popup.width/height다(PopupResponseDto). 구 서버 값은 PopupFactory가 임시로 읽는다.
    public class ImagePopupContentDto
    {
        public string ImageTitle { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool ShowDescription { get; set; } = true;
        public string ImageSizeMode { get; set; } = "ADAPTIVE";
        public bool KeepAspectRatio { get; set; } = true;
    }
}
