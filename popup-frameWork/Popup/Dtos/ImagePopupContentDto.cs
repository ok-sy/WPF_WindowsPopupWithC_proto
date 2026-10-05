namespace Popup.Dtos
{
    // IMAGE content dimensions: window in ADAPTIVE, actual image DIP size in FIT_TO_IMAGE.
    public class ImagePopupContentDto
    {
        public string ImageTitle { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool ShowDescription { get; set; } = true;
        public string ImageSizeMode { get; set; } = "ADAPTIVE";
        public double? Width { get; set; }
        public double? Height { get; set; }
        public bool KeepAspectRatio { get; set; } = true;
        public string LinkUrl { get; set; } = string.Empty;
    }
}
