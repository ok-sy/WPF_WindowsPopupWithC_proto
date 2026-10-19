using System.Text.Json;
using System;

namespace Popup.Dtos
{
    /*
     * 서버에서 내려오는 팝업 조회 응답을 담는 DTO
     *
     * DTO는 JSON 데이터를 전달받기 위한 객체다.
     * 화면을 직접 그리거나 팝업을 여는 역할은 하지 않는다.
     */
    public class PopupResponseDto
    {
        /*
         * [설계 29-01·29-02] 노출 시작·종료 일시(DisplayStartAt/DisplayEndAt)는 삭제했다.
         * 서버가 기간을 포함한 노출 판정을 끝낸 최종 목록만 내려주므로 WPF는 시각을 비교하지 않는다.
         * 서버가 보내더라도 System.Text.Json은 모르는 속성을 무시한다.
         */

        /*
         * 팝업 고유 번호
         *
         * 나중에 조회, 로그 저장,
         * 다시 보지 않기 처리 등에 사용한다.
         */
        public string PopupId { get; set; } = string.Empty;

        /* [설계 35] 조회 API가 발급한 전달 건 ID. 결과 수신 요청에 그대로 돌려준다(Demo 샘플은 비어 있을 수 있음). */
        public string DeliveryId { get; set; } = string.Empty;

        /*
         * 팝업 종류
         *
         * 서버 JSON 예:
         * TEXT
         * IMAGE
         * VIDEO
         * SURVEY
         * QUIZ
         */
        public string PopupType { get; set; } =
            string.Empty;

        /*
         * 팝업 표시 방식(계약 필드 SEQUENTIAL / SIMULTANEOUS).
         * [설계 35·50-B] 조회 응답이 1건이라 WPF는 이 값을 읽지 않고 항상 1건씩 순차 표시한다.
         * 계약·Demo 편집기(표시 문구) 호환을 위해 필드는 유지하며, 모르는 값이 와도 팝업 생성을 실패시키지 않는다.
         */
        public string DisplayMode { get; set; } =
            "SEQUENTIAL";

        /*
         * 팝업 표시 우선순위 — [설계 35] 서버 조회 응답에는 없다(서버가 정렬해 1건만 보냄, 기본값 100 유지).
         * Demo 샘플·Demo 옵션 편집에서만 값이 있으며 Demo 게이트웨이가 후보 정렬에 쓴다.
         */
        public int DisplayOrder { get; set; } =
            100;


        /*
         * PopupWindow 상단에 표시할 제목
         */
        public string Title { get; set; } =
            string.Empty;

        /*
         * 팝업 크기 계산 방식
         *
         * 서버 JSON 예:
         * FIXED
         * RATIO
         * FULLSCREEN
         * AUTO
         */
        public string SizeMode { get; set; } =
            "FIXED";

        /*
         * Fixed 모드에서 사용하는 고정 크기
         *
         * [TODO58] 생략·null을 구분하려고 nullable로 받는다(예전에는 900/620이 역직렬화 전에 주입돼 "값 미지정"을 알 수 없었다).
         * IMAGE가 아닌 유형은 PopupFactory가 예전과 같이 900/620으로 채운다.
         * IMAGE는 content.imageSizeMode에 따라 의미가 다르다: ADAPTIVE·ORIGINAL은 팝업 창 전체 크기,
         * FIT_TO_IMAGE는 이미지 콘텐츠 영역 크기(헤더·푸터·제목·설명·여백은 더해서 창을 계산). 한 축 생략은 원본 기준으로 채운다.
         */
        public double? Width { get; set; }

        public double? Height { get; set; }

        /*
         * ViewportRatio 모드에서 사용하는
         * 모니터 작업 영역 대비 크기 비율
         */
        public double WidthRatio { get; set; } =
            0.7;

        public double HeightRatio { get; set; } =
            0.75;

        /*
         * 동적 계산 결과에 적용할 최소 크기
         */
        public double MinimumWidth { get; set; } =
            480;

        public double MinimumHeight { get; set; } =
            320;

        /*
         * 동적 계산 결과에 적용할 최대 크기
         */
        public double MaximumWidth { get; set; } =
            1200;

        public double MaximumHeight { get; set; } =
            900;

        /*
         * PopupWindow 공통 영역 표시 옵션
         */
        public bool ShowHeader { get; set; } =
            true;

        /* [설계 29-11] 서버 응답 이름을 showFooterButton으로 통일해 legacy showCloseButton 수신 별칭을 삭제했다. */
        public bool ShowFooterButton { get; set; } =
            true;

        public bool ShowFooter { get; set; } =
            true;

        /*
         * [설계 30] 공통 Footer 버튼 동작. content가 아니라 popup 최상위로 받는다.
         * CLOSE(닫기) / LINK_AND_CLOSE(바로가기) / SUBMIT(제출, SURVEY·QUIZ 고정).
         * 생략·미지원 값은 PopupFactory가 유형별 기본값(CLOSE 또는 SUBMIT)으로 처리한다.
         */
        public string FooterAction { get; set; } = "CLOSE";

        /* [설계 30] LINK_AND_CLOSE일 때 열 절대 http/https URL. 그 밖의 동작에서는 쓰지 않는다. */
        public string FooterLinkUrl { get; set; } = string.Empty;

        /*
         * [설계 31] PopupWindow 공통 UI 옵션. content가 아니라 popup 최상위로 받는다.
         * Overlay 기본 true / 0.45(0~1 보정), 위치 기본 CENTER(미지원 값도 CENTER),
         * 폰트 크기는 null이면 XAML 기본 크기이며 값이 있으면 PopupWindow가 10~40으로 보정한다.
         */
        public bool UseBackgroundOverlay { get; set; } = true;
        public double BackgroundOverlayOpacity { get; set; } = 0.45;
        public string PopupPosition { get; set; } = "CENTER";
        public double? HeaderFontSize { get; set; }
        public double? BodyFontSize { get; set; }
        public double? FooterFontSize { get; set; }

        public bool ShowDoNotShowAgain { get; set; }

        /// <summary>[TODO52-2] Footer "나중에 보기" 버튼 표시. 응답에 없으면 false.</summary>
        public bool ShowLater { get; set; }

        /*
         * 숨김·완료 정책 값
         *
         * [설계 18 L-0 — C-5 삭제] WPF에서 읽는 곳이 없고 계약 v3.0 §6.3 응답 필드에도 없는
         * QuestionTemplateId, PeriodMode, RepeatInterval, RepeatDayOfWeek, RepeatDayOfMonth를 삭제했다.
         * 기간·반복 판단은 서버가 끝내고 노출 대상만 내려주므로 WPF는 이 값을 받을 필요가 없다.
         * 서버가 여전히 보내더라도 System.Text.Json은 모르는 속성을 무시하므로 역직렬화 동작은 같다.
         */
        public int? HideDays { get; set; }
        public double? CompletionRatio { get; set; }
        public double? PassingScore { get; set; }
        /* [TODO57] allowCloseBeforeComplete를 폐기했다. 화면 버튼은 completionRatio, 외부 닫기는 useBackgroundOverlay,
         * 완료 전 연기는 showLater로 판단한다. 구 서버가 필드를 보내도 System.Text.Json이 모르는 속성으로 무시한다. */

        /* 설문 제출 시 사용할 서버 문항 목록 */
        public System.Collections.Generic.List<SurveyQuestionDto> Questions
            { get; set; } = new();

        /*
         * 팝업 종류별 상세 데이터
         *
         * TEXT, IMAGE, VIDEO, SURVEY마다
         * content 내부 구조가 다르므로
         * 공통 DTO에서는 JsonElement로 받아둔다.
         *
         * 이후 PopupFactory에서 PopupType을 확인하고
         * 각각의 ContentDto로 다시 변환한다.
         */
        public JsonElement Content { get; set; }
    }
}
