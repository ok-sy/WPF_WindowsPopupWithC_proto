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
            if (popupDto == null) throw new ArgumentNullException(nameof(popupDto));

            FrameworkElement content = popupDto.PopupType.Trim().ToUpperInvariant() switch
            {
                "TEXT" => CreateTextPopupView(popupDto.Content),
                "IMAGE" => CreateImagePopupView(popupDto.Content),
                "VIDEO" => CreateVideoPopupView(popupDto.Content),
                "SURVEY" => CreateSurveyPopupView(popupDto, false),
                "QUIZ" => CreateSurveyPopupView(popupDto, true),
                _ => throw new NotSupportedException($"지원하지 않는 팝업 종류입니다: {popupDto.PopupType}")
            };

            return new PopupOptions
            {
                PopupId = popupDto.PopupId,
                // [기준 3] 결과 항목 조립(HIDDEN hideDays)과 제출 결과 안내(QUIZ 분기)에 필요한 값
                PopupType = popupDto.PopupType.Trim().ToUpperInvariant(),
                HideDays = popupDto.HideDays,
                Title = popupDto.Title,
                Content = content,
                DisplayMode = ConvertPopupDisplayMode(popupDto.DisplayMode),
                DisplayOrder = popupDto.DisplayOrder,
                ShowHeader = popupDto.ShowHeader,
                ShowCloseButton = popupDto.ShowCloseButton,
                ShowFooter = popupDto.ShowFooter,
                ShowDoNotShowAgain = popupDto.ShowDoNotShowAgain,

                /*
                 * Overlay 옵션은 popup_content.content_options_json 안에 저장한다.
                 * 서버가 content JSON을 그대로 WPF에 전달하므로 별도 DB 컬럼이나
                 * Java DTO 계약을 늘리지 않고도 관리자 설정을 전달할 수 있다.
                 * 기존 데이터에 값이 없으면 이전 동작과 동일하게 true / 0.45를 사용한다.
                 */
                UseBackgroundOverlay = GetContentBoolean(
                    popupDto.Content, "useBackgroundOverlay", true),
                BackgroundOverlayOpacity = GetContentDouble(
                    popupDto.Content, "backgroundOverlayOpacity", 0.45),

                CompletionRatio = popupDto.CompletionRatio ?? 1.0,
                AllowCloseBeforeComplete = popupDto.AllowCloseBeforeComplete,
                SizeMode = ConvertPopupSizeMode(popupDto.SizeMode),
                Width = popupDto.Width,
                Height = popupDto.Height,
                WidthRatio = popupDto.WidthRatio,
                HeightRatio = popupDto.HeightRatio,
                MinimumWidth = popupDto.MinimumWidth,
                MinimumHeight = popupDto.MinimumHeight,
                MaximumWidth = popupDto.MaximumWidth,
                MaximumHeight = popupDto.MaximumHeight
            };
        }

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

        private static double GetContentDouble(JsonElement content, string propertyName, double defaultValue)
        {
            if (content.ValueKind == JsonValueKind.Object
                && content.TryGetProperty(propertyName, out JsonElement value)
                && value.ValueKind == JsonValueKind.Number
                && value.TryGetDouble(out double result))
            {
                return Math.Clamp(result, 0.0, 1.0);
            }
            return defaultValue;
        }

        private static TextPopupView CreateTextPopupView(JsonElement contentJson)
        {
            TextPopupContentDto contentDto = contentJson.Deserialize<TextPopupContentDto>(JsonOptions)
                ?? throw new InvalidOperationException("TEXT 팝업 content 변환에 실패했습니다.");

            return new TextPopupView(
                contentDto.ContentTitle,
                contentDto.Description,
                contentDto.HighlightText,
                contentDto.ShowHighlight ?? !string.IsNullOrWhiteSpace(contentDto.HighlightText),
                contentDto.BottomDescription,
                contentDto.BottomDescriptionUrl,
                contentDto.ShowContentHeader,
                contentDto.ShowPlainText,
                contentDto.PlainText,
                contentDto.ShowBottomDescription ?? (!string.IsNullOrWhiteSpace(contentDto.BottomDescription)
                    || !string.IsNullOrWhiteSpace(contentDto.BottomDescriptionUrl)),
                contentDto.MarkdownMode,
                contentDto.MarkdownContent);
        }

        private static FrameworkElement CreateImagePopupView(JsonElement contentJson)
        {
            ImagePopupContentDto contentDto = contentJson.Deserialize<ImagePopupContentDto>(JsonOptions)
                ?? throw new InvalidOperationException("IMAGE 팝업 content 변환에 실패했습니다.");

            if (string.Equals(contentDto.ImageSizeMode, "FILL", StringComparison.OrdinalIgnoreCase))
            {
                return new ImageFillPopupView(contentDto.ImageUrl, contentDto.LinkUrl);
            }

            return new ImagePopupView(
                contentDto.ImageTitle,
                contentDto.ImageUrl,
                contentDto.Description,
                contentDto.ShowDescription,
                ConvertImagePopupSizeMode(contentDto.ImageSizeMode),
                contentDto.ImageWidth > 0 ? contentDto.ImageWidth : null,
                contentDto.ImageHeight > 0 ? contentDto.ImageHeight : null);
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
                contentDto.DefaultVolume);
        }

        /*
         * [기준 3] 신규 WPF API는 문항을 최상위 questions에만 내려주고 content.questions는 제거했다.
         * 최상위 questions가 있으면 그것을 쓰고, 비어 있으면 구 서버·데모 JSON 호환을 위해 content.questions를 읽는다.
         * passingScore는 더 이상 내려오지 않으며(채점은 서버), SurveyPopupView도 로컬 채점을 하지 않는다.
         */
        private static SurveyPopupView CreateSurveyPopupView(PopupResponseDto popupDto, bool isQuizMode)
        {
            SurveyPopupContentDto contentDto = popupDto.Content.Deserialize<SurveyPopupContentDto>(JsonOptions)
                ?? throw new InvalidOperationException("SURVEY 또는 QUIZ content 변환에 실패했습니다.");
            List<SurveyQuestionDto> questionDtos = popupDto.Questions.Count > 0
                ? popupDto.Questions
                : contentDto.Questions;

            List<SurveyQuestion> questions = new();
            foreach (SurveyQuestionDto questionDto in questionDtos)
            {
                SurveyQuestion question = new()
                {
                    QuestionId = questionDto.QuestionId,
                    Title = questionDto.Title,
                    Description = questionDto.Description,
                    QuestionType = ConvertSurveyQuestionType(questionDto.QuestionType),
                    IsRequired = questionDto.IsRequired,
                    IsScored = questionDto.IsScored,
                    CorrectAnswers = new List<string>(questionDto.CorrectAnswers)
                };

                foreach (SurveyOptionDto optionDto in questionDto.Options)
                {
                    question.Options.Add(new SurveyOption
                    {
                        OptionId = optionDto.OptionId,
                        Value = optionDto.Value,
                        Text = optionDto.Text
                    });
                }
                questions.Add(question);
            }

            return new SurveyPopupView(
                contentDto.SurveyTitle,
                contentDto.Description,
                questions,
                isQuizMode,
                contentDto.PassingScore);
        }

        private static SurveyQuestionType ConvertSurveyQuestionType(string questionType) =>
            questionType.Trim().ToUpperInvariant() switch
            {
                "RATING5" => SurveyQuestionType.Rating5,
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
                "FIXED" => ImagePopupSizeMode.Adaptive,
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
                "VIEWPORT_RATIO" => PopupSizeMode.ViewportRatio,
                "RATIO" => PopupSizeMode.ViewportRatio,
                "FULLSCREEN" => PopupSizeMode.Fullscreen,
                "AUTO" => PopupSizeMode.Auto,
                _ => throw new ArgumentException($"지원하지 않는 팝업 크기 방식입니다: {sizeMode}")
            };
    }
}
