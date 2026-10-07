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
                    "sizeMode": "RATIO",
                    "widthRatio": 0.58,
                    "heightRatio": 0.68,
                    "minimumWidth": 620,
                    "minimumHeight": 470,
                    "maximumWidth": 980,
                    "maximumHeight": 820,
                    "showHeader": true,
                    "showFooterButton": true,
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
                    "showHeader": false,
                    "showFooterButton": true,
                    "showFooter": true,
                    "showDoNotShowAgain": true,
                    "content": {
                      "imageTitle": "HYUNDAI CARD",
                      "imageUrl": "LOCAL_DEMO_IMAGE",
                      "description": "폐쇄망 Media 폴더의 로컬 이미지를 표시하는 팝업입니다.",
                      "showDescription": true,
                      "imageSizeMode": "ADAPTIVE",
                      "width": 400,
                      "height": 1200
                    }
                  },
                  {
                    "popupId": "DEMO-VIDEO-001",
                    "popupType": "VIDEO",
                    "title": "교육 영상 시연",
                    "displayMode": "SEQUENTIAL",
                    "sizeMode": "RATIO",
                    "widthRatio": 0.7,
                    "heightRatio": 0.75,
                    "minimumWidth": 680,
                    "minimumHeight": 500,
                    "maximumWidth": 1200,
                    "maximumHeight": 900,
                    "showHeader": true,
                    "showFooterButton": true,
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
                    "sizeMode": "RATIO",
                    "widthRatio": 0.55,
                    "heightRatio": 0.75,
                    "minimumWidth": 620,
                    "minimumHeight": 520,
                    "maximumWidth": 900,
                    "maximumHeight": 900,
                    "showHeader": false,
                    "showFooterButton": true,
                    "showFooter": false,
                    "content": {
                      "surveyTitle": "교육 만족도 설문",
                      "description": "가로·세로 단일/복수 선택과 주관식을 확인할 수 있는 설문입니다. 필수 문항에 답하고 추가 의견은 자유롭게 남겨주세요."
                    },
                    "questions": [
                      {
                        "questionId": 1001,
                        "optionLayout": "VERTICAL",
                        "title": "화면 구성이 이해하기 쉬웠나요?",
                        "questionType": "SINGLE_CHOICE",
                        "isRequired": true,
                        "options": [
                          {
                            "optionId": 1011,
                            "value": "EASY",
                            "text": "쉽게 이해할 수 있었습니다"
                          },
                          {
                            "optionId": 1012,
                            "value": "NORMAL",
                            "text": "설명을 읽고 이해할 수 있었습니다"
                          },
                          {
                            "optionId": 1013,
                            "value": "HELP",
                            "text": "추가 안내가 필요합니다. 화면의 문항과 선택지를 자세히 설명하는 긴 안내 문구가 팝업의 오른쪽 영역을 넘어가지 않고 다음 줄로 이어지는지 확인합니다."
                          },
                          {
                            "optionId": 1014,
                            "value": "WRAP",
                            "text": "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                          }
                        ]
                      },
                      {
                        "questionId": 1002,
                        "optionLayout": "HORIZONTAL",
                        "title": "가장 유용한 팝업 유형을 선택해주세요.",
                        "questionType": "SINGLE_CHOICE",
                        "isRequired": true,
                        "options": [
                          {
                            "optionId": 1101,
                            "value": "TEXT",
                            "text": "텍스트"
                          },
                          {
                            "optionId": 1102,
                            "value": "IMAGE",
                            "text": "이미지"
                          },
                          {
                            "optionId": 1103,
                            "value": "VIDEO",
                            "text": "영상"
                          },
                          {
                            "optionId": 1104,
                            "value": "SURVEY",
                            "text": "설문"
                          }
                        ]
                      },
                      {
                        "questionId": 1004,
                        "optionLayout": "VERTICAL",
                        "title": "교육에서 도움이 된 요소를 모두 선택해주세요.",
                        "questionType": "MULTIPLE_CHOICE",
                        "isRequired": true,
                        "options": [
                          {
                            "optionId": 1401,
                            "value": "1401",
                            "text": "실습"
                          },
                          {
                            "optionId": 1402,
                            "value": "1402",
                            "text": "업무 상황에 맞춘 구체적인 사례와 단계별 설명 덕분에 처음 접하는 내용도 이해할 수 있었고, 교육 이후 실제 업무에 적용할 방법을 찾는 데 도움이 되었습니다."
                          },
                          {
                            "optionId": 1403,
                            "value": "1403",
                            "text": "질의응답"
                          },
                          {
                            "optionId": 1404,
                            "value": "1404",
                            "text": "Detailed examples and guided exercises helped me understand the workflow and confidently apply the learning to everyday tasks."
                          },
                          {
                            "optionId": 1405,
                            "value": "1405",
                            "text": "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                          }
                        ]
                      },
                      {
                        "questionId": 1005,
                        "optionLayout": "HORIZONTAL",
                        "title": "다음 교육에서 다루었으면 하는 주제를 모두 선택해주세요.",
                        "questionType": "MULTIPLE_CHOICE",
                        "isRequired": true,
                        "options": [
                          {
                            "optionId": 1501,
                            "value": "1501",
                            "text": "보안"
                          },
                          {
                            "optionId": 1502,
                            "value": "1502",
                            "text": "협업"
                          },
                          {
                            "optionId": 1503,
                            "value": "1503",
                            "text": "데이터"
                          },
                          {
                            "optionId": 1504,
                            "value": "1504",
                            "text": "업무 자동화"
                          },
                          {
                            "optionId": 1505,
                            "value": "1505",
                            "text": "실제 프로젝트를 따라 하며 요구사항 정리부터 구현과 검증까지 전체 과정을 경험하는 심화 실습"
                          },
                          {
                            "optionId": 1506,
                            "value": "1506",
                            "text": "Accessibility and responsive interface design"
                          },
                          {
                            "optionId": 1507,
                            "value": "1507",
                            "text": "기타"
                          }
                        ]
                      },
                      {
                        "questionId": 1006,
                        "optionLayout": "HORIZONTAL",
                        "title": "선호하는 후속 교육 방식을 하나 선택해주세요.",
                        "questionType": "SINGLE_CHOICE",
                        "isRequired": true,
                        "options": [
                          {
                            "optionId": 1601,
                            "value": "1601",
                            "text": "온라인"
                          },
                          {
                            "optionId": 1602,
                            "value": "1602",
                            "text": "대면"
                          },
                          {
                            "optionId": 1603,
                            "value": "1603",
                            "text": "영상과 실습 자료를 먼저 살펴본 뒤 소규모 워크숍에서 질문하고 함께 문제를 해결하는 혼합 과정"
                          },
                          {
                            "optionId": 1604,
                            "value": "1604",
                            "text": "Self-paced learning with a live question-and-answer session"
                          }
                        ]
                      },
                      {
                        "questionId": 1003,
                        "title": "추가 의견을 작성해주세요.",
                        "questionType": "TEXT",
                        "isRequired": false
                      }
                    ]
                  },
                  {
                    "popupId": "DEMO-QUIZ-001",
                    "popupType": "QUIZ",
                    "title": "정보보안 교육 평가",
                    "displayMode": "SEQUENTIAL",
                    "sizeMode": "RATIO",
                    "widthRatio": 0.55,
                    "heightRatio": 0.75,
                    "minimumWidth": 620,
                    "minimumHeight": 520,
                    "maximumWidth": 900,
                    "maximumHeight": 900,
                    "showHeader": false,
                    "showFooterButton": true,
                    "showFooter": false,
                    "content": {
                      "surveyTitle": "정보보안 교육 평가",
                      "description": "객관식 4문항은 각 25점이며 100점이면 통과합니다. 단일선택은 하나, 복수선택은 해당하는 항목을 모두 선택하세요. 마지막 의견은 선택 사항입니다."
                    },
                    "passingScore": 100,
                    "questions": [
                      {
                        "questionId": 2001,
                        "optionLayout": "VERTICAL",
                        "title": "개인정보에 해당하는 것은?",
                        "questionType": "SINGLE_CHOICE",
                        "isRequired": true,
                        "isScored": true,
                        "questionScore": 25,
                        "options": [
                          {
                            "optionId": 2101,
                            "value": "PHONE",
                            "text": "휴대전화 번호",
                            "isCorrect": true
                          },
                          {
                            "optionId": 2102,
                            "value": "WEATHER",
                            "text": "오늘의 날씨",
                            "isCorrect": false
                          }
                        ]
                      },
                      {
                        "questionId": 2002,
                        "optionLayout": "HORIZONTAL",
                        "title": "안전한 비밀번호 관리 방법을 모두 선택하세요.",
                        "questionType": "MULTIPLE_CHOICE",
                        "isRequired": true,
                        "isScored": true,
                        "questionScore": 25,
                        "options": [
                          {
                            "optionId": 2201,
                            "value": "LONG",
                            "text": "충분히 긴 비밀번호 사용",
                            "isCorrect": true
                          },
                          {
                            "optionId": 2202,
                            "value": "REUSE",
                            "text": "모든 사이트에서 동일한 비밀번호를 반복해서 재사용하고 다른 사람과 공유하는 방식은 안전하지 않습니다. 긴 복수 선택 보기의 줄바꿈을 확인하세요.",
                            "isCorrect": false
                          },
                          {
                            "optionId": 2203,
                            "value": "MFA",
                            "text": "다중 인증 사용",
                            "isCorrect": true
                          }
                        ]
                      },
                      {
                        "questionId": 2003,
                        "optionLayout": "HORIZONTAL",
                        "title": "의심스러운 메일을 받았을 때 가장 먼저 할 행동은?",
                        "questionType": "SINGLE_CHOICE",
                        "isRequired": true,
                        "options": [
                          {
                            "optionId": 2301,
                            "value": "2301",
                            "text": "신고",
                            "isCorrect": true
                          },
                          {
                            "optionId": 2302,
                            "value": "2302",
                            "text": "회신",
                            "isCorrect": false
                          },
                          {
                            "optionId": 2303,
                            "value": "2303",
                            "text": "발신자를 확인하지 않고 첨부파일을 열어 안내에 따라 계정 정보와 인증번호를 입력한다.",
                            "isCorrect": false
                          },
                          {
                            "optionId": 2304,
                            "value": "2304",
                            "text": "Forward the suspicious attachment to everyone without checking the sender.",
                            "isCorrect": false
                          }
                        ],
                        "isScored": true,
                        "questionScore": 25
                      },
                      {
                        "questionId": 2004,
                        "optionLayout": "VERTICAL",
                        "title": "개인정보를 안전하게 처리하는 방법을 모두 선택하세요.",
                        "questionType": "MULTIPLE_CHOICE",
                        "isRequired": true,
                        "options": [
                          {
                            "optionId": 2401,
                            "value": "2401",
                            "text": "화면 잠금",
                            "isCorrect": true
                          },
                          {
                            "optionId": 2402,
                            "value": "2402",
                            "text": "업무에 필요한 최소한의 개인정보만 수집하고, 보관 기간이 끝나거나 처리 목적이 달성되면 정해진 절차에 따라 안전하게 삭제한다.",
                            "isCorrect": true
                          },
                          {
                            "optionId": 2403,
                            "value": "2403",
                            "text": "공개 폴더에 저장",
                            "isCorrect": false
                          },
                          {
                            "optionId": 2404,
                            "value": "2404",
                            "text": "Share customer records through an unrestricted public link so that anyone can download them without authentication.",
                            "isCorrect": false
                          },
                          {
                            "optionId": 2405,
                            "value": "2405",
                            "text": "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                            "isCorrect": false
                          }
                        ],
                        "isScored": true,
                        "questionScore": 25
                      },
                      {
                        "questionId": 2005,
                        "title": "교육 내용 중 다시 살펴보고 싶은 부분이나 추가 의견을 남겨주세요.",
                        "questionType": "TEXT",
                        "isRequired": false
                      }
                    ]
                  }
                ]
                """;

            JsonArray demoPopups =
                JsonNode.Parse(
                    demoJson)?.AsArray()
                ?? throw new InvalidOperationException(
                    "Demo Mode 샘플 JSON을 읽지 못했습니다.");

            JsonObject videoQuiz = demoPopups.First(node => node?["popupType"]?.GetValue<string>() == "QUIZ")!.DeepClone().AsObject();
            videoQuiz["popupId"] = "DEMO-VIDEO-QUIZ";
            videoQuiz["title"] = "동영상 + 퀴즈";
            videoQuiz["height"] = 850;
            videoQuiz["completionRatio"] = 0.8;
            videoQuiz["allowCloseBeforeComplete"] = true;
            videoQuiz["showFooter"] = true;
            videoQuiz["showFooterButton"] = true;
            videoQuiz["content"]!["videoEnabled"] = true;
            videoQuiz["content"]!["videoTitle"] = "교육 영상";
            videoQuiz["content"]!["autoPlay"] = false;
            videoQuiz["content"]!["surveyTitle"] = "교육 영상 이해도 평가";
            videoQuiz["content"]!["description"] = "영상을 80% 이상 시청하면 응답할 수 있습니다. 객관식 4문항은 각 25점이며 100점이면 통과합니다. 마지막 의견은 선택 사항입니다.";
            demoPopups.Add(videoQuiz);

            JsonObject linked = demoPopups.First(node => node?["popupType"]?.GetValue<string>() == "TEXT")!.DeepClone().AsObject();
            linked["popupId"] = "DEMO-FOOTER-LINK";
            linked["title"] = "바로가기 버튼 데모";
            linked["showFooter"] = true;
            linked["showFooterButton"] = true;
            linked["content"]!["footerAction"] = "LINK_AND_CLOSE";
            linked["content"]!["footerLinkUrl"] = "https://example.com/";
            demoPopups.Add(linked);

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

                    bool selected = requestedPopupType == "VIDEO_QUIZ"
                        ? demoPopups[index]?["popupId"]?.GetValue<string>() == "DEMO-VIDEO-QUIZ"
                        : requestedPopupType == "FOOTER_LINK"
                        ? demoPopups[index]?["popupId"]?.GetValue<string>() == "DEMO-FOOTER-LINK"
                        : popupType.Equals(
                            requestedPopupType,
                            StringComparison.OrdinalIgnoreCase)
                            && demoPopups[index]?["popupId"]?.GetValue<string>() is not ("DEMO-VIDEO-QUIZ" or "DEMO-FOOTER-LINK");
                    if (!selected)
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
                             StringComparison.OrdinalIgnoreCase)
                         || contentObject["videoEnabled"]?.GetValue<bool>() == true)
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
