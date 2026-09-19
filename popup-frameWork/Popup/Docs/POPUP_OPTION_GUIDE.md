# WPF 팝업 옵션 및 연동 가이드

## 1. 문서 목적

이 문서는 관리자 화면, Java API, PostgreSQL, WPF 클라이언트가 공유하는 팝업 옵션과 실제 호출 기능을 최신 `master` 소스 기준으로 정리한다.

사용자·운영자가 화면에서 어떤 값을 선택하는지에 대한 설명은 `POPUP_USER_OPTION_GUIDE.md`를 참고한다.
관리자 화면에 아직 노출되지 않았거나 계층 간 값이 불일치하는 항목은 `POPUP_ADMIN_UI_GAP.md`를 참고한다.

지원 팝업 유형은 다음과 같다.

| popupType | 설명 |
|---|---|
| `TEXT` | 일반 텍스트, 카드, 강조 문구, Markdown 안내 |
| `IMAGE` | 이미지, 설명, 링크 |
| `VIDEO` | 동영상, 재생 제어, 시청 완료 판정 |
| `SURVEY` | 객관식/주관식/평점 설문 |
| `QUIZ` | 정답, 배점, 통과 점수가 있는 퀴즈 |

전체 흐름은 다음과 같다.

```text
관리자 화면
→ Java 관리자 API
→ PostgreSQL
→ Java 사용자 팝업 API
→ WPF PopupResponseDto
→ PopupService / PopupFactory
→ PopupOptions + 타입별 View
→ PopupManager
→ PopupWindow
→ 사용자 동작
→ Java 이벤트/응답/진행률 API
→ PostgreSQL
```

---

## 2. 공통 팝업 옵션

### 2.1 식별 및 표시 옵션

| JSON/DTO 옵션 | 기본/예시 | 실제 용도 |
|---|---|---|
| `popupId` | `NOTICE_001` | 팝업 고유 ID. 숨김, 상태, 응답, 이벤트의 기준 키 |
| `popupType` | `TEXT` | `TEXT`, `IMAGE`, `VIDEO`, `SURVEY`, `QUIZ` |
| `title` | 문자열 | PopupWindow 공통 Header 제목 |
| `displayStartAt` | 일시 | 노출 시작 시각 |
| `displayEndAt` | 일시 | 노출 종료 시각 |
| `displayMode` | `SEQUENTIAL` | 같은 우선순위 그룹 안의 표시 방식 |
| `displayOrder` | `100` | 숫자가 작을수록 먼저 표시. 같은 숫자는 한 표시 그룹 |
| `showHeader` | `true` | 공통 Header 표시 |
| `showCloseButton` | `true` | 닫기 버튼 표시. Header가 없으면 상단 X도 표시되지 않음 |
| `showFooter` | `true` | Footer 표시 |
| `showDoNotShowAgain` | `false` | 다시 보지 않기 체크박스 표시. Footer가 있어야 화면에 보임 |

### 2.2 표시 방식

| 값 | 동작 |
|---|---|
| `SEQUENTIAL` | 같은 `displayOrder` 그룹에서도 한 개씩 차례로 표시 |
| `SIMULTANEOUS` | 같은 `displayOrder` 그룹의 팝업을 동시에 표시 |

`displayOrder` 그룹이 끝난 뒤 다음 순서 그룹으로 넘어간다.

### 2.3 창 크기 옵션

WPF 런타임 `PopupSizeMode`는 다음 네 가지를 가진다.

| WPF 값 | API 문자열 | 동작 |
|---|---|---|
| `Fixed` | `FIXED` | `width`, `height` 사용 |
| `ViewportRatio` | `VIEWPORT_RATIO` | 모니터 작업영역 × `widthRatio`, `heightRatio` |
| `Fullscreen` | `FULLSCREEN` | 대상 모니터 전체 영역 사용 |
| `Auto` | `AUTO` | 콘텐츠 크기에 맞춘 뒤 최소/최대 범위 적용 |

공통 크기 필드는 다음과 같다.

| 옵션 | 설명 |
|---|---|
| `width`, `height` | FIXED 모드의 창 크기 |
| `widthRatio`, `heightRatio` | VIEWPORT_RATIO 모드 비율 |
| `minimumWidth`, `minimumHeight` | 최소 창 크기 |
| `maximumWidth`, `maximumHeight` | 최대 창 크기 |

> 주의: 현재 관리자 웹/zero-rule-server는 `RATIO`를 사용하고 WPF `PopupFactory`는 `VIEWPORT_RATIO`를 받는다. 이 불일치는 `POPUP_ADMIN_UI_GAP.md`의 최우선 정리 항목이다.

---

## 3. 기간·반복·숨김·완료 정책 필드

`PopupResponseDto` 및 관리자 모델에는 다음 정책 값이 존재한다.

| 옵션 | 설명 | 현재 런타임 반영 상태 |
|---|---|---|
| `periodMode` | 기간/반복 정책 종류 | DTO/DB에 존재. 사용자 조회에서 반복 정책 전체가 적용되는지 별도 검증 필요 |
| `repeatInterval` | 반복 간격 | DTO/DB에 존재 |
| `repeatDayOfWeek` | 반복 요일 | DTO/DB에 존재 |
| `repeatDayOfMonth` | 반복 일자 | DTO/DB에 존재 |
| `hideDays` | 다시 보지 않기 숨김 일수 | 서버 필드 존재. 현재 WPF PopupWindow는 30일을 상수로 호출 |
| `completionRatio` | VIDEO 완료 인정 비율 | 실제 VIDEO 완료 판정/닫기 제한에 사용 |
| `passingScore` | QUIZ 통과 점수 | 서버 채점 및 화면 입력에 사용 |
| `allowCloseBeforeComplete` | VIDEO 완료 전 닫기 허용 | PopupWindow 닫기 차단에 사용 |

---

## 4. TEXT 팝업

`TextPopupContentDto`의 실제 content 항목이다.

| 옵션 | 형식 | 설명 |
|---|---|---|
| `contentTitle` | string | 콘텐츠 내부 제목 |
| `description` | string | 콘텐츠 제목 아래 설명 |
| `showContentHeader` | bool | 콘텐츠 제목/설명 영역 사용 여부 |
| `plainText` | string | 일반 텍스트 본문 |
| `showPlainText` | bool | 일반 텍스트 영역 사용 여부 |
| `highlightText` | string | 강조 문구 |
| `showHighlight` | bool/null | 강조 영역 표시 여부 |
| `bottomDescription` | string | 본문 하단 설명 |
| `bottomDescriptionUrl` | string | 하단 설명 클릭 시 열 HTTP/HTTPS URL. 비우면 일반 설명. 호버 시 색상·밑줄 변경 |
| `showBottomDescription` | bool/null | 하단 설명 표시 여부 |
| `markdownMode` | bool/null | Markdown 렌더링 모드 |
| `markdownContent` | string | Markdown 본문 |

Markdown 모드에서는 일반 텍스트/강조 영역 대신 Markdown 본문을 중심으로 사용한다. 하단 설명과 연결 URL은 Markdown 모드에서도 표시한다.

---

## 5. IMAGE 팝업

`ImagePopupContentDto` 기준 항목이다.

| 옵션 | 형식 | 설명 |
|---|---|---|
| `imageTitle` | string | 이미지 콘텐츠 제목 |
| `imageUrl` | string | 이미지 URL 또는 로컬 경로 |
| `description` | string | 이미지 설명 |
| `showDescription` | bool | 설명 표시 여부 |
| `imageSizeMode` | string | 이미지 표시 방식 |
| `imageWidth` | number | 요청 이미지 너비 |
| `imageHeight` | number | 요청 이미지 높이 |
| `linkUrl` | string | 이미지 클릭 시 이동 URL |

현재 관리자 화면에는 다음 이미지 모드가 노출된다.

| 관리자 값 | 설명 | WPF 처리 |
|---|---|---|
| `FIXED` | 고정 영역 | 기존 Adaptive 처리로 변환 |
| `FIT_TO_IMAGE` | 원본 크기/비율에 맞춤 | `FitToImage` |
| `ADAPTIVE` | 화면/형태에 맞춤 | `Adaptive` |
| `FILL` | 이미지만 꽉 채움 | 전용 `ImageFillPopupView` 사용 |

---

## 6. VIDEO 팝업

`VideoPopupContentDto`와 PopupOptions를 합쳐 실제 사용 옵션을 정리한다.

| 옵션 | 기본값 | 설명 | 실제 연결 상태 |
|---|---:|---|---|
| `videoTitle` | 빈 문자열 | 콘텐츠 제목 | 사용 |
| `videoUrl` | 빈 문자열 | 영상 URL/경로 | 사용 |
| `description` | 빈 문자열 | 영상 설명 | 사용 |
| `showDescription` | `true` | 설명 표시 | 사용 |
| `showControls` | `true` | 컨트롤 표시 | DTO/관리자 값 존재. View 실제 강제 여부는 변경 시 함께 검증 필요 |
| `allowFullScreen` | `true` | 영상 자체 전체화면 허용 | DTO/관리자 값 존재. View 실제 연결 여부 검증 필요 |
| `allowPlaybackRateChange` | `true` | 배속 변경 허용 | DTO/관리자 값 존재. View 실제 연결 여부 검증 필요 |
| `autoPlay` | `false` | 자동 재생 | DTO/관리자 값 존재. View 실제 연결 여부 검증 필요 |
| `isLoop` | `false` | 반복 재생 | DTO/관리자 값 존재. View 실제 연결 여부 검증 필요 |
| `defaultVolume` | `0.7` | 기본 음량 0~1 | DTO/관리자 값 존재. View 실제 연결 여부 검증 필요 |
| `completionRatio` | `0.9` 계열 | 완료 인정 비율 | 진행률 API/닫기 제한에 사용 |
| `allowCloseBeforeComplete` | `true` | 완료 전 닫기 허용 | PopupWindow에서 사용 |

영상 진행률은 현재 위치만 보내는 것이 아니라 `durationSeconds`, `positionSeconds`, `maximumPositionSeconds`, `watchedSeconds`를 서버에 전송하고 서버 응답의 `completed`를 최종 완료 상태로 사용한다.

---

## 7. SURVEY / QUIZ 팝업

두 유형은 공통 `SurveyPopupView`를 사용한다.

### 7.1 콘텐츠 옵션

| 옵션 | 설명 |
|---|---|
| `surveyTitle` | 설문/퀴즈 콘텐츠 제목 |
| `description` | 설명 |
| `questions` | 문항 목록 |
| `passingScore` | 퀴즈 통과 점수. 일반 설문에서는 사용하지 않음 |
| `validateRequiredQuestions` | 필수 응답 정책용 필드. 현재 실제 검증은 문항별 `isRequired` 중심 |

### 7.2 문항 옵션

`SurveyQuestionDto`/모델은 다음 유형을 처리한다.

| questionType | UI 형태 | WPF 지원 |
|---|---|---|
| `RATING5` | 1~5점 RadioButton | O |
| `SINGLE_CHOICE` | 단일 선택 RadioButton | O |
| `MULTIPLE_CHOICE` | 복수 선택 CheckBox | O |
| `TEXT` | 주관식 TextBox | O |

문항 공통 필드는 `questionId`, `title`, `description`, `questionType`, `isRequired`, `isScored`, `questionScore`, 정답/선택지 관련 값이다.

현재 관리자 `PopupQuestionEditor`의 선택 목록에는 `RATING5`가 없으므로 UI에서 신규 구성할 수 없다. WPF DTO/Factory/View 자체는 이미 처리한다.

### 7.3 QUIZ

QUIZ는 다음 기능이 추가된다.

- 문항별 배점
- 선택형 정답 지정
- 주관식 정답 및 비교 방식
- 총점 계산
- 통과 점수 입력
- 응답 서버 제출
- 서버 결과를 최종 점수/통과 결과로 사용

---

## 8. 실제 WPF API 호출 목록

`PopupApiService`에서 실제 호출하는 사용자용 API이다.

| 메서드 | HTTP | 경로 | 기능 |
|---|---|---|---|
| `GetAvailablePopupsAsync` | GET | `/api/popups?userId={userId}` | 현재 사용자에게 노출 가능한 팝업 조회 |
| `GetPopupStatusesAsync` | GET | `/api/popups/statuses?userId={userId}` | 사용자별 표시/완료/숨김 상태 조회 |
| `HidePopupAsync` | POST | `/api/popups/{popupId}/hide` | 다시 보지 않기 저장 |
| `SubmitResponseAsync` | POST | `/api/popups/{popupId}/responses` | SURVEY/QUIZ 답안 제출 |
| `SaveVideoProgressAsync` | POST | `/api/popups/{popupId}/video-progress` | VIDEO 진행률/완료 판정 |
| `RecordPopupEventAsync` | POST | `/api/popups/{popupId}/events` | `DISPLAYED`, `CLOSED` 이벤트 저장 |

### 8.1 조회 흐름

```text
MainWindow
→ GetAvailablePopupsAsync
→ GetPopupStatusesAsync
→ 완료 팝업 및 현재 실행에서 이미 연 팝업 제외
→ PopupService.CreatePopupOptions
→ PopupManager.ShowRange
```

### 8.2 팝업 표시/닫기 이벤트

PopupOptions에는 UI와 API를 느슨하게 연결하기 위한 콜백이 들어간다.

- `PopupDisplayedAsync` → `DISPLAYED`
- `PopupClosedAsync` → `CLOSED`
- `HidePopupAsync` → 숨김 API
- `SubmitSurveyAsync` → 설문/퀴즈 응답 API
- `SaveVideoProgressAsync` → 영상 진행률 API

PopupWindow와 각 View는 서버 주소나 사용자 ID를 직접 알지 않고 이 콜백을 호출한다.

---

## 9. 다시 보지 않기

현재 실제 동작은 다음과 같다.

```text
showFooter = true
AND showDoNotShowAgain = true
→ 체크박스 표시
→ 사용자가 체크 후 닫기
→ PopupWindow.SaveDoNotShowAgainAsync
→ HidePopupAsync
→ POST /api/popups/{popupId}/hide
```

현재 PopupWindow는 숨김 기간을 `30`일 상수로 전달한다. `hideDays` 필드는 서버/DTO에 존재하지만 WPF 창에서 아직 이 값을 사용하지 않는다.

---

## 10. 표시 완료 및 중복 방지

WPF는 한 번 조회한 팝업 ID를 `_shownPopupIds`로 기억해 같은 실행 중 주기 조회에서 동일 팝업을 다시 열지 않는다.

또한 서버 `statuses` 조회 결과에서 `completed=true`인 팝업은 재표시 대상에서 제외한다.

숨김 상태는 사용자 팝업 조회 SQL에서도 제외된다.

---

## 11. 관리자 화면과 런타임의 현재 차이

문서를 사용하는 개발자는 아래 항목을 반드시 확인한다.

1. 관리자 웹/zero-rule-server의 크기 비율 값은 `RATIO`, WPF는 `VIEWPORT_RATIO`를 기대한다.
2. WPF에는 `AUTO` 크기 모드가 있으나 관리자 웹/zero-rule-server 허용 목록에는 없다.
3. `RATING5`는 WPF에서 구현되어 있으나 관리자 문항 유형 선택 목록에 없다.
4. `hideDays`는 모델/서버 필드가 있으나 관리자 입력이 없고 WPF는 30일 고정이다.
5. `periodMode`, 반복 관련 필드는 모델/DB에 있으나 관리자 입력 UI와 실제 반복 노출 정책 적용 범위를 추가 검증해야 한다.
6. VIDEO의 여러 확장 옵션은 DTO/관리자 화면에는 있으나 실제 Video View 연결 여부를 옵션별로 확인해야 한다.

세부 작업 후보와 우선순위는 `POPUP_ADMIN_UI_GAP.md`에서 관리한다.
