# Popup JSON Mapping

## 1. 개요

본 문서는 WPF Popup 클라이언트와 백엔드 서버 사이에서 사용하는
팝업 조회 및 사용자 응답 제출 JSON 규격을 정의한다.

지원하는 팝업 유형은 다음과 같다.

- TEXT
- IMAGE
- VIDEO
- SURVEY
- QUIZ

---

## 2. 공통 규칙

### 2.1 Property 이름

JSON Property 이름은 camelCase를 사용한다.

예시:

```json
{
  "popupId": 1001,
  "popupType": "TEXT",
  "showCloseButton": true
}
```

### 2.2 날짜 및 시간

날짜 및 시간은 ISO-8601 형식을 사용한다.

예시:

```text
2026-07-27T12:30:00+09:00
```

### 2.3 Boolean

Boolean 값은 문자열이 아닌 JSON Boolean을 사용한다.

```json
{
  "showHeader": true,
  "showFooter": false
}
```

다음과 같은 문자열 형식은 사용하지 않는다.

```json
{
  "showHeader": "true",
  "showFooter": "false"
}
```

### 2.4 ID 자료형

팝업, 질문, 보기 등의 식별자는 `number` 형식을 사용한다.

```json
{
  "popupId": 1001,
  "questionId": 1
}
```

### 2.5 Null 및 빈 값

값이 없는 문자열은 빈 문자열보다 `null` 사용을 권장한다.

```json
{
  "description": null
}
```

목록 값이 없는 경우에는 `null`이 아니라 빈 배열을 사용한다.

```json
{
  "options": []
}
```

---

## 3. 공통 팝업 조회 응답

모든 팝업 유형은 아래 공통 필드를 가진다.

### 3.1 JSON 예시

```json
{
  "popupId": 1001,
  "popupType": "TEXT",
  "title": "정보보안 안내",
  "width": 700,
  "height": 600,
  "showHeader": true,
  "showCloseButton": true,
  "showFooter": true,
  "showDoNotShowAgain": false,
  "content": {}
}
```

### 3.2 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| popupId | number | Y | 팝업 고유 식별자 | 1001 |
| popupType | string | Y | 팝업 유형 | TEXT |
| title | string | Y | 팝업 창 제목 | 정보보안 안내 |
| width | number | N | 팝업 너비, 단위는 DIP | 700 |
| height | number | N | 팝업 높이, 단위는 DIP | 600 |
| showHeader | boolean | N | 상단 제목 영역 표시 여부 | true |
| showCloseButton | boolean | N | 닫기 버튼 표시 여부 | true |
| showFooter | boolean | N | 하단 영역 표시 여부 | true |
| showDoNotShowAgain | boolean | N | 다시 보지 않기 항목 표시 여부 | false |
| content | object | Y | 팝업 유형별 상세 데이터 | `{}` |

### 3.3 popupType

| 값 | 설명 |
|---|---|
| TEXT | 텍스트 안내 팝업 |
| IMAGE | 이미지 팝업 |
| VIDEO | 동영상 팝업 |
| SURVEY | 일반 설문 팝업 |
| QUIZ | 채점형 퀴즈 팝업 |

### 3.4 기본값

필드가 누락됐을 때 서버와 클라이언트가 다르게 해석하지 않도록
아래 기본값 사용을 권장한다.

| 필드명 | 기본값 |
|---|---|
| width | 700 |
| height | 600 |
| showHeader | true |
| showCloseButton | true |
| showFooter | true |
| showDoNotShowAgain | false |

### 3.5 공통 검증 규칙

- `popupId`는 필수이며 0보다 커야 한다.
- `popupType`은 정의된 값만 사용한다.
- `title`은 null 또는 빈 문자열을 허용하지 않는다.
- `width`와 `height`는 0보다 커야 한다.
- `content`는 팝업 유형에 맞는 객체여야 한다.
- Boolean 필드는 문자열이 아닌 JSON Boolean 형식이어야 한다.

---

## 4. TEXT 팝업

텍스트 기반 공지, 안내문, 정책 안내 등을 표시하는 팝업이다.

### 4.1 JSON 예시

```json
{
  "popupId": 1001,
  "popupType": "TEXT",
  "title": "정보보안 안내",
  "width": 700,
  "height": 600,
  "showHeader": true,
  "showCloseButton": true,
  "showFooter": true,
  "showDoNotShowAgain": true,
  "content": {
    "contentTitle": "정보보안 정책 변경 안내",
    "description": "변경된 정책 내용을 확인해주세요.",
    "sections": [
      {
        "sectionId": 1,
        "sectionType": "TITLE",
        "text": "주요 변경사항",
        "emphasized": false
      },
      {
        "sectionId": 2,
        "sectionType": "BODY",
        "text": "비밀번호 변경 주기가 90일에서 60일로 변경됩니다.",
        "emphasized": false
      },
      {
        "sectionId": 3,
        "sectionType": "CARD",
        "text": "변경된 정책은 2026년 8월 1일부터 적용됩니다.",
        "emphasized": true
      }
    ]
  }
}
```

### 4.2 content 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| contentTitle | string | N | 텍스트 콘텐츠 내부 제목 | 정보보안 정책 변경 안내 |
| description | string | N | 제목 아래 설명 문구 | 변경된 정책 내용을 확인해주세요. |
| sections | array | Y | 화면에 표시할 텍스트 영역 목록 | `[]` |

### 4.3 sections 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| sectionId | number | Y | 텍스트 영역 식별자 | 1 |
| sectionType | string | Y | 텍스트 영역 유형 | TITLE |
| text | string | Y | 화면에 표시할 문자열 | 주요 변경사항 |
| emphasized | boolean | N | 강조 테두리 또는 강조 스타일 적용 여부 | false |

### 4.4 sectionType

| 값 | 설명 |
|---|---|
| TITLE | 섹션 제목 |
| BODY | 일반 본문 |
| CARD | 테두리가 있는 강조 문구 |

### 4.5 기본값

| 필드명 | 기본값 |
|---|---|
| contentTitle | null |
| description | null |
| sections | 빈 배열 |
| emphasized | false |

### 4.6 검증 규칙

- `sections`는 빈 배열일 수 있다.
- `sections`가 null이면 빈 배열로 처리하는 것을 권장한다.
- `sectionId`는 동일 팝업 안에서 중복되지 않아야 한다.
- `sectionId`는 0보다 커야 한다.
- `sectionType`은 정의된 값만 사용한다.
- `text`는 null 또는 빈 문자열을 허용하지 않는다.
- `emphasized`가 누락되면 `false`로 처리한다.

### 4.7 최소 JSON 예시

```json
{
  "popupId": 1001,
  "popupType": "TEXT",
  "title": "안내",
  "content": {
    "sections": [
      {
        "sectionId": 1,
        "sectionType": "BODY",
        "text": "안내 내용을 확인해주세요.",
        "emphasized": false
      }
    ]
  }
}
```

## 5. IMAGE 팝업

이미지 공지, 배너, 안내 이미지 등을 표시하는 팝업이다.

이미지는 로컬 파일 경로 또는 HTTP/HTTPS URL을 사용할 수 있다.

### 5.1 JSON 예시

```json
{
  "popupId": 1002,
  "popupType": "IMAGE",
  "title": "정보보안 캠페인",
  "width": 760,
  "height": 680,
  "showHeader": true,
  "showCloseButton": true,
  "showFooter": true,
  "showDoNotShowAgain": true,
  "content": {
    "imageTitle": "정보보안 실천 안내",
    "imageUrl": "https://example.com/images/security-campaign.png",
    "description": "이미지를 클릭하면 상세 안내 페이지로 이동합니다.",
    "showDescription": true,
    "linkUrl": "https://example.com/security/detail",
    "fitToImageSize": false,
    "maximumImageWidth": 720,
    "maximumImageHeight": 520,
    "stretchMode": "UNIFORM",
    "horizontalPadding": 0,
    "verticalPadding": 0
  }
}
```

### 5.2 content 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| imageTitle | string | N | 이미지 콘텐츠 내부 제목 | 정보보안 실천 안내 |
| imageUrl | string | Y | 표시할 이미지의 경로 또는 URL | https://example.com/image.png |
| description | string | N | 이미지 아래 설명 문구 | 이미지를 클릭하면 상세 페이지로 이동합니다. |
| showDescription | boolean | N | 설명 영역 표시 여부 | true |
| linkUrl | string | N | 이미지 클릭 시 이동할 외부 URL | https://example.com/detail |
| fitToImageSize | boolean | N | 이미지 원본 크기를 기준으로 팝업 크기를 조정할지 여부 | false |
| maximumImageWidth | number | N | 이미지 최대 너비, 단위는 DIP | 720 |
| maximumImageHeight | number | N | 이미지 최대 높이, 단위는 DIP | 520 |
| stretchMode | string | N | 이미지 크기 조정 방식 | UNIFORM |
| horizontalPadding | number | N | 이미지 좌우 여백, 단위는 DIP | 0 |
| verticalPadding | number | N | 이미지 상하 여백, 단위는 DIP | 0 |

### 5.3 imageUrl 규칙

`imageUrl`에는 다음 형식을 사용할 수 있다.

| 유형 | 예시 |
|---|---|
| HTTP URL | https://example.com/images/notice.png |
| HTTPS URL | https://example.com/images/notice.png |
| 절대 로컬 경로 | C:\\Popup\\Images\\notice.png |
| 상대 로컬 경로 | Assets/Images/notice.png |

상대 로컬 경로는 WPF 실행 파일의 기준 디렉터리를 기준으로 해석한다.

백엔드에서 이미지를 제공하는 경우에는 HTTPS URL 사용을 권장한다.

### 5.4 stretchMode

| 값 | 설명 |
|---|---|
| NONE | 이미지 원본 크기를 유지한다. |
| FILL | 이미지 영역 전체를 채운다. 비율이 변형될 수 있다. |
| UNIFORM | 원본 비율을 유지하면서 이미지 영역 안에 전부 표시한다. |
| UNIFORM_TO_FILL | 원본 비율을 유지하면서 영역을 채운다. 일부가 잘릴 수 있다. |

권장 기본값은 `UNIFORM`이다.

### 5.5 fitToImageSize

`fitToImageSize`가 `true`이면 이미지 원본 크기를 기준으로 팝업 크기를 계산한다.

단, 실제 표시 크기는 다음 값의 제한을 받는다.

- `maximumImageWidth`
- `maximumImageHeight`
- 화면의 사용 가능한 작업 영역
- 팝업 Header 및 Footer 영역
- 이미지 설명 영역

```json
{
  "fitToImageSize": true,
  "maximumImageWidth": 900,
  "maximumImageHeight": 700
}
```

`fitToImageSize`가 `false`이면 공통 필드의 `width`, `height`를 기준으로 팝업을 표시한다.

### 5.6 linkUrl

`linkUrl`이 존재하면 이미지 클릭 시 기본 웹 브라우저로 해당 주소를 연다.

```json
{
  "imageUrl": "https://example.com/banner.png",
  "linkUrl": "https://example.com/event"
}
```

`linkUrl`이 `null`이면 이미지 클릭 동작을 수행하지 않는다.

보안을 위해 다음 프로토콜만 허용하는 것을 권장한다.

- HTTP
- HTTPS

### 5.7 기본값

| 필드명 | 기본값 |
|---|---|
| imageTitle | null |
| description | null |
| showDescription | true |
| linkUrl | null |
| fitToImageSize | false |
| maximumImageWidth | 720 |
| maximumImageHeight | 520 |
| stretchMode | UNIFORM |
| horizontalPadding | 0 |
| verticalPadding | 0 |

### 5.8 검증 규칙

- `imageUrl`은 null 또는 빈 문자열을 허용하지 않는다.
- URL을 사용할 경우 HTTP 또는 HTTPS 형식이어야 한다.
- 로컬 파일 경로를 사용할 경우 클라이언트에서 접근 가능한 경로여야 한다.
- `maximumImageWidth`와 `maximumImageHeight`는 0보다 커야 한다.
- `horizontalPadding`과 `verticalPadding`은 0 이상이어야 한다.
- `stretchMode`는 정의된 값만 사용한다.
- `showDescription`이 `false`이면 `description` 값이 존재해도 화면에 표시하지 않는다.
- `linkUrl`이 존재하면 클라이언트에서 URL 형식과 허용 프로토콜을 검증한다.

### 5.9 최소 JSON 예시

```json
{
  "popupId": 1002,
  "popupType": "IMAGE",
  "title": "이미지 안내",
  "content": {
    "imageUrl": "https://example.com/images/notice.png"
  }
}
```

## 6. VIDEO 팝업

로컬 영상 파일, 직접 영상 URL 또는 YouTube 영상을 표시하는 팝업이다.

영상 재생 상태, 재생 위치, 재생 완료 여부 등의 시청 로그를 별도 API로 전송할 수 있다.

### 6.1 JSON 예시

```json
{
  "popupId": 1003,
  "popupType": "VIDEO",
  "title": "정보보안 교육 영상",
  "width": 850,
  "height": 680,
  "showHeader": true,
  "showCloseButton": true,
  "showFooter": true,
  "showDoNotShowAgain": false,
  "content": {
    "videoTitle": "개인정보 보호 교육",
    "videoUrl": "https://example.com/videos/security-training.mp4",
    "description": "영상 시청 후 하단의 완료 버튼을 눌러주세요.",
    "showDescription": true,
    "videoSourceType": "DIRECT_URL",
    "autoPlay": true,
    "initialVolume": 0.7,
    "allowMute": true,
    "allowSeeking": true,
    "allowFullScreen": true,
    "playbackSpeedEnabled": false,
    "allowedPlaybackSpeeds": [
      1.0
    ],
    "completionPolicy": {
      "completionType": "WATCH_RATIO",
      "requiredWatchRatio": 0.9,
      "requiredWatchSeconds": null
    }
  }
}
```

### 6.2 content 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| videoTitle | string | N | 영상 콘텐츠 내부 제목 | 개인정보 보호 교육 |
| videoUrl | string | Y | 영상 파일 경로 또는 영상 URL | https://example.com/video.mp4 |
| description | string | N | 영상 아래 설명 문구 | 영상을 끝까지 시청해주세요. |
| showDescription | boolean | N | 설명 영역 표시 여부 | true |
| videoSourceType | string | Y | 영상 소스 유형 | DIRECT_URL |
| autoPlay | boolean | N | 영상 로딩 완료 후 자동 재생 여부 | true |
| initialVolume | number | N | 초기 음량, 0에서 1 사이 값 | 0.7 |
| allowMute | boolean | N | 음소거 기능 사용 여부 | true |
| allowSeeking | boolean | N | 재생 위치 이동 허용 여부 | true |
| allowFullScreen | boolean | N | 전체화면 기능 사용 여부 | true |
| playbackSpeedEnabled | boolean | N | 재생 속도 변경 기능 사용 여부 | false |
| allowedPlaybackSpeeds | array | N | 허용할 재생 속도 목록 | `[1.0, 1.5, 2.0]` |
| completionPolicy | object | N | 영상 시청 완료 판정 기준 | `{}` |

### 6.3 videoSourceType

| 값 | 설명 |
|---|---|
| LOCAL_FILE | 클라이언트 로컬 파일 경로 |
| DIRECT_URL | MP4 등 직접 재생 가능한 HTTP/HTTPS URL |
| YOUTUBE | YouTube 영상 URL |

### 6.4 videoUrl 예시

#### 로컬 절대 경로

```json
{
  "videoSourceType": "LOCAL_FILE",
  "videoUrl": "C:\\Popup\\Videos\\security-training.mp4"
}
```

#### 로컬 상대 경로

```json
{
  "videoSourceType": "LOCAL_FILE",
  "videoUrl": "Assets/Videos/security-training.mp4"
}
```

상대 경로는 WPF 실행 파일의 기준 디렉터리를 기준으로 해석한다.

#### 직접 영상 URL

```json
{
  "videoSourceType": "DIRECT_URL",
  "videoUrl": "https://example.com/videos/security-training.mp4"
}
```

#### YouTube URL

```json
{
  "videoSourceType": "YOUTUBE",
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

YouTube 주소는 다음 형식을 지원할 수 있다.

| 유형 | 예시 |
|---|---|
| 일반 영상 | https://www.youtube.com/watch?v=VIDEO_ID |
| 공유 주소 | https://youtu.be/VIDEO_ID |
| Embed | https://www.youtube.com/embed/VIDEO_ID |
| Shorts | https://www.youtube.com/shorts/VIDEO_ID |

### 6.5 initialVolume

`initialVolume`은 `0`부터 `1` 사이의 값으로 전달한다.

| 값 | 설명 |
|---:|---|
| 0 | 음소거 |
| 0.5 | 음량 50% |
| 1 | 음량 100% |

```json
{
  "initialVolume": 0.7
}
```

범위를 벗어난 값은 클라이언트에서 다음과 같이 보정한다.

| 전달값 | 적용값 |
|---:|---:|
| -0.5 | 0 |
| 0.7 | 0.7 |
| 1.5 | 1 |

### 6.6 allowSeeking

`allowSeeking`은 사용자가 영상 재생 위치를 변경할 수 있는지를 나타낸다.

```json
{
  "allowSeeking": true
}
```

`true`인 경우 다음 기능을 사용할 수 있다.

- 진행바 클릭 이동
- 진행바 드래그 이동
- 드래그를 놓은 시점에 실제 영상 위치 변경

`false`인 경우 진행바를 조회용으로만 표시하거나 숨길 수 있다.

필수 교육 영상처럼 구간 건너뛰기를 제한해야 한다면 `false` 사용을 권장한다.

### 6.7 재생 속도

재생 속도 변경을 허용하려면 다음과 같이 전달한다.

```json
{
  "playbackSpeedEnabled": true,
  "allowedPlaybackSpeeds": [
    1.0,
    1.25,
    1.5,
    2.0
  ]
}
```

`playbackSpeedEnabled`가 `false`이면 `allowedPlaybackSpeeds` 값이 존재해도 재생 속도 선택 UI를 표시하지 않는다.

허용하지 않은 속도는 클라이언트에서 선택할 수 없어야 한다.

### 6.8 completionPolicy

영상 시청 완료 여부를 판단하는 기준이다.

```json
{
  "completionPolicy": {
    "completionType": "WATCH_RATIO",
    "requiredWatchRatio": 0.9,
    "requiredWatchSeconds": null
  }
}
```

#### completionPolicy 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| completionType | string | Y | 완료 판정 방식 | WATCH_RATIO |
| requiredWatchRatio | number | 조건부 | 필수 시청 비율, 0에서 1 사이 | 0.9 |
| requiredWatchSeconds | number | 조건부 | 필수 시청 시간, 단위는 초 | 300 |

### 6.9 completionType

| 값 | 설명 |
|---|---|
| MEDIA_ENDED | 영상이 끝까지 재생되면 완료 |
| WATCH_RATIO | 전체 재생시간 중 지정 비율 이상을 시청하면 완료 |
| WATCH_SECONDS | 누적 시청시간이 지정 시간 이상이면 완료 |
| NONE | 별도의 완료 판정을 하지 않음 |

#### 영상 종료 기준

```json
{
  "completionPolicy": {
    "completionType": "MEDIA_ENDED",
    "requiredWatchRatio": null,
    "requiredWatchSeconds": null
  }
}
```

#### 시청 비율 기준

```json
{
  "completionPolicy": {
    "completionType": "WATCH_RATIO",
    "requiredWatchRatio": 0.9,
    "requiredWatchSeconds": null
  }
}
```

#### 누적 시청시간 기준

```json
{
  "completionPolicy": {
    "completionType": "WATCH_SECONDS",
    "requiredWatchRatio": null,
    "requiredWatchSeconds": 300
  }
}
```

### 6.10 기본값

| 필드명 | 기본값 |
|---|---|
| videoTitle | null |
| description | null |
| showDescription | true |
| autoPlay | true |
| initialVolume | 0.7 |
| allowMute | true |
| allowSeeking | true |
| allowFullScreen | true |
| playbackSpeedEnabled | false |
| allowedPlaybackSpeeds | `[1.0]` |
| completionPolicy.completionType | NONE |
| completionPolicy.requiredWatchRatio | null |
| completionPolicy.requiredWatchSeconds | null |

### 6.11 검증 규칙

- `videoUrl`은 null 또는 빈 문자열을 허용하지 않는다.
- `videoSourceType`은 정의된 값만 사용한다.
- `DIRECT_URL`은 HTTP 또는 HTTPS URL이어야 한다.
- `YOUTUBE`은 지원되는 YouTube URL 형식이어야 한다.
- `LOCAL_FILE`은 클라이언트에서 접근 가능한 경로여야 한다.
- `initialVolume`은 0에서 1 사이 값이어야 한다.
- `allowedPlaybackSpeeds`의 각 값은 0보다 커야 한다.
- `playbackSpeedEnabled`가 `true`이면 `allowedPlaybackSpeeds`에는 최소 한 개 이상의 값이 있어야 한다.
- `requiredWatchRatio`는 0보다 크고 1 이하여야 한다.
- `requiredWatchSeconds`는 0보다 커야 한다.
- `showDescription`이 `false`이면 `description`이 존재해도 화면에 표시하지 않는다.
- `allowSeeking`이 `false`이면 클라이언트는 재생 위치 이동을 차단해야 한다.
- YouTube 영상은 자체 플레이어 기능 때문에 로컬 영상과 일부 옵션 동작이 다를 수 있다.

### 6.12 최소 JSON 예시

```json
{
  "popupId": 1003,
  "popupType": "VIDEO",
  "title": "교육 영상",
  "content": {
    "videoUrl": "https://example.com/videos/training.mp4",
    "videoSourceType": "DIRECT_URL"
  }
}
```

### 6.13 영상 시청 로그 요청 JSON

영상 재생 중 발생한 사용자의 행동을 서버에 기록할 때 사용한다.

```json
{
  "popupId": 1003,
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "eventType": "PAUSE",
  "eventAt": "2026-07-27T13:10:25+09:00",
  "positionSeconds": 125.4,
  "durationSeconds": 600,
  "playbackSpeed": 1.0,
  "volume": 0.7,
  "muted": false,
  "completed": false
}
```

### 6.14 영상 시청 로그 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| popupId | number | Y | 영상 팝업 식별자 | 1003 |
| userId | string | Y | 사용자 식별자 | USER001 |
| sessionId | string | Y | 팝업 실행 단위 식별자 | UUID |
| eventType | string | Y | 영상 이벤트 유형 | PAUSE |
| eventAt | string | Y | 이벤트 발생 일시 | ISO-8601 |
| positionSeconds | number | Y | 이벤트 발생 시 영상 위치 | 125.4 |
| durationSeconds | number | N | 영상 전체 길이 | 600 |
| playbackSpeed | number | N | 이벤트 발생 당시 재생 속도 | 1.0 |
| volume | number | N | 이벤트 발생 당시 음량 | 0.7 |
| muted | boolean | N | 음소거 여부 | false |
| completed | boolean | N | 영상 시청 완료 여부 | false |

### 6.15 eventType

| 값 | 설명 |
|---|---|
| OPEN | 영상 팝업 열림 |
| PLAY | 영상 재생 |
| PAUSE | 영상 일시정지 |
| SEEK | 영상 위치 이동 |
| VOLUME_CHANGE | 음량 변경 |
| MUTE | 음소거 |
| UNMUTE | 음소거 해제 |
| SPEED_CHANGE | 재생 속도 변경 |
| FULLSCREEN_ENTER | 전체화면 진입 |
| FULLSCREEN_EXIT | 전체화면 종료 |
| ENDED | 영상 재생 종료 |
| COMPLETE | 시청 완료 조건 충족 |
| CLOSE | 영상 팝업 닫힘 |
| ERROR | 영상 로드 또는 재생 오류 |

### 6.16 SEEK 로그 예시

```json
{
  "popupId": 1003,
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "eventType": "SEEK",
  "eventAt": "2026-07-27T13:12:10+09:00",
  "positionSeconds": 250,
  "durationSeconds": 600,
  "playbackSpeed": 1.0,
  "volume": 0.7,
  "muted": false,
  "completed": false
}
```

현재 구조에서는 드래그 중 계속 로그를 전송하지 않고, 사용자가 드래그를 놓아 실제 영상 위치가 변경된 시점에 `SEEK` 로그를 한 번 기록하는 것을 권장한다.

## 7. SURVEY 팝업

사용자 만족도 조사, 의견 수집, 교육 설문 등을 표시하는 일반 설문 팝업이다.

설문 문항은 다음 형식을 지원한다.

- 5점 평가
- 단일 선택
- 복수 선택
- 주관식 입력

일반 설문은 정답과 점수를 계산하지 않는다.

### 7.1 JSON 예시

```json
{
  "popupId": 1004,
  "popupType": "SURVEY",
  "title": "교육 만족도 설문",
  "width": 700,
  "height": 670,
  "showHeader": false,
  "showCloseButton": false,
  "showFooter": false,
  "showDoNotShowAgain": false,
  "content": {
    "surveyTitle": "교육 만족도 설문",
    "description": "더 나은 교육을 위해 아래 문항에 응답해주세요.",
    "questions": [
      {
        "questionId": 1,
        "title": "교육 내용에 얼마나 만족하셨나요?",
        "description": "전체 교육 내용을 기준으로 평가해주세요.",
        "questionType": "RATING5",
        "required": true,
        "options": []
      },
      {
        "questionId": 2,
        "title": "교육을 알게 된 경로를 선택해주세요.",
        "description": null,
        "questionType": "SINGLE_CHOICE",
        "required": true,
        "options": [
          {
            "value": "EMAIL",
            "text": "이메일"
          },
          {
            "value": "NOTICE",
            "text": "사내 공지"
          },
          {
            "value": "RECOMMEND",
            "text": "동료 추천"
          },
          {
            "value": "ETC",
            "text": "기타"
          }
        ]
      },
      {
        "questionId": 3,
        "title": "도움이 되었던 내용을 선택해주세요.",
        "description": "여러 항목을 선택할 수 있습니다.",
        "questionType": "MULTIPLE_CHOICE",
        "required": false,
        "options": [
          {
            "value": "THEORY",
            "text": "이론 설명"
          },
          {
            "value": "EXAMPLE",
            "text": "실습 예제"
          },
          {
            "value": "DOCUMENT",
            "text": "교육 자료"
          },
          {
            "value": "QNA",
            "text": "질의응답"
          }
        ]
      },
      {
        "questionId": 4,
        "title": "추가 의견을 작성해주세요.",
        "description": "개선이 필요한 점이나 좋았던 점을 자유롭게 작성해주세요.",
        "questionType": "TEXT",
        "required": false,
        "options": []
      }
    ]
  }
}
```

### 7.2 content 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| surveyTitle | string | N | 설문 콘텐츠 내부 제목 | 교육 만족도 설문 |
| description | string | N | 설문 상단 설명 문구 | 아래 문항에 응답해주세요. |
| questions | array | Y | 설문 문항 목록 | `[]` |

### 7.3 questions 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| questionId | number | Y | 문항 식별자 | 1 |
| title | string | Y | 문항 제목 | 교육 내용에 만족하셨나요? |
| description | string | N | 문항 보조 설명 | 전체 교육 내용을 기준으로 평가해주세요. |
| questionType | string | Y | 문항 유형 | RATING5 |
| required | boolean | N | 필수 응답 여부 | true |
| options | array | 조건부 | 선택형 문항의 보기 목록 | `[]` |

### 7.4 questionType

| 값 | 설명 |
|---|---|
| RATING5 | 1점부터 5점까지 선택하는 5점 평가 문항 |
| SINGLE_CHOICE | 보기 중 하나만 선택하는 문항 |
| MULTIPLE_CHOICE | 보기 중 여러 개를 선택할 수 있는 문항 |
| TEXT | 사용자가 문자열을 직접 입력하는 주관식 문항 |

### 7.5 options 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| value | string | Y | 서버에 제출할 보기 값 | EMAIL |
| text | string | Y | 화면에 표시할 보기 문구 | 이메일 |

`value`는 화면 표시 문구와 분리하여 사용하는 것을 권장한다.

```json
{
  "value": "EMAIL",
  "text": "이메일"
}
```

사용자가 해당 보기를 선택하면 서버에는 `text`가 아니라 `value`를 제출한다.

### 7.6 RATING5 문항

`RATING5` 문항은 `options`가 비어 있으면 클라이언트의 기본 보기 다섯 개를 사용한다.

```json
{
  "questionId": 1,
  "title": "교육 내용에 얼마나 만족하셨나요?",
  "questionType": "RATING5",
  "required": true,
  "options": []
}
```

기본 보기는 다음과 같다.

| value | text |
|---:|---|
| 1 | 매우 좋지 않음 |
| 2 | 좋지 않음 |
| 3 | 보통 |
| 4 | 좋음 |
| 5 | 매우 좋음 |

직접 보기 문구를 지정할 수도 있다.

```json
{
  "questionId": 1,
  "title": "서비스 만족도를 평가해주세요.",
  "questionType": "RATING5",
  "required": true,
  "options": [
    {
      "value": "1",
      "text": "매우 불만족"
    },
    {
      "value": "2",
      "text": "불만족"
    },
    {
      "value": "3",
      "text": "보통"
    },
    {
      "value": "4",
      "text": "만족"
    },
    {
      "value": "5",
      "text": "매우 만족"
    }
  ]
}
```

### 7.7 SINGLE_CHOICE 문항

사용자가 하나의 보기만 선택할 수 있다.

```json
{
  "questionId": 2,
  "title": "교육을 알게 된 경로를 선택해주세요.",
  "questionType": "SINGLE_CHOICE",
  "required": true,
  "options": [
    {
      "value": "EMAIL",
      "text": "이메일"
    },
    {
      "value": "NOTICE",
      "text": "사내 공지"
    }
  ]
}
```

### 7.8 MULTIPLE_CHOICE 문항

사용자가 여러 개의 보기를 선택할 수 있다.

```json
{
  "questionId": 3,
  "title": "도움이 되었던 내용을 선택해주세요.",
  "questionType": "MULTIPLE_CHOICE",
  "required": false,
  "options": [
    {
      "value": "THEORY",
      "text": "이론 설명"
    },
    {
      "value": "EXAMPLE",
      "text": "실습 예제"
    }
  ]
}
```

### 7.9 TEXT 문항

사용자가 문자열을 직접 입력하는 문항이다.

```json
{
  "questionId": 4,
  "title": "추가 의견을 작성해주세요.",
  "description": "개선이 필요한 점을 자유롭게 작성해주세요.",
  "questionType": "TEXT",
  "required": false,
  "options": []
}
```

`TEXT` 문항에서는 `options`를 빈 배열로 전달한다.

### 7.10 필수 문항

`required`가 `true`인 문항은 사용자가 응답하지 않으면 제출할 수 없다.

```json
{
  "questionId": 1,
  "title": "교육 내용에 만족하셨나요?",
  "questionType": "RATING5",
  "required": true,
  "options": []
}
```

문항 유형별 응답 여부 판단 기준은 다음과 같다.

| questionType | 응답 완료 기준 |
|---|---|
| RATING5 | 하나의 점수를 선택함 |
| SINGLE_CHOICE | 하나의 보기를 선택함 |
| MULTIPLE_CHOICE | 최소 한 개 이상의 보기를 선택함 |
| TEXT | 공백을 제외한 문자를 한 글자 이상 입력함 |

### 7.11 기본값

| 필드명 | 기본값 |
|---|---|
| surveyTitle | null |
| description | null |
| questions | 빈 배열 |
| question.description | null |
| question.required | false |
| question.options | 빈 배열 |

### 7.12 검증 규칙

- `questions`는 null이 아닌 배열이어야 한다.
- `questions`가 비어 있으면 설문 문항이 없는 안내 화면으로 처리할 수 있다.
- `questionId`는 동일 설문 안에서 중복되지 않아야 한다.
- `questionId`는 0보다 커야 한다.
- `title`은 null 또는 빈 문자열을 허용하지 않는다.
- `questionType`은 정의된 값만 사용한다.
- `SINGLE_CHOICE`와 `MULTIPLE_CHOICE`는 최소 한 개 이상의 `options`가 있어야 한다.
- `TEXT` 문항은 `options`를 사용하지 않는다.
- `RATING5`에서 `options`가 비어 있으면 클라이언트 기본 보기를 사용한다.
- 동일 문항 안에서 `option.value`는 중복되지 않아야 한다.
- `option.value`와 `option.text`는 null 또는 빈 문자열을 허용하지 않는다.
- `required`가 누락되면 `false`로 처리한다.

### 7.13 최소 JSON 예시

```json
{
  "popupId": 1004,
  "popupType": "SURVEY",
  "title": "간단 설문",
  "content": {
    "questions": [
      {
        "questionId": 1,
        "title": "서비스에 만족하셨나요?",
        "questionType": "RATING5",
        "required": true,
        "options": []
      }
    ]
  }
}
```

### 7.14 설문 응답 제출 요청 JSON

사용자가 설문 제출 버튼을 누르고 필수 문항 검증을 통과했을 때 서버에 전송한다.

```json
{
  "popupId": 1004,
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "submittedAt": "2026-07-27T14:20:00+09:00",
  "answers": [
    {
      "questionId": 1,
      "selectedValues": [
        "5"
      ],
      "textAnswer": null
    },
    {
      "questionId": 2,
      "selectedValues": [
        "EMAIL"
      ],
      "textAnswer": null
    },
    {
      "questionId": 3,
      "selectedValues": [
        "THEORY",
        "EXAMPLE"
      ],
      "textAnswer": null
    },
    {
      "questionId": 4,
      "selectedValues": [],
      "textAnswer": "실습 시간이 조금 더 길었으면 좋겠습니다."
    }
  ]
}
```

### 7.15 설문 응답 제출 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| popupId | number | Y | 설문 팝업 식별자 | 1004 |
| userId | string | Y | 응답 사용자 식별자 | USER001 |
| sessionId | string | Y | 팝업 실행 단위 식별자 | UUID |
| submittedAt | string | Y | 설문 제출 일시 | ISO-8601 |
| answers | array | Y | 문항별 응답 목록 | `[]` |

### 7.16 answers 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| questionId | number | Y | 응답 대상 문항 식별자 | 1 |
| selectedValues | array | Y | 선택한 보기 값 목록 | `["EMAIL"]` |
| textAnswer | string | N | 주관식 응답 문자열 | 교육 내용이 좋았습니다. |

문항 유형별 제출 형식은 다음과 같다.

| questionType | selectedValues | textAnswer |
|---|---|---|
| RATING5 | 선택한 점수 1개 | null |
| SINGLE_CHOICE | 선택한 보기 값 1개 | null |
| MULTIPLE_CHOICE | 선택한 보기 값 1개 이상 | null |
| TEXT | 빈 배열 | 입력 문자열 |

### 7.17 미응답 문항 처리

선택 문항에 응답하지 않은 경우에도 전체 문항을 `answers`에 포함하는 방식을 권장한다.

```json
{
  "questionId": 3,
  "selectedValues": [],
  "textAnswer": null
}
```

이 방식은 서버에서 전체 문항과 응답 상태를 비교하기 쉽다는 장점이 있다.

다만 백엔드와 협의하여 미응답 문항을 `answers`에서 제외하는 방식도 사용할 수 있다.

한 가지 방식으로 통일해야 하며, 본 문서에서는 모든 문항을 포함하는 방식을 기본으로 한다.

### 7.18 설문 제출 응답 JSON

```json
{
  "success": true,
  "popupId": 1004,
  "submissionId": 50001,
  "submittedAt": "2026-07-27T14:20:00+09:00",
  "message": "설문이 정상적으로 제출되었습니다."
}
```

### 7.19 설문 제출 응답 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| success | boolean | Y | 설문 저장 성공 여부 | true |
| popupId | number | Y | 설문 팝업 식별자 | 1004 |
| submissionId | number | N | 서버에서 생성한 제출 식별자 | 50001 |
| submittedAt | string | N | 서버 저장 완료 일시 | ISO-8601 |
| message | string | N | 사용자 안내 메시지 | 설문이 정상적으로 제출되었습니다. |

설문 팝업은 서버 저장 성공 응답을 받은 뒤 닫는 것을 권장한다.

저장에 실패하면 팝업을 유지하고 사용자가 다시 제출할 수 있도록 처리한다.

## 8. QUIZ 팝업

정답이 존재하는 객관식 문항을 채점하고 통과 여부를 판단하는 평가형 팝업이다.

화면 구성과 사용자 응답 방식은 `SURVEY` 팝업과 동일하지만 다음 기능이 추가된다.

- 채점 대상 문항 지정
- 정답 비교
- 점수 계산
- 통과 점수 비교
- 통과 또는 미달 결과 처리

보안상 정답과 최종 점수 계산은 서버에서 처리하는 것을 권장한다.

---

### 8.1 클라이언트 조회 JSON 예시

```json
{
  "popupId": 1005,
  "popupType": "QUIZ",
  "title": "정보보안 교육 평가",
  "width": 700,
  "height": 670,
  "showHeader": false,
  "showCloseButton": false,
  "showFooter": false,
  "showDoNotShowAgain": false,
  "content": {
    "quizTitle": "정보보안 교육 평가",
    "description": "80점 이상이면 평가를 통과합니다.",
    "passingScore": 80,
    "questions": [
      {
        "questionId": 1,
        "title": "다음 중 개인정보에 해당하는 것은?",
        "description": "정답을 하나 선택해주세요.",
        "questionType": "SINGLE_CHOICE",
        "required": true,
        "scored": true,
        "options": [
          {
            "value": "PHONE",
            "text": "휴대전화 번호"
          },
          {
            "value": "WEATHER",
            "text": "오늘의 날씨"
          },
          {
            "value": "BUILDING",
            "text": "회사 건물 층수"
          }
        ]
      },
      {
        "questionId": 2,
        "title": "올바른 비밀번호 관리 방법을 모두 선택하세요.",
        "description": "복수 선택 문항입니다.",
        "questionType": "MULTIPLE_CHOICE",
        "required": true,
        "scored": true,
        "options": [
          {
            "value": "LONG",
            "text": "충분히 긴 비밀번호를 사용한다."
          },
          {
            "value": "REUSE",
            "text": "모든 사이트에서 같은 비밀번호를 사용한다."
          },
          {
            "value": "MFA",
            "text": "다중 인증을 사용한다."
          },
          {
            "value": "SHARE",
            "text": "동료와 비밀번호를 공유한다."
          }
        ]
      },
      {
        "questionId": 3,
        "title": "의심스러운 이메일을 받았을 때 가장 적절한 행동은?",
        "description": null,
        "questionType": "SINGLE_CHOICE",
        "required": true,
        "scored": true,
        "options": [
          {
            "value": "CLICK",
            "text": "링크를 눌러 내용을 확인한다."
          },
          {
            "value": "REPORT",
            "text": "링크를 누르지 않고 보안 담당자에게 신고한다."
          },
          {
            "value": "FORWARD",
            "text": "동료들에게 그대로 전달한다."
          }
        ]
      },
      {
        "questionId": 4,
        "title": "교육에 대한 의견을 작성해주세요.",
        "description": "이 문항은 채점하지 않습니다.",
        "questionType": "TEXT",
        "required": false,
        "scored": false,
        "options": []
      }
    ]
  }
}
```

---

### 8.2 content 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| quizTitle | string | N | 퀴즈 콘텐츠 내부 제목 | 정보보안 교육 평가 |
| description | string | N | 퀴즈 상단 설명 문구 | 80점 이상이면 통과합니다. |
| passingScore | number | Y | 통과에 필요한 최소 점수 | 80 |
| questions | array | Y | 퀴즈 문항 목록 | `[]` |

---

### 8.3 questions 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| questionId | number | Y | 문항 식별자 | 1 |
| title | string | Y | 문항 제목 | 개인정보에 해당하는 것은? |
| description | string | N | 문항 보조 설명 | 정답을 하나 선택해주세요. |
| questionType | string | Y | 문항 유형 | SINGLE_CHOICE |
| required | boolean | N | 필수 응답 여부 | true |
| scored | boolean | N | 채점 대상 여부 | true |
| options | array | 조건부 | 객관식 보기 목록 | `[]` |

퀴즈의 `questionType`과 `options` 형식은 `SURVEY` 팝업의 규격을 동일하게 사용한다.

---

### 8.4 지원 문항 유형

| 값 | 사용 여부 | 설명 |
|---|:---:|---|
| RATING5 | 가능 | 특정 점수 또는 선택값을 정답으로 사용할 때 |
| SINGLE_CHOICE | 권장 | 보기 중 하나를 선택하는 단일 정답 문항 |
| MULTIPLE_CHOICE | 권장 | 여러 정답을 모두 선택하는 복수 정답 문항 |
| TEXT | 채점 제외 권장 | 주관식 의견 또는 비채점 문항 |

현재 기본 구현에서는 `TEXT` 문항의 자동 채점을 지원하지 않는다.

따라서 `TEXT` 문항은 다음과 같이 설정하는 것을 권장한다.

```json
{
  "questionId": 4,
  "title": "교육에 대한 의견을 작성해주세요.",
  "questionType": "TEXT",
  "required": false,
  "scored": false,
  "options": []
}
```

---

### 8.5 passingScore

`passingScore`는 0점부터 100점 사이의 값으로 전달한다.

```json
{
  "passingScore": 80
}
```

클라이언트 또는 서버에서는 범위를 벗어난 값을 다음과 같이 보정하거나 오류 처리한다.

| 전달값 | 권장 처리 |
|---:|---|
| -10 | 0으로 보정 또는 요청 오류 |
| 80 | 그대로 적용 |
| 120 | 100으로 보정 또는 요청 오류 |

백엔드에서는 범위를 벗어난 값을 오류로 처리하는 방식을 권장한다.

---

### 8.6 scored

`scored`는 해당 문항을 점수 계산에 포함할지를 나타낸다.

```json
{
  "questionId": 1,
  "questionType": "SINGLE_CHOICE",
  "required": true,
  "scored": true
}
```

| 값 | 설명 |
|---|---|
| true | 정답 비교 및 점수 계산에 포함 |
| false | 응답은 수집하지만 점수 계산에서는 제외 |

채점 대상 문항은 일반적으로 `required`도 `true`로 설정하는 것을 권장한다.

```json
{
  "required": true,
  "scored": true
}
```

---

### 8.7 정답 데이터 전달 정책

정답을 클라이언트 조회 JSON에 포함하면 사용자가 네트워크 응답이나 메모리를 확인하여 정답을 알아낼 수 있다.

따라서 운영 환경에서는 클라이언트에 다음 필드를 전달하지 않는 것을 권장한다.

```json
{
  "correctAnswers": [
    "PHONE"
  ]
}
```

권장 구조는 다음과 같다.

```text
클라이언트
→ 문항과 보기만 조회
→ 사용자가 선택한 답안 제출

서버
→ 서버에 저장된 정답과 비교
→ 점수 및 통과 여부 반환
```

현재 WPF 테스트 코드처럼 로컬 채점이 필요한 개발 환경에서는 `correctAnswers`를 임시로 사용할 수 있다.

---

### 8.8 개발용 로컬 채점 JSON 예시

개발 또는 단독 실행 환경에서 클라이언트가 직접 채점해야 하는 경우에만 사용한다.

```json
{
  "popupId": 1005,
  "popupType": "QUIZ",
  "title": "정보보안 교육 평가",
  "content": {
    "quizTitle": "정보보안 교육 평가",
    "description": "80점 이상이면 통과합니다.",
    "passingScore": 80,
    "questions": [
      {
        "questionId": 1,
        "title": "다음 중 개인정보에 해당하는 것은?",
        "questionType": "SINGLE_CHOICE",
        "required": true,
        "scored": true,
        "options": [
          {
            "value": "PHONE",
            "text": "휴대전화 번호"
          },
          {
            "value": "WEATHER",
            "text": "오늘의 날씨"
          }
        ],
        "correctAnswers": [
          "PHONE"
        ]
      }
    ]
  }
}
```

`correctAnswers`에는 `option.text`가 아니라 `option.value`를 넣는다.

```json
{
  "options": [
    {
      "value": "PHONE",
      "text": "휴대전화 번호"
    }
  ],
  "correctAnswers": [
    "PHONE"
  ]
}
```

---

### 8.9 단일 선택 채점 규칙

`SINGLE_CHOICE`는 선택한 값 하나가 정답 값 하나와 같으면 정답이다.

정답 설정:

```json
{
  "questionId": 1,
  "questionType": "SINGLE_CHOICE",
  "correctAnswers": [
    "PHONE"
  ]
}
```

사용자 답안:

```json
{
  "questionId": 1,
  "selectedValues": [
    "PHONE"
  ],
  "textAnswer": null
}
```

---

### 8.10 복수 선택 채점 규칙

`MULTIPLE_CHOICE`는 선택한 값 목록과 정답 목록이 정확히 일치해야 정답이다.

정답 설정:

```json
{
  "questionId": 2,
  "questionType": "MULTIPLE_CHOICE",
  "correctAnswers": [
    "LONG",
    "MFA"
  ]
}
```

다음 답안은 정답이다.

```json
{
  "questionId": 2,
  "selectedValues": [
    "LONG",
    "MFA"
  ],
  "textAnswer": null
}
```

순서가 달라도 같은 값이면 정답으로 처리한다.

```json
{
  "questionId": 2,
  "selectedValues": [
    "MFA",
    "LONG"
  ],
  "textAnswer": null
}
```

정답 외 항목을 하나라도 추가로 선택하면 오답이다.

```json
{
  "questionId": 2,
  "selectedValues": [
    "LONG",
    "MFA",
    "REUSE"
  ],
  "textAnswer": null
}
```

---

### 8.11 점수 계산 방식

기본 점수 계산은 채점 대상 문항에 동일한 배점을 적용한다.

```text
점수 =
정답 문항 수
÷ 채점 대상 문항 수
× 100
```

예를 들어 채점 대상 문항이 3개인 경우:

| 정답 수 | 점수 |
|---:|---:|
| 0 | 0 |
| 1 | 33.33 |
| 2 | 66.67 |
| 3 | 100 |

소수점은 둘째 자리까지 반올림하는 것을 권장한다.

```text
66.6666...
→ 66.67
```

문항별 배점을 다르게 적용할 필요가 있다면 추후 `scoreWeight` 필드를 추가할 수 있다.

---

### 8.12 통과 판정

계산된 점수가 `passingScore` 이상이면 통과로 처리한다.

```text
score >= passingScore
```

예시:

```text
score = 80
passingScore = 80
→ 통과
```

```text
score = 79.99
passingScore = 80
→ 미통과
```

---

### 8.13 기본값

| 필드명 | 기본값 |
|---|---|
| quizTitle | null |
| description | null |
| passingScore | 0 |
| questions | 빈 배열 |
| question.description | null |
| question.required | false |
| question.scored | false |
| question.options | 빈 배열 |

개발용 로컬 채점에서만 사용하는 값:

| 필드명 | 기본값 |
|---|---|
| question.correctAnswers | 빈 배열 |

---

### 8.14 검증 규칙

- `questions`는 null이 아닌 배열이어야 한다.
- `questionId`는 동일 퀴즈 안에서 중복되지 않아야 한다.
- `questionId`는 0보다 커야 한다.
- `title`은 null 또는 빈 문자열을 허용하지 않는다.
- `questionType`은 정의된 값만 사용한다.
- `passingScore`는 0에서 100 사이여야 한다.
- `SINGLE_CHOICE`와 `MULTIPLE_CHOICE`는 최소 한 개 이상의 `options`가 있어야 한다.
- 동일 문항 안에서 `option.value`는 중복되지 않아야 한다.
- `scored`가 `true`인 문항은 서버에 정답이 등록되어 있어야 한다.
- `TEXT` 문항은 `scored`를 `false`로 설정하는 것을 권장한다.
- 채점 대상 문항이 한 개도 없으면 퀴즈를 실행하지 않고 설정 오류로 처리하는 것을 권장한다.
- 운영 환경의 조회 응답에는 `correctAnswers`를 포함하지 않는다.
- 개발용 로컬 채점에서는 `correctAnswers`가 최소 한 개 이상 있어야 한다.
- `correctAnswers`의 값은 해당 문항의 `option.value`에 존재해야 한다.

---

### 8.15 최소 JSON 예시

```json
{
  "popupId": 1005,
  "popupType": "QUIZ",
  "title": "간단 평가",
  "content": {
    "passingScore": 100,
    "questions": [
      {
        "questionId": 1,
        "title": "올바른 항목을 선택해주세요.",
        "questionType": "SINGLE_CHOICE",
        "required": true,
        "scored": true,
        "options": [
          {
            "value": "A",
            "text": "항목 A"
          },
          {
            "value": "B",
            "text": "항목 B"
          }
        ]
      }
    ]
  }
}
```

---

### 8.16 퀴즈 답안 제출 요청 JSON

사용자가 채점 버튼을 누르고 필수 문항 검증을 통과했을 때 서버에 전송한다.

```json
{
  "popupId": 1005,
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "submittedAt": "2026-07-27T15:00:00+09:00",
  "answers": [
    {
      "questionId": 1,
      "selectedValues": [
        "PHONE"
      ],
      "textAnswer": null
    },
    {
      "questionId": 2,
      "selectedValues": [
        "LONG",
        "MFA"
      ],
      "textAnswer": null
    },
    {
      "questionId": 3,
      "selectedValues": [
        "REPORT"
      ],
      "textAnswer": null
    },
    {
      "questionId": 4,
      "selectedValues": [],
      "textAnswer": "교육 내용이 이해하기 쉬웠습니다."
    }
  ]
}
```

---

### 8.17 퀴즈 답안 제출 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| popupId | number | Y | 퀴즈 팝업 식별자 | 1005 |
| userId | string | Y | 응시 사용자 식별자 | USER001 |
| sessionId | string | Y | 팝업 실행 및 응시 단위 식별자 | UUID |
| submittedAt | string | Y | 답안 제출 일시 | ISO-8601 |
| answers | array | Y | 문항별 사용자 답안 | `[]` |

`answers`의 세부 형식은 `SURVEY` 응답 제출 규격과 동일하다.

---

### 8.18 서버 채점 응답 JSON

```json
{
  "success": true,
  "popupId": 1005,
  "submissionId": 60001,
  "score": 100,
  "passingScore": 80,
  "passed": true,
  "correctCount": 3,
  "scoredQuestionCount": 3,
  "submittedAt": "2026-07-27T15:00:01+09:00",
  "message": "평가를 통과했습니다."
}
```

---

### 8.19 서버 채점 응답 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| success | boolean | Y | 답안 저장 및 채점 성공 여부 | true |
| popupId | number | Y | 퀴즈 팝업 식별자 | 1005 |
| submissionId | number | N | 서버에서 생성한 응시 식별자 | 60001 |
| score | number | Y | 계산된 점수 | 100 |
| passingScore | number | Y | 적용된 통과 점수 | 80 |
| passed | boolean | Y | 통과 여부 | true |
| correctCount | number | N | 정답 문항 수 | 3 |
| scoredQuestionCount | number | N | 전체 채점 대상 문항 수 | 3 |
| submittedAt | string | N | 서버 처리 완료 일시 | ISO-8601 |
| message | string | N | 사용자 안내 메시지 | 평가를 통과했습니다. |

---

### 8.20 미통과 응답 JSON

```json
{
  "success": true,
  "popupId": 1005,
  "submissionId": 60002,
  "score": 66.67,
  "passingScore": 80,
  "passed": false,
  "correctCount": 2,
  "scoredQuestionCount": 3,
  "submittedAt": "2026-07-27T15:05:01+09:00",
  "message": "통과 점수에 미달했습니다."
}
```

`success`는 서버 요청과 저장 및 채점 처리가 정상적으로 완료됐는지를 뜻한다.

따라서 평가에 통과하지 못했더라도 서버 처리가 정상적이면 다음과 같이 반환한다.

```json
{
  "success": true,
  "passed": false
}
```

---

### 8.21 클라이언트 처리 권장 흐름

```text
채점 버튼 클릭
→ 필수 문항 검증
→ 답안 서버 전송
→ 서버 채점 결과 수신
```

통과한 경우:

```text
passed = true
→ 통과 메시지 표시
→ 제출 완료 처리
→ 팝업 닫기
```

미통과한 경우:

```text
passed = false
→ 점수 및 미달 메시지 표시
→ 팝업 유지
→ 사용자가 답안을 다시 확인
```

서버 처리에 실패한 경우:

```text
success = false
→ 오류 메시지 표시
→ 팝업 유지
→ 재시도 가능
```

재응시 허용 여부와 최대 응시 횟수는 백엔드 정책으로 별도 정의할 수 있다.

## 9. 공통 오류 응답

팝업 조회, 설문 제출, 퀴즈 채점, 영상 로그 저장 등의 요청이 실패했을 때 사용하는 공통 오류 응답 형식이다.

### 9.1 오류 응답 JSON 예시

```json
{
  "success": false,
  "errorCode": "INVALID_REQUEST",
  "message": "요청 데이터가 올바르지 않습니다.",
  "fieldErrors": [
    {
      "field": "content.questions[0].questionType",
      "reason": "지원하지 않는 문항 유형입니다."
    }
  ],
  "occurredAt": "2026-07-27T15:30:00+09:00"
}
```

### 9.2 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| success | boolean | Y | 요청 처리 성공 여부 | false |
| errorCode | string | Y | 오류 구분 코드 | INVALID_REQUEST |
| message | string | Y | 사용자 또는 클라이언트용 오류 설명 | 요청 데이터가 올바르지 않습니다. |
| fieldErrors | array | N | 필드 단위 검증 오류 목록 | `[]` |
| occurredAt | string | N | 서버에서 오류가 발생한 시각 | ISO-8601 |

### 9.3 fieldErrors 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| field | string | Y | 오류가 발생한 JSON 필드 경로 | content.questions[0].questionType |
| reason | string | Y | 해당 필드가 잘못된 이유 | 지원하지 않는 문항 유형입니다. |

### 9.4 errorCode

| 값 | 설명 |
|---|---|
| INVALID_REQUEST | 요청 JSON 형식 또는 필드 값이 올바르지 않음 |
| POPUP_NOT_FOUND | 요청한 팝업을 찾을 수 없음 |
| POPUP_INACTIVE | 비활성화되었거나 노출 기간이 지난 팝업 |
| POPUP_TYPE_NOT_SUPPORTED | 지원하지 않는 팝업 유형 |
| INVALID_CONTENT | 팝업 유형별 content 데이터가 올바르지 않음 |
| REQUIRED_ANSWER_MISSING | 필수 설문 또는 퀴즈 문항 미응답 |
| INVALID_ANSWER | 제출한 답안 값이 문항 보기와 일치하지 않음 |
| SUBMISSION_ALREADY_COMPLETED | 이미 제출이 완료된 설문 또는 퀴즈 |
| ATTEMPT_LIMIT_EXCEEDED | 허용된 퀴즈 응시 횟수 초과 |
| VIDEO_NOT_FOUND | 영상 파일 또는 URL을 찾을 수 없음 |
| VIDEO_LOG_SAVE_FAILED | 영상 시청 로그 저장 실패 |
| SUBMISSION_SAVE_FAILED | 설문 또는 퀴즈 응답 저장 실패 |
| INTERNAL_SERVER_ERROR | 서버 내부 오류 |

### 9.5 팝업을 찾을 수 없는 경우

```json
{
  "success": false,
  "errorCode": "POPUP_NOT_FOUND",
  "message": "요청한 팝업을 찾을 수 없습니다.",
  "fieldErrors": [],
  "occurredAt": "2026-07-27T15:31:00+09:00"
}
```

### 9.6 필수 문항 미응답

```json
{
  "success": false,
  "errorCode": "REQUIRED_ANSWER_MISSING",
  "message": "필수 문항에 응답해주세요.",
  "fieldErrors": [
    {
      "field": "answers[1]",
      "reason": "questionId 2는 필수 문항입니다."
    }
  ],
  "occurredAt": "2026-07-27T15:32:00+09:00"
}
```

### 9.7 클라이언트 처리 권장 흐름

```text
success = false
→ errorCode 확인
→ 사용자 메시지 표시
→ 입력 오류라면 팝업 유지
→ 다시 제출 가능
```

다음 오류는 사용자가 수정 후 다시 시도할 수 있으므로 팝업을 유지하는 것을 권장한다.

- INVALID_REQUEST
- INVALID_CONTENT
- REQUIRED_ANSWER_MISSING
- INVALID_ANSWER
- SUBMISSION_SAVE_FAILED
- VIDEO_LOG_SAVE_FAILED

다음 오류는 팝업을 더 이상 진행할 수 없으므로 닫거나 오류 화면으로 전환할 수 있다.

- POPUP_NOT_FOUND
- POPUP_INACTIVE
- POPUP_TYPE_NOT_SUPPORTED
- VIDEO_NOT_FOUND

`INTERNAL_SERVER_ERROR`는 사용자에게 상세 예외 내용을 노출하지 않고 일반적인 오류 메시지만 표시한다.

```json
{
  "success": false,
  "errorCode": "INTERNAL_SERVER_ERROR",
  "message": "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
  "fieldErrors": [],
  "occurredAt": "2026-07-27T15:33:00+09:00"
}
```

서버의 Stack Trace, SQL, 파일 경로 등의 내부 정보는 응답 JSON에 포함하지 않는다.

## 10. API 엔드포인트 권장안

본 절은 WPF Popup 클라이언트와 백엔드 서버 사이에서 사용할 수 있는
REST API 엔드포인트 권장 구조를 정의한다.

실제 URL과 HTTP Method는 백엔드 프레임워크 및 사내 API 표준에 맞게 조정할 수 있다.

---

### 10.1 팝업 목록 조회

사용자에게 노출해야 하는 팝업 목록을 조회한다.

```http
GET /api/v1/popups
```

#### Query Parameter 예시

| 파라미터 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| userId | string | Y | 팝업 대상 사용자 식별자 | USER001 |
| clientType | string | N | 클라이언트 유형 | WPF |
| clientVersion | string | N | 클라이언트 버전 | 1.0.0 |

#### 요청 예시

```http
GET /api/v1/popups?userId=USER001&clientType=WPF&clientVersion=1.0.0
```

#### 응답 JSON 예시

```json
{
  "success": true,
  "popups": [
    {
      "popupId": 1001,
      "popupType": "TEXT",
      "title": "정보보안 안내",
      "width": 700,
      "height": 600,
      "showHeader": true,
      "showCloseButton": true,
      "showFooter": true,
      "showDoNotShowAgain": false,
      "content": {
        "contentTitle": "정보보안 정책 변경 안내",
        "description": "변경된 정책 내용을 확인해주세요.",
        "sections": [
          {
            "sectionId": 1,
            "sectionType": "BODY",
            "text": "비밀번호 변경 주기가 변경됩니다.",
            "emphasized": false
          }
        ]
      }
    }
  ]
}
```

---

### 10.2 팝업 단건 조회

특정 팝업의 상세 내용을 조회한다.

```http
GET /api/v1/popups/{popupId}
```

#### 요청 예시

```http
GET /api/v1/popups/1001
```

#### 응답 JSON 예시

```json
{
  "success": true,
  "popup": {
    "popupId": 1001,
    "popupType": "TEXT",
    "title": "정보보안 안내",
    "width": 700,
    "height": 600,
    "showHeader": true,
    "showCloseButton": true,
    "showFooter": true,
    "showDoNotShowAgain": false,
    "content": {
      "contentTitle": "정보보안 정책 변경 안내",
      "description": "변경된 정책 내용을 확인해주세요.",
      "sections": []
    }
  }
}
```

---

### 10.3 팝업 노출 로그 저장

팝업이 사용자 화면에 실제로 표시됐을 때 호출한다.

```http
POST /api/v1/popups/{popupId}/open
```

#### 요청 JSON 예시

```json
{
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "openedAt": "2026-07-27T16:00:00+09:00",
  "clientType": "WPF",
  "clientVersion": "1.0.0"
}
```

#### 응답 JSON 예시

```json
{
  "success": true,
  "popupId": 1001,
  "message": "팝업 노출 로그가 저장되었습니다."
}
```

---

### 10.4 팝업 닫기 로그 저장

사용자가 팝업을 닫았을 때 호출한다.

```http
POST /api/v1/popups/{popupId}/close
```

#### 요청 JSON 예시

```json
{
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "closedAt": "2026-07-27T16:03:00+09:00",
  "closeReason": "USER_CLOSE"
}
```

#### closeReason

| 값 | 설명 |
|---|---|
| USER_CLOSE | 사용자가 닫기 버튼으로 종료 |
| SUBMITTED | 설문 또는 퀴즈 제출 완료 후 종료 |
| COMPLETED | 영상 시청 완료 후 종료 |
| DO_NOT_SHOW_AGAIN | 다시 보지 않기 선택 후 종료 |
| WINDOW_CLOSED | 운영체제 또는 창 닫기 동작 |
| ERROR | 오류로 인해 팝업 종료 |

---

### 10.5 다시 보지 않기 저장

사용자가 다시 보지 않기를 선택했을 때 호출한다.

```http
POST /api/v1/popups/{popupId}/suppress
```

#### 요청 JSON 예시

```json
{
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "suppressedAt": "2026-07-27T16:03:00+09:00",
  "suppressType": "DAYS",
  "suppressDays": 30
}
```

#### suppressType

| 값 | 설명 |
|---|---|
| DAYS | 지정 일수 동안 다시 표시하지 않음 |
| PERMANENT | 영구적으로 다시 표시하지 않음 |
| UNTIL_DATE | 지정 날짜까지 다시 표시하지 않음 |

`UNTIL_DATE`를 사용할 경우 다음처럼 전달할 수 있다.

```json
{
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "suppressedAt": "2026-07-27T16:03:00+09:00",
  "suppressType": "UNTIL_DATE",
  "suppressUntil": "2026-08-26T23:59:59+09:00"
}
```

---

### 10.6 설문 제출

일반 설문 응답을 저장한다.

```http
POST /api/v1/popups/{popupId}/survey-submissions
```

#### 요청 JSON 예시

```json
{
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "submittedAt": "2026-07-27T16:10:00+09:00",
  "answers": [
    {
      "questionId": 1,
      "selectedValues": [
        "5"
      ],
      "textAnswer": null
    },
    {
      "questionId": 2,
      "selectedValues": [
        "EMAIL"
      ],
      "textAnswer": null
    }
  ]
}
```

#### 응답 JSON 예시

```json
{
  "success": true,
  "popupId": 1004,
  "submissionId": 50001,
  "submittedAt": "2026-07-27T16:10:01+09:00",
  "message": "설문이 정상적으로 제출되었습니다."
}
```

---

### 10.7 퀴즈 제출 및 채점

퀴즈 답안을 저장하고 서버에서 채점한다.

```http
POST /api/v1/popups/{popupId}/quiz-submissions
```

#### 요청 JSON 예시

```json
{
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "submittedAt": "2026-07-27T16:20:00+09:00",
  "answers": [
    {
      "questionId": 1,
      "selectedValues": [
        "PHONE"
      ],
      "textAnswer": null
    },
    {
      "questionId": 2,
      "selectedValues": [
        "LONG",
        "MFA"
      ],
      "textAnswer": null
    }
  ]
}
```

#### 응답 JSON 예시

```json
{
  "success": true,
  "popupId": 1005,
  "submissionId": 60001,
  "score": 100,
  "passingScore": 80,
  "passed": true,
  "correctCount": 2,
  "scoredQuestionCount": 2,
  "submittedAt": "2026-07-27T16:20:01+09:00",
  "message": "평가를 통과했습니다."
}
```

---

### 10.8 영상 이벤트 로그 저장

영상 재생, 일시정지, 위치 이동, 음량 변경 등의 로그를 저장한다.

```http
POST /api/v1/popups/{popupId}/video-events
```

#### 요청 JSON 예시

```json
{
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "eventType": "SEEK",
  "eventAt": "2026-07-27T16:30:00+09:00",
  "positionSeconds": 125.4,
  "durationSeconds": 600,
  "playbackSpeed": 1.0,
  "volume": 0.7,
  "muted": false,
  "completed": false
}
```

#### 응답 JSON 예시

```json
{
  "success": true,
  "popupId": 1003,
  "message": "영상 이벤트 로그가 저장되었습니다."
}
```

---

### 10.9 영상 완료 처리

영상 완료 조건을 충족했을 때 호출한다.

```http
POST /api/v1/popups/{popupId}/video-completions
```

#### 요청 JSON 예시

```json
{
  "userId": "USER001",
  "sessionId": "9fd37eab-6f87-4cc6-8627-9909559b4db1",
  "completedAt": "2026-07-27T16:40:00+09:00",
  "completionType": "WATCH_RATIO",
  "watchRatio": 0.95,
  "watchedSeconds": 570,
  "durationSeconds": 600
}
```

#### 응답 JSON 예시

```json
{
  "success": true,
  "popupId": 1003,
  "completed": true,
  "completedAt": "2026-07-27T16:40:01+09:00",
  "message": "영상 시청이 완료 처리되었습니다."
}
```

---

### 10.10 사용자별 팝업 상태 조회

특정 사용자의 팝업 제출, 완료 및 다시 보지 않기 상태를 조회한다.

```http
GET /api/v1/users/{userId}/popup-statuses
```

#### 응답 JSON 예시

```json
{
  "success": true,
  "userId": "USER001",
  "popupStatuses": [
    {
      "popupId": 1001,
      "opened": true,
      "submitted": false,
      "completed": false,
      "suppressed": true,
      "suppressUntil": "2026-08-26T23:59:59+09:00"
    },
    {
      "popupId": 1005,
      "opened": true,
      "submitted": true,
      "completed": true,
      "suppressed": false,
      "suppressUntil": null
    }
  ]
}
```

---

### 10.11 HTTP 상태 코드 권장안

| HTTP 상태 코드 | 사용 상황 |
|---:|---|
| 200 | 조회, 제출, 채점 및 로그 저장 성공 |
| 201 | 제출 데이터 또는 완료 데이터 신규 생성 |
| 400 | 요청 JSON 형식 또는 필드 검증 실패 |
| 401 | 인증 정보가 없거나 유효하지 않음 |
| 403 | 해당 팝업에 접근 권한이 없음 |
| 404 | 팝업 또는 영상 정보를 찾을 수 없음 |
| 409 | 이미 제출 완료, 중복 처리 또는 응시 횟수 초과 |
| 410 | 팝업 노출 기간이 종료됨 |
| 500 | 서버 내부 오류 |

### 10.12 인증 정보

`userId`를 요청 Body나 Query Parameter에 직접 전달할 수 있지만,
운영 환경에서는 인증 토큰 또는 로그인 세션에서 사용자 정보를 확인하는 것을 권장한다.

권장 Header 예시:

```http
Authorization: Bearer {accessToken}
Content-Type: application/json
```

인증 토큰에서 사용자 식별자를 확인할 수 있다면 요청 JSON의 `userId`는 생략할 수 있다.

### 10.13 멱등성 처리

설문 제출, 퀴즈 제출 및 영상 완료 API의 중복 호출을 방지하려면
`sessionId` 또는 별도의 `requestId`를 멱등성 키로 사용할 수 있다.

```http
Idempotency-Key: 9fd37eab-6f87-4cc6-8627-9909559b4db1
```

동일한 멱등성 키로 요청이 반복되면 서버는 중복 저장하지 않고
기존 처리 결과를 반환하는 방식을 권장한다.

### 10.14 API 처리 권장 흐름

```text
클라이언트 실행
→ 사용자 대상 팝업 목록 조회
→ 팝업 유형별 화면 생성
→ 팝업 노출 로그 저장
→ 사용자 상호작용 처리
→ 제출, 채점 또는 영상 완료 저장
→ 서버 처리 성공 확인
→ 팝업 닫기
```

팝업 목록 조회가 실패한 경우에는 전체 프로그램을 종료하기보다
오류 로그를 남기고 팝업 표시만 건너뛰는 방식을 권장한다.

## 11. Enum 전체 요약

본 절은 팝업 JSON에서 사용하는 문자열 상수 값을 한곳에 정리한다.

백엔드와 WPF 클라이언트는 아래 값을 대소문자까지 동일하게 사용한다.

---

### 11.1 popupType

| 값 | 설명 |
|---|---|
| TEXT | 텍스트 안내 팝업 |
| IMAGE | 이미지 팝업 |
| VIDEO | 동영상 팝업 |
| SURVEY | 일반 설문 팝업 |
| QUIZ | 채점형 퀴즈 팝업 |

예시:

```json
{
  "popupType": "VIDEO"
}
```

---

### 11.2 sectionType

TEXT 팝업의 텍스트 영역 유형이다.

| 값 | 설명 |
|---|---|
| TITLE | 섹션 제목 |
| BODY | 일반 본문 |
| CARD | 테두리 또는 강조 스타일이 적용되는 문구 |

예시:

```json
{
  "sectionType": "CARD"
}
```

---

### 11.3 stretchMode

IMAGE 팝업의 이미지 크기 조정 방식이다.

| 값 | 설명 |
|---|---|
| NONE | 이미지 원본 크기를 유지 |
| FILL | 영역 전체를 채움. 원본 비율이 변형될 수 있음 |
| UNIFORM | 원본 비율을 유지하면서 영역 안에 전체 이미지 표시 |
| UNIFORM_TO_FILL | 원본 비율을 유지하면서 영역을 채움. 일부가 잘릴 수 있음 |

권장 기본값:

```json
{
  "stretchMode": "UNIFORM"
}
```

---

### 11.4 videoSourceType

VIDEO 팝업의 영상 소스 유형이다.

| 값 | 설명 |
|---|---|
| LOCAL_FILE | 클라이언트 로컬 영상 파일 |
| DIRECT_URL | 직접 재생할 수 있는 HTTP 또는 HTTPS 영상 URL |
| YOUTUBE | YouTube 영상 URL |

예시:

```json
{
  "videoSourceType": "DIRECT_URL"
}
```

---

### 11.5 completionType

영상 시청 완료 판정 방식이다.

| 값 | 설명 |
|---|---|
| NONE | 완료 여부를 판단하지 않음 |
| MEDIA_ENDED | 영상이 끝까지 재생되면 완료 |
| WATCH_RATIO | 지정된 비율 이상 시청하면 완료 |
| WATCH_SECONDS | 지정된 누적 시간 이상 시청하면 완료 |

예시:

```json
{
  "completionType": "WATCH_RATIO",
  "requiredWatchRatio": 0.9
}
```

---

### 11.6 video eventType

영상 팝업에서 발생하는 사용자 행동 로그 유형이다.

| 값 | 설명 |
|---|---|
| OPEN | 영상 팝업 열림 |
| PLAY | 영상 재생 |
| PAUSE | 영상 일시정지 |
| SEEK | 영상 위치 이동 |
| VOLUME_CHANGE | 음량 변경 |
| MUTE | 음소거 |
| UNMUTE | 음소거 해제 |
| SPEED_CHANGE | 재생 속도 변경 |
| FULLSCREEN_ENTER | 전체화면 진입 |
| FULLSCREEN_EXIT | 전체화면 종료 |
| ENDED | 영상 재생 종료 |
| COMPLETE | 시청 완료 조건 충족 |
| CLOSE | 영상 팝업 닫힘 |
| ERROR | 영상 로드 또는 재생 오류 |

예시:

```json
{
  "eventType": "SEEK"
}
```

---

### 11.7 questionType

SURVEY와 QUIZ에서 사용하는 문항 유형이다.

| 값 | 설명 |
|---|---|
| RATING5 | 1점부터 5점까지 선택하는 평가 문항 |
| SINGLE_CHOICE | 보기 중 하나만 선택하는 문항 |
| MULTIPLE_CHOICE | 보기 중 여러 개를 선택하는 문항 |
| TEXT | 사용자가 직접 문자열을 입력하는 주관식 문항 |

예시:

```json
{
  "questionType": "MULTIPLE_CHOICE"
}
```

---

### 11.8 closeReason

팝업 닫기 로그에서 사용하는 종료 사유다.

| 값 | 설명 |
|---|---|
| USER_CLOSE | 사용자가 닫기 버튼으로 종료 |
| SUBMITTED | 설문 또는 퀴즈 제출 완료 후 종료 |
| COMPLETED | 영상 시청 완료 후 종료 |
| DO_NOT_SHOW_AGAIN | 다시 보지 않기 선택 후 종료 |
| WINDOW_CLOSED | 운영체제 또는 창 닫기 동작 |
| ERROR | 오류로 인해 종료 |

예시:

```json
{
  "closeReason": "SUBMITTED"
}
```

---

### 11.9 suppressType

다시 보지 않기 적용 방식이다.

| 값 | 설명 |
|---|---|
| DAYS | 지정된 일수 동안 다시 표시하지 않음 |
| UNTIL_DATE | 지정 일시까지 다시 표시하지 않음 |
| PERMANENT | 영구적으로 다시 표시하지 않음 |

일수 기준 예시:

```json
{
  "suppressType": "DAYS",
  "suppressDays": 30
}
```

날짜 기준 예시:

```json
{
  "suppressType": "UNTIL_DATE",
  "suppressUntil": "2026-08-26T23:59:59+09:00"
}
```

---

### 11.10 errorCode

공통 오류 응답에서 사용하는 오류 코드다.

| 값 | 설명 |
|---|---|
| INVALID_REQUEST | 요청 JSON 형식 또는 값이 올바르지 않음 |
| POPUP_NOT_FOUND | 요청한 팝업을 찾을 수 없음 |
| POPUP_INACTIVE | 비활성화되었거나 노출 기간이 종료된 팝업 |
| POPUP_TYPE_NOT_SUPPORTED | 지원하지 않는 팝업 유형 |
| INVALID_CONTENT | 팝업 유형별 content 데이터 오류 |
| REQUIRED_ANSWER_MISSING | 필수 설문 또는 퀴즈 문항 미응답 |
| INVALID_ANSWER | 제출 답안이 문항 보기와 일치하지 않음 |
| SUBMISSION_ALREADY_COMPLETED | 이미 제출 완료된 설문 또는 퀴즈 |
| ATTEMPT_LIMIT_EXCEEDED | 허용된 퀴즈 응시 횟수 초과 |
| VIDEO_NOT_FOUND | 영상 파일 또는 URL을 찾을 수 없음 |
| VIDEO_LOG_SAVE_FAILED | 영상 시청 로그 저장 실패 |
| SUBMISSION_SAVE_FAILED | 설문 또는 퀴즈 응답 저장 실패 |
| INTERNAL_SERVER_ERROR | 서버 내부 오류 |

예시:

```json
{
  "success": false,
  "errorCode": "REQUIRED_ANSWER_MISSING",
  "message": "필수 문항에 응답해주세요."
}
```

---

### 11.11 문자열 상수 사용 규칙

Enum 값은 다음 규칙을 따른다.

- 모두 영문 대문자를 사용한다.
- 여러 단어는 언더스코어로 구분한다.
- 화면 표시용 한글 문구와 서버 전송 값은 분리한다.
- 백엔드와 클라이언트에서 임의로 값을 변환하지 않는다.
- 정의되지 않은 값은 기본값으로 조용히 처리하지 않고 오류로 처리하는 것을 권장한다.

잘못된 예시:

```json
{
  "popupType": "Video",
  "questionType": "multipleChoice"
}
```

올바른 예시:

```json
{
  "popupType": "VIDEO",
  "questionType": "MULTIPLE_CHOICE"
}
```

---

## 12. 최종 데이터 처리 흐름

### 12.1 팝업 조회 및 표시

```text
WPF 클라이언트 실행
→ 사용자 인증 정보 확인
→ 사용자 대상 팝업 목록 조회
→ popupType 확인
→ 유형별 content JSON 역직렬화
→ 유형별 UserControl 생성
→ PopupOptions 생성
→ PopupWindow 표시
→ OPEN 로그 저장
```

### 12.2 일반 팝업 종료

```text
사용자 닫기
→ 다시 보지 않기 선택 여부 확인
→ 필요한 경우 suppress API 호출
→ CLOSE 로그 저장
→ 팝업 종료
```

### 12.3 설문 제출

```text
사용자 제출 버튼 클릭
→ 필수 문항 클라이언트 검증
→ 답안 JSON 생성
→ 설문 제출 API 호출
→ 서버 필수 문항 재검증
→ 응답 저장
→ 성공 응답 반환
→ 클라이언트 완료 메시지 표시
→ 팝업 종료
```

### 12.4 퀴즈 제출

```text
사용자 채점 버튼 클릭
→ 필수 문항 클라이언트 검증
→ 답안 JSON 생성
→ 퀴즈 제출 API 호출
→ 서버 답안 검증
→ 서버 정답 비교
→ 점수 계산
→ 통과 여부 판정
→ 결과 응답 반환
```

통과한 경우:

```text
passed = true
→ 통과 메시지 표시
→ 완료 처리
→ 팝업 종료
```

미통과한 경우:

```text
passed = false
→ 점수와 미달 메시지 표시
→ 팝업 유지
→ 재응시 정책에 따라 다시 제출
```

### 12.5 영상 시청

```text
영상 팝업 열림
→ OPEN 로그
→ 영상 로드
→ PLAY, PAUSE, SEEK 등의 이벤트 기록
→ 완료 조건 확인
→ 완료 조건 충족 시 COMPLETE 처리
→ 팝업 종료 시 CLOSE 로그
```

### 12.6 서버와 클라이언트의 검증 책임

클라이언트 검증:

- 필수 입력 여부
- JSON 역직렬화 가능 여부
- 지원하는 팝업 및 문항 유형 여부
- URL 및 숫자 범위의 기본 검증
- 사용자에게 즉시 안내할 수 있는 화면 검증

서버 검증:

- 사용자 권한
- 팝업 활성 기간
- 팝업 대상 사용자 여부
- 문항과 보기의 실제 존재 여부
- 설문 및 퀴즈 중복 제출 여부
- 퀴즈 정답 비교와 최종 점수
- 영상 완료 조건
- 데이터 저장 정합성

클라이언트 검증 결과만 신뢰하지 않고 서버에서 반드시 다시 검증한다.

---

## 13. 버전 관리

팝업 JSON 규격이 변경될 가능성이 있으므로 API 또는 응답 데이터에 버전을 포함하는 것을 권장한다.

### 13.1 응답에 schemaVersion 포함

```json
{
  "schemaVersion": "1.0",
  "popupId": 1001,
  "popupType": "TEXT",
  "title": "정보보안 안내",
  "content": {}
}
```

### 13.2 schemaVersion 필드 정의

| 필드명 | 자료형 | 필수 | 설명 | 예시 |
|---|---|:---:|---|---|
| schemaVersion | string | N | 팝업 JSON Mapping 규격 버전 | 1.0 |

### 13.3 버전 변경 기준

하위 호환이 가능한 변경:

- 선택 필드 추가
- 새로운 Enum 값 추가
- 기존 필드 설명 보완
- 기본값 추가

하위 호환이 어려운 변경:

- 필드명 변경
- 필드 자료형 변경
- 필수 여부 변경
- 기존 Enum 값 삭제 또는 의미 변경
- JSON 계층 구조 변경

하위 호환이 어려운 변경은 `schemaVersion`의 주요 버전을 변경하는 것을 권장한다.

예시:

```text
1.0
→ 선택 필드 추가
→ 1.1

1.1
→ content 구조 변경
→ 2.0
```

---

## 14. 문서 변경 이력

| 버전 | 일자 | 변경 내용 | 작성자 |
|---|---|---|---|
| 1.0 | 2026-07-27 | 최초 Popup JSON Mapping 작성 | 작성자명 |

문서가 변경되면 다음 항목을 함께 기록한다.

- 변경 버전
- 변경 일자
- 변경 필드
- 변경 사유
- 클라이언트 영향도
- 백엔드 영향도