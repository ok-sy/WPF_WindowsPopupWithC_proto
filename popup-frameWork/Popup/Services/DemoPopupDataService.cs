using Popup.Dtos;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Popup.Services
{
    /// <summary>
    /// Java API와 DB 없이 화면 시연에 사용할 WPF 전용 샘플 데이터를 만든다.
    /// 서버 응답과 같은 DTO 구조를 사용하므로 실제 PopupFactory와 화면을 그대로 검증한다.
    /// [2026-09-21] TEXT 시연 데이터를 markdown 모드에서 plainText/highlight 구성으로 바꿨다(markdown 모드 제거).
    /// </summary>
    public static class DemoPopupDataService
    {
        private static readonly JsonSerializerOptions JsonOptions =
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

        public static List<PopupResponseDto> CreatePopups(
            string? requestedPopupType = null)
        {
            const string demoJson =
                """
                [
                  {
                    "popupId": "DEMO-TEXT-001",
                    "popupType": "TEXT",
                    "title": "공지사항",
                    "displayMode": "SEQUENTIAL",
                    "sizeMode": "VIEWPORT_RATIO",
                    "widthRatio": 0.58,
                    "heightRatio": 0.68,
                    "minimumWidth": 620,
                    "minimumHeight": 470,
                    "maximumWidth": 980,
                    "maximumHeight": 820,
                    "showHeader": true,
                    "showCloseButton": true,
                    "showFooter": true,
                    "showDoNotShowAgain": false,
                    "content": {
                      "contentTitle": "사내 업무시스템 정기 점검 안내",
                      "description": "IT운영팀 — 안정적인 서비스 제공과 보안 강화를 위한 정기 점검",
                      "showContentHeader": true,
                      "showPlainText": true,
                      "plainText": "점검 일정: 2026년 9월 12일 22:00 ~ 9월 13일 02:00 (한국시간)\n대상: 사내 포털, 전자결재, 문서관리 시스템\n영향: 점검 시간 동안 서비스 접속 및 이용이 일시 중단됩니다.\n\n주요 작업\n- 서버 보안 업데이트 및 안정화\n- 전자결재 조회 성능 개선\n- 문서 저장소 백업 및 복구 상태 확인\n\n문의: IT운영팀 서비스데스크 (사내 포털 IT 지원 요청 메뉴)",
                      "showHighlight": true,
                      "highlightText": "작업 중인 문서와 결재 내용은 점검 시작 전 반드시 저장해 주세요.",
                      "showBottomDescription": true,
                      "bottomDescription": "작업 상황에 따라 종료 시간이 변경될 수 있으며, 변경 시 별도 안내드리겠습니다."
                    }
                  },
                  {
                    "popupId": "DEMO-IMAGE-001",
                    "popupType": "IMAGE",
                    "title": "이미지 팝업 시연",
                    "displayMode": "SEQUENTIAL",
                    "sizeMode": "FIXED",
                    "width": 400,
                    "height": 700,
                    "showHeader": false,
                    "showCloseButton": true,
                    "showFooter": true,
                    "showDoNotShowAgain": true,
                    "content": {
                      "imageTitle": "HYUNDAI CARD",
                      "imageUrl": "LOCAL_DEMO_IMAGE",
                      "description": "폐쇄망 Media 폴더의 로컬 이미지를 표시하는 팝업입니다.",
                      "showDescription": false,
                      "imageSizeMode": "ADAPTIVE",
                      "imageWidth": 620,
                      "imageHeight": 520
                    }
                  },
                  {
                    "popupId": "DEMO-VIDEO-001",
                    "popupType": "VIDEO",
                    "title": "교육 영상 시연",
                    "displayMode": "SEQUENTIAL",
                    "sizeMode": "VIEWPORT_RATIO",
                    "widthRatio": 0.70,
                    "heightRatio": 0.75,
                    "minimumWidth": 680,
                    "minimumHeight": 500,
                    "maximumWidth": 1200,
                    "maximumHeight": 900,
                    "showHeader": true,
                    "showCloseButton": true,
                    "showFooter": true,
                    "showDoNotShowAgain": false,
                    "allowCloseBeforeComplete": true,
                    "content": {
                      "videoTitle": "Demo Mode 교육 영상",
                      "videoUrl": "LOCAL_DEMO_VIDEO",
                      "description": "재생, 일시정지, 전체화면 컨트롤을 확인하세요.",
                      "showDescription": true
                    }
                  },
                  {
                    "popupId": "DEMO-SURVEY-001",
                    "popupType": "SURVEY",
                    "title": "교육 만족도 설문",
                    "displayMode": "SEQUENTIAL",
                    "sizeMode": "VIEWPORT_RATIO",
                    "widthRatio": 0.55,
                    "heightRatio": 0.75,
                    "minimumWidth": 620,
                    "minimumHeight": 520,
                    "maximumWidth": 900,
                    "maximumHeight": 900,
                    "showHeader": false,
                    "showCloseButton": true,
                    "showFooter": false,
                    "content": {
                      "surveyTitle": "교육 만족도 설문",
                      "description": "시연 화면 확인을 위해 아래 문항에 응답해주세요.",
                      "questions": [
                        {
                          "questionId": 1001,
                          "title": "화면 구성이 이해하기 쉬웠나요?",
                          "questionType": "RATING5",
                          "isRequired": true
                        },
                        {
                          "questionId": 1002,
                          "title": "가장 유용한 팝업 유형을 선택해주세요.",
                          "questionType": "SINGLE_CHOICE",
                          "isRequired": true,
                          "options": [
                            { "optionId": 1101, "value": "TEXT", "text": "텍스트" },
                            { "optionId": 1102, "value": "IMAGE", "text": "이미지" },
                            { "optionId": 1103, "value": "VIDEO", "text": "영상" },
                            { "optionId": 1104, "value": "SURVEY", "text": "설문" }
                          ]
                        },
                        {
                          "questionId": 1003,
                          "title": "추가 의견을 작성해주세요.",
                          "questionType": "TEXT",
                          "isRequired": false
                        }
                      ]
                    }
                  },
                  {
                    "popupId": "DEMO-QUIZ-001",
                    "popupType": "QUIZ",
                    "title": "정보보안 교육 평가",
                    "displayMode": "SEQUENTIAL",
                    "sizeMode": "VIEWPORT_RATIO",
                    "widthRatio": 0.55,
                    "heightRatio": 0.75,
                    "minimumWidth": 620,
                    "minimumHeight": 520,
                    "maximumWidth": 900,
                    "maximumHeight": 900,
                    "showHeader": false,
                    "showCloseButton": true,
                    "showFooter": false,
                    "content": {
                      "surveyTitle": "정보보안 교육 평가",
                      "description": "두 문항을 모두 맞히면 통과합니다.",
                      "passingScore": 100,
                      "questions": [
                        {
                          "questionId": 2001,
                          "title": "개인정보에 해당하는 것은?",
                          "questionType": "SINGLE_CHOICE",
                          "isRequired": true,
                          "isScored": true,
                          "correctAnswers": ["PHONE"],
                          "options": [
                            { "optionId": 2101, "value": "PHONE", "text": "휴대전화 번호" },
                            { "optionId": 2102, "value": "WEATHER", "text": "오늘의 날씨" }
                          ]
                        },
                        {
                          "questionId": 2002,
                          "title": "안전한 비밀번호 관리 방법을 모두 선택하세요.",
                          "questionType": "MULTIPLE_CHOICE",
                          "isRequired": true,
                          "isScored": true,
                          "correctAnswers": ["LONG", "MFA"],
                          "options": [
                            { "optionId": 2201, "value": "LONG", "text": "충분히 긴 비밀번호 사용" },
                            { "optionId": 2202, "value": "REUSE", "text": "모든 사이트에서 재사용" },
                            { "optionId": 2203, "value": "MFA", "text": "다중 인증 사용" }
                          ]
                        }
                      ]
                    }
                  }
                ]
                """;

            JsonArray demoPopups =
                JsonNode.Parse(
                    demoJson)?.AsArray()
                ?? throw new InvalidOperationException(
                    "Demo Mode 샘플 JSON을 읽지 못했습니다.");

            /*
             * 개별 버튼으로 실행했다면 선택한 종류만 먼저 남긴다.
             * 따라서 TEXT나 SURVEY를 확인할 때 이미지·동영상 파일이 없어도 된다.
             */
            if (!string.IsNullOrWhiteSpace(
                    requestedPopupType))
            {
                for (int index = demoPopups.Count - 1;
                     index >= 0;
                     index--)
                {
                    string popupType =
                        demoPopups[index]?["popupType"]?.GetValue<string>()
                        ?? string.Empty;

                    if (!popupType.Equals(
                            requestedPopupType,
                            StringComparison.OrdinalIgnoreCase))
                    {
                        demoPopups.RemoveAt(
                            index);
                    }
                }
            }

            /*
             * JSON에 특정 PC의 절대경로를 하드코딩하지 않고,
             * 실행 중인 EXE 옆 Media 폴더의 실제 절대경로를 넣는다.
             */
            foreach (JsonNode? popupNode
                     in demoPopups)
            {
                JsonObject? popupObject =
                    popupNode?.AsObject();

                string popupType =
                    popupObject?["popupType"]?.GetValue<string>()
                    ?? string.Empty;

                JsonObject? contentObject =
                    popupObject?["content"]?.AsObject();

                if (contentObject == null)
                {
                    continue;
                }

                if (popupType.Equals(
                        "IMAGE",
                        StringComparison.OrdinalIgnoreCase))
                {
                    contentObject["imageUrl"] =
                        DemoMediaPathService.GetImagePath();
                }
                else if (popupType.Equals(
                             "VIDEO",
                             StringComparison.OrdinalIgnoreCase))
                {
                    contentObject["videoUrl"] =
                        DemoMediaPathService.GetVideoPath();
                }
            }

            return JsonSerializer.Deserialize<List<PopupResponseDto>>(
                       demoPopups.ToJsonString(),
                       JsonOptions)
                   ?? throw new InvalidOperationException(
                       "Demo Mode 샘플 데이터를 읽지 못했습니다.");
        }
    }
}
