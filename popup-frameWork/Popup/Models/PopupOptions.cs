using Popup.Dtos;
using System.Windows;
using System;


namespace Popup.Models
{
    /* 팝업 창의 크기를 결정하는 방식이다(JSON sizeMode FIXED / RATIO / FULLSCREEN / AUTO). */
    public enum PopupSizeMode
    {
        Fixed,
        ViewportRatio,
        Fullscreen,
        Auto
    }

    /* POL-01-02 : 기본값의 적용 — 팝업 위치(JSON popupPosition). 기본·미지원 값은 Center. */
    public enum PopupPosition { Center, TopLeft, TopCenter, TopRight, CenterLeft, CenterRight, BottomLeft, BottomCenter, BottomRight }

    /*
     * POL-02-03 : 푸터 역할
     * 공통 Footer 버튼 동작(JSON footerAction).
     * Close = '닫기', LinkAndClose = '바로가기'(footerLinkUrl을 연 뒤 닫기), Submit = '제출'(SURVEY/QUIZ 고정).
     */
    public enum PopupFooterAction { Close, LinkAndClose, Submit }

    /*
     * POL-01-01 : 공통 옵션의 위치
     * ■ 팝업 창 표시 옵션
     * - PopupFactory가 조회 응답(PopupResponseDto)을 변환해 만들고 PopupWindow·PopupManager가 읽는다.
     * - 창·헤더·푸터·Overlay·글자 크기 옵션과 결과 저장 훅(EnqueueResult 등)을 담는다. PopupWindow·View는 서버를 모른다.
     */
    public class PopupOptions
    {
        public string PopupId { get; set; } = string.Empty;

        /// <summary>POL-10-01 : 전달과 제출 식별 — 조회 응답의 전달 건 ID. 결과 항목(PopupResultBuilder)에 담아 서버로 돌려준다.</summary>
        public string DeliveryId { get; set; } = string.Empty;

        /*
         * POL-12-02 : 현행 임시 복구
         * 팝업 창 하나의 결과는 항목 1개로 닫힐 때 한 번만 보낸다(표시·닫기·숨김·제출·영상 진행률을 개별 API로 즉시 호출하지 않음).
         * 제출 응답을 기다리지 않는다. 닫기·숨김·영상·제출 모두 아래 훅으로
         * "로컬 큐 저장 → 창 닫기 → 백그라운드 전송" 경로를 탄다.
         */

        /// <summary>
        /// 결과 항목을 로컬 큐(pending-results.json)에 저장한다(동기). PopupResultQueue.Enqueue에 연결된다.
        /// 반환 시점에 결과가 파일에 보존되므로 그 뒤에 창을 닫아도 유실되지 않는다. 서버 전송은 하지 않는다.
        /// POL-12-01 : 종결과 보관 — 창 닫기(Closing) 중에도 호출하므로 동기 저장이다. 디스크 저장 실패 시 예외를 던지며 항목은 큐에 남기지 않는다
        /// (호출자가 창을 유지하고 다음 닫기·제출 때 결과를 다시 만들어 저장한다).
        /// </summary>
        public Action<WpfResultItemDto>? EnqueueResult { get; set; }

        /// <summary>
        /// POL-12-01 : 종결과 보관
        /// 앱 종료 중 저장에 실패한 닫힘 결과를 이번 실행 동안 메모리에 남긴다. PopupResultQueue.RetainForExit에 연결된다.
        /// 종료 경로는 이미 전송을 멈춘 상태라 이 결과는 서버에 보내지 못한 채 프로세스 종료와 함께 사라질 수 있다.
        /// </summary>
        public Action<WpfResultItemDto>? RetainResultForExit { get; set; }

        /// <summary>
        /// 창이 닫힌 뒤(Closed) 호출되는 후속 처리 훅. API 모드는 MainWindow.OnPopupFinished, Demo는 DemoWindow.ContinueAfterResult에
        /// 연결되며, 보관된 결과를 FlushAsync로 전송하고 nextStatus에 따라 다음 조회를 정한다. 창 닫기는 이 처리를 기다리지 않는다.
        /// </summary>
        public Action? FlushResultsInBackground { get; set; }

        /// <summary>
        /// POL-10-03 : 완료·숨김·연기
        /// "다시 보지 않기" 체크 여부. PopupWindow가 닫히기 직전에 기록하고 PopupManager가 HIDDEN 항목을 만든다(숨김 API를 직접 호출하지 않음).
        /// </summary>
        public bool DoNotShowAgainChecked { get; set; }

        /// <summary>
        /// POL-10-03 : 완료·숨김·연기
        /// "나중에 보기" 버튼으로 닫는 중인지. PopupWindow가 닫기 직전에 기록하고 PopupManager가 LATER 항목을 만든다.
        /// 다시 보지 않기 체크보다 우선한다(버튼이 명시적 선택이므로).
        /// </summary>
        public bool LaterRequested { get; set; }

        /// <summary>POL-10-03 : 완료·숨김·연기 — 서버가 내려준 숨김 일수(hideDays). null이면 PopupResultBuilder 기본값 30일.</summary>
        public int? HideDays { get; set; }

        /// <summary>팝업 유형 문자열(TEXT/IMAGE/VIDEO/SURVEY/QUIZ). 제출 결과 안내 문구 분기에 쓴다.</summary>
        public string PopupType { get; set; } = string.Empty;

        /* POL-05-02 : 완료·화면 이탈 — 영상 완료 기준 누적 시청 비율. 기본 1.0 */
        public double CompletionRatio { get; set; } = 1.0;

        public string Title { get; set; } = string.Empty;
        public FrameworkElement? Content { get; set; }

        public bool ShowHeader { get; set; } = true;
        public bool ShowFooterButton { get; set; } = true;
        public bool ShowFooter { get; set; } = true;
        public PopupFooterAction FooterAction { get; set; } = PopupFooterAction.Close;
        public bool OpenFooterLinkAndClose => FooterAction == PopupFooterAction.LinkAndClose;
        public string FooterLinkUrl { get; set; } = string.Empty;
        public bool ShowDoNotShowAgain { get; set; } = true;
        /// <summary>POL-02-03 : 푸터 역할 — Footer "나중에 보기" 버튼 표시(ShowFooter와 함께 true일 때). 기본 false.</summary>
        public bool ShowLater { get; set; }

        /*
         * POL-02-02 : 종료 제어
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
         * POL-01-01 : 공통 옵션의 위치
         * POL-01-02 : 기본값의 적용
         * Header / 본문 / Footer 폰트 크기.
         * 관리자 웹이 content(CONTENT_OPTIONS JSON)의 headerFontSize/bodyFontSize/footerFontSize로 저장하고
         * 서버가 WPF 조회 응답의 popup 최상위 필드로 승격해 내려준다(별도 DB 컬럼 없음 — Overlay 옵션과 같은 경로).
         * null이면 "관리자가 설정하지 않음"이며 PopupWindow·각 콘텐츠 View는 기존 XAML 기본 크기를 그대로 쓴다(기존 데이터 호환).
         * 값이 있어도 PopupWindow가 FontSizeMin~FontSizeMax로 최종 Clamp 하므로 서버 값을 그대로 신뢰하지 않는다.
         */
        public double? HeaderFontSize { get; set; }
        public double? BodyFontSize { get; set; }
        public double? FooterFontSize { get; set; }

        /// <summary>WPF 최종 방어 범위. 관리자 웹 입력 범위(10~40)와 같다.</summary>
        public const double FontSizeMin = 10;
        public const double FontSizeMax = 40;

        public PopupPosition Position { get; set; } = PopupPosition.Center;

        public PopupSizeMode SizeMode { get; set; } = PopupSizeMode.Fixed;
        public double Width { get; set; } = 900;
        public double Height { get; set; } = 620;
        public double WidthRatio { get; set; } = 0.7;
        public double HeightRatio { get; set; } = 0.75;
        /// <summary>POL-01-03 : 최소 크기 — 팝업 창 최소 크기(DIP). 관리자 웹 POPUP_MIN_WINDOW_SIZE·서버 PopupService.POPUP_MIN_WINDOW_SIZE와 같다.</summary>
        public const double MinWindowSize = 300;
        public double MinimumWidth { get; set; } = MinWindowSize;
        public double MinimumHeight { get; set; } = MinWindowSize;
        public double MaximumWidth { get; set; } = 1200;
        public double MaximumHeight { get; set; } = 900;
    }
}
