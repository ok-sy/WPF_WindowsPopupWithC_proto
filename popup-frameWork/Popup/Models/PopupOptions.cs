using Popup.Dtos;
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

        /*
         * [기준 3·4] 기존 콜백 5개(HidePopupAsync·PopupDisplayedAsync·PopupClosedAsync·SubmitSurveyAsync·
         * SaveVideoProgressAsync)는 각각 서버 API를 즉시 호출했다. 이제 팝업 창 하나의 결과는 항목 1개로
         * 닫힐 때 한 번만 보내므로, 결과 항목을 넘기는 훅 2개로 통합한다. PopupWindow·View는 서버를 모른다.
         */

        /// <summary>
        /// 닫기·숨김·영상 시청 결과를 넘긴다. PopupResultQueue.EnqueueAndSendAsync에 연결되며
        /// 전송 실패는 큐가 보관하므로 예외를 던지지 않는다.
        /// </summary>
        public Func<WpfResultItemDto, Task>? ReportResultAsync { get; set; }

        /// <summary>
        /// 설문·퀴즈 제출처럼 사용자가 결과(통과 여부·거절 사유)를 바로 알아야 하는 항목을 즉시 전송하고
        /// 서버의 항목 응답을 돌려준다. PopupResultQueue.SendImmediateAsync에 연결된다.
        /// </summary>
        public Func<WpfResultItemDto, Task<WpfResultItemResponseDto>>? ReportResultImmediateAsync { get; set; }

        /// <summary>
        /// "다시 보지 않기" 체크 여부. PopupWindow가 닫히기 직전에 기록하고 PopupManager가 HIDDEN 항목을 만든다.
        /// (기존에는 PopupWindow가 닫기 전에 숨김 API를 직접 호출했다.)
        /// </summary>
        public bool DoNotShowAgainChecked { get; set; }

        /// <summary>서버가 내려준 숨김 일수(hideDays). null이면 PopupResultBuilder 기본값 30일.</summary>
        public int? HideDays { get; set; }

        /// <summary>팝업 유형 문자열(TEXT/IMAGE/VIDEO/SURVEY/QUIZ). 제출 결과 안내 문구 분기에 쓴다.</summary>
        public string PopupType { get; set; } = string.Empty;

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
