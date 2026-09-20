# 팝업 시스템 인터페이스 설계서 — JSON 송수신 기준

- 문서 버전: 1.0 / 작성일: 2026-09-16 (KST)
- 대상: 관리자 웹 ↔ zero-rule-server ↔ WPF 팝업 클라이언트
- 기준: 현재 저장소 구현. 설계서 예시는 가상 데이터이며 실운영 캡처가 아니다.
- 범위: 팝업 관련 JSON API 12개, 공통 데이터 및 유형별 content. 로그인·타 업무 API와 화면 배치 설계는 제외한다.
- 예제 모음: [popup-interface-examples.json](popup-interface-examples.json)

## 1. 공통 규약

| 항목 | 규약 |
|---|---|
| 기본 주소 예시 | http://localhost:8080/zero-rule-server |
| 본문 | UTF-8 JSON, Content-Type: application/json |
| 필드명 | camelCase, 이름과 대소문자 유지 |
| WPF API | /p/api/popups 아래. 배열 또는 객체 직접 반환, body 래퍼 없음 |
| 관리자 API | /apis/popup 아래. 응답의 body에 업무 데이터 포함. 관리자 로그인/기존 권한 체계 사용 |
| 식별자 | popupId·userId는 문자열. questionId·optionId·templateId·responseId는 JSON 정수 |
| 날짜 요청 | 시간대 포함 ISO 8601 문자열 권장. 예: 2026-09-16T09:00:00+09:00 |
| 날짜 응답 | BasicConfig에서 WRITE_DATES_AS_TIMESTAMPS 사용. OffsetDateTime은 epoch 초 숫자(소수 가능). 예제는 정수 초. 웹/WPF는 ISO/epoch 호환 처리 |
| null | NON_NULL 설정으로 값 없는 응답 필드는 생략될 수 있음. 미제공을 오류나 0으로 단정하지 않음 |
| boolean | true/false. 관리자 목록 activeYn만 Y/N 문자열 |
| GET | 요청 JSON 본문 없음. userId를 URL 쿼리로 전송 |

WPF 설정의 BaseUrl 예시는 http://localhost:8080/zero-rule-server/p 이며 클라이언트가 /api/popups를 붙인다. /p를 중복해서 붙이지 않는다. 별도 popup-api 프로젝트의 /api/popups와 주 서버 경로를 혼용하지 않는다.

관리자 정상 응답은 CLNewApiResponse를 사용한다. 아래 예시는 msgId와 body만 표시한 축약형이다. msgCn, msgClsf, msgPrntCd, msgKn, occrPrgNm, occrMethodNm, url 등의 부가 필드는 프레임워크/메시지 설정에 따라 달라진다. 정상 메시지 ID는 BE00000001을 요청하며 실제 메시지 레코드가 없으면 오류 응답이 될 수 있다. msgClsf가 ER이면 오류로 처리한다.

## 2. 인터페이스 목록

| ID | 기능 | HTTP | 경로 | 응답 업무 데이터 |
|---|---|---|---|---|
| WPF-01 | 사용자 팝업 목록 | GET | /p/api/popups | 직접 배열/객체 |
| WPF-02 | 팝업 숨김 | POST | /p/api/popups/{popupId}/hide | 직접 배열/객체 |
| WPF-03 | 답안 제출 | POST | /p/api/popups/{popupId}/responses | 직접 배열/객체 |
| WPF-04 | 영상 진행률 | POST | /p/api/popups/{popupId}/video-progress | 직접 배열/객체 |
| WPF-05 | 표시·닫기 이벤트 | POST | /p/api/popups/{popupId}/events | 직접 배열/객체 |
| WPF-06 | 사용자 상태 목록 | GET | /p/api/popups/statuses | 직접 배열/객체 |
| ADM-01 | 관리자 목록 | POST | /apis/popup/list | body 내부 객체 |
| ADM-02 | 관리자 상세 | POST | /apis/popup/info | body 내부 객체 |
| ADM-03 | 관리자 등록·수정 | POST | /apis/popup/save | body 내부 객체 |
| ADM-04 | 활성 변경 | POST | /apis/popup/active | body 내부 객체 |
| ADM-05 | 문항 템플릿 목록 | POST | /apis/popup/question-templates | body 내부 객체 |
| ADM-06 | 문항 템플릿 상세 | POST | /apis/popup/question-template | body 내부 객체 |

## 3. API별 요청·응답 JSON

POST 경로의 {popupId}는 실제 대상 팝업 ID로 치환한다. 예시의 ID는 실제 DB 등록값이 아니므로 그대로 실행하면 업무 검증에 실패할 수 있다.

### WPF-01 사용자 팝업 목록

**GET /p/api/popups**

요청 본문 없음. 응답은 배열이며 body 래퍼 없음. 노출 가능한 팝업이 없으면 [].

요청 URL 예: /p/api/popups?userId=SAMPLE-USER-001 (본문 없음)

응답 예시:

```json
[
  {
    "popupId": "SAMPLE-TEXT-001",
    "popupType": "TEXT",
    "title": "공지사항",
    "displayStartAt": 1789516800,
    "displayEndAt": 1792108800,
    "displayMode": "SEQUENTIAL",
    "displayOrder": 100,
    "sizeMode": "FIXED",
    "width": 560,
    "height": 420,
    "widthRatio": 0.7,
    "heightRatio": 0.75,
    "minimumWidth": 480,
    "minimumHeight": 320,
    "maximumWidth": 1200,
    "maximumHeight": 900,
    "showHeader": true,
    "showCloseButton": true,
    "showFooter": true,
    "showDoNotShowAgain": false,
    "periodMode": "FIXED",
    "allowCloseBeforeComplete": true,
    "questions": [],
    "content": {
      "contentTitle": "서비스 안내",
      "description": "공지 내용을 확인해 주세요.",
      "showContentHeader": true,
      "plainText": "서비스 점검 안내입니다.",
      "showPlainText": true,
      "highlightText": "작업 중인 내용을 저장해 주세요.",
      "showHighlight": true,
      "bottomDescription": "자세히 보기",
      "bottomDescriptionUrl": "https://example.com/notice",
      "showBottomDescription": true,
      "markdownMode": false,
      "markdownContent": "",
      "useBackgroundOverlay": true,
      "backgroundOverlayOpacity": 0.45
    }
  },
  {
    "popupId": "SAMPLE-QUIZ-001",
    "popupType": "QUIZ",
    "title": "확인 퀴즈",
    "displayStartAt": 1789516800,
    "displayEndAt": 1792108800,
    "displayMode": "SEQUENTIAL",
    "displayOrder": 100,
    "sizeMode": "FIXED",
    "width": 560,
    "height": 420,
    "widthRatio": 0.7,
    "heightRatio": 0.75,
    "minimumWidth": 480,
    "minimumHeight": 320,
    "maximumWidth": 1200,
    "maximumHeight": 900,
    "showHeader": true,
    "showCloseButton": true,
    "showFooter": true,
    "showDoNotShowAgain": false,
    "periodMode": "FIXED",
    "allowCloseBeforeComplete": true,
    "questions": [
      {
        "questionId": 101,
        "title": "안내를 확인했습니까?",
        "description": "한 개를 선택하세요.",
        "questionType": "SINGLE_CHOICE",
        "isRequired": true,
        "isScored": true,
        "questionScore": 10,
        "sortOrder": 1,
        "options": [
          {
            "optionId": 1001,
            "value": "YES",
            "text": "예",
            "sortOrder": 1
          },
          {
            "optionId": 1002,
            "value": "NO",
            "text": "아니요",
            "sortOrder": 2
          }
        ]
      }
    ],
    "content": {
      "surveyTitle": "안내 확인",
      "description": "문항에 응답해 주세요.",
      "questions": [
        {
          "questionId": 101,
          "title": "안내를 확인했습니까?",
          "description": "한 개를 선택하세요.",
          "questionType": "SINGLE_CHOICE",
          "isRequired": true,
          "isScored": true,
          "questionScore": 10,
          "sortOrder": 1,
          "options": [
            {
              "optionId": 1001,
              "value": "YES",
              "text": "예",
              "sortOrder": 1
            },
            {
              "optionId": 1002,
              "value": "NO",
              "text": "아니요",
              "sortOrder": 2
            }
          ]
        }
      ],
      "useBackgroundOverlay": true,
      "backgroundOverlayOpacity": 0.45
    },
    "questionTemplateId": 10,
    "passingScore": 10
  }
]
```

### WPF-02 팝업 숨김

**POST /p/api/popups/{popupId}/hide**

userId 필수, hideDays 필수 정수 1~3650. hiddenUntil은 서버/DB 계산 결과.

요청 본문:

```json
{
  "userId": "SAMPLE-USER-001",
  "hideDays": 1
}
```

응답 예시:

```json
{
  "userId": "SAMPLE-USER-001",
  "popupId": "SAMPLE-TEXT-001",
  "hideType": "UNTIL",
  "hiddenUntil": 1789603200
}
```

### WPF-03 답안 제출

**POST /p/api/popups/{popupId}/responses**

clientRequestId·userId·answers 필수. answers는 1개 이상, questionId 필수. responseStartedAt 선택. 선택형은 optionIds, 주관식은 textAnswer 사용. 실제 조회된 문항/선택지 ID를 사용. 점수는 보내지 않음.

요청 본문:

```json
{
  "clientRequestId": "example-request-001",
  "userId": "SAMPLE-USER-001",
  "responseStartedAt": "2026-09-16T09:00:00+09:00",
  "answers": [
    {
      "questionId": 101,
      "optionIds": [
        1001
      ]
    }
  ]
}
```

응답 예시:

```json
{
  "responseId": 5001,
  "clientRequestId": "example-request-001",
  "userId": "SAMPLE-USER-001",
  "popupId": "SAMPLE-QUIZ-001",
  "responseStatus": "SUBMITTED",
  "totalScore": 10,
  "passed": true,
  "submittedAt": 1789516860
}
```

### WPF-04 영상 진행률

**POST /p/api/popups/{popupId}/video-progress**

모든 요청 항목 필수. durationSeconds >= 0.001, 나머지 시간 >= 0. 단위 초. 서버의 completed를 완료 판단 기준으로 사용.

요청 본문:

```json
{
  "userId": "SAMPLE-USER-001",
  "durationSeconds": 100,
  "positionSeconds": 95,
  "maximumPositionSeconds": 95,
  "watchedSeconds": 95
}
```

응답 예시:

```json
{
  "userId": "SAMPLE-USER-001",
  "popupId": "SAMPLE-VIDEO-001",
  "watchedRatio": 0.95,
  "requiredRatio": 0.9,
  "completed": true,
  "completedAt": 1789516895
}
```

### WPF-05 표시·닫기 이벤트

**POST /p/api/popups/{popupId}/events**

userId·eventType 필수. eventType은 DISPLAYED 또는 CLOSED.

요청 본문:

```json
{
  "userId": "SAMPLE-USER-001",
  "eventType": "DISPLAYED"
}
```

응답 예시:

```json
{
  "userId": "SAMPLE-USER-001",
  "popupId": "SAMPLE-TEXT-001",
  "eventType": "DISPLAYED",
  "recordedAt": 1789516800
}
```

### WPF-06 사용자 상태 목록

**GET /p/api/popups/statuses**

요청 본문 없음. closedAt·hiddenUntilAt·completedAt은 해당 값이 있을 때 제공.

요청 URL 예: /p/api/popups/statuses?userId=SAMPLE-USER-001 (본문 없음)

응답 예시:

```json
[
  {
    "userId": "SAMPLE-USER-001",
    "popupId": "SAMPLE-TEXT-001",
    "popupStatus": "DISPLAYED",
    "firstDisplayedAt": 1789516800,
    "lastDisplayedAt": 1789516800,
    "displayCount": 1,
    "completed": false
  }
]
```

### ADM-01 관리자 목록

**POST /apis/popup/list**

별도 필터·페이지 요청 필드 없음. 비활성·기간 만료 포함. activeYn은 Y/N 문자열. questionTemplateId는 설정된 경우 제공.

요청 본문:

```json
{}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "popups": [
      {
        "popupId": "SAMPLE-TEXT-001",
        "popupType": "TEXT",
        "title": "공지사항",
        "displayStartAt": 1789516800,
        "displayEndAt": 1792108800,
        "displayMode": "SEQUENTIAL",
        "displayOrder": 100,
        "sizeMode": "FIXED",
        "activeYn": "Y",
        "periodMode": "FIXED",
        "createdBy": "SAMPLE-ADMIN",
        "createdAt": 1789516800,
        "updatedBy": "SAMPLE-ADMIN",
        "updatedAt": 1789516800
      }
    ]
  }
}
```

### ADM-02 관리자 상세

**POST /apis/popup/info**

popupId 필수 1~50자. 정답 포함 문항은 popup.questions 및 adminQuestions에서 확인. 예시는 TEXT라 빈 배열.

요청 본문:

```json
{
  "popupId": "SAMPLE-TEXT-001"
}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "popup": {
      "popupId": "SAMPLE-TEXT-001",
      "popupType": "TEXT",
      "title": "공지사항",
      "displayStartAt": 1789516800,
      "displayEndAt": 1792108800,
      "displayMode": "SEQUENTIAL",
      "displayOrder": 100,
      "sizeMode": "FIXED",
      "width": 560,
      "height": 420,
      "widthRatio": 0.7,
      "heightRatio": 0.75,
      "minimumWidth": 480,
      "minimumHeight": 320,
      "maximumWidth": 1200,
      "maximumHeight": 900,
      "showHeader": true,
      "showCloseButton": true,
      "showFooter": true,
      "showDoNotShowAgain": false,
      "periodMode": "FIXED",
      "allowCloseBeforeComplete": true,
      "questions": [],
      "content": {
        "contentTitle": "서비스 안내",
        "description": "공지 내용을 확인해 주세요.",
        "showContentHeader": true,
        "plainText": "서비스 점검 안내입니다.",
        "showPlainText": true,
        "highlightText": "작업 중인 내용을 저장해 주세요.",
        "showHighlight": true,
        "bottomDescription": "자세히 보기",
        "bottomDescriptionUrl": "https://example.com/notice",
        "showBottomDescription": true,
        "markdownMode": false,
        "markdownContent": "",
        "useBackgroundOverlay": true,
        "backgroundOverlayOpacity": 0.45
      }
    },
    "adminQuestions": [],
    "targetGroups": [
      {
        "targetName": "예시 사용자",
        "targetDescription": "설계서 예시",
        "conditions": [
          {
            "conditionType": "EMPLOYEE",
            "conditionOperator": "=",
            "value": "SAMPLE-USER-001",
            "includeChild": false
          }
        ]
      }
    ]
  }
}
```

### ADM-03 관리자 등록·수정

**POST /apis/popup/save**

popup·active·targetGroups 필수. 같은 popupId는 수정. 활성 저장 시 대상 그룹 1개 이상. 저장 응답은 body.popup이며 대상 그룹/active를 별도 반환하지 않음.

요청 본문:

```json
{
  "popup": {
    "popupId": "SAMPLE-TEXT-001",
    "popupType": "TEXT",
    "title": "공지사항",
    "displayStartAt": "2026-09-16T09:00:00+09:00",
    "displayEndAt": "2026-10-16T09:00:00+09:00",
    "displayMode": "SEQUENTIAL",
    "displayOrder": 100,
    "sizeMode": "FIXED",
    "width": 560,
    "height": 420,
    "widthRatio": 0.7,
    "heightRatio": 0.75,
    "minimumWidth": 480,
    "minimumHeight": 320,
    "maximumWidth": 1200,
    "maximumHeight": 900,
    "showHeader": true,
    "showCloseButton": true,
    "showFooter": true,
    "showDoNotShowAgain": false,
    "periodMode": "FIXED",
    "allowCloseBeforeComplete": true,
    "questions": [],
    "content": {
      "contentTitle": "서비스 안내",
      "description": "공지 내용을 확인해 주세요.",
      "showContentHeader": true,
      "plainText": "서비스 점검 안내입니다.",
      "showPlainText": true,
      "highlightText": "작업 중인 내용을 저장해 주세요.",
      "showHighlight": true,
      "bottomDescription": "자세히 보기",
      "bottomDescriptionUrl": "https://example.com/notice",
      "showBottomDescription": true,
      "markdownMode": false,
      "markdownContent": "",
      "useBackgroundOverlay": true,
      "backgroundOverlayOpacity": 0.45
    }
  },
  "active": true,
  "targetGroups": [
    {
      "targetName": "예시 사용자",
      "targetDescription": "설계서 예시",
      "conditions": [
        {
          "conditionType": "EMPLOYEE",
          "conditionOperator": "=",
          "value": "SAMPLE-USER-001",
          "includeChild": false
        }
      ]
    }
  ]
}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "popup": {
      "popupId": "SAMPLE-TEXT-001",
      "popupType": "TEXT",
      "title": "공지사항",
      "displayStartAt": 1789516800,
      "displayEndAt": 1792108800,
      "displayMode": "SEQUENTIAL",
      "displayOrder": 100,
      "sizeMode": "FIXED",
      "width": 560,
      "height": 420,
      "widthRatio": 0.7,
      "heightRatio": 0.75,
      "minimumWidth": 480,
      "minimumHeight": 320,
      "maximumWidth": 1200,
      "maximumHeight": 900,
      "showHeader": true,
      "showCloseButton": true,
      "showFooter": true,
      "showDoNotShowAgain": false,
      "periodMode": "FIXED",
      "allowCloseBeforeComplete": true,
      "questions": [],
      "content": {
        "contentTitle": "서비스 안내",
        "description": "공지 내용을 확인해 주세요.",
        "showContentHeader": true,
        "plainText": "서비스 점검 안내입니다.",
        "showPlainText": true,
        "highlightText": "작업 중인 내용을 저장해 주세요.",
        "showHighlight": true,
        "bottomDescription": "자세히 보기",
        "bottomDescriptionUrl": "https://example.com/notice",
        "showBottomDescription": true,
        "markdownMode": false,
        "markdownContent": "",
        "useBackgroundOverlay": true,
        "backgroundOverlayOpacity": 0.45
      }
    }
  }
}
```

### ADM-04 활성 변경

**POST /apis/popup/active**

popupId 필수 1~50자, active 필수 boolean. 목록 조회의 activeYn과 형식이 다름.

요청 본문:

```json
{
  "popupId": "SAMPLE-TEXT-001",
  "active": false
}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "popup": {
      "popupId": "SAMPLE-TEXT-001",
      "popupType": "TEXT",
      "title": "공지사항",
      "displayStartAt": 1789516800,
      "displayEndAt": 1792108800,
      "displayMode": "SEQUENTIAL",
      "displayOrder": 100,
      "sizeMode": "FIXED",
      "width": 560,
      "height": 420,
      "widthRatio": 0.7,
      "heightRatio": 0.75,
      "minimumWidth": 480,
      "minimumHeight": 320,
      "maximumWidth": 1200,
      "maximumHeight": 900,
      "showHeader": true,
      "showCloseButton": true,
      "showFooter": true,
      "showDoNotShowAgain": false,
      "periodMode": "FIXED",
      "allowCloseBeforeComplete": true,
      "questions": [],
      "content": {
        "contentTitle": "서비스 안내",
        "description": "공지 내용을 확인해 주세요.",
        "showContentHeader": true,
        "plainText": "서비스 점검 안내입니다.",
        "showPlainText": true,
        "highlightText": "작업 중인 내용을 저장해 주세요.",
        "showHighlight": true,
        "bottomDescription": "자세히 보기",
        "bottomDescriptionUrl": "https://example.com/notice",
        "showBottomDescription": true,
        "markdownMode": false,
        "markdownContent": "",
        "useBackgroundOverlay": true,
        "backgroundOverlayOpacity": 0.45
      }
    }
  }
}
```

### ADM-05 문항 템플릿 목록

**POST /apis/popup/question-templates**

요청 필드 없음. templateId는 정수.

요청 본문:

```json
{}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "templates": [
      {
        "templateId": 10,
        "templateName": "확인 퀴즈",
        "templateType": "QUIZ"
      }
    ]
  }
}
```

### ADM-06 문항 템플릿 상세

**POST /apis/popup/question-template**

templateId 필수 정수. correctValues는 optionId가 아닌 선택지 value 문자열 목록. 주관식 정답은 question.correctAnswer.

요청 본문:

```json
{
  "templateId": 10
}
```

응답 예시:

```json
{
  "msgId": "BE00000001",
  "body": {
    "adminQuestions": [
      {
        "question": {
          "questionId": 101,
          "title": "안내를 확인했습니까?",
          "description": "한 개를 선택하세요.",
          "questionType": "SINGLE_CHOICE",
          "isRequired": true,
          "isScored": true,
          "questionScore": 10,
          "sortOrder": 1,
          "options": [
            {
              "optionId": 1001,
              "value": "YES",
              "text": "예",
              "sortOrder": 1,
              "isCorrect": true
            },
            {
              "optionId": 1002,
              "value": "NO",
              "text": "아니요",
              "sortOrder": 2,
              "isCorrect": false
            }
          ]
        },
        "correctValues": [
          "YES"
        ]
      }
    ]
  }
}
```

## 4. 공통 팝업 객체 필드 정의

관리자 저장은 popup 객체에 아래 항목을 전송한다. 필수는 서비스 검증 기준이며 표시 여부와 관계없이 크기 수치는 유효한 양수가 필요하다. 응답의 선택 항목은 생략될 수 있다.

| 필드 | JSON 형식 | 저장 시 | 설명 |
|---|---|---|---|
| popupId | string | 필수 | 1~50자, 등록/수정 키 |
| popupType | string | 필수 | TEXT, IMAGE, VIDEO, SURVEY, QUIZ |
| title | string | 필수 | 1~200자 |
| displayStartAt / displayEndAt | string(요청), number(응답) | 필수 | 시작·종료. 구현은 종료 < 시작을 거절하므로 같은 시각은 허용 |
| displayMode | string | 필수 | SEQUENTIAL, SIMULTANEOUS |
| displayOrder | integer | 선택 | 생략/null 시 100으로 처리, 지정 시 1 이상. 작은 값 우선 |
| sizeMode | string | 필수 | FIXED, RATIO, FULLSCREEN |
| width / height | number | 필수 | 창 너비·높이, 0보다 큰 유한값 |
| widthRatio / heightRatio | number | 필수 | 화면 비율, 서버 검증은 0보다 큰 유한값 |
| minimumWidth / minimumHeight | number | 필수 | 최소 크기, 양수 |
| maximumWidth / maximumHeight | number | 필수 | 최대 크기, 각 최소값 이상 |
| showHeader / showCloseButton / showFooter / showDoNotShowAgain | boolean | 명시 권장 | 화면 표시 플래그. Java primitive라 누락 시 false가 될 수 있음 |
| questionTemplateId | integer | 선택 | 설문/퀴즈 템플릿. 저장 과정에서 재사용 또는 새 ID 생성 가능 |
| periodMode | string | 필수 | 현재 웹 신규 기본값 FIXED. 서버는 빈 값 여부 검사 |
| repeatInterval | integer | 선택 | 반복 주기 값 |
| repeatDayOfWeek | string | 선택 | 반복 요일 값 |
| repeatDayOfMonth | integer | 선택 | 반복 일자 값 |
| hideDays | integer | 선택 | 지정 시 1 이상. 숨김 API 별도 제한은 1~3650 |
| completionRatio | number | 선택 | 영상 완료 비율 0~1 |
| passingScore | number | 선택 | 통과 점수 0 이상. 저장 정책상 QUIZ에서 사용 |
| allowCloseBeforeComplete | boolean | 명시 권장 | 완료 전 닫기 허용 |
| questions | array | 유형별 | TEXT/IMAGE/VIDEO는 빈 배열. 설문/퀴즈 문항 저장 원본 |
| content | object | 유형별 | 유형별 콘텐츠 및 배경 옵션. 없으면 빈 객체로 보정 |

반복 필드의 조합별 허용값은 별도 업무 정책 확정이 필요하다. 이 문서는 구현에서 확인되지 않은 요일 코드나 반복 enum을 임의로 정의하지 않는다.

## 5. content 유형별 계약

content는 확장 JSON 객체로 저장된다. 아래 예시는 현재 사용하는 필드 집합이다. 좌우 카드 및 additionalDescription은 현재 화면/DTO에서 제거된 옵션이며 신규 연동에 사용하지 않는다. 기존 DB JSON에 남은 과거 키의 자동 삭제·변환은 수행하지 않는다.

| 공통 필드 | 형식 | 설명 |
|---|---|---|
| useBackgroundOverlay | boolean | 배경 클릭 차단 사용. 웹 신규 기본 true |
| backgroundOverlayOpacity | number | 배경 어둡기 0~1. 웹 신규 기본 0.45 |

### TEXT

```json
{
  "contentTitle": "서비스 안내",
  "description": "공지 내용을 확인해 주세요.",
  "showContentHeader": true,
  "plainText": "서비스 점검 안내입니다.",
  "showPlainText": true,
  "highlightText": "작업 중인 내용을 저장해 주세요.",
  "showHighlight": true,
  "bottomDescription": "자세히 보기",
  "bottomDescriptionUrl": "https://example.com/notice",
  "showBottomDescription": true,
  "markdownMode": false,
  "markdownContent": "",
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45
}
```

### IMAGE

```json
{
  "imageTitle": "이미지 안내",
  "description": "이미지 설명",
  "imageUrl": "https://example.com/notice.png",
  "showDescription": true,
  "imageSizeMode": "ADAPTIVE",
  "imageWidth": 640,
  "imageHeight": 480,
  "linkUrl": "https://example.com/notice",
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45
}
```

### VIDEO

```json
{
  "videoTitle": "교육 영상",
  "description": "영상을 확인하세요.",
  "videoUrl": "http://localhost:8080/zero-rule-server/p/api/popups/video?path=sample.mp4",
  "showDescription": true,
  "showControls": true,
  "allowFullScreen": true,
  "allowPlaybackRateChange": true,
  "autoPlay": false,
  "isLoop": false,
  "defaultVolume": 0.7,
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45
}
```

### SURVEY

```json
{
  "surveyTitle": "설문",
  "description": "의견을 입력해 주세요.",
  "questions": [
    {
      "questionId": 102,
      "title": "의견",
      "description": "자유롭게 입력하세요.",
      "questionType": "TEXT",
      "isRequired": true,
      "isScored": false,
      "sortOrder": 1,
      "options": []
    }
  ],
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45
}
```

### QUIZ

```json
{
  "surveyTitle": "안내 확인",
  "description": "문항에 응답해 주세요.",
  "questions": [
    {
      "questionId": 101,
      "title": "안내를 확인했습니까?",
      "description": "한 개를 선택하세요.",
      "questionType": "SINGLE_CHOICE",
      "isRequired": true,
      "isScored": true,
      "questionScore": 10,
      "sortOrder": 1,
      "options": [
        {
          "optionId": 1001,
          "value": "YES",
          "text": "예",
          "sortOrder": 1
        },
        {
          "optionId": 1002,
          "value": "NO",
          "text": "아니요",
          "sortOrder": 2
        }
      ]
    }
  ],
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45
}
```

TEXT: bottomDescription은 표시 문구, bottomDescriptionUrl은 클릭 이동 주소. 웹은 https:// 생략 주소를 보정해 저장하고 미리보기에도 동일하게 적용한다. showBottomDescription=true에서 문구가 비어 있으면 URL을 표시한다. URL을 비우면 일반 설명이며 HTTP/HTTPS만 링크로 사용한다. markdownMode는 본문 선택이며 하단 설명은 별도 표시된다.

IMAGE: imageSizeMode는 FIXED, FIT_TO_IMAGE, ADAPTIVE, FILL. imageWidth/imageHeight는 숫자. linkUrl은 이미지 클릭 이동 주소이다.

VIDEO: defaultVolume은 0~1 숫자, 나머지 재생/표시 플래그는 boolean. completionRatio 및 allowCloseBeforeComplete는 최상위 popup 필드이다. 재생 옵션의 모든 WPF 실제 강제 동작은 별도 UI 검증 대상이며 JSON 전달과 구분한다.

SURVEY/QUIZ: 서버 조회 응답은 최상위 questions와 content.questions에 문항을 함께 제공한다. 관리자 저장 시 최상위 questions를 기준으로 처리하므로 두 배열을 서로 다르게 편집하지 않는다.

## 6. 문항·선택지 및 정답

| 필드 | 형식 | 설명 |
|---|---|---|
| questionId | integer | 문항 ID. 응답 제출에서는 서버가 발급한 ID 필수 |
| title / description | string | 문항 제목 / 설명(선택) |
| questionType | string | SINGLE_CHOICE, MULTIPLE_CHOICE, TEXT; WPF/기존 문항은 RATING5도 처리 |
| isRequired / isScored | boolean | 필수 응답 / 채점 여부 |
| questionScore | number | 배점, 해당 시 제공 |
| sortOrder | integer | 표시 순서 |
| options | array | 선택지 목록. TEXT는 [] |
| options[].optionId | integer | 선택지 ID. 제출 optionIds는 이 값을 사용 |
| options[].value / text | string | 저장 값 / 표시 문구 |
| options[].sortOrder | integer | 선택지 순서 |
| options[].isCorrect | boolean | 관리자용 정답 여부. 공개 응답에서 제외 |
| correctAnswer | string | 관리자용 주관식 정답. 공개 응답에서 제외 |
| answerMatchMode | string | EXACT 또는 CONTAINS. 관리자용, 공개 응답에서 제외 |

관리자 정답 문항 예시:

```json
{
  "question": {
    "questionId": 101,
    "title": "안내를 확인했습니까?",
    "description": "한 개를 선택하세요.",
    "questionType": "SINGLE_CHOICE",
    "isRequired": true,
    "isScored": true,
    "questionScore": 10,
    "sortOrder": 1,
    "options": [
      {
        "optionId": 1001,
        "value": "YES",
        "text": "예",
        "sortOrder": 1,
        "isCorrect": true
      },
      {
        "optionId": 1002,
        "value": "NO",
        "text": "아니요",
        "sortOrder": 2,
        "isCorrect": false
      }
    ]
  },
  "correctValues": [
    "YES"
  ]
}
```

주관식 제출 항목 예시:

```json
{
  "questionId": 102,
  "textAnswer": "확인했습니다.",
  "optionIds": []
}
```

답안 저장은 서버 DB의 정답과 배점을 기준으로 판정한다. 현재 구현은 사용자·팝업 조합으로 upsert하고 기존 답안 상세를 교체한다. clientRequestId만으로 매번 별도 응답 이력이 생성되거나 모든 재전송이 무조건 허용된다고 가정하면 안 된다. 제출 시 노출 자격을 다시 검사한다.

## 7. 노출 대상 JSON

```json
[
  {
    "targetName": "예시 사용자",
    "targetDescription": "설계서 예시",
    "conditions": [
      {
        "conditionType": "EMPLOYEE",
        "conditionOperator": "=",
        "value": "SAMPLE-USER-001",
        "includeChild": false
      }
    ]
  }
]
```

| 필드 | 형식 | 규칙 |
|---|---|---|
| targetName / targetDescription | string | 그룹 이름·설명 |
| conditions | array | 각 그룹에 1개 이상 |
| conditionType | string | DEPARTMENT, POSITION, EMPLOYEE, HIRE_DATE |
| conditionOperator | string | 부서/직급/사번은 = 또는 !=. 입사일은 =, !=, <, <=, >, >= |
| value | string | 부서/직급/사번은 30자 이내. 입사일은 YYYY-MM-DD |
| includeChild | boolean | DEPARTMENT에서만 하위 포함으로 적용 |

같은 그룹의 조건은 AND, 그룹 사이는 OR이다. active=true인 저장은 최소 한 개의 그룹이 필요하다. active=false일 때 targetGroups=[]를 보낼 수 있지만 필드 자체는 필수이다.

## 8. 응답 결과 필드

| 응답 | 필드 및 형식 |
|---|---|
| 숨김 | userId:string, popupId:string, hideType:string(UNTIL), hiddenUntil:날짜 |
| 제출 | responseId:integer, clientRequestId:string, userId:string, popupId:string, responseStatus:string(SUBMITTED), totalScore:number, passed:boolean, submittedAt:날짜 |
| 영상 | userId:string, popupId:string, watchedRatio:number, requiredRatio:number, completed:boolean, completedAt:날짜(선택) |
| 이벤트 | userId:string, popupId:string, eventType:string, recordedAt:날짜 |
| 상태 | userId:string, popupId:string, popupStatus:string, firstDisplayedAt/lastDisplayedAt/closedAt/hiddenUntilAt/completedAt:날짜(선택), displayCount:integer, completed:boolean |
| 관리자 목록 | popupId/popupType/title/displayMode/sizeMode/periodMode:string, displayOrder:integer, activeYn:string(Y/N), displayStartAt/displayEndAt/createdAt/updatedAt:날짜, createdBy/updatedBy:string, questionTemplateId:integer(선택) |
| 템플릿 목록 | templateId:integer, templateName:string, templateType:string |

상태 문자열의 구현 예: DISPLAYED, CLOSED, HIDDEN, SUBMITTED, COMPLETED. 완료 여부 판단은 completed를 함께 사용한다. 날짜 형식은 1절 규약을 따른다.

## 9. 오류와 JSON 외 인터페이스

- Bean Validation과 서비스 검증이 별도로 존재한다. 누락 필드·잘못된 enum·기간/크기 오류·대상 불일치·잘못된 문항 ID 등을 거절한다.
- 현재 팝업 API 전용으로 통일된 오류 JSON DTO/HTTP 상태 매핑은 확인되지 않았다. 프레임워크 예외 응답을 임의로 {code,message} 형식이라고 확정하지 않는다. 오류 계약 고정이 필요하면 실행 응답 수집과 공통 예외 처리 확인이 필요하다.
- 관리자 클라이언트는 응답의 msgClsf=ER 등을 검사한다. HTTP 성공만으로 업무 저장 성공을 판단하지 않는다.
- GET /p/api/popups/video?path=sample.mp4 및 /p/api/popups/video/{*path}는 영상 바이너리 응답이므로 본 JSON 계약에서 제외한다. Range 요청은 206/416으로 처리될 수 있고 잘못된 경로/파일은 400/403/404/415가 가능하다.
- 하단 링크와 이미지 링크 클릭은 브라우저 URL 이동이며 별도 팝업 API 요청 JSON을 만들지 않는다.

## 10. 구현 근거와 확인 범위

| 기준 파일 | 확인 내용 |
|---|---|
| zero-rule-server/web/api/src/main/java/server/web/api/popup/PopupController.java | WPF API 6개 경로·메서드 |
| zero-rule-server/web/api/src/main/java/server/web/api/popup/PopupAdminController.java | 관리자 API 6개 및 응답 래퍼 |
| zero-rule-server/web/api/src/main/java/server/web/api/payload/popup/ | 요청 DTO·필수/범위 검증 |
| zero-rule-server/domain/src/main/java/server/domain/popup/ | 공통 팝업·문항·응답 DTO |
| zero-rule-server/service/core/src/main/java/server/service/core/popup/PopupService.java | 업무 검증·정답 제외·문항 복제·콘텐츠 조립 |
| zero-rule-server/repo/core/src/main/resources/mappers/popup/PopupMapper.xml | 응답 upsert와 상태 저장 |
| zero-rule-server/app/src/main/java/server/app/config/BasicConfig.java | timestamp 및 null 생략 설정 |
| zero-rule-web/sub/domain/src/base.ts | 관리자 응답 부가 필드 |
| zero-rule-web/sub/domain/src/user-apis/PopupAdminApi.ts | 관리자 클라이언트 요청·응답 사용 |
| popup-frameWork/Popup/Service/PopupApiService.cs | WPF API 조합 경로 |

이 문서는 소스 대조 기반이다. 실제 서버 호출, 운영 DB 반영, 오류 응답 캡처 및 브라우저/WPF 전체 연동 시험은 문서 작성 과정에서 실행하지 않았다. 예시 JSON 구문과 DTO 필드 누락·불일치는 별도 정적 검사한다.
