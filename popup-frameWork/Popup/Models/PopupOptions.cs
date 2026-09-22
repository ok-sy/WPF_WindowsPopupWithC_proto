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
         * 닫힐 때 한 번만 보낸다. PopupWindow·View는 서버를 모른다.
         *
         * [설계 12] 제출 응답을 기다리던 훅(ReportResultImmediateAsync)은 제거했다. 닫기·숨김·영상·제출 모두
         * 아래 훅 2개로 "로컬 큐 저장 → 창 닫기 → 백그라운드 전송" 경로를 탄다.
         */

        /// <summary>
        /// 결과 항목을 로컬 큐(pending-results.json)에 저장한다. PopupResultQueue.EnqueueAsync에 연결된다.
        /// 완료(await) 시점에 결과가 파일에 보존되므로 그 뒤에 창을 닫아도 유실되지 않는다. 서버 전송은 하지 않는다.
        /// </summary>
        public Func<WpfResultItemDto, Task>? EnqueueResultAsync { get; set; }

        /// <summary>
        /// 보관된 결과를 백그라운드로 서버에 전송한다(예외는 안에서 처리). PopupResultQueue.FlushInBackground에 연결된다.
        /// 창을 닫은 뒤 호출하며 UI는 기다리지 않는다.
        /// </summary>
        public Action? FlushResultsInBackground { get; set; }

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

        /*
         * [설계 14 §5] Header / 본문 / Footer 폰트 크기.
         * 관리자 웹이 content(CONTENT_OPTIONS JSON)의 headerFontSize/bodyFontSize/footerFontSize로 저장하고
         * 서버 목록 응답의 content를 통해 그대로 내려온다(별도 DB 컬럼·Java DTO 변경 없음 — Overlay 옵션과 같은 경로).
         * null이면 "관리자가 설정하지 않음"이며 PopupWindow·각 콘텐츠 View는 기존 XAML 기본 크기를 그대로 쓴다(기존 데이터 호환 §5.8).
         * 값이 있어도 PopupWindow가 FontSizeMin~FontSizeMax로 최종 Clamp 하므로 서버 값을 그대로 신뢰하지 않는다(§5.7).
         */
        public double? HeaderFontSize { get; set; }
        public double? BodyFontSize { get; set; }
        public double? FooterFontSize { get; set; }

        /// <summary>[설계 14 §5.7] WPF 최종 방어 범위. 관리자 웹 입력 범위(10~40)와 같다.</summary>
        public const double FontSizeMin = 10;
        public const double FontSizeMax = 40;

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
