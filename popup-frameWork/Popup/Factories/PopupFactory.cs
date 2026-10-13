using Popup.Dtos;
using Popup.Models;
using Popup.Views.Contents;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Windows;

namespace Popup.Factories
{
    public static class PopupFactory
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true
        };

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
             */
            if (popupDto == null) throw new ArgumentNullException(nameof(popupDto));

            FrameworkElement content = popupDto.PopupType.Trim().ToUpperInvariant() switch
            {
                "TEXT" => CreateTextPopupView(popupDto.Content),
                "IMAGE" => CreateImagePopupView(popupDto.Content),
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
                // [기준 3] 결과 항목 조립(HIDDEN hideDays)과 제출 결과 안내(QUIZ 분기)에 필요한 값
                PopupType = popupDto.PopupType.Trim().ToUpperInvariant(),
                HideDays = popupDto.HideDays,
                Title = popupDto.Title,
                Content = content,
                DisplayMode = ConvertPopupDisplayMode(popupDto.DisplayMode),
                DisplayOrder = popupDto.DisplayOrder,
                ShowHeader = popupDto.ShowHeader,
                ShowFooterButton = popupDto.ShowFooterButton,
                ShowFooter = popupDto.ShowFooter,
                FooterAction = ConvertFooterAction(popupDto.PopupType, popupDto.FooterAction),
                FooterLinkUrl = popupDto.FooterLinkUrl ?? string.Empty,
                ShowDoNotShowAgain = popupDto.ShowDoNotShowAgain,

                /*
                 * [설계 31] PopupWindow 공통 UI 옵션은 popup 최상위 값을 쓴다(content 키는 읽지 않는다).
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
                AllowCloseBeforeComplete = popupDto.AllowCloseBeforeComplete,
                Position = ConvertPopupPosition(popupDto.PopupPosition),
                SizeMode = content is ImagePopupView && !string.Equals(popupDto.SizeMode, "FULLSCREEN", StringComparison.OrdinalIgnoreCase)
                    ? PopupSizeMode.Fixed : ConvertPopupSizeMode(popupDto.SizeMode),
                Width = content is ImagePopupView imageWidthView ? imageWidthView.RequestedWindowWidth ?? 560 : popupDto.Width,
                Height = content is ImagePopupView imageHeightView ? imageHeightView.RequestedWindowHeight ?? 420 : popupDto.Height,
                WidthRatio = popupDto.WidthRatio,
                HeightRatio = popupDto.HeightRatio,
                MinimumWidth = popupDto.MinimumWidth,
                MinimumHeight = popupDto.MinimumHeight,
                MaximumWidth = popupDto.MaximumWidth,
                MaximumHeight = popupDto.MaximumHeight
            };
        }

        /*
         * [설계 30] 최상위 footerAction을 동작으로 바꾼다. SURVEY/QUIZ(동영상+퀴즈 포함)는 제출 경로가 사라지지 않도록
         * 서버 값과 무관하게 Submit이다. 그 밖의 유형은 LINK_AND_CLOSE만 바로가기이고 생략·CLOSE·SUBMIT·미지원 값은 Close다.
         */
        public static PopupFooterAction ConvertFooterAction(string popupType, string? footerAction)
        {
            string type = popupType?.Trim().ToUpperInvariant() ?? string.Empty;
            if (type is "SURVEY" or "QUIZ") return PopupFooterAction.Submit;
            return string.Equals(footerAction?.Trim(), "LINK_AND_CLOSE", StringComparison.OrdinalIgnoreCase)
                ? PopupFooterAction.LinkAndClose : PopupFooterAction.Close;
        }

        /* [설계 31] 최상위 popupPosition 9개 값. 없거나 미지원 값이면 CENTER. */
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

        private static FrameworkElement CreateImagePopupView(JsonElement contentJson)
        {
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
                contentDto.Width,
                contentDto.Height,
                contentDto.KeepAspectRatio);
        }

        private static VideoPopupView CreateVideoPopupView(JsonElement contentJson)
        {
            VideoPopupContentDto contentDto = contentJson.Deserialize<VideoPopupContentDto>(JsonOptions)
                ?? throw new InvalidOperationException("VIDEO 팝업 content 변환에 실패했습니다.");

            /*
             * [관리자 웹 옵션 정합성 — 2026-09-20] 관리자 웹 "영상 재생" 섹션의 옵션 6개
             * (showControls·allowFullScreen·allowPlaybackRateChange·autoPlay·isLoop·defaultVolume)를 View 에 전달한다.
             * 이전에는 제목·URL·설명·설명 표시만 넘겨 웹에서 설정한 값이 WPF 에서 무시됐다.
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
         * [기준 3] 문항은 응답 최상위 questions로만 받는다.
         * [설계 12 §4] QUIZ는 WPF가 로컬 채점하므로 서버가 QUIZ 팝업에 한해 내려주는 정답 정보
         * (questionScore / options[].isCorrect / correctAnswer / answerMatchMode)와 최상위 passingScore를 모델에 옮긴다.
         * [설계 18 L-2 — C-14·C-15·C-16] 구 서버·데모 JSON용 content.questions / content.passingScore /
         * correctAnswers(보기 value 목록) fallback을 삭제했다. 데모 JSON도 v3 형태로 바꿨다.
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
                        Value = optionDto.Value,
                        Text = optionDto.Text,
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
                popupDto.PassingScore);
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

        private static PopupDisplayMode ConvertPopupDisplayMode(string displayMode) =>
            displayMode.Trim().ToUpperInvariant() switch
            {
                "SEQUENTIAL" => PopupDisplayMode.Sequential,
                "SIMULTANEOUS" => PopupDisplayMode.Simultaneous,
                _ => throw new ArgumentException($"지원하지 않는 팝업 표시 방식입니다: {displayMode}")
            };

        private static PopupSizeMode ConvertPopupSizeMode(string sizeMode) =>
            sizeMode.Trim().ToUpperInvariant() switch
            {
                "FIXED" => PopupSizeMode.Fixed,
                // [설계 18 L-5 — C-24] 서버·관리자 웹 값 RATIO로 단일화. VIEWPORT_RATIO는 더 이상 받지 않는다.
                "RATIO" => PopupSizeMode.ViewportRatio,
                "FULLSCREEN" => PopupSizeMode.Fullscreen,
                "AUTO" => PopupSizeMode.Auto,
                _ => throw new ArgumentException($"지원하지 않는 팝업 크기 방식입니다: {sizeMode}")
            };
    }
}
