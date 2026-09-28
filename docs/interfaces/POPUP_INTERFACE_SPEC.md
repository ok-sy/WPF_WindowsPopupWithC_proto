# WPF Popup Client API Interface — JSON Contract

- 문서 버전: 3.2
- 최신화: 2026-09-28 (KST)
- 3.2 변경: 문항 유형 `RATING5` 삭제, TEXT `showHighlight`·`showBottomDescription` 미지정 시 문구 유무로 추정하던 처리 삭제(없으면 false)
- 3.1 변경: IMAGE `imageSizeMode`의 과거 호환 값 `FIXED` 삭제(ADAPTIVE / FIT_TO_IMAGE / FILL만 허용, 미지정 시 ADAPTIVE)
- 대상: **별도 구축 백엔드 ↔ 제공되는 C# WPF 팝업 클라이언트**
- 기준 구현: `popup-frameWork/Popup`
- 목적: 백엔드 구현 방식, DB 구조, 관리자 화면 구조와 무관하게 **C# 클라이언트가 요구하는 HTTP/JSON 계약**만 정의한다.
- 비범위: 백엔드 DB 테이블, SQL, Java/Spring 구현, 관리자 웹 API, 관리자 화면, 기존 zero-rule-server 내부 클래스·설정.
- 예제 데이터는 형식 설명용이며 실제 사용자·팝업 데이터가 아니다.

> 핵심 원칙: 백엔드는 내부 구조를 자유롭게 설계할 수 있다. 다만 이 문서의 URL, 헤더, JSON 필드, ENUM, 의미와 처리 결과를 C# 클라이언트가 이해할 수 있는 형태로 제공해야 한다.

---

## 1. 역할 분리

### 1.1 백엔드 책임

백엔드는 다음을 끝낸 **최종 표시 대상 목록**만 WPF에 내려준다.

- 사용자 식별
- 팝업 활성 여부
- 노출 시작/종료 기간
- 사용자/부서/직급 등 대상 조건
- 숨김 기간
- 이미 완료된 팝업 제외 정책
- 기타 서버 측 업무 정책

WPF에 전체 팝업을 내려준 뒤 대상 여부를 다시 판단하게 하지 않는다.

### 1.2 WPF 책임

WPF는 서버가 내려준 최종 목록을 받아 다음을 수행한다.

- 팝업 화면 렌더링
- 표시 우선순위 및 순차/동시 표시
- 창 위치·크기 최종 보정
- SURVEY 필수 응답 확인
- QUIZ 로컬 채점
- VIDEO 완료 비율 로컬 판정
- 닫기/숨김/제출/영상 결과 생성
- 결과를 로컬 파일에 먼저 저장
- 서버 결과 API 비동기 전송 및 재전송

### 1.3 서버 구현 자유 영역

아래 항목은 이 계약에 포함하지 않는다.

- DB 종류와 테이블 구조
- ORM/MyBatis/JPA 사용 여부
- 관리자 웹의 저장 API
- 팝업 데이터 생성·관리 방식
- 서버 내부 클래스·패키지 구조

---

## 2. 공통 HTTP/JSON 규약

| 항목 | 규약 |
|---|---|
| 문자 인코딩 | UTF-8 |
| Content-Type | `application/json` |
| JSON 필드명 | camelCase |
| 날짜/시간 | ISO 8601 문자열 권장. 예: `2026-09-28T15:30:00+09:00` |
| Boolean | `true` / `false` |
| null/생략 | 선택 필드는 null 또는 생략 가능. 필수 필드는 명시 권장 |
| 사용자 ID | 목록/결과 API 요청 JSON에는 userId를 넣지 않음. 인증 정보로 서버가 식별 |
| HTTP timeout | WPF HTTP 호출은 현재 10초 |
| 목록 없음 | 오류가 아니라 `popups: []` 반환 |

C# 역직렬화는 대소문자를 구분하지 않지만, 신규 백엔드는 문서의 camelCase 이름을 그대로 사용하는 것을 기준으로 한다.

---

## 3. 현재 C#이 사용하는 API

| ID | 기능 | Method | 기본 경로 |
|---|---|---|---|
| WPF-00 | 로그인/토큰 발급 | POST | `/api/wpf/auth/login` |
| WPF-01 | 표시 대상 팝업 조회 | GET | `/api/wpf/popups` |
| WPF-02 | 팝업 처리 결과 일괄 전송 | POST | `/api/wpf/popups/results` |

실제 전체 URL은 WPF의 `PopupApi.BaseUrl` 뒤에 위 경로를 붙여 사용한다.

예:

```text
BaseUrl = https://example.company/popup-api
GET https://example.company/popup-api/api/wpf/popups
```

로그인 경로는 현재 C# 설정의 `Auth.LoginPath`로 교체 가능하며, 미설정 시 `/api/wpf/auth/login`을 사용한다.

---

## 4. 공통 헤더

### 4.1 X-Client-Version

현재 C#은 로그인, 목록 조회, 결과 전송에 다음 헤더를 보낸다.

```http
X-Client-Version: 1.0.0
```

값은 WPF 실행 파일의 버전에서 생성된다.

백엔드가 최소 지원 버전을 검사하지 않는 경우 이 헤더를 무시할 수 있다. 버전 강제 업데이트 기능을 구현한다면 §9의 426 계약을 따른다.

### 4.2 Authorization

로그인 성공 후:

```http
Authorization: Bearer <accessToken>
```

형태로 목록/결과 API에 전달한다.

현재 C#의 SSO 프로토타입 인증 흐름은 다음과 같다.

```text
프로세스 최초 인증
→ 사내 SSO에서 logonId / classCode 확보
→ 로그인 API 호출
→ accessToken 메모리 저장
→ 목록/결과 API에 Bearer 토큰 전달

401 발생
→ 기존 SSO 사용자 정보로 로그인 API 재호출
→ 원 요청 1회 재전송
```

토큰 값은 파일이나 레지스트리에 저장하지 않는다.

---

# 5. WPF-00 로그인

## 5.1 Request

```http
POST /api/wpf/auth/login
Content-Type: application/json
X-Client-Version: 1.0.0
```

```json
{
  "logonId": "E1001",
  "classCode": "10",
  "linkYn": "N"
}
```

| 필드 | 형식 | 필수 | 설명 |
|---|---|---|---|
| logonId | string | O | SSO에서 얻은 사용자 식별값 |
| classCode | string | O | SSO에서 얻은 사용자 분류 코드 |
| linkYn | string | O 권장 | 현재 C#은 `N` 전송 |

## 5.2 Response

```json
{
  "accessToken": "opaque-token-value",
  "tokenType": "Bearer",
  "expiresAt": "2026-09-28T15:40:00+09:00"
}
```

| 필드 | 형식 | 필수 | 설명 |
|---|---|---|---|
| accessToken | string | O | 비어 있으면 C# 로그인 실패 처리 |
| tokenType | string | O 권장 | 현재 기준 `Bearer` |
| expiresAt | string(ISO 8601) | O | C# 진단용 만료 시각 |

---

# 6. WPF-01 표시 대상 팝업 조회

## 6.1 Request

```http
GET /api/wpf/popups
Authorization: Bearer <token>
X-Client-Version: 1.0.0
```

- Query String 없음
- Request Body 없음
- userId 없음

## 6.2 Response Envelope

```json
{
  "serverTime": "2026-09-28T15:30:00+09:00",
  "userId": "E1001",
  "pollingIntervalSeconds": 1800,
  "popups": []
}
```

| 필드 | 형식 | 필수 | 설명 |
|---|---|---|---|
| serverTime | string(ISO) | 선택 | 서버 기준 시각. WPF는 참고만 함 |
| userId | string | O 권장 | 인증 정보에서 식별된 사용자 |
| pollingIntervalSeconds | integer | O 권장 | 다음 자동 조회 간격(초). 0 이하면 WPF 로컬 설정 유지 |
| popups | array | O | 표시 대상 팝업. 없으면 빈 배열 |

---

## 6.3 popups[] 공통 필드

| 필드 | 형식 | 필수 | C# 처리 |
|---|---|---|---|
| popupId | string | O | 결과 전송 식별자 |
| popupType | string | O | TEXT / IMAGE / VIDEO / SURVEY / QUIZ |
| title | string | O | 공통 Header 제목 |
| displayMode | string | O | SEQUENTIAL / SIMULTANEOUS |
| displayOrder | integer | O | 작은 값 우선, 같은 값은 같은 표시 그룹 |
| displayStartAt | string(ISO) | 선택 | DTO 수신 가능. 표시 대상 판단은 서버에서 완료하는 것이 기준 |
| displayEndAt | string(ISO) | 선택 | 동일 |
| sizeMode | string | O | FIXED / RATIO / VIEWPORT_RATIO / FULLSCREEN / AUTO |
| width | number | O | FIXED/FILL 등 실제 창 크기 기준 |
| height | number | O | 동일 |
| widthRatio | number | O 권장 | RATIO/VIEWPORT_RATIO |
| heightRatio | number | O 권장 | RATIO/VIEWPORT_RATIO |
| minimumWidth | number | O 권장 | 최소 창 너비 |
| minimumHeight | number | O 권장 | 최소 창 높이 |
| maximumWidth | number | O 권장 | 최대 창 너비 |
| maximumHeight | number | O 권장 | 최대 창 높이 |
| showHeader | boolean | O | 공통 Header 표시 |
| showCloseButton | boolean | O | 닫기 버튼 표시 |
| showFooter | boolean | O | Footer 표시 |
| showDoNotShowAgain | boolean | O | 다시 보지 않기 체크박스 표시 |
| hideDays | integer | 선택 | HIDDEN 결과에 사용. 없으면 C# 기본 30일 |
| completionRatio | number | VIDEO | 완료 인정 비율 0~1 |
| allowCloseBeforeComplete | boolean | O 권장 | VIDEO 완료 전 닫기 허용 여부 |
| passingScore | number | QUIZ | 로컬 통과 점수 |
| questions | array | SURVEY/QUIZ | 문항 목록 |
| content | object | O | 유형별 화면 데이터 및 공통 옵션 |

### 크기 처리 참고

WPF는 최종 렌더링 단계에서 화면 밖으로 나가지 않도록 값을 보정한다.

- FIXED: 작업 영역 95% 이내로 최종 제한
- RATIO / VIEWPORT_RATIO: 작업 영역 비율 사용
- FULLSCREEN: 주 모니터 전체
- AUTO: 콘텐츠 기준 자동 크기
- 잘못된 값은 일부 모드에서 기본값/보정값으로 처리되지만, 백엔드는 정상 범위 값을 제공해야 한다.

---

# 7. content 공통 필드

모든 popupType의 `content` 안에서 사용할 수 있다.

| 필드 | 형식 | 기본값/처리 |
|---|---|---|
| useBackgroundOverlay | boolean | 없으면 true |
| backgroundOverlayOpacity | number | 없으면 0.45, WPF에서 0~1 보정 |
| headerFontSize | number | 선택. 있으면 10~40으로 최종 보정 |
| bodyFontSize | number | 선택. 있으면 10~40으로 최종 보정 |
| footerFontSize | number | 선택. 있으면 10~40으로 최종 보정 |
| popupPosition | string | 없거나 잘못되면 CENTER |

### popupPosition ENUM

```text
CENTER
TOP_LEFT
TOP_CENTER
TOP_RIGHT
CENTER_LEFT
CENTER_RIGHT
BOTTOM_LEFT
BOTTOM_CENTER
BOTTOM_RIGHT
```

위치는 현재 **주 모니터 작업 영역** 기준이다. FULLSCREEN은 위치 값과 무관하게 주 모니터 전체 화면을 사용한다.

---

# 8. 유형별 content 계약

## 8.1 TEXT

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

  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER",
  "headerFontSize": 17,
  "bodyFontSize": 15,
  "footerFontSize": 14
}
```

| 필드 | 형식 | 설명 |
|---|---|---|
| contentTitle | string | 콘텐츠 내부 제목 |
| description | string | 콘텐츠 설명 |
| showContentHeader | boolean | 콘텐츠 제목/설명 영역 표시 여부 |
| plainText | string | 본문 |
| showPlainText | boolean | 본문 표시 여부 |
| highlightText | string | 강조 문구 |
| showHighlight | boolean | 강조 영역 표시 여부. 없으면 false(v3.2) |
| bottomDescription | string | 하단 설명 |
| bottomDescriptionUrl | string | 클릭 시 이동 URL |
| showBottomDescription | boolean | 하단 설명 영역 표시. 없으면 false(v3.2) |

Markdown 필드는 현재 C# 화면에서 사용하지 않는다.

---

## 8.2 IMAGE

```json
{
  "imageTitle": "이미지 안내",
  "imageUrl": "https://example.com/notice.png",
  "description": "이미지 설명",
  "showDescription": true,
  "imageSizeMode": "ADAPTIVE",
  "imageWidth": 640,
  "imageHeight": 480,
  "descriptionPosition": "AUTO",
  "imageAreaRatio": 0.75,
  "linkUrl": "https://example.com/notice",

  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER"
}
```

### imageSizeMode

| 값 | 의미 |
|---|---|
| ADAPTIVE | 팝업 크기가 기준. 이미지를 배정 영역 안에 비율 유지하여 표시 |
| FIT_TO_IMAGE | 이미지 크기가 기준. imageWidth/imageHeight 우선, 없으면 원본 크기로 팝업 크기 재계산 |
| FILL | 팝업 영역을 이미지로 꽉 채움. 제목/설명 없는 배경형 표시 |

필드가 없으면 ADAPTIVE로 처리한다. 위 세 값 외의 값(과거 값 `FIXED`, 빈 문자열 포함)은 C#이 지원하지 않는 값으로 보고 팝업 변환에 실패한다(v3.1).

### descriptionPosition

```text
AUTO
RIGHT
BOTTOM
```

- AUTO: 이미지 비율에 따라 RIGHT/BOTTOM 결정
- FILL에서는 사용하지 않음

### imageAreaRatio

- 이미지와 설명 영역의 비율
- 기본 0.75
- WPF 기준 정상 범위 0.5~0.9

---

## 8.3 VIDEO

```json
{
  "videoTitle": "교육 영상",
  "videoUrl": "https://example.com/education.mp4",
  "description": "영상을 시청해 주세요.",
  "showDescription": true,
  "showControls": true,
  "allowFullScreen": true,
  "allowPlaybackRateChange": true,
  "autoPlay": false,
  "isLoop": false,
  "defaultVolume": 0.7,

  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER"
}
```

| 필드 | 형식 | 기본 |
|---|---|---|
| videoTitle | string | "" |
| videoUrl | string | "" |
| description | string | "" |
| showDescription | boolean | true |
| showControls | boolean | true |
| allowFullScreen | boolean | true |
| allowPlaybackRateChange | boolean | true |
| autoPlay | boolean | false |
| isLoop | boolean | false |
| defaultVolume | number | 0.7 |

VIDEO의 완료 기준은 content가 아니라 **popups[] 최상위 `completionRatio` / `allowCloseBeforeComplete`**를 기준으로 한다.

---

## 8.4 SURVEY

```json
{
  "popupId": "SURVEY-001",
  "popupType": "SURVEY",
  "title": "만족도 조사",
  "questions": [
    {
      "questionId": 101,
      "title": "서비스는 만족스러웠습니까?",
      "description": "",
      "questionType": "SINGLE_CHOICE",
      "isRequired": true,
      "isScored": false,
      "options": [
        {
          "optionId": 1001,
          "value": "YES",
          "text": "예"
        },
        {
          "optionId": 1002,
          "value": "NO",
          "text": "아니요"
        }
      ]
    }
  ],
  "content": {
    "surveyTitle": "만족도 조사",
    "description": "문항에 응답해 주세요."
  }
}
```

SURVEY는 정답 키가 필요하지 않다.

---

## 8.5 QUIZ

```json
{
  "popupId": "QUIZ-001",
  "popupType": "QUIZ",
  "title": "보안 퀴즈",
  "passingScore": 80,
  "questions": [
    {
      "questionId": 201,
      "title": "올바른 항목을 선택하세요.",
      "description": "",
      "questionType": "SINGLE_CHOICE",
      "isRequired": true,
      "isScored": true,
      "questionScore": 100,
      "options": [
        {
          "optionId": 2001,
          "value": "A",
          "text": "정답",
          "isCorrect": true
        },
        {
          "optionId": 2002,
          "value": "B",
          "text": "오답",
          "isCorrect": false
        }
      ]
    }
  ],
  "content": {
    "surveyTitle": "보안 퀴즈",
    "description": "통과 점수 이상 획득해야 합니다."
  }
}
```

QUIZ는 WPF에서 즉시 채점하므로 **정답 정보가 반드시 필요하다.**

### 선택형 채점

- `options[].isCorrect=true`인 선택지 집합과 사용자가 선택한 집합이 정확히 같아야 정답
- 부분 점수 없음

### TEXT 채점

TEXT 문항은 다음 필드를 사용할 수 있다.

```json
{
  "questionId": 202,
  "questionType": "TEXT",
  "isRequired": true,
  "isScored": true,
  "questionScore": 20,
  "correctAnswer": "OPENAI",
  "answerMatchMode": "EXACT",
  "options": []
}
```

`answerMatchMode`:

```text
EXACT
CONTAINS
```

### QUIZ 실패/성공 동작

```text
채점
→ passingScore 미달
→ 점수 안내
→ 창 유지
→ 답 수정 후 다시 채점

passingScore 이상
→ SUBMITTED 결과 생성
→ 로컬 큐 저장
→ 창 닫기
→ 결과 API 백그라운드 전송
```

따라서 백엔드는 **미통과 QUIZ의 SUBMITTED 결과가 오지 않는 것**을 정상 동작으로 본다.

---

# 9. questions[] 계약

선택지는 직접 전달한다(C#이 기본 보기를 자동 생성하지 않는다). 각 문항의 optionLayout으로 가로·세로를 개별 지정하며, 누락·미지원 값은 WPF에서 세로형으로 표시한다. 한 팝업에서 두 배치를 혼합할 수 있다.

| 필드 | 형식 | 설명 |
|---|---|---|
| questionId | integer | 결과 answers의 참조 ID |
| title | string | 질문 제목 |
| description | string | 부가 설명 |
| questionType | string | SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT (그 외 값은 팝업 변환 실패, v3.2) |
| optionLayout | string | 문항별 선택지 배치. VERTICAL(기본) / HORIZONTAL. 가로형은 너비 초과 시 줄바꿈 |
| isRequired | boolean | 필수 응답 여부 |
| isScored | boolean | QUIZ 채점 대상 여부 |
| questionScore | number | QUIZ 배점. 선택 |
| correctAnswer | string | QUIZ TEXT 정답. 선택 |
| answerMatchMode | string | EXACT / CONTAINS. 선택 |
| options | array | 선택형 보기 |

### options[]

| 필드 | 형식 | 설명 |
|---|---|---|
| optionId | integer | 제출 시 optionIds에 사용 |
| value | string | 선택지 업무 값 |
| text | string | 화면 표시 문구 |
| isCorrect | boolean | QUIZ 선택형 정답 여부. SURVEY에서는 생략 가능 |

---

# 10. WPF-02 결과 일괄 전송

## 10.1 기본 흐름

WPF는 사용자 동작 직후 서버 응답을 기다린 다음 창을 닫는 구조가 아니다.

```text
사용자 동작
→ WPF 로컬 결과 생성
→ %LOCALAPPDATA%\Popup\pending-results.json 저장
→ 팝업 닫기
→ POST /api/wpf/popups/results
```

네트워크/서버 오류 시 파일에 남겨 두고 다음 기회에 동일 `resultId`로 재전송한다.

백엔드는 `resultId`를 **멱등 키**로 처리해야 한다.

---

## 10.2 Request

```json
{
  "clientRequestId": "c2cc2e16d4714e569ea8451ab5284479",
  "sentAt": "2026-09-28T15:35:10+09:00",
  "results": [
    {
      "resultId": "7be7d5e2-b821-4f9b-92ff-d21a858d86ef",
      "popupId": "NOTICE-001",
      "resultType": "CLOSED",
      "displayedAt": "2026-09-28T15:34:00+09:00",
      "closedAt": "2026-09-28T15:35:00+09:00"
    }
  ]
}
```

| 필드 | 형식 | 필수 | 설명 |
|---|---|---|---|
| clientRequestId | string | O | 전송 요청 단위 ID. 재전송 요청에서는 새 값일 수 있음 |
| sentAt | string(ISO) | O | 이번 전송 시각 |
| results | array | O | 1~50개씩 전송 |

### results[] 공통

| 필드 | 형식 | 필수 |
|---|---|---|
| resultId | string(GUID) | O |
| popupId | string | O |
| resultType | string | O |
| displayedAt | string(ISO) | 선택 |
| closedAt | string(ISO) | 선택 |

### resultType ENUM

```text
CLOSED
HIDDEN
SUBMITTED
VIDEO_WATCHED
```

---

## 10.3 CLOSED

```json
{
  "resultId": "GUID",
  "popupId": "NOTICE-001",
  "resultType": "CLOSED",
  "displayedAt": "2026-09-28T15:34:00+09:00",
  "closedAt": "2026-09-28T15:35:00+09:00"
}
```

---

## 10.4 HIDDEN

```json
{
  "resultId": "GUID",
  "popupId": "NOTICE-001",
  "resultType": "HIDDEN",
  "displayedAt": "2026-09-28T15:34:00+09:00",
  "closedAt": "2026-09-28T15:35:00+09:00",
  "hideDays": 7
}
```

- `hideDays`: 1~3650
- 서버가 해당 사용자/팝업에 대한 숨김 만료 시각을 계산·저장한다.

---

## 10.5 SUBMITTED — SURVEY

```json
{
  "resultId": "GUID",
  "popupId": "SURVEY-001",
  "resultType": "SUBMITTED",
  "responseStartedAt": "2026-09-28T15:34:00+09:00",
  "closedAt": "2026-09-28T15:35:00+09:00",
  "answers": [
    {
      "questionId": 101,
      "optionIds": [1001]
    },
    {
      "questionId": 102,
      "textAnswer": "좋았습니다.",
      "optionIds": []
    }
  ]
}
```

---

## 10.6 SUBMITTED — QUIZ

```json
{
  "resultId": "GUID",
  "popupId": "QUIZ-001",
  "resultType": "SUBMITTED",
  "answers": [
    {
      "questionId": 201,
      "optionIds": [2001]
    }
  ],
  "score": 100,
  "passed": true
}
```

현재 WPF는 통과한 QUIZ만 SUBMITTED 한다.

---

## 10.7 VIDEO_WATCHED

```json
{
  "resultId": "GUID",
  "popupId": "VIDEO-001",
  "resultType": "VIDEO_WATCHED",
  "displayedAt": "2026-09-28T15:30:00+09:00",
  "closedAt": "2026-09-28T15:40:00+09:00",
  "video": {
    "durationSeconds": 600.0,
    "positionSeconds": 590.0,
    "maximumPositionSeconds": 600.0,
    "watchedSeconds": 580.5
  }
}
```

| 필드 | 단위 |
|---|---|
| durationSeconds | 초 |
| positionSeconds | 초 |
| maximumPositionSeconds | 초 |
| watchedSeconds | 초 |

---

# 11. 결과 API Response

```json
{
  "receivedAt": "2026-09-28T15:35:11+09:00",
  "results": [
    {
      "resultId": "7be7d5e2-b821-4f9b-92ff-d21a858d86ef",
      "popupId": "NOTICE-001",
      "resultType": "CLOSED",
      "status": "ACCEPTED"
    }
  ]
}
```

### 필수 응답 필드

| 필드 | 형식 | 설명 |
|---|---|---|
| receivedAt | string(ISO) | 선택 가능 |
| results | array | 처리한 항목별 결과 |
| results[].resultId | string | 요청 resultId와 동일 |
| results[].popupId | string | 요청 popupId |
| results[].resultType | string | 요청 resultType |
| results[].status | string | ACCEPTED / DUPLICATE / REJECTED |
| results[].code | string | REJECTED 사유. 선택 |
| results[].message | string | REJECTED 설명. 선택 |

### status 의미

| status | 의미 |
|---|---|
| ACCEPTED | 처음 정상 처리 |
| DUPLICATE | 동일 resultId가 이미 처리됨. 재처리하지 않음 |
| REJECTED | 업무 검증상 처리하지 않음 |

현재 C# 큐는 **응답 results에 포함된 resultId를 처리 종결 항목으로 보고 로컬 큐에서 제거**한다.

따라서 일시적 장애로 다시 받아야 하는 항목은 HTTP 5xx 등 요청 자체를 실패시키거나, 해당 계약을 별도 협의해야 한다. `REJECTED`를 반환하면 WPF는 재전송하지 않는다.

### 선택 응답 필드

C# DTO는 다음 값을 받을 수 있으나, 현재 UI는 서버 응답을 기다려 사용자 판정을 바꾸지 않는다.

```text
popupStatus
completed
completedAt
hiddenUntil
responseId
totalScore
passed
watchedRatio
requiredRatio
```

---

# 12. 멱등/재전송 규칙

백엔드 신규 구현에서 반드시 맞춰야 하는 핵심 규칙이다.

1. `resultId`는 결과 항목 단위 멱등 키다.
2. 동일 `resultId`가 여러 번 들어오면 업무 데이터를 중복 저장하지 않는다.
3. 이미 처리한 항목은 `DUPLICATE`로 응답할 수 있다.
4. `clientRequestId`는 전송 단위 추적용이며 업무 멱등 키가 아니다.
5. 네트워크 오류로 WPF가 같은 resultId를 다시 보내는 것은 정상 시나리오다.
6. 한 요청에 최대 50개의 results가 들어올 수 있다.

---

# 13. 오류 응답

공통 오류 본문 권장 형식:

```json
{
  "code": "WPF_UNAUTHORIZED",
  "message": "인증 토큰이 없습니다.",
  "timestamp": "2026-09-28T15:30:00+09:00"
}
```

현재 C#이 중요하게 구분하는 상태는 다음과 같다.

| HTTP | 의미 | WPF 동작 |
|---|---|---|
| 400 | 요청 형식/업무 검증 오류 | 요청 실패 |
| 401 | 인증 없음/만료 | 재로그인 후 원 요청 1회 재시도 |
| 403 | 인증됐지만 사용자 사용 불가 | 오류 표시 가능 |
| 426 | C# 버전 지원 중단 | 재로그인하지 않고 조회 중단, pending 결과 유지 |
| 5xx | 서버 오류 | 결과 전송이면 로컬 큐 유지 후 추후 재전송 |

---

## 13.1 426 Upgrade Required

버전 강제 기능을 사용할 경우 다음 형태를 권장한다.

```json
{
  "code": "CLIENT_VERSION_NOT_SUPPORTED",
  "message": "WPF 클라이언트 업데이트가 필요합니다.",
  "clientVersion": "0.9.0",
  "minimumSupportedVersion": "1.0.0",
  "latestVersion": "1.2.0",
  "timestamp": "2026-09-28T15:30:00+09:00"
}
```

WPF는 426을 받으면:

- 401 인증 갱신 경로로 들어가지 않음
- 주기 조회 중단
- 결과 큐 삭제하지 않음
- 업데이트 안내

---

# 14. ENUM / 코드값 요약

## popupType

```text
TEXT
IMAGE
VIDEO
SURVEY
QUIZ
```

## displayMode

```text
SEQUENTIAL
SIMULTANEOUS
```

## sizeMode

```text
FIXED
RATIO
VIEWPORT_RATIO
FULLSCREEN
AUTO
```

## popupPosition

```text
CENTER
TOP_LEFT
TOP_CENTER
TOP_RIGHT
CENTER_LEFT
CENTER_RIGHT
BOTTOM_LEFT
BOTTOM_CENTER
BOTTOM_RIGHT
```

## imageSizeMode

```text
ADAPTIVE
FIT_TO_IMAGE
FILL
```

## descriptionPosition

```text
AUTO
RIGHT
BOTTOM
```

## questionType

```text
SINGLE_CHOICE
MULTIPLE_CHOICE
TEXT
```

## answerMatchMode

```text
EXACT
CONTAINS
```

## resultType

```text
CLOSED
HIDDEN
SUBMITTED
VIDEO_WATCHED
```

## result status

```text
ACCEPTED
DUPLICATE
REJECTED
```

---

# 15. 전체 목록 응답 예시

```json
{
  "serverTime": "2026-09-28T15:30:00+09:00",
  "userId": "E1001",
  "pollingIntervalSeconds": 1800,
  "popups": [
    {
      "popupId": "TEXT-001",
      "popupType": "TEXT",
      "title": "공지사항",
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
      "showDoNotShowAgain": true,
      "hideDays": 30,
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
        "useBackgroundOverlay": true,
        "backgroundOverlayOpacity": 0.45,
        "popupPosition": "CENTER",
        "headerFontSize": 17,
        "bodyFontSize": 15,
        "footerFontSize": 14
      }
    }
  ]
}
```

---

# 16. 백엔드 구현 체크리스트

새 백엔드가 C# WPF와 연동되기 위해 최소한 다음을 확인한다.

- [ ] 로그인 API가 accessToken을 반환한다.
- [ ] 목록/결과 API가 Bearer 인증 사용자를 식별할 수 있다.
- [ ] GET /api/wpf/popups에는 userId 요청 파라미터를 요구하지 않는다.
- [ ] 목록 API는 서버에서 노출 판정을 끝낸 최종 목록만 반환한다.
- [ ] popups가 없을 때 빈 배열을 반환한다.
- [ ] popupType별 content 필드 이름을 그대로 제공한다.
- [ ] QUIZ는 로컬 채점용 정답 키와 passingScore를 내려준다.
- [ ] 결과 API는 resultId 기준 멱등 처리를 한다.
- [ ] 동일 resultId 재수신 시 업무 데이터를 중복 저장하지 않는다.
- [ ] results[].status를 ACCEPTED/DUPLICATE/REJECTED 중 하나로 반환한다.
- [ ] REJECTED는 WPF가 재전송하지 않는 종결 상태임을 고려한다.
- [ ] 네트워크/서버 장애 시 WPF가 같은 결과를 재전송할 수 있음을 고려한다.
- [ ] 401이면 WPF가 로그인 후 원 요청을 한 번 재시도하는 것을 고려한다.
- [ ] 426을 사용할 경우 지정된 오류 형식을 제공한다.
- [ ] 날짜는 ISO 8601로 송수신한다.
- [ ] C#과 실제 통합 테스트에서 TEXT/IMAGE/VIDEO/SURVEY/QUIZ를 각각 1건 이상 확인한다.

---

# 17. C# 기준 소스

이 문서는 다음 C# 구현을 계약 기준으로 정리했다.

```text
popup-frameWork/Popup/
├─ Services/
│  ├─ PopupApiService.cs
│  ├─ PopupResultQueue.cs
│  └─ Auth/
│     ├─ WpfLoginClient.cs
│     └─ SsoAuthHeaderProvider.cs
├─ Dtos/
│  ├─ WpfPopupListResponseDto.cs
│  ├─ PopupResponseDto.cs
│  ├─ WpfResultDtos.cs
│  ├─ TextPopupContentDto.cs
│  ├─ ImagePopupContentDto.cs
│  ├─ VideoPopupContentDto.cs
│  ├─ SurveyPopupContentDto.cs
│  ├─ SurveyQuestionDto.cs
│  └─ SurveyOptionDto.cs
└─ Factories/
   └─ PopupFactory.cs
```

새 백엔드 구현 시 서버 내부 코드를 이 저장소와 동일하게 만들 필요는 없다. **위 C# 코드가 보내고 받는 계약만 맞으면 된다.**
