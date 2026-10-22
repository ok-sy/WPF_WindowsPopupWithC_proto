using Popup.Dtos;
using Popup.Models;
using Popup.Views.Contents;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Windows;

namespace Popup.Factories
{
    /*
     * POL-01-01 : 공통 옵션의 위치
     * ■ 팝업 생성기
     * - in : 서버 조회 응답의 popup 객체(PopupResponseDto)
     * - out: PopupWindow가 사용할 PopupOptions(유형별 Content View + 공통 창 옵션)
     * - popupType별 Content View를 만들고 popup 최상위 공통 옵션을 PopupOptions로 옮긴다. 노출 여부는 판단하지 않는다.
     */
    public static class PopupFactory
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

        /*
         * POL-01-01 : 공통 옵션의 위치
         * POL-11-01 : 노출 판단 소유
         * ■ 팝업 옵션 생성
         * - in : popupDto(PopupResponseDto) 조회 응답의 popup 1건
         * - out: PopupOptions · 예외: ArgumentNullException(null), NotSupportedException(미지원 popupType), InvalidOperationException/ArgumentException(content·ENUM 변환 실패)
         * - popupType에 맞는 Content View를 만들고 공통 창 설정을 PopupOptions에 복사한다. PopupManager가 이 값으로 PopupWindow를 만든다.
         */
        public static PopupOptions Create(PopupResponseDto popupDto)
        {
            /*
             * [실행 순서 5/6]
             * 서버 JSON DTO를 "실제로 화면에 띄울 수 있는 WPF 객체"로 바꾸는 지점.
             *
             * PopupResponseDto
             *   → popupType에 맞는 Content View 생성
             *   → 공통 창 설정을 PopupOptions에 복사
             *   → PopupManager가 PopupOptions를 받아 PopupWindow 생성
             *
             * 여기서는 노출 대상 여부를 판단하지 않는다.
             * POL-09-02 : 조회 응답 — displayMode(계약 필드)는 읽지 않는다. 조회 응답이 1건이라 표시 방식에 효과가 없으므로
             * 모르는 값이 와도 팝업 생성을 실패시키지 않는다(항상 1건 순차 표시).
             */
            if (popupDto == null) throw new ArgumentNullException(nameof(popupDto));

            FrameworkElement content = popupDto.PopupType.Trim().ToUpperInvariant() switch
            {
                "TEXT" => CreateTextPopupView(popupDto.Content),
                "IMAGE" => CreateImagePopupView(popupDto),
                "VIDEO" => CreateVideoPopupView(popupDto.Content),
                "SURVEY" => CreateSurveyPopupView(popupDto, false),
                "QUIZ" when GetContentBoolean(popupDto.Content, "videoEnabled", false) =>
                    new VideoQuizPopupView(CreateVideoPopupView(popupDto.Content),
                        CreateSurveyPopupView(popupDto, true), popupDto.CompletionRatio ?? 1.0),
                "QUIZ" => CreateSurveyPopupView(popupDto, true),
                _ => throw new NotSupportedException($"지원하지 않는 팝업 종류입니다: {popupDto.PopupType}")
            };

            return new PopupOptions
            {
                PopupId = popupDto.PopupId,
                DeliveryId = popupDto.DeliveryId ?? string.Empty,
                // POL-10-03 : 완료·숨김·연기 — 결과 항목 조립(HIDDEN hideDays)과 제출 결과 안내(QUIZ 분기)에 필요한 값
                PopupType = popupDto.PopupType.Trim().ToUpperInvariant(),
                HideDays = popupDto.HideDays,
                Title = popupDto.Title,
                Content = content,
                ShowHeader = popupDto.ShowHeader,
                ShowFooterButton = popupDto.ShowFooterButton,
                ShowFooter = popupDto.ShowFooter,
                FooterAction = ConvertFooterAction(popupDto.PopupType, popupDto.FooterAction),
                FooterLinkUrl = popupDto.FooterLinkUrl ?? string.Empty,
                ShowDoNotShowAgain = popupDto.ShowDoNotShowAgain,
                ShowLater = popupDto.ShowLater,

                /*
                 * POL-01-01 : 공통 옵션의 위치
                 * POL-01-02 : 기본값의 적용
                 * PopupWindow 공통 UI 옵션은 popup 최상위 값을 쓴다(content 키는 읽지 않는다).
                 * 관리자 설정은 서버 DB의 CONTENT_OPTIONS에 저장되지만 서버가 WPF 응답 조립 시 최상위로 승격한다.
                 * Overlay 불투명도는 서버가 저장 시 0~1을 검증하고 WPF도 0~1로 한 번 더 보정한다.
                 * 폰트 크기 null → PopupWindow·View가 XAML 기본 크기 유지. 범위 보정(10~40)은 PopupWindow.ApplyFontSizes()가 한다.
                 */
                UseBackgroundOverlay = popupDto.UseBackgroundOverlay,
                BackgroundOverlayOpacity = double.IsFinite(popupDto.BackgroundOverlayOpacity)
                    ? Math.Clamp(popupDto.BackgroundOverlayOpacity, 0.0, 1.0) : 0.45,
                HeaderFontSize = popupDto.HeaderFontSize,
                BodyFontSize = popupDto.BodyFontSize,
                FooterFontSize = popupDto.FooterFontSize,

                CompletionRatio = popupDto.CompletionRatio ?? 1.0,
                Position = ConvertPopupPosition(popupDto.PopupPosition),
                SizeMode = content is ImagePopupView && !string.Equals(popupDto.SizeMode, "FULLSCREEN", StringComparison.OrdinalIgnoreCase)
                    ? PopupSizeMode.Fixed : ConvertPopupSizeMode(popupDto.SizeMode),
                Width = content is ImagePopupView imageWidthView ? imageWidthView.RequestedWindowWidth ?? 560 : popupDto.Width ?? 900,
                Height = content is ImagePopupView imageHeightView ? imageHeightView.RequestedWindowHeight ?? 420 : popupDto.Height ?? 620,
                WidthRatio = popupDto.WidthRatio,
                HeightRatio = popupDto.HeightRatio,
                MinimumWidth = popupDto.MinimumWidth,
                MinimumHeight = popupDto.MinimumHeight,
                MaximumWidth = popupDto.MaximumWidth,
                MaximumHeight = popupDto.MaximumHeight
            };
        }

        /*
         * POL-02-03 : 푸터 역할
         * ■ 푸터 동작 변환
         * - in : popupType(string) 팝업 유형 · footerAction(string?) popup 최상위 footerAction
         * - out: PopupFooterAction(Submit/LinkAndClose/Close)
         * - SURVEY/QUIZ(동영상+퀴즈 포함)는 제출 경로가 사라지지 않도록 서버 값과 무관하게 Submit이다.
         *   그 밖의 유형은 LINK_AND_CLOSE만 바로가기이고 생략·CLOSE·SUBMIT·미지원 값은 Close다.
         */
        public static PopupFooterAction ConvertFooterAction(string popupType, string? footerAction)
        {
            string type = popupType?.Trim().ToUpperInvariant() ?? string.Empty;
            if (type is "SURVEY" or "QUIZ") return PopupFooterAction.Submit;
            return string.Equals(footerAction?.Trim(), "LINK_AND_CLOSE", StringComparison.OrdinalIgnoreCase)
                ? PopupFooterAction.LinkAndClose : PopupFooterAction.Close;
        }

        /*
         * POL-01-01 : 공통 옵션의 위치
         * ■ 팝업 위치 변환
         * - in : popupPosition(string?) popup 최상위 popupPosition
         * - out: PopupPosition(9개 값)
         * - 최상위 popupPosition 9개 값을 변환한다. 없거나 미지원 값이면 CENTER.
         */
        public static PopupPosition ConvertPopupPosition(string? popupPosition) =>
                popupPosition?.Trim().ToUpperInvariant() switch
                {
                    "CENTER" => PopupPosition.Center,
                    "TOP_LEFT" => PopupPosition.TopLeft,
                    "TOP_CENTER" => PopupPosition.TopCenter,
                    "TOP_RIGHT" => PopupPosition.TopRight,
                    "CENTER_LEFT" => PopupPosition.CenterLeft,
                    "CENTER_RIGHT" => PopupPosition.CenterRight,
                    "BOTTOM_LEFT" => PopupPosition.BottomLeft,
                    "BOTTOM_CENTER" => PopupPosition.BottomCenter,
                    "BOTTOM_RIGHT" => PopupPosition.BottomRight,
                    _ => PopupPosition.Center
                };

        private static bool GetContentBoolean(JsonElement content, string propertyName, bool defaultValue)
        {
            if (content.ValueKind == JsonValueKind.Object
                && content.TryGetProperty(propertyName, out JsonElement value)
                && (value.ValueKind == JsonValueKind.True || value.ValueKind == JsonValueKind.False))
            {
                return value.GetBoolean();
            }
            return defaultValue;
        }

        private static TextPopupView CreateTextPopupView(JsonElement contentJson)
        {
            TextPopupContentDto contentDto = contentJson.Deserialize<TextPopupContentDto>(JsonOptions)
                ?? throw new InvalidOperationException("TEXT 팝업 content 변환에 실패했습니다.");

            return new TextPopupView(
                contentDto.HighlightText,
                contentDto.ShowHighlight,
                contentDto.BottomDescription,
                contentDto.BottomDescriptionUrl,
                contentDto.ShowPlainText,
                contentDto.PlainText,
                contentDto.ShowBottomDescription,
                contentDto.TextBlocks);
        }

        /*
         * POL-04-01 : 공통 크기 입력
         * 일반 IMAGE 크기는 최상위 popup.width/height 한 쌍이다. ADAPTIVE는 창 전체, FIT_TO_IMAGE는 이미지 콘텐츠 영역으로
         * ImagePopupView에 넘기고(내부 창/이미지 모델은 그대로 구분), ORIGINAL은 공통 창 크기(PopupOptions.Width/Height)로 쓴다.
         * 임시 호환: 구 서버는 일반 모드 크기를 content.width/height로 보내고 최상위 값을 생략한다. 최상위 축이 없을 때만 그 값을 읽는다
         * (최상위 우선). 새 서버 반영과 구 서버 미사용을 확인한 뒤 이 호환 읽기를 삭제한다.
         */
        private static double? LegacyContentDimension(JsonElement content, string name) =>
            content.ValueKind == JsonValueKind.Object && content.TryGetProperty(name, out JsonElement value)
                && value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out double number) ? number : null;

        private static FrameworkElement CreateImagePopupView(PopupResponseDto popupDto)
        {
            JsonElement contentJson = popupDto.Content;
            ImagePopupContentDto contentDto = contentJson.Deserialize<ImagePopupContentDto>(JsonOptions)
                ?? throw new InvalidOperationException("IMAGE 팝업 content 변환에 실패했습니다.");

            bool original = string.Equals(contentDto.ImageSizeMode, "ORIGINAL", StringComparison.OrdinalIgnoreCase);
            if (original)
            {
                return new ImageFillPopupView(contentDto.ImageUrl);
            }

            return new ImagePopupView(
                contentDto.ImageTitle,
                contentDto.ImageUrl,
                contentDto.Description,
                contentDto.ShowDescription,
                ConvertImagePopupSizeMode(contentDto.ImageSizeMode),
                popupDto.Width ?? LegacyContentDimension(contentJson, "width"),
                popupDto.Height ?? LegacyContentDimension(contentJson, "height"),
                contentDto.KeepAspectRatio);
        }

        private static VideoPopupView CreateVideoPopupView(JsonElement contentJson)
        {
            VideoPopupContentDto contentDto = contentJson.Deserialize<VideoPopupContentDto>(JsonOptions)
                ?? throw new InvalidOperationException("VIDEO 팝업 content 변환에 실패했습니다.");

            /*
             * POL-05-01 : 재생 경로
             * POL-01-02 : 기본값의 적용
             * 관리자 웹 "영상 재생" 섹션의 옵션 6개
             * (showControls·allowFullScreen·allowPlaybackRateChange·autoPlay·isLoop·defaultVolume)와 allowSeek를 View 에 전달한다.
             * 값이 JSON 에 없을 때의 기본값(VideoPopupContentDto)은 웹 편집기의 기본 표시와 같다
             * (autoPlay·isLoop 는 꺼짐, 나머지는 켜짐, 음량 0.7).
             */
            return new VideoPopupView(
                contentDto.VideoTitle,
                contentDto.VideoUrl,
                contentDto.Description,
                contentDto.ShowDescription,
                contentDto.ShowControls,
                contentDto.AllowFullScreen,
                contentDto.AllowPlaybackRateChange,
                contentDto.AutoPlay,
                contentDto.IsLoop,
                contentDto.DefaultVolume,
                contentDto.AllowSeek);
        }

        /*
         * POL-06-01 : 문항·서식
         * POL-06-02 : 선택·제출
         * 문항은 응답 최상위 questions로만 받는다.
         * QUIZ는 WPF가 로컬 채점하므로 서버가 QUIZ 팝업에 한해 내려주는 정답 정보
         * (questionScore / options[].isCorrect / correctAnswer / answerMatchMode)와 최상위 passingScore를 모델에 옮긴다.
         * content.questions / content.passingScore / correctAnswers(보기 value 목록)는 읽지 않는다(데모 JSON도 최상위 형태).
         */
        private static SurveyPopupView CreateSurveyPopupView(PopupResponseDto popupDto, bool isQuizMode)
        {
            SurveyPopupContentDto contentDto = popupDto.Content.Deserialize<SurveyPopupContentDto>(JsonOptions)
                ?? throw new InvalidOperationException("SURVEY 또는 QUIZ content 변환에 실패했습니다.");

            List<SurveyQuestion> questions = new();
            foreach (SurveyQuestionDto questionDto in popupDto.Questions)
            {
                SurveyQuestion question = new()
                {
                    QuestionId = questionDto.QuestionId,
                    Title = questionDto.Title,
                    Description = questionDto.Description,
                    TitleBlocks = questionDto.TitleBlocks,
                    DescriptionBlocks = questionDto.DescriptionBlocks,
                    QuestionType = ConvertSurveyQuestionType(questionDto.QuestionType),
                    HorizontalOptions = string.Equals(questionDto.OptionLayout, "HORIZONTAL", StringComparison.Ordinal),
                    IsRequired = questionDto.IsRequired,
                    IsScored = questionDto.IsScored,
                    QuestionScore = questionDto.QuestionScore,
                    CorrectAnswer = questionDto.CorrectAnswer,
                    AnswerMatchMode = questionDto.AnswerMatchMode
                };

                foreach (SurveyOptionDto optionDto in questionDto.Options)
                {
                    question.Options.Add(new SurveyOption
                    {
                        OptionId = optionDto.OptionId,
                        Text = optionDto.Text,
                        TextBlocks = optionDto.TextBlocks,
                        IsCorrect = optionDto.IsCorrect
                    });
                }
                questions.Add(question);
            }

            return new SurveyPopupView(
                contentDto.SurveyTitle,
                contentDto.Description,
                questions,
                isQuizMode,
                popupDto.PassingScore,
                contentDto.SurveyTitleBlocks,
                contentDto.DescriptionBlocks);
        }

        private static SurveyQuestionType ConvertSurveyQuestionType(string questionType) =>
            questionType.Trim().ToUpperInvariant() switch
            {
                "SINGLE_CHOICE" => SurveyQuestionType.SingleChoice,
                "MULTIPLE_CHOICE" => SurveyQuestionType.MultipleChoice,
                "TEXT" => SurveyQuestionType.Text,
                _ => throw new ArgumentException($"지원하지 않는 설문 질문 유형입니다: {questionType}")
            };

        private static ImagePopupSizeMode ConvertImagePopupSizeMode(string imageSizeMode) =>
            imageSizeMode.Trim().ToUpperInvariant() switch
            {
                "ADAPTIVE" => ImagePopupSizeMode.Adaptive,
                "FIT_TO_IMAGE" => ImagePopupSizeMode.FitToImage,
                _ => throw new ArgumentException($"지원하지 않는 이미지 크기 방식입니다: {imageSizeMode}")
            };

        private static PopupSizeMode ConvertPopupSizeMode(string sizeMode) =>
            sizeMode.Trim().ToUpperInvariant() switch
            {
                "FIXED" => PopupSizeMode.Fixed,
                // POL-01-01 : 공통 옵션의 위치 — 서버·관리자 웹 값 RATIO만 받는다. VIEWPORT_RATIO는 받지 않는다.
                "RATIO" => PopupSizeMode.ViewportRatio,
                "FULLSCREEN" => PopupSizeMode.Fullscreen,
                "AUTO" => PopupSizeMode.Auto,
                _ => throw new ArgumentException($"지원하지 않는 팝업 크기 방식입니다: {sizeMode}")
            };
    }
}
