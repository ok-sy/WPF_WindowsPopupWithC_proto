using System.Windows;
using System;
using System.Threading.Tasks;


namespace Popup.Models
{
    /* 팝업 창의 크기를 결정하는 방식이다. */
    public enum PopupSizeMode
    {
        Fixed,
        ViewportRatio,
        Fullscreen,
        Auto
    }

    /* 여러 팝업이 조회됐을 때 팝업을 표시하는 방식이다. */
    public enum PopupDisplayMode
    {
        Sequential,
        Simultaneous
    }

    public class PopupOptions
    {
        public string PopupId { get; set; } = string.Empty;

        public Func<string, int, Task>? HidePopupAsync { get; set; }
        public Func<string, Task>? PopupDisplayedAsync { get; set; }
        public Func<string, Task>? PopupClosedAsync { get; set; }
        public Func<string, List<SurveyAnswer>, Task>? SubmitSurveyAsync { get; set; }
        public Func<string, VideoProgressSnapshot, Task<bool>>? SaveVideoProgressAsync { get; set; }

        public double CompletionRatio { get; set; } = 1.0;
        public bool AllowCloseBeforeComplete { get; set; } = true;
        public bool IsCompleted { get; set; }

        public string Title { get; set; } = string.Empty;
        public FrameworkElement? Content { get; set; }

        public PopupDisplayMode DisplayMode { get; set; } = PopupDisplayMode.Sequential;
        public int DisplayOrder { get; set; } = 100;

        public bool ShowHeader { get; set; } = true;
        public bool ShowCloseButton { get; set; } = true;
        public bool ShowFooter { get; set; } = true;
        public bool ShowDoNotShowAgain { get; set; } = true;

        /*
         * 팝업이 표시되는 동안 모든 모니터에 배경 Overlay를 표시할지 결정한다.
         * Overlay Window가 마우스 입력을 받아 뒤쪽 프로그램의 클릭을 막는다.
         * 키보드 입력(Alt+Tab 등)은 이 옵션에서 차단하지 않는다.
         */
        public bool UseBackgroundOverlay { get; set; } = true;

        /*
         * 배경 Overlay의 불투명도다.
         * 0.0 = 완전 투명, 1.0 = 완전 불투명.
         * PopupManager에서 실제 적용 전에 0~1 범위로 보정한다.
         */
        public double BackgroundOverlayOpacity { get; set; } = 0.45;

        public PopupSizeMode SizeMode { get; set; } = PopupSizeMode.Fixed;
        public double Width { get; set; } = 900;
        public double Height { get; set; } = 620;
        public double WidthRatio { get; set; } = 0.7;
        public double HeightRatio { get; set; } = 0.75;
        public double MinimumWidth { get; set; } = 480;
        public double MinimumHeight { get; set; } = 320;
        public double MaximumWidth { get; set; } = 1200;
        public double MaximumHeight { get; set; } = 900;
    }
}
