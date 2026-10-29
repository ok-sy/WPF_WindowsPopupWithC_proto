using Popup.Dtos;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Popup.Services
{
    /// <summary>
    /// POL-14-02 : Demo 모드
    /// ■ Demo 샘플 데이터
    /// - in : 없음(내장 샘플 JSON · DemoMediaPathService 로컬 미디어 경로)
    /// - out: CreatePopups → List&lt;PopupResponseDto&gt; · 예외: InvalidOperationException(샘플 JSON 해석 실패)
    /// - Java API와 DB 없이 화면 시연에 사용할 WPF 전용 샘플 데이터를 만든다.
    ///   서버 응답과 같은 DTO 구조를 사용하므로 실제 PopupFactory와 화면을 그대로 검증한다.
    ///   TEXT 시연 데이터는 plainText/highlight 구성이다(markdown 모드 없음).
    /// </summary>
    public static class DemoPopupDataService
    {
        private static readonly JsonSerializerOptions JsonOptions =
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

        /*
         * ■ Demo 샘플 전체 생성
         * - in : 없음
         * - out: List<PopupResponseDto> 샘플 전체(7건)
         * - 유형 필터 매개변수는 두지 않는다. 유형별 선택은 DemoPopupGateway가 후보를 고를 때 한다.
         */
        public static List<PopupResponseDto> CreatePopups()
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
                      "showPlainText": true,
                      "textBlocks": [
                        {
                          "alignment": "LEFT",
                          "runs": [
                            {
                              "text": "사내 업무시스템 정기 점검 안내",
                              "bold": true,
                              "size": 24
                            }
                          ]
                        },
                        {
                          "alignment": "LEFT",
                          "runs": [
                            {
                              "text": "IT운영팀 — 안정적인 서비스 제공과 보안 강화를 위한 정기 점검",
                              "color": "#6B7280"
                            }
                          ]
                        },
                        {
                          "alignment": "LEFT",
                          "runs": [
                            {
                              "text": "점검 일정: ",
                              "bold": true
                            },
                            {
                              "text": "2026년 9월 12일 22:00 ~ 9월 13일 02:00",
                              "bold": true,
                              "color": "#DC2626"
                            },
                            {
                              "text": " (한국시간)",
                              "size": 12,
                              "color": "#6B7280"
                            }
                          ]
                        },
                        {
                          "alignment": "LEFT",
                          "runs": [
                            {
                              "text": "대상: ",
                              "bold": true
                            },
                            {
                              "text": "사내 포털, 전자결재, 문서관리 시스템"
                            }
                          ]
                        },
                        {
                          "alignment": "LEFT",
                          "runs": [
                            {
                              "text": "영향: ",
                              "bold": true
                            },
                            {
                              "text": "점검 시간 동안 "
                            },
                            {
                              "text": "서비스 접속 및 이용이 일시 중단",
                              "underline": true,
                              "color": "#DC2626"
                            },
                            {
                              "text": "됩니다."
                            }
                          ]
                        },
                        {
                          "alignment": "LEFT",
                          "runs": []
                        },
                        {
                          "alignment": "LEFT",
                          "runs": [
                            {
                              "text": "주요 작업",
                              "bold": true,
                              "size": 18,
                              "color": "#2563EB"
                            }
                          ]
                        },
                        {
                          "alignment": "LEFT",
                          "indent": 1,
                          "runs": [
                            {
                              "text": "- 서버 보안 업데이트 및 안정화"
                            }
                          ]
                        },
                        {
                          "alignment": "LEFT",
                          "indent": 1,
                          "runs": [
                            {
                              "text": "- 전자결재 조회 성능 개선"
                            }
                          ]
                        },
                        {
                          "alignment": "LEFT",
                          "indent": 1,
                          "runs": [
                            {
                              "text": "- 문서 저장소 백업 및 복구 상태 확인"
                            }
                          ]
                        },
                        {
                          "alignment": "LEFT",
                          "runs": []
                        },
                        {
                          "alignment": "RIGHT",
                          "runs": [
                            {
                              "text": "문의: ",
                              "bold": true
                            },
                            {
                              "text": "IT운영팀 서비스데스크",
                              "font": "MALGUN_GOTHIC"
                            },
                            {
                              "text": " (사내 포털 IT 지원 요청 메뉴)",
                              "italic": true,
                              "size": 14,
                              "color": "#6B7280"
                            }
                          ]
                        }
                      ],
                      "plainText": "사내 업무시스템 정기 점검 안내\nIT운영팀 — 안정적인 서비스 제공과 보안 강화를 위한 정기 점검\n점검 일정: 2026년 9월 12일 22:00 ~ 9월 13일 02:00 (한국시간)\n대상: 사내 포털, 전자결재, 문서관리 시스템\n영향: 점검 시간 동안 서비스 접속 및 이용이 일시 중단됩니다.\n\n주요 작업\n- 서버 보안 업데이트 및 안정화\n- 전자결재 조회 성능 개선\n- 문서 저장소 백업 및 복구 상태 확인\n\n문의: IT운영팀 서비스데스크 (사내 포털 IT 지원 요청 메뉴)",
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
                    "height": 1200,
                    "showHeader": false,
                    "showFooterButton": true,
                    "showFooter": true,
                    "showDoNotShowAgain": true,
                    "content": {
                      "imageTitle": "HYUNDAI CARD",
                      "imageUrl": "LOCAL_DEMO_IMAGE",
                      "description": "폐쇄망 Media 폴더의 로컬 이미지를 표시하는 팝업입니다.",
                      "showDescription": true,
                      "imageSizeMode": "ADAPTIVE"
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
                    "showLater": true,
                    "content": {
                      "videoTitle": "Demo Mode 교육 영상",
                      "videoUrl": "LOCAL_DEMO_VIDEO",
                      "description": "재생, 일시정지, 전체화면 컨트롤을 확인하세요.",
                      "showDescription": true,
                      "allowSeek": true
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
                      "surveyTitleBlocks": [
                        { "runs": [ { "text": "교육 " }, { "text": "만족도", "bold": true, "color": "#1F4E8C" }, { "text": " 설문" } ] }
                      ],
                      "description": "가로·세로 단일/복수 선택과 주관식을 확인할 수 있는 설문입니다.\n필수 문항에 답하고 추가 의견은 자유롭게 남겨주세요.",
                      "descriptionBlocks": [
                        { "runs": [ { "text": "가로·세로 단일/복수 선택과 주관식을 확인할 수 있는 설문입니다." } ] },
                        { "indent": 1, "runs": [ { "text": "필수 문항", "bold": true }, { "text": "에 답하고 추가 의견은 자유롭게 남겨주세요.", "italic": true } ] }
                      ]
                    },
                    "questions": [
                      {
                        "questionId": 1001,
                        "optionLayout": "VERTICAL",
                        "title": "화면 구성이 이해하기 쉬웠나요?",
                        "titleBlocks": [
                          { "runs": [ { "text": "화면 구성", "underline": true }, { "text": "이 이해하기 쉬웠나요?" } ] }
                        ],
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
                            "text": "추가 안내가 필요합니다.\n화면의 문항과 선택지를 자세히 설명하는 긴 안내 문구가 팝업의 오른쪽 영역을 넘어가지 않고 다음 줄로 이어지는지 확인합니다.",
                            "textBlocks": [
                              { "runs": [ { "text": "추가 안내가 필요합니다.", "bold": true } ] },
                              { "indent": 1, "runs": [ { "text": "화면의 문항과 선택지를 자세히 설명하는 긴 안내 문구가 팝업의 오른쪽 영역을 넘어가지 않고 다음 줄로 이어지는지 확인합니다.", "italic": true, "size": 12 } ] }
                            ]
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
                            "text": "이미지",
                            "textBlocks": [ { "runs": [ { "text": "이미지", "color": "#B42318", "size": 16 } ] } ]
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
            // POL-02-02 : 종료 제어 — 완료 전 닫기 허용 옵션은 없다. 시청 기준 전 이탈은 나중에 보기로 확인한다.
            videoQuiz["showLater"] = true;
            videoQuiz["showFooter"] = true;
            videoQuiz["showFooterButton"] = true;
            videoQuiz["content"]!["videoEnabled"] = true;
            // POL-05-03 : 결합 화면 — 서버는 VIDEO+QUIZ 제목을 1개(CONTENT_TITLE = surveyTitle)만 저장하고 videoTitle을 같은 값으로 내려준다.
            videoQuiz["content"]!["videoTitle"] = "교육 영상 이해도 평가";
            videoQuiz["content"]!["autoPlay"] = false;
            videoQuiz["content"]!["allowSeek"] = true;
            videoQuiz["content"]!["surveyTitle"] = "교육 영상 이해도 평가";
            videoQuiz["content"]!["description"] = "영상을 80% 이상 시청하면 응답할 수 있습니다. 객관식 4문항은 각 25점이며 100점이면 통과합니다. 마지막 의견은 선택 사항입니다.";
            demoPopups.Add(videoQuiz);

            JsonObject linked = demoPopups.First(node => node?["popupType"]?.GetValue<string>() == "TEXT")!.DeepClone().AsObject();
            linked["popupId"] = "DEMO-FOOTER-LINK";
            linked["title"] = "바로가기 버튼 데모";
            linked["showFooter"] = true;
            linked["showFooterButton"] = true;
            // POL-02-03 : 푸터 역할 — Footer 동작은 content가 아니라 popup 최상위 값이다.
            linked["footerAction"] = "LINK_AND_CLOSE";
            linked["footerLinkUrl"] = "https://example.com/";
            demoPopups.Add(linked);

            // POL-06-03 : 표현·수명 — 디자인 평가용 설문: 실제 교육 만족도 문구, 기본 글자색, 서식(FONT EDIT) 없음.
            // 서식·긴 문자열 스트레스 검증은 DEMO-SURVEY-001이 계속 맡는다. 단일/복수 × 세로/가로와 선택 문항을 모두 포함한다.
            JsonObject plainSurvey = demoPopups.First(node => node?["popupId"]?.GetValue<string>() == "DEMO-SURVEY-001")!.DeepClone().AsObject();
            plainSurvey["popupId"] = "DEMO-SURVEY-PLAIN";
            plainSurvey["title"] = "교육 만족도 조사";
            plainSurvey["content"] = JsonNode.Parse("""
                { "surveyTitle": "교육 만족도 조사", "description": "더 나은 교육을 위해 의견을 들려주세요. 응답에는 약 2분이 걸립니다." }
                """);
            plainSurvey["questions"] = JsonNode.Parse("""
                [
                  { "questionId": 5001, "optionLayout": "VERTICAL", "title": "이번 교육에 전반적으로 만족하셨나요?", "questionType": "SINGLE_CHOICE", "isRequired": true,
                    "options": [ { "optionId": 5101, "value": "5", "text": "매우 만족" }, { "optionId": 5102, "value": "4", "text": "만족" },
                                 { "optionId": 5103, "value": "3", "text": "보통" }, { "optionId": 5104, "value": "2", "text": "불만족" },
                                 { "optionId": 5105, "value": "1", "text": "매우 불만족" } ] },
                  { "questionId": 5002, "optionLayout": "HORIZONTAL", "title": "교육 시간은 적절했나요?", "questionType": "SINGLE_CHOICE", "isRequired": true,
                    "options": [ { "optionId": 5201, "value": "SHORT", "text": "짧았다" }, { "optionId": 5202, "value": "FIT", "text": "적절했다" },
                                 { "optionId": 5203, "value": "LONG", "text": "길었다" } ] },
                  { "questionId": 5003, "optionLayout": "VERTICAL", "title": "도움이 된 부분을 모두 선택해주세요.", "questionType": "MULTIPLE_CHOICE", "isRequired": true,
                    "options": [ { "optionId": 5301, "value": "LECTURE", "text": "강의 내용" }, { "optionId": 5302, "value": "PRACTICE", "text": "실습" },
                                 { "optionId": 5303, "value": "MATERIAL", "text": "교재와 참고 자료" }, { "optionId": 5304, "value": "QNA", "text": "질의응답" } ] },
                  { "questionId": 5004, "optionLayout": "HORIZONTAL", "title": "다음 교육에서 다루었으면 하는 주제가 있나요?", "questionType": "MULTIPLE_CHOICE", "isRequired": false,
                    "minSelections": 2, "maxSelections": 3,
                    "options": [ { "optionId": 5401, "value": "SECURITY", "text": "정보 보안" }, { "optionId": 5402, "value": "COLLAB", "text": "협업 도구" },
                                 { "optionId": 5403, "value": "DATA", "text": "데이터 분석" }, { "optionId": 5404, "value": "AUTO", "text": "업무 자동화" } ] },
                  { "questionId": 5005, "title": "교육에 대한 의견을 자유롭게 남겨주세요.", "questionType": "TEXT", "isRequired": false }
                ]
                """);
            demoPopups.Add(plainSurvey);

            /*
             * JSON에 특정 PC의 절대경로를 하드코딩하지 않고,
             * 실행 중인 EXE 옆 Media 폴더의 실제 절대경로를 넣는다.
             * EXE 옆 Media 파일이 없으면 DemoMediaPathService가 내장 리소스를 사용자 캐시에 풀어 그 경로를 쓴다.
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

                // Demo 샘플의 절대경로는 구분자를 '/'로 바꿔 넣는다(Windows가 허용하며 JSON 로그에 '\\' 이스케이프가 생기지 않음).
                if (popupType.Equals(
                        "IMAGE",
                        StringComparison.OrdinalIgnoreCase))
                {
                    contentObject["imageUrl"] =
                        DemoMediaPathService.GetImagePath().Replace('\\', '/');
                }
                else if (popupType.Equals(
                             "VIDEO",
                             StringComparison.OrdinalIgnoreCase)
                         || contentObject["videoEnabled"]?.GetValue<bool>() == true)
                {
                    contentObject["videoUrl"] =
                        DemoMediaPathService.GetVideoPath().Replace('\\', '/');
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
