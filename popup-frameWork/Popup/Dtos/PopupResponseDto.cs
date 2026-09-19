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
         * 팝업 노출 시작 일시
         *
         * null이면 시작 일시 제한 없이
         * 바로 노출할 수 있다.
         */
        public DateTimeOffset? DisplayStartAt { get; set; }

        /*
         * 팝업 노출 종료 일시
         *
         * null이면 종료 일시 제한 없이
         * 계속 노출할 수 있다.
         */
        public DateTimeOffset? DisplayEndAt { get; set; }


        /*
         * 팝업 고유 번호
         *
         * 나중에 조회, 로그 저장,
         * 다시 보지 않기 처리 등에 사용한다.
         */
        public string PopupId { get; set; } = string.Empty;

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
       * 팝업 표시 방식
       *
       * 서버 JSON 예:
       *
       * SEQUENTIAL
       * → 앞 팝업이 닫힌 뒤 표시
       *
       * SIMULTANEOUS
       * → 같은 표시 우선순위의 팝업들과 동시에 표시
       */
        public string DisplayMode { get; set; } =
            "SEQUENTIAL";

        /*
         * 팝업 표시 우선순위
         *
         * 숫자가 작을수록 먼저 표시한다.
         * 같은 숫자는 하나의 표시 그룹으로 처리한다.
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
         * VIEWPORT_RATIO
         * FULLSCREEN
         * AUTO
         */
        public string SizeMode { get; set; } =
            "FIXED";

        /*
         * Fixed 모드에서 사용하는 고정 크기
         */
        public double Width { get; set; } =
            900;

        public double Height { get; set; } =
            620;

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

        public bool ShowCloseButton { get; set; } =
            true;

        public bool ShowFooter { get; set; } =
            true;

        public bool ShowDoNotShowAgain { get; set; }

        /* 설문·퀴즈가 참조하는 서버 질문 템플릿 ID */
        public long? QuestionTemplateId { get; set; }

        /* 기간·반복·숨김·완료 정책 값 */
        public string PeriodMode { get; set; } = "FIXED";
        public int? RepeatInterval { get; set; }
        public string? RepeatDayOfWeek { get; set; }
        public int? RepeatDayOfMonth { get; set; }
        public int? HideDays { get; set; }
        public double? CompletionRatio { get; set; }
        public double? PassingScore { get; set; }
        public bool AllowCloseBeforeComplete { get; set; } = true;

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
