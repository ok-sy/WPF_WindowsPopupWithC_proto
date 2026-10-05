using Popup.Dtos;
using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Windows;
using System.Windows.Controls;

namespace Popup
{
    public sealed partial class DemoOptionsWindow
    {
        private static readonly Dictionary<string, string> Labels = new()
        {
            ["contentTitle"]="콘텐츠 제목", ["description"]="설명", ["showContentHeader"]="콘텐츠 제목·설명 표시",
            ["plainText"]="본문", ["showPlainText"]="본문 표시", ["highlightText"]="강조 문구", ["showHighlight"]="강조 문구 표시",
            ["bottomDescription"]="하단 안내", ["bottomDescriptionUrl"]="하단 안내 링크", ["showBottomDescription"]="하단 안내 표시",
            ["imageTitle"]="이미지 제목", ["imageUrl"]="이미지 경로 또는 URL", ["imageSizeMode"]="이미지 표시 방식",
            ["width"]="너비 · ADAPTIVE는 창 / FIT_TO_IMAGE는 이미지", ["height"]="높이 · ADAPTIVE는 창 / FIT_TO_IMAGE는 이미지",
            ["keepAspectRatio"]="이미지 비율 고정", ["showDescription"]="설명 표시", ["linkUrl"]="이미지 바로가기 URL · ORIGINAL",
            ["videoTitle"]="영상 제목", ["videoUrl"]="영상 경로 또는 URL", ["showControls"]="재생 컨트롤 표시",
            ["allowFullScreen"]="영상 전체화면 허용", ["allowPlaybackRateChange"]="배속 변경 허용", ["autoPlay"]="자동 재생",
            ["isLoop"]="반복 재생", ["defaultVolume"]="기본 음량 · 0~1, 시스템 동기화 연결 전/실패 시",
            ["surveyTitle"]="설문·퀴즈 제목", ["title"]="문항 제목", ["optionLayout"]="선택지 배치",
            ["questionType"]="문항 유형", ["isRequired"]="필수 응답", ["isScored"]="채점 대상", ["questionScore"]="문항 배점",
            ["correctAnswer"]="주관식 정답", ["answerMatchMode"]="주관식 정답 일치 방식", ["value"]="선택지 값",
            ["text"]="선택지 문구", ["isCorrect"]="정답 선택지"
        };

        private void BuildCommon(StackPanel panel, PopupResponseDto popup)
        {
            StackPanel container = panel;
            StackPanel Group(string label, bool expanded)
            {
                var fields = new StackPanel { Margin = new Thickness(12) };
                container.Children.Add(new Expander { Header = label, Content = fields, IsExpanded = expanded, Margin = new Thickness(0, 0, 0, 12) });
                return fields;
            }
            panel = Group("제목·표시 순서", true);
            void Field(string key, string label, Type type, string[]? choices = null, double? min = null, double? max = null) =>
                AddField(panel, _draft, key, label, type, choices, min, max);
            Field("title", "창 제목", typeof(string));
            Field("displayMode", "여러 팝업 표시 방식", typeof(string), new[] { "SEQUENTIAL", "SIMULTANEOUS" });
            Field("displayOrder", "표시 순서 · 같은 순서는 하나의 그룹", typeof(int), min: 0);
            panel = Group("창 크기", false);
            if (popup.PopupType == "IMAGE")
                panel.Children.Add(new TextBlock { Text = "이미지 창 최대는 현재 모니터 작업 영역의 90%로 계산합니다. 고정 최대 픽셀값은 사용하지 않습니다. 지정한 이미지 크기는 유지하며 화면을 넘는 부분은 모드별 정책으로 처리합니다.",
                    TextWrapping = TextWrapping.Wrap, Foreground = System.Windows.Media.Brushes.DimGray, Margin = new Thickness(0, 0, 0, 16) });
            Field("sizeMode", "창 크기 방식", typeof(string), new[] { "FIXED", "RATIO", "FULLSCREEN" });
            Field("width", "고정 창 너비 · ORIGINAL 포함", typeof(double), min: 1);
            Field("height", "고정 창 높이 · ORIGINAL 포함", typeof(double), min: 1);
            Field("widthRatio", "작업 영역 대비 너비 비율", typeof(double), min: .01, max: 1);
            Field("heightRatio", "작업 영역 대비 높이 비율", typeof(double), min: .01, max: 1);
            Field("minimumWidth", "최소 창 너비", typeof(double), min: 1);
            Field("minimumHeight", "최소 창 높이", typeof(double), min: 1);
            if (popup.PopupType != "IMAGE")
            {
                Field("maximumWidth", "최대 창 너비", typeof(double), min: 1);
                Field("maximumHeight", "최대 창 높이", typeof(double), min: 1);
            }
            panel = Group("표시 영역·완료 조건", false);
            Field("showHeader", "헤더 표시", typeof(bool));
            Field("showCloseButton", "닫기 버튼 표시", typeof(bool));
            Field("showFooter", "푸터 표시", typeof(bool));
            Field("showDoNotShowAgain", "다시 보지 않기 표시", typeof(bool));
            Field("hideDays", "숨김 일수 · 비우면 30일", typeof(int?), min: 1);
            Field("allowCloseBeforeComplete", "완료 전 닫기 허용", typeof(bool));
            if (popup.PopupType == "VIDEO" || HasVideo(popup))
                Field("completionRatio", "영상 시청 완료 비율 · 0~1", typeof(double?), min: 0, max: 1);
            if (popup.PopupType == "QUIZ") Field("passingScore", "퀴즈 통과 점수", typeof(double?), min: 0);
            panel = Group("위치·푸터 바로가기", false);
            JsonObject content = _draft["content"]!.AsObject();
            content["popupPosition"] ??= "CENTER";
            content["footerAction"] ??= "CLOSE";
            content["footerLinkUrl"] ??= "";
            content["useBackgroundOverlay"] ??= true;
            content["backgroundOverlayOpacity"] ??= .45;
            AddField(panel, content, "popupPosition", "창 위치", typeof(string), new[] {
                "CENTER", "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER_RIGHT", "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT" });
            AddField(panel, content, "footerAction", "푸터 동작", typeof(string), new[] { "CLOSE", "LINK_AND_CLOSE" });
            AddField(panel, content, "footerLinkUrl", "푸터 바로가기 URL", typeof(string));
            panel = Group("배경·글자 크기", false);
            AddField(panel, content, "useBackgroundOverlay", "배경 Overlay 사용", typeof(bool));
            AddField(panel, content, "backgroundOverlayOpacity", "배경 불투명도 · 0~1", typeof(double), min: 0, max: 1);
            AddField(panel, content, "headerFontSize", "헤더 글자 크기 · 비우면 기본", typeof(double?), min: 10, max: 40);
            AddField(panel, content, "bodyFontSize", "본문 글자 크기 · 비우면 기본", typeof(double?), min: 10, max: 40);
            AddField(panel, content, "footerFontSize", "푸터 글자 크기 · 비우면 기본", typeof(double?), min: 10, max: 40);
        }

        private static bool HasVideo(PopupResponseDto popup) => popup.Content.TryGetProperty("videoEnabled", out var enabled)
            && enabled.ValueKind == JsonValueKind.True;

        private void BuildContent(StackPanel panel, PopupResponseDto popup)
        {
            JsonObject content = _draft["content"]!.AsObject();
            Type type = popup.PopupType switch { "TEXT" => typeof(TextPopupContentDto), "IMAGE" => typeof(ImagePopupContentDto),
                "VIDEO" => typeof(VideoPopupContentDto), _ => typeof(SurveyPopupContentDto) };
            void AddDefaults(Type dtoType)
            {
                var defaults = JsonSerializer.SerializeToNode(Activator.CreateInstance(dtoType), dtoType, JsonOptions)!.AsObject();
                foreach (var pair in defaults)
                    if (!content.ContainsKey(pair.Key)) content[pair.Key] = pair.Value?.DeepClone();
            }
            AddDefaults(type);
            AddObjectFields(panel, content, type, popup.PopupType == "QUIZ");
            if (HasVideo(popup))
            {
                AddDefaults(typeof(VideoPopupContentDto));
                var video = new StackPanel();
                panel.Children.Add(new Expander { Header = "동영상 재생 옵션", IsExpanded = true, Content = video });
                AddObjectFields(video, content, typeof(VideoPopupContentDto), true, videoSection: true);
            }
            if (popup.PopupType == "IMAGE")
                panel.Children.Insert(0, new TextBlock { Text = "일반 이미지 크기는 아래 너비·높이만 사용합니다. 비우면 원본 크기로 계산합니다. 비율 고정 시 너비를 우선하고, 해제하면 지정한 크기로 표시합니다. ORIGINAL은 공통 창 크기를 사용합니다.",
                    TextWrapping = TextWrapping.Wrap, Foreground = System.Windows.Media.Brushes.DimGray, Margin = new Thickness(0, 0, 0, 16) });
        }

        private void BuildQuestions(StackPanel panel, PopupResponseDto popup)
        {
            var questions = _draft["questions"]!.AsArray();
            for (int i = 0; i < questions.Count; i++)
            {
                var question = questions[i]!.AsObject();
                var fields = new StackPanel { Margin = new Thickness(12) };
                panel.Children.Add(new Expander { Header = $"{i + 1}번 문항", Content = fields, IsExpanded = i == 0,
                    Margin = new Thickness(0, 0, 0, 12) });
                AddObjectFields(fields, question, typeof(SurveyQuestionDto), popup.PopupType == "QUIZ");
                foreach (JsonNode? node in question["options"]!.AsArray())
                {
                    var option = node!.AsObject();
                    var optionFields = new StackPanel { Margin = new Thickness(12) };
                    fields.Children.Add(new Expander { Header = "선택지 · " + option["text"]?.GetValue<string>(), Content = optionFields });
                    AddObjectFields(optionFields, option, typeof(SurveyOptionDto), popup.PopupType == "QUIZ");
                }
            }
        }
    }
}
