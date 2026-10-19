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
            ["description"]="설명",
            ["plainText"]="본문 · 서식 본문이 있으면 저장 시 서식 본문에서 다시 만듦", ["textBlocks"]="서식 본문 (textBlocks JSON) · 있으면 본문 대신 표시, 비우면 본문 사용", ["showPlainText"]="본문 표시", ["highlightText"]="강조 문구", ["showHighlight"]="강조 문구 표시",
            ["bottomDescription"]="하단 안내", ["bottomDescriptionUrl"]="하단 안내 링크", ["showBottomDescription"]="하단 안내 표시",
            ["imageTitle"]="이미지 제목", ["imageUrl"]="이미지 경로 또는 URL", ["imageSizeMode"]="이미지 표시 방식",
            ["width"]="너비 · ADAPTIVE는 창 / FIT_TO_IMAGE는 이미지", ["height"]="높이 · ADAPTIVE는 창 / FIT_TO_IMAGE는 이미지",
            ["keepAspectRatio"]="이미지 비율 고정", ["showDescription"]="설명 표시",
            ["videoTitle"]="영상 제목", ["videoUrl"]="영상 경로 또는 URL", ["showControls"]="재생 컨트롤 표시",
            ["allowFullScreen"]="영상 전체화면 허용", ["allowPlaybackRateChange"]="배속 변경 허용", ["allowSeek"]="재생 위치 변경 허용", ["autoPlay"]="자동 재생",
            ["isLoop"]="반복 재생", ["defaultVolume"]="기본 음량 · 0~1, 시스템 동기화 연결 전/실패 시",
            ["surveyTitle"]="설문·퀴즈 제목", ["title"]="문항 제목", ["optionLayout"]="선택지 배치",
            ["questionType"]="문항 유형", ["isRequired"]="필수 응답", ["isScored"]="채점 대상", ["questionScore"]="문항 배점",
            ["correctAnswer"]="주관식 정답", ["answerMatchMode"]="주관식 정답 일치 방식", ["value"]="선택지 값",
            ["text"]="선택지 문구", ["isCorrect"]="정답 선택지",
            // [TODO55] 설문·퀴즈 서식(JSON). 있으면 저장 시 옆 일반 문자열을 서식에서 다시 만든다.
            ["surveyTitleBlocks"]="설문·퀴즈 제목 서식 (JSON) · 있으면 제목 대신 표시", ["descriptionBlocks"]="설명 서식 (JSON) · 있으면 설명 대신 표시",
            ["titleBlocks"]="문항 제목 서식 (JSON) · 있으면 문항 제목 대신 표시"
        };

        /*
         * [TODO54-3] 그룹 탭. 자주 쓰는 창·헤더/푸터·콘텐츠를 앞에 두고, 효과 없는 계약 필드와 Demo 전용 값은 고급 탭으로 뺀다.
         */
        private void BuildTabs(PopupResponseDto popup)
        {
            bool survey = popup.PopupType is "SURVEY" or "QUIZ";
            BuildWindowTab(popup);
            BuildHeaderFooterTab(survey);
            BuildContent(AddTab("콘텐츠", "유형별 화면 데이터입니다."), popup);
            BuildCompletionTab(popup);
            if (survey) BuildQuestions(AddTab("문항·선택지", "문항은 펼쳐서 편집합니다. 문항·선택지 추가·삭제는 Demo에서 지원하지 않습니다."), popup);
            BuildAdvancedTab();
        }

        private void BuildWindowTab(PopupResponseDto popup)
        {
            var panel = AddTab("창·배치", "창 크기·위치와 배경 Overlay입니다.");
            if (popup.PopupType == "IMAGE")
                AddNote(panel, "이미지 창 최대는 현재 모니터 작업 영역의 90%로 계산합니다. 고정 최대 픽셀값은 사용하지 않습니다. 지정한 이미지 크기는 유지하며 화면을 넘는 부분은 모드별 정책으로 처리합니다.");
            AddField(panel, _draft, "sizeMode", "창 크기 방식", typeof(string), new[] { "FIXED", "RATIO", "FULLSCREEN" });
            AddField(panel, _draft, "width", "고정 창 너비(px) · ORIGINAL 포함", typeof(double), min: 1, indent: true);
            AddField(panel, _draft, "height", "고정 창 높이(px) · ORIGINAL 포함", typeof(double), min: 1, indent: true);
            AddField(panel, _draft, "widthRatio", "작업 영역 대비 너비 비율", typeof(double), min: .01, max: 1, indent: true);
            AddField(panel, _draft, "heightRatio", "작업 영역 대비 높이 비율", typeof(double), min: .01, max: 1, indent: true);
            AddField(panel, _draft, "minimumWidth", "최소 창 너비(px)", typeof(double), min: 1);
            AddField(panel, _draft, "minimumHeight", "최소 창 높이(px)", typeof(double), min: 1);
            if (popup.PopupType != "IMAGE")
            {
                AddField(panel, _draft, "maximumWidth", "최대 창 너비(px)", typeof(double), min: 1);
                AddField(panel, _draft, "maximumHeight", "최대 창 높이(px)", typeof(double), min: 1);
            }
            AddField(panel, _draft, "popupPosition", "창 위치", typeof(string), new[] {
                "CENTER", "TOP_LEFT", "TOP_CENTER", "TOP_RIGHT", "CENTER_LEFT", "CENTER_RIGHT", "BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT" });
            // [설계 31] 위치·Overlay·글자 크기는 PopupWindow 공통 옵션이라 content가 아니라 최상위 값이다.
            AddField(panel, _draft, "useBackgroundOverlay", "배경 Overlay 사용", typeof(bool));
            AddField(panel, _draft, "backgroundOverlayOpacity", "배경 불투명도", typeof(double), min: 0, max: 1, indent: true);
        }

        private void BuildHeaderFooterTab(bool survey)
        {
            var panel = AddTab("헤더·푸터", "창 제목과 하단 영역입니다.");
            AddField(panel, _draft, "title", "창 제목", typeof(string));
            AddField(panel, _draft, "showHeader", "헤더 표시", typeof(bool));
            AddField(panel, _draft, "headerFontSize", "헤더 글자 크기 · 비우면 기본", typeof(double?), min: 10, max: 40, indent: true);
            AddField(panel, _draft, "showFooter", "푸터 표시", typeof(bool));
            AddField(panel, _draft, "showFooterButton", "푸터 버튼 표시", typeof(bool), indent: true);
            // [설계 30] Footer 동작은 최상위 값. 설문·퀴즈는 제출(SUBMIT) 고정이라 선택 항목을 두지 않는다.
            if (survey)
            {
                _draft["footerAction"] = "SUBMIT";
                _draft["footerLinkUrl"] = "";
                AddNote(panel, "푸터 동작: 제출 (설문·퀴즈 고정)");
            }
            else
            {
                if (_draft["footerAction"]?.GetValue<string>() != "LINK_AND_CLOSE") _draft["footerAction"] = "CLOSE";
                AddField(panel, _draft, "footerAction", "푸터 버튼 동작", typeof(string), new[] { "CLOSE", "LINK_AND_CLOSE" }, indent: true);
                AddField(panel, _draft, "footerLinkUrl", "푸터 바로가기 URL (http/https)", typeof(string), indent: true);
            }
            AddField(panel, _draft, "footerFontSize", "푸터 글자 크기 · 비우면 기본", typeof(double?), min: 10, max: 40, indent: true);
        }

        private void BuildCompletionTab(PopupResponseDto popup)
        {
            var panel = AddTab("완료·동작", "사용자가 팝업을 닫거나 미루는 동작과 완료 조건입니다.");
            AddField(panel, _draft, "showDoNotShowAgain", "다시 보지 않기 표시", typeof(bool));
            AddField(panel, _draft, "hideDays", "숨김 일수 · 비우면 30일", typeof(int?), min: 1, max: 3650, indent: true);
            AddField(panel, _draft, "showLater", "나중에 보기 표시", typeof(bool));
            if (popup.PopupType == "VIDEO" || HasVideo(popup))
                AddField(panel, _draft, "completionRatio", "영상 시청 완료 비율 · 비우면 1.0", typeof(double?), min: 0, max: 1);
            if (popup.PopupType == "QUIZ") AddField(panel, _draft, "passingScore", "퀴즈 통과 점수", typeof(double?), min: 0);
        }

        private void BuildAdvancedTab()
        {
            var panel = AddTab("고급", "효과가 제한된 값입니다. 보통은 바꿀 필요가 없습니다.");
            AddField(panel, _draft, "displayOrder", "표시 순서 · Demo 정렬용, 서버 응답에는 없음", typeof(int), min: 0);
            AddField(panel, _draft, "displayMode", "여러 팝업 표시 방식 · WPF는 읽지 않는 계약 필드(설계 50-B)", typeof(string), new[] { "SEQUENTIAL", "SIMULTANEOUS" });
        }

        private static bool HasVideo(PopupResponseDto popup) => popup.Content.TryGetProperty("videoEnabled", out var enabled)
            && enabled.ValueKind == JsonValueKind.True;

        private void BuildContent(StackPanel panel, PopupResponseDto popup)
        {
            JsonObject content = _draft["content"]!.AsObject();
            JsonObject defaults = _defaultsOf[content];
            Type type = popup.PopupType switch { "TEXT" => typeof(TextPopupContentDto), "IMAGE" => typeof(ImagePopupContentDto),
                "VIDEO" => typeof(VideoPopupContentDto), _ => typeof(SurveyPopupContentDto) };
            void AddDefaults(Type dtoType)
            {
                var dtoDefaults = JsonSerializer.SerializeToNode(Activator.CreateInstance(dtoType), dtoType, JsonOptions)!.AsObject();
                foreach (var pair in dtoDefaults)
                {
                    if (!content.ContainsKey(pair.Key)) content[pair.Key] = pair.Value?.DeepClone();
                    if (!defaults.ContainsKey(pair.Key)) defaults[pair.Key] = pair.Value?.DeepClone();
                }
            }
            AddDefaults(type);
            if (popup.PopupType == "IMAGE")
                AddNote(panel, "일반 이미지 크기는 아래 너비·높이만 사용합니다. 비우면 원본 크기로 계산합니다. 비율 고정 시 너비를 우선하고, 해제하면 지정한 크기로 표시합니다. ORIGINAL은 창·배치 탭의 창 크기를 사용합니다.");
            AddField(panel, _draft, "bodyFontSize", "본문 글자 크기 · 비우면 기본", typeof(double?), min: 10, max: 40);
            AddObjectFields(panel, content, type, popup.PopupType == "QUIZ");
            if (HasVideo(popup))
            {
                AddDefaults(typeof(VideoPopupContentDto));
                var video = new StackPanel { Margin = new Thickness(12) };
                panel.Children.Add(new Expander { Header = "동영상 재생 옵션", IsExpanded = true, Content = video });
                AddObjectFields(video, content, typeof(VideoPopupContentDto), true, videoSection: true);
            }
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
