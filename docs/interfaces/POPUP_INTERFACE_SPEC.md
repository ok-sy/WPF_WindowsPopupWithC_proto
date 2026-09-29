# WPF Popup Client API Interface — JSON Contract

- 문서 버전: 3.5
- 최신화: 2026-09-29 (KST)
- 3.5 변경: 주요 요청/응답 필드 표에 `필수 여부`와 `Default`를 추가하고, 생략 시 C# 처리 기준을 명확화. 최신 main의 IMAGE ORIGINAL, 푸터 바로가기, 동영상+퀴즈 계약을 정합성 점검.
- 3.4 변경: IMAGE `imageSizeMode=ORIGINAL` 추가. 팝업 크기를 유지하고 원본 이미지를 왼쪽 위에 배치한 뒤 넘치는 영역을 자른다.
- 3.3 변경: 공통 푸터 `footerAction`·`footerLinkUrl`, QUIZ의 `videoEnabled` 영상 결합 모드 추가. 영상 결합 QUIZ 제출은 `answers`와 `video`를 한 결과 항목에 포함한다.
- 3.2 변경: 팝업 `sizeMode`의 `VIEWPORT_RATIO` 삭제(`RATIO`로 단일화), 문항 유형 `RATING5` 삭제, TEXT `showHighlight`·`showBottomDescription` 미지정 시 문구 유무로 추정하던 처리 삭제(없으면 false)
- 3.1 변경: IMAGE `imageSizeMode`의 과거 호환 값 `FIXED` 삭제(ADAPTIVE / FIT_TO_IMAGE / FILL만 허용, 미지정 시 ADAPTIVE)
- 대상: **별도 구축 백엔드 ↔ 제공되는 C# WPF 팝업 클라이언트**
- 기준 구현: `popup-frameWork/Popup`
- 목적: 백엔드 구현 방식, DB 구조, 관리자 화면 구조와 무관하게 **C# 클라이언트가 요구하는 HTTP/JSON 계약**만 정의한다.
- 비범위: 백엔드 DB 테이블, SQL, Java/Spring 구현, 관리자 웹 API, 관리자 화면, 기존 zero-rule-server 내부 클래스·설정.
- 예제 데이터는 형식 설명용이며 실제 사용자·팝업 데이터가 아니다.

> 핵심 원칙: 백엔드는 내부 구조를 자유롭게 설계할 수 있다. 다만 이 문서의 URL, 헤더, JSON 필드, ENUM, 의미와 처리 결과를 C# 클라이언트가 이해할 수 있는 형태로 제공해야 한다.
>
> **표 읽는 기준**: `필수 여부`는 백엔드가 계약상 값을 제공해야 하는지의 기준이고, `Default`는 필드가 생략되거나 null일 때 현재 C# 클라이언트가 사용하는 값/처리다. 필수 필드에 C# fallback이 있더라도 신규 백엔드는 필수 값을 명시해서 보내는 것을 기준으로 한다.

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

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| logonId | string | O | 없음 | SSO에서 얻은 사용자 식별값 |
| classCode | string | O | 없음 | SSO에서 얻은 사용자 분류 코드 |
| linkYn | string | O | `"N"` | 현재 C#은 항상 `N` 전송 |

## 5.2 Response

```json
{
  "accessToken": "opaque-token-value",
  "tokenType": "Bearer",
  "expiresAt": "2026-09-28T15:40:00+09:00"
}
```

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| accessToken | string | O | 없음 | 비어 있으면 C# 로그인 실패 처리 |
| tokenType | string | 선택 | `"Bearer"` | 현재 C# DTO 기본값. 인증 헤더는 Bearer 방식 사용 |
| expiresAt | string(ISO 8601) | 선택 | .NET DateTimeOffset 기본값 | 현재 C#은 진단 로그에 사용하며 별도 필수 검증은 하지 않음 |

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

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| serverTime | string(ISO) | 선택 | `null` | 서버 기준 시각. WPF는 참고만 함 |
| userId | string | 선택 | `""` | 인증 정보에서 식별된 사용자. 요청에는 보내지 않음 |
| pollingIntervalSeconds | integer | 선택 | `0` | 0 이하면 WPF 로컬 설정 유지 |
| popups | array | O | `[]` | 표시 대상 팝업. 없으면 빈 배열 |

---

## 6.3 popups[] 공통 필드

| 필드 | 형식 | 필수 여부 | Default | C# 처리 |
|---|---|---|---|---|
| popupId | string | O | 없음 | 결과 전송 식별자 |
| popupType | string | O | 없음 | TEXT / IMAGE / VIDEO / SURVEY / QUIZ |
| title | string | O | `""` | 공통 Header 제목 |
| displayMode | string | O | `SEQUENTIAL` | SEQUENTIAL / SIMULTANEOUS |
| displayOrder | integer | O | `100` | 작은 값 우선, 같은 값은 같은 표시 그룹 |
| displayStartAt | string(ISO) | 선택 | `null` | DTO 수신 가능. 표시 대상 판단은 서버에서 완료하는 것이 기준 |
| displayEndAt | string(ISO) | 선택 | `null` | 동일 |
| sizeMode | string | O | `FIXED` | FIXED / RATIO / FULLSCREEN / AUTO |
| width | number | O | `900` | FIXED 등 실제 창 너비 기준 |
| height | number | O | `620` | FIXED 등 실제 창 높이 기준 |
| widthRatio | number | RATIO | `0.7` | RATIO 너비 비율 |
| heightRatio | number | RATIO | `0.75` | RATIO 높이 비율 |
| minimumWidth | number | 선택 | `480` | 최소 창 너비 |
| minimumHeight | number | 선택 | `320` | 최소 창 높이 |
| maximumWidth | number | 선택 | `1200` | 최대 창 너비 |
| maximumHeight | number | 선택 | `900` | 최대 창 높이 |
| showHeader | boolean | O | `true` | 공통 Header 표시 |
| showCloseButton | boolean | O | `true` | 닫기 버튼 표시 |
| showFooter | boolean | O | `true` | Footer 표시 |
| showDoNotShowAgain | boolean | O | `false` | 다시 보지 않기 체크박스 표시 |
| hideDays | integer | 선택 | `null` → HIDDEN 생성 시 30일 | 다시 보지 않기 결과에 사용 |
| completionRatio | number | VIDEO / 동영상+퀴즈 | `1.0` | 완료 인정 비율 0~1 |
| allowCloseBeforeComplete | boolean | VIDEO / 동영상+퀴즈 | `true` | 완료 전 닫기 허용 여부 |
| passingScore | number | QUIZ | `null` | 로컬 통과 점수. QUIZ 백엔드는 명시 권장 |
| questions | array | SURVEY / QUIZ | `[]` | 문항 목록 |
| content | object | O | 유형별 필수값 포함 | 유형별 화면 데이터 및 공통 옵션 |

### 크기 처리 참고

WPF는 최종 렌더링 단계에서 화면 밖으로 나가지 않도록 값을 보정한다.

- FIXED: 작업 영역 95% 이내로 최종 제한
- RATIO: 작업 영역 비율 사용
- FULLSCREEN: 주 모니터 전체
- AUTO: 콘텐츠 기준 자동 크기
- 잘못된 값은 일부 모드에서 기본값/보정값으로 처리되지만, 백엔드는 정상 범위 값을 제공해야 한다.

---

# 7. content 공통 필드

모든 popupType의 `content` 안에서 사용할 수 있다.

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| useBackgroundOverlay | boolean | 선택 | `true` | 배경 Overlay 사용 |
| backgroundOverlayOpacity | number | 선택 | `0.45` | WPF에서 0~1 보정 |
| headerFontSize | number | 선택 | XAML 기본값(현재 Header 17) | 값이 있으면 10~40으로 보정 |
| bodyFontSize | number | 선택 | 유형별 XAML 기본값 | 값이 있으면 10~40으로 보정 |
| footerFontSize | number | 선택 | XAML 기본값(현재 Footer 14) | 값이 있으면 10~40으로 보정 |
| footerAction | string | 선택 | `CLOSE` | CLOSE / LINK_AND_CLOSE |
| footerLinkUrl | string | footerAction=LINK_AND_CLOSE | `""` | 절대 http/https URL |
| popupPosition | string | 선택 | `CENTER` | 없거나 잘못되면 CENTER |

`LINK_AND_CLOSE`는 하단 닫기 버튼을 **바로가기**로 표시하며, 기본 브라우저로 URL을 연 뒤 창을 닫는다. URL이 잘못되었거나 브라우저 실행이 실패하면 창을 유지하고 오류를 안내한다. 헤더 X는 기존 닫기 동작을 유지한다. 버튼 표시는 `showFooter`·`showCloseButton`을 따른다.

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

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| contentTitle | string | 선택 | `""` | 콘텐츠 내부 제목 |
| description | string | 선택 | `""` | 콘텐츠 설명 |
| showContentHeader | boolean | 선택 | `true` | 콘텐츠 제목/설명 영역 표시 여부 |
| plainText | string | 선택 | `""` | 본문 |
| showPlainText | boolean | 선택 | `true` | 본문 표시 여부 |
| highlightText | string | 선택 | `""` | 강조 문구 |
| showHighlight | boolean | 선택 | `false` | 강조 영역 표시 여부 |
| bottomDescription | string | 선택 | `""` | 하단 설명 |
| bottomDescriptionUrl | string | 선택 | `""` | 클릭 시 이동 URL |
| showBottomDescription | boolean | 선택 | `false` | 하단 설명 영역 표시 |

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

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| imageTitle | string | 선택 | `""` | 이미지 콘텐츠 내부 제목 |
| imageUrl | string | O | `""` | 표시할 이미지 URL/경로. 빈 값이면 이미지 팝업 생성 불가 |
| description | string | 선택 | `""` | 이미지 설명 |
| showDescription | boolean | 선택 | `true` | 설명 표시 여부 |
| imageSizeMode | string | 선택 | `ADAPTIVE` | ADAPTIVE / FIT_TO_IMAGE / FILL / ORIGINAL |
| imageWidth | number | 선택 | `0` | ADAPTIVE 최대 크기, FIT_TO_IMAGE 요청 크기. ORIGINAL/FILL에서는 미사용 |
| imageHeight | number | 선택 | `0` | imageWidth와 동일 기준 |
| descriptionPosition | string | 선택 | `AUTO` | AUTO / RIGHT / BOTTOM. ORIGINAL/FILL에서는 미사용 |
| imageAreaRatio | number | 선택 | `0.75` | 0.5~0.9, 범위 밖이면 0.75 |
| linkUrl | string | 선택 | `""` | 이미지 클릭 시 이동 URL |

### imageSizeMode

| 값 | 의미 |
|---|---|
| ADAPTIVE | 팝업 크기가 기준. 이미지를 배정 영역 안에 비율 유지하여 표시 |
| FIT_TO_IMAGE | 이미지 크기가 기준. imageWidth/imageHeight 우선, 없으면 원본 크기로 팝업 크기 재계산 |
| FILL | 팝업 영역을 이미지로 꽉 채움. 제목/설명 없는 배경형 표시 |
| ORIGINAL | 팝업 크기는 유지. 원본 이미지를 왼쪽 위에 확대·축소 없이 표시하고 오른쪽·아래 초과 부분을 자름 |

필드가 없으면 ADAPTIVE로 처리한다. 위 네 값 외의 값(과거 값 `FIXED`, 빈 문자열 포함)은 C#이 지원하지 않는 값으로 보고 팝업 변환에 실패한다. ORIGINAL은 v3.4 클라이언트부터 지원한다.

ORIGINAL은 헤더·푸터를 제외한 본문 전체를 이미지 영역으로 사용한다. 콘텐츠 제목·설명·`imageWidth`·`imageHeight`·설명 배치 옵션은 사용하지 않는다. 작은 이미지는 확대하지 않고 남는 영역을 흰색으로 표시하며 스크롤하지 않는다. `linkUrl` 이미지 클릭 동작은 유지한다. 원본 픽셀 크기 1px를 WPF 1 DIP / 웹 1 CSS px로 표시하며 이미지 파일의 DPI 메타데이터는 크기 계산에 사용하지 않는다(OS 화면 배율은 적용된다).

관리자 신규 등록 기본 선택은 ORIGINAL이며, 기존 저장값과 필드 미지정 시 ADAPTIVE 동작은 유지한다. JSON 예: `{"imageSizeMode":"ORIGINAL","imageUrl":"https://example.com/notice.png"}`.

### descriptionPosition

```text
AUTO
RIGHT
BOTTOM
```

- AUTO: 이미지 비율에 따라 RIGHT/BOTTOM 결정
- FILL / ORIGINAL에서는 사용하지 않음

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

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| videoTitle | string | 선택 | `""` | 영상 콘텐츠 내부 제목 |
| videoUrl | string | O | `""` | 재생할 영상 URL/경로 |
| description | string | 선택 | `""` | 영상 설명 |
| showDescription | boolean | 선택 | `true` | 설명 표시 |
| showControls | boolean | 선택 | `true` | 컨트롤 표시 |
| allowFullScreen | boolean | 선택 | `true` | 영상 전체화면 허용 |
| allowPlaybackRateChange | boolean | 선택 | `true` | 배속 변경 허용 |
| autoPlay | boolean | 선택 | `false` | 자동 재생 |
| isLoop | boolean | 선택 | `false` | 반복 재생 |
| defaultVolume | number | 선택 | `0.7` | 기본 음량 0~1 |

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

## 8.6 동영상 + 퀴즈 (v3.3)

별도 popupType을 추가하지 않고 `popupType: "QUIZ"`, `content.videoEnabled: true`로 지정한다. 일반 QUIZ는 이 옵션을 생략하거나 false로 보낸다.

```json
{
  "popupType": "QUIZ",
  "completionRatio": 0.8,
  "passingScore": 80,
  "allowCloseBeforeComplete": true,
  "content": {
    "videoEnabled": true,
    "videoUrl": "https://example.com/training.mp4",
    "videoTitle": "교육 영상",
    "surveyTitle": "이해도 확인",
    "description": "영상을 시청한 뒤 퀴즈에 응답하세요.",
    "autoPlay": false,
    "showControls": true,
    "footerAction": "LINK_AND_CLOSE",
    "footerLinkUrl": "https://example.com/training"
  }
}
```

위 예시는 관련 필드만 발췌했다. 공통 필드와 최상위 `questions`·정답·문항 배점은 일반 QUIZ와 같다. 영상 재생 옵션은 §8.3 VIDEO와 같다.

- 영상 아래 퀴즈를 함께 표시한다. 작은 창에서는 콘텐츠를 스크롤한다.
- 영상 길이가 확인되고 `watchedSeconds / durationSeconds`를 소수점 4자리에서 내린 비율이 최상위 `completionRatio` 이상일 때 퀴즈 입력·채점 버튼과 **푸터 전체**를 활성화한다. 미설정 기준은 1.0이다.
- 현재 재생 위치나 최대 도달 위치로 활성화하지 않는다. 활성화한 뒤 되감기·반복 재생을 해도 다시 잠그지 않는다.
- `allowCloseBeforeComplete: true`면 헤더 X·Alt+F4로 중단할 수 있지만 푸터는 시청 기준까지 비활성화한다. false면 시청 기준 전 종료를 차단한다. 영상 재생 실패 시에는 종료를 허용하며 퀴즈를 자동 활성화하지 않는다.
- 현재 플레이어의 YouTube 임베드는 시청 비율을 제공하지 않으므로 이 모드는 로컬 영상 파일 또는 직접 재생 가능한 HTTP(S) 영상 URL을 사용한다.
- 영상만 보고 닫으면 `VIDEO_WATCHED`를 보내되 **퀴즈 완료로 처리하지 않는다**. 퀴즈 통과 후에만 `SUBMITTED`로 완료한다. 숨김 선택 시에는 기존 HIDDEN 정책을 따른다.
- 새 모드를 사용하려면 WPF와 백엔드를 함께 갱신해야 한다. 기존 클라이언트는 `videoEnabled`를 이해하지 못한다.

---

# 9. questions[] 계약

선택지는 직접 전달한다(C#이 기본 보기를 자동 생성하지 않는다). 각 문항의 optionLayout으로 가로·세로를 개별 지정하며, 누락·미지원 값은 WPF에서 세로형으로 표시한다. 한 팝업에서 두 배치를 혼합할 수 있다.

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| questionId | integer | O | `0` | 결과 answers의 참조 ID. 실제 서버는 유효 ID 제공 |
| title | string | O | `""` | 질문 제목 |
| description | string | 선택 | `""` | 부가 설명 |
| questionType | string | O | 없음 | SINGLE_CHOICE / MULTIPLE_CHOICE / TEXT |
| optionLayout | string | 선택 | `VERTICAL` | VERTICAL / HORIZONTAL |
| isRequired | boolean | 선택 | `false` | 필수 응답 여부 |
| isScored | boolean | QUIZ 권장 | `false` | QUIZ 채점 대상 여부 |
| questionScore | number | 채점 QUIZ | `null` → C# 계산상 0점 | 문항 배점 |
| correctAnswer | string | QUIZ TEXT 채점 문항 | `null` | TEXT 정답 |
| answerMatchMode | string | QUIZ TEXT 채점 문항 | `null` | EXACT / CONTAINS |
| options | array | 선택형 문항 | `[]` | 선택형 보기. TEXT는 빈 배열 |

### options[]

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| optionId | integer | O | `0` | 제출 시 optionIds에 사용. 실제 서버는 유효 ID 제공 |
| value | string | 선택 | `""` | 선택지 업무 값 |
| text | string | O | `""` | 화면 표시 문구 |
| isCorrect | boolean | QUIZ 선택형 채점 문항 | `null` | 정답 여부. SURVEY에서는 생략 가능 |

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

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| clientRequestId | string | O | C#이 전송 시 새 GUID(N 형식) 생성 | 전송 요청 단위 ID. 재전송 요청에서는 새 값일 수 있음 |
| sentAt | string(ISO) | O | C# 전송 시각 | 이번 전송 시각 |
| results | array | O | `[]` | 실제 전송 시 1~50개씩 전송 |

### results[] 공통

| 필드 | 형식 | 필수 여부 | Default/생성 기준 |
|---|---|---|---|
| resultId | string(GUID) | O | 팝업 결과 생성 시 GUID 생성, 재전송 시 유지 |
| popupId | string | O | 원 팝업의 popupId |
| resultType | string | O | 기본 객체값은 CLOSED이나 실제 동작에 따라 타입 결정 |
| displayedAt | string(ISO) | 선택 | `null` 가능 |
| closedAt | string(ISO) | 선택 | `null` 가능 |

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

동영상+퀴즈의 SUBMITTED는 위 `answers`·`score`·`passed`와 함께 §10.7의 `video` 블록을 같은 항목에 넣는다. 백엔드는 영상 블록과 시청 기준을 확인한 뒤 답안을 저장하며, 시청 기준 미달 또는 영상 블록 누락 시 제출을 거절한다. 영상 시청만으로 퀴즈 완료 상태를 갱신하지 않는다.

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

| 필드 | 형식 | 필수 여부 | Default | 단위/의미 |
|---|---|---|---|---|
| durationSeconds | number | O | `0` | 초, 전체 길이 |
| positionSeconds | number | O | `0` | 초, 현재 위치 |
| maximumPositionSeconds | number | O | `0` | 초, 최대 도달 위치 |
| watchedSeconds | number | O | `0` | 초, 누적 시청 시간 |

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

### 응답 필드

| 필드 | 형식 | 필수 여부 | Default | 설명 |
|---|---|---|---|---|
| receivedAt | string(ISO) | 선택 | `null` | 서버 수신 시각 |
| results | array | O | `[]` | 처리한 항목별 결과 |
| results[].resultId | string | O | 없음 | 요청 resultId와 동일 |
| results[].popupId | string | O | 없음 | 요청 popupId |
| results[].resultType | string | O | 없음 | 요청 resultType |
| results[].status | string | O | 없음 | ACCEPTED / DUPLICATE / REJECTED |
| results[].code | string | 선택 | `null` | REJECTED 사유 |
| results[].message | string | 선택 | `null` | REJECTED 설명 |

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
ORIGINAL
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
