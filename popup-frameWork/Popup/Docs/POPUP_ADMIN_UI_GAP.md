# 팝업 관리자 화면 기능 Gap 정리

## 1. 목적

이 문서는 최신 `master` 기준으로 다음 세 층을 비교해 관리자 화면에 추가하거나 정리해야 할 기능을 기록한다.

```text
관리자 Web
↕
Java API / PostgreSQL
↕
WPF Client
```

단순히 필드가 존재하는지만 보지 않고, 실제로 사용자가 화면에서 설정할 수 있는지와 WPF에서 기능이 동작하는지까지 구분한다.

상태 표기:

- `P0`: 값 불일치로 실제 동작 오류 가능. 우선 수정
- `P1`: 기능은 구현되어 있으나 관리자 화면에서 사용할 수 없음
- `P2`: 모델/필드는 있으나 런타임 연결이 일부 빠짐
- `VERIFY`: 화면에는 있으나 실제 WPF View 동작 확인 필요

---

## 2. P0 - 화면 비율 크기 모드 값 불일치

### 현재 상태

관리자 Web 도메인과 zero-rule-server는 다음 값을 사용한다.

```text
RATIO
```

반면 WPF `PopupFactory.ConvertPopupSizeMode()`는 다음 값을 요구한다.

```text
VIEWPORT_RATIO
```

WPF 허용값:

```text
FIXED
VIEWPORT_RATIO
FULLSCREEN
AUTO
```

zero-rule-server 허용값:

```text
FIXED
RATIO
FULLSCREEN
```

### 영향

관리자 화면에서 `화면 비율`을 저장해 서버가 `RATIO`를 그대로 WPF에 내려주면 WPF에서 지원하지 않는 크기 방식 예외가 발생할 수 있다.

### 필요한 작업

권장 방향은 API 계약값을 하나로 통일하는 것이다.

```text
VIEWPORT_RATIO
```

기준으로 통일할 경우:

1. `zero-rule-web/sub/domain/src/model/PopupAdmin.ts`
2. `PopupEditorDialog.tsx`
3. `PopupPreview.tsx`
4. zero-rule-server `SIZE_MODES`
5. DB 기존 `RATIO` 데이터 마이그레이션 여부

를 함께 점검한다.

반대로 `RATIO`를 표준으로 결정하면 WPF `PopupFactory`가 `RATIO`도 허용하도록 수정해야 한다.

---

## 3. P1 - SURVEY/QUIZ 5점 평가(RATING5) 관리자 입력 추가

### WPF 구현 상태

WPF에는 이미 다음 기능이 있다.

- `SurveyQuestionType.Rating5`
- `SurveyQuestionDto.QuestionType = "RATING5"` 처리
- `PopupFactory`의 `RATING5` 변환
- `SurveyPopupView.CreateRating5Control()`
- 1~5점 RadioButton UI
- SurveyAnswer에 Rating5 값 저장 구조

즉 **WPF DTO에도 이미 `RATING5`를 받을 수 있는 구조가 있다.**

### 현재 빠진 부분

관리자 `PopupQuestionEditor.tsx` 문항 유형 선택지는 현재 다음 세 개뿐이다.

```text
SINGLE_CHOICE
MULTIPLE_CHOICE
TEXT
```

`RATING5`가 없다.

### 필요한 화면 기능

문항 유형 ComboBox에 추가:

```text
5점 평가 (RATING5)
```

RATING5 선택 시 일반 선택지 추가 UI는 숨기고 1~5 값이 고정이라는 점을 사용자에게 안내하는 편이 좋다.

### 추가 검증 필요

서버 저장/채점 로직이 RATING5를 일반 단일 선택형처럼 처리할지, SURVEY 전용으로만 허용할지 정책을 결정해야 한다.

QUIZ에서 RATING5를 허용할 경우 정답/배점 처리 기준도 정의해야 한다.

---

## 4. P1/P2 - AUTO 창 크기 관리자 선택 추가

### WPF 구현 상태

WPF `PopupSizeMode`에는 이미 다음 값이 있다.

```csharp
Fixed
ViewportRatio
Fullscreen
Auto
```

`PopupWindow.ApplyWindowSize()`도 Auto 분기를 갖는다.

### 현재 빠진 부분

관리자 Web의 `PopupSizeMode` 타입:

```text
FIXED | RATIO | FULLSCREEN
```

관리자 화면 ComboBox에도 AUTO가 없다.
zero-rule-server의 허용 크기 모드에도 AUTO가 없다.

### 필요한 작업

UI만 추가하면 끝나지 않는다.

1. Web `PopupSizeMode`에 AUTO 추가
2. 관리자 크기 모드 ComboBox에 `콘텐츠 자동 크기` 추가
3. Preview의 AUTO 표현 추가
4. zero-rule-server 허용 목록 추가
5. DB 값 허용 여부 검증
6. WPF 최소/최대 크기 동작 확인

따라서 `P1` 기능이지만 서버까지 함께 수정해야 하므로 `P2` 성격도 가진다.

---

## 5. P1/P2 - 다시 보지 않기 기간(hideDays) 설정

### 현재 상태

다음 계층에는 `hideDays`가 이미 존재한다.

- Web `AdminPopupDetail.hideDays`
- Java DTO/Entity
- DB `hide_days`
- 숨김 API Request의 `hideDays`

하지만 관리자 등록/수정 화면에는 숨김 일수 입력란이 없다.

또한 WPF `PopupWindow.SaveDoNotShowAgainAsync()`는 현재 다음 값으로 고정한다.

```text
30일
```

즉 서버에서 `hideDays`를 내려줘도 WPF PopupWindow가 그 값을 사용하지 않는다.

### 필요한 작업

1. 관리자 화면에서 `다시 보지 않기` 활성화 시 `숨김 일수` 입력 표시
2. 기본값 30일 정의
3. 서버 validation 범위와 동일하게 제한
4. `PopupResponseDto.HideDays` → `PopupOptions` 매핑 추가
5. `PopupWindow`의 `const int hideDays = 30` 제거
6. 실제 팝업별 설정값을 Hide API에 전달

### 권장 UI

```text
[다시 보지 않기 ON]
숨김 기간: [30] 일
```

`showFooter=false`인 경우 현재처럼 다시 보지 않기 옵션도 비활성화한다.

---

## 6. P2 - periodMode / 반복 노출 설정 화면

### 모델/DB 존재 필드

현재 다음 필드는 Web 모델, Java DTO/Entity, DB에 존재한다.

- `periodMode`
- `repeatInterval`
- `repeatDayOfWeek`
- `repeatDayOfMonth`

### 현재 관리자 화면

`PopupEditorDialog`에는 노출 시작/종료 시각만 있고 위 반복 정책을 설정하는 UI가 없다.

### 런타임 상태

현재 사용자 팝업 조회는 기본적으로 `display_start_at` ~ `display_end_at` 기간과 사용자 숨김 상태를 중심으로 동작한다.

반복 관련 필드는 저장/조회 구조에는 존재하지만 실제 반복 주기에 따라 재노출 여부를 계산하는 정책이 완성됐는지 별도 확인이 필요하다.

### 필요한 작업

정책부터 확정해야 한다.

예시:

```text
FIXED
DAILY
WEEKLY
MONTHLY
INTERVAL
```

그 후:

- periodMode 선택
- 반복 간격
- 요일
- 매월 일자
- 마지막 노출 이력과 재노출 계산

을 서버 조회 정책과 함께 구현한다.

UI만 먼저 추가하면 사용자는 설정했는데 실제 노출에는 반영되지 않는 상태가 될 수 있으므로 서버 정책 구현 후 노출하는 것을 권장한다.

---

## 7. VERIFY - VIDEO 확장 옵션 실제 View 연결 확인

관리자 화면에는 다음 옵션이 이미 있다.

- 영상 설명 표시
- 컨트롤 표시
- 전체화면 허용
- 배속 변경 허용
- 자동 재생
- 반복 재생
- 기본 음량
- 완료 비율
- 완료 전 닫기 허용

`VideoPopupContentDto`에도 대응 필드가 존재한다.

하지만 현재 `PopupFactory.CreateVideoPopupView()` 생성자 전달값은 주로 다음 값이다.

```text
videoTitle
videoUrl/videoPath
description
showDescription
```

따라서 아래 옵션은 관리자 화면에 있어도 실제 `VideoPopupView`까지 값이 전달되는지 확인 및 연결이 필요하다.

```text
showControls
allowFullScreen
allowPlaybackRateChange
autoPlay
isLoop
defaultVolume
```

반면 다음 두 값은 PopupOptions/PopupWindow와 서버 진행률 기능에서 실제 사용되고 있다.

```text
completionRatio
allowCloseBeforeComplete
```

### 필요한 작업

`VideoPopupView` 생성자 또는 별도 옵션 모델로 확장 옵션을 전달하고 각 UI/MediaElement 동작에 실제 반영되는지 테스트한다.

---

## 8. VERIFY - SURVEY validateRequiredQuestions

`SurveyPopupContentDto`에는 다음 필드가 있다.

```text
validateRequiredQuestions
```

하지만 실제 필수 응답 검사는 현재 각 문항의 `isRequired`를 중심으로 구현되어 있다.

관리자가 전체 필수검증 정책을 끄고 켤 기능이 필요하다면:

1. 관리자 화면 스위치 추가
2. DTO/Factory/View 연결
3. `isRequired`와의 우선순위 정의

가 필요하다.

정책이 필요 없다면 해당 필드는 제거/비노출하는 편이 문서와 코드의 혼란을 줄인다.

---

## 9. 관리자 화면과 WPF 지원 기능 비교

| 기능 | WPF | 관리자 UI | 서버/모델 | 조치 |
|---|:---:|:---:|:---:|---|
| TEXT 일반 텍스트 | O | O | O | 없음 |
| TEXT 좌/우 카드 | O | O | O | 없음 |
| TEXT 강조/하단 설명 | O | O | O | 없음 |
| TEXT Markdown | O | O | O | 없음 |
| IMAGE FIT_TO_IMAGE | O | O | O | 없음 |
| IMAGE ADAPTIVE | O | O | O | 없음 |
| IMAGE FILL | O | O | O | 없음 |
| VIDEO 기본 재생 | O | O | O | 없음 |
| VIDEO 완료 비율 | O | O | O | 없음 |
| VIDEO 완료 전 닫기 제한 | O | O | O | 없음 |
| VIDEO 확장 제어 옵션 | 부분 확인 | O | O | View 연결 검증 |
| SURVEY 단일 선택 | O | O | O | 없음 |
| SURVEY 복수 선택 | O | O | O | 없음 |
| SURVEY 주관식 | O | O | O | 없음 |
| SURVEY RATING5 | O | X | 구조 존재 | UI 추가 |
| QUIZ 배점/정답 | O | O | O | 없음 |
| QUIZ 통과 점수 | O | O | O | 없음 |
| FIXED 크기 | O | O | O | 없음 |
| 화면 비율 크기 | O | O | O | 문자열 계약 통일 필요 |
| FULLSCREEN | O | O | O | 없음 |
| AUTO 크기 | O | X | server X | Web/Server 추가 |
| 숨김 기간 지정 | API O | X | O | WPF + UI 연결 |
| 반복 노출 정책 | DTO만 | X | 필드 O | 정책 구현 후 UI 추가 |

---

## 10. 권장 작업 순서

1. **P0 - `RATIO` / `VIEWPORT_RATIO` 계약 통일**
2. **P1 - SURVEY `RATING5` 관리자 문항 유형 추가**
3. **VERIFY - VIDEO 옵션이 실제 View까지 전달되는지 정리**
4. **P1/P2 - hideDays를 실제 팝업 설정값으로 연결**
5. **P1/P2 - AUTO 크기 모드 Web/Server 지원 추가**
6. **P2 - period/repeat 정책 확정 후 관리자 화면 추가**
7. 필요 시 `validateRequiredQuestions` 정책화 또는 제거

각 항목은 관리자 미리보기와 실제 WPF 화면을 동시에 비교해 완료 여부를 판단한다.
