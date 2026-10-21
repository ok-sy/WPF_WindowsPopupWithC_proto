# WPF 팝업 옵션 및 연동 가이드

## 1. 문서 목적

이 문서는 관리자 화면, zero-rule-server(Oracle), WPF 클라이언트가 공유하는 팝업 옵션과 실제 호출 기능을 최신 `main` 소스 기준으로 정리한다.

관리자 화면에서 어떤 값을 선택하는지에 대한 설명은 [`POPUP_USER_OPTION_GUIDE.md`](POPUP_USER_OPTION_GUIDE.md)를 참고한다.
계층 간 값이 다르거나 아직 정하지 않은 항목(WPF 전용 `AUTO` 크기 모드, 기간·반복 정책 등)은 [`design/09_전환계획_및_미결사항.md`](design/09_전환계획_및_미결사항.md)에서 관리한다.

기능 범위는 [최소 기능 정의서](interfaces/WPF_POPUP_MINIMAL_SPEC.md)와 [전체 기능 정의서](interfaces/WPF_POPUP_ALL_SPEC.md)를 함께 관리한다.

지원 팝업 유형은 다음과 같다.

| popupType | 설명 |
|---|---|
| `TEXT` | 일반 텍스트·서식 본문(textBlocks), 강조 문구 |
| `IMAGE` | 이미지, 제목·설명(ORIGINAL은 이미지만). 이미지 클릭 링크는 계약 3.7에서 삭제 |
| `VIDEO` | 동영상, 재생 제어, 시청 완료 판정 |
| `SURVEY` | 객관식/주관식 설문 |
| `QUIZ` | 정답, 배점, 통과 점수가 있는 퀴즈. `content.videoEnabled=true`이면 동영상+퀴즈 |

전체 흐름은 다음과 같다.

```text
관리자 화면
→ 관리자 API
→ Oracle
→ WPF 단건 조회 API(팝업 1건 + deliveryId)
→ WPF PopupResponseDto
→ PopupService / PopupFactory
→ PopupOptions + 타입별 View
→ PopupManager
→ PopupWindow
→ 사용자 동작
→ WPF 결과 수신 API(결과 1건, 응답 nextStatus)
→ Oracle
```

---

## 2. 공통 팝업 옵션

### 2.1 식별 및 표시 옵션

| JSON/DTO 옵션 | 기본/예시 | 실제 용도 |
|---|---|---|
| `popupId` | `NOTICE_001` | 팝업 고유 ID. 숨김, 상태, 응답, 이벤트의 기준 키 |
| `popupType` | `TEXT` | `TEXT`, `IMAGE`, `VIDEO`, `SURVEY`, `QUIZ` |
| `title` | 문자열 | PopupWindow 공통 Header 제목 |
| `displayMode` | `SEQUENTIAL` | 같은 우선순위 그룹 안의 표시 방식. WPF 조회가 1건씩이라 서버 팝업의 동시 표시는 일어나지 않음(2.2) |
| `displayOrder` | `100` | 관리자 표시 순서. 숫자가 작을수록 먼저 표시. 서버가 이 순서(같으면 생성 시각·ID 순)로 첫 1건을 골라 내려주며 WPF 조회 응답에는 싣지 않음(설계 35) |
| `showHeader` | `true` | 공통 Header 표시 |
| `showFooterButton` | `true` | Footer 버튼 표시(닫기·제출·바로가기). Header에는 고정 로고 표시 |
| `showFooter` | `true` | Footer 표시 |
| `showDoNotShowAgain` | `false` | 다시 보지 않기 체크박스 표시. Footer가 있어야 화면에 보임 |
| `showLater` | `false` | 나중에 보기 버튼 표시(모든 유형, TODO52-2). Footer가 있어야 화면에 보임. 누르면 결과 LATER로 닫히고 다음 조회 주기에 다시 표시(9.1) |
| `footerAction` | `CLOSE` | Footer 버튼 동작. `CLOSE`(닫기) / `LINK_AND_CLOSE`(바로가기) / `SUBMIT`(제출, SURVEY·QUIZ 고정). 생략·미지원 값은 유형별 기본값 |
| `footerLinkUrl` | 빈 문자열 | `LINK_AND_CLOSE`일 때 열 절대 HTTP/HTTPS URL |
| `useBackgroundOverlay` | `true` | 팝업 표시 중 배경 클릭 차단·어둡게 표시. 켜면 Alt+F4 등 키보드·외부 닫기를 막고 화면의 닫기·제출로만 닫힌다. 닫기·제출 수단이 화면에 없으면 막지 않는다(설계 44) |
| `backgroundOverlayOpacity` | `0.45` | 배경 어둡기 0~1(범위 밖 값은 보정) |
| `popupPosition` | `CENTER` | 주 모니터 작업 영역 기준 9방향 위치(`TOP_LEFT`~`BOTTOM_RIGHT`). 미지원 값은 `CENTER`. FULLSCREEN에서는 사용하지 않음 |
| `headerFontSize` / `bodyFontSize` / `footerFontSize` | 없음(null) | 영역별 글자 크기. 없으면 XAML 기본 크기, 값이 있으면 10~40으로 보정 |

> 위 표는 WPF 조회 응답(`popup` 최상위, `PopupResponseDto`) 기준이다. 단, `displayOrder`는 관리자 API·DB 값이며 WPF 응답에는 없다. 조회 응답의 `popup`에는 서버 발급 `deliveryId`가 함께 온다(설계 35). `displayStartAt`/`displayEndAt`은 WPF 응답에서 삭제했다(설계 29). 관리자 API·DB는 `footerAction`~`footerFontSize`를 `content`(CONTENT_OPTIONS)에 저장하고, 서버가 WPF 응답을 만들 때 최상위로 올린다(설계 30·31). 관리자 `showCloseButton`(라벨 "닫기 표시")은 WPF `showFooterButton`에 대응한다.

### 2.2 표시 방식

| 값 | 동작 |
|---|---|
| `SEQUENTIAL` | 한 개씩 차례로 표시 |
| `SIMULTANEOUS` | WPF `PopupManager`가 함께 받은 같은 순서 그룹의 팝업을 동시에 표시 |

[설계 35] WPF 조회 API는 서버가 `displayOrder` 순으로 고른 팝업 1건만 내려주고, 그 결과를 저장한 뒤 다음 1건을 조회한다. 따라서 API 모드에서는 서버 팝업이 항상 한 개씩 차례로 표시되며 `SIMULTANEOUS` 동시 표시는 일어나지 않는다. 값 자체는 계약에 남아 있다.

### 2.3 창 크기 옵션

WPF 런타임 `PopupSizeMode`는 다음 네 가지를 가진다.

| WPF 값 | API 문자열 | 동작 |
|---|---|---|
| `Fixed` | `FIXED` | `width`, `height` 사용 |
| `ViewportRatio` | `RATIO` | 모니터 작업영역 × `widthRatio`, `heightRatio` |
| `Fullscreen` | `FULLSCREEN` | 주 모니터 전체 영역 사용(주 모니터를 얻지 못하면 창이 있는 모니터) |
| `Auto` | `AUTO` | 콘텐츠 크기에 맞춘 뒤 최소/최대 범위 적용 |

공통 크기 필드는 다음과 같다.

| 옵션 | 설명 |
|---|---|
| `width`, `height` | FIXED 모드의 창 크기 |
| `widthRatio`, `heightRatio` | RATIO 모드 비율 |
| `minimumWidth`, `minimumHeight` | 최소 창 크기 |
| `maximumWidth`, `maximumHeight` | 최대 창 크기. IMAGE는 고정 상한을 사용하지 않고 작업 영역 90%로 계산 |

> 2026-09-28(설계 18 L-5 — C-24): API 문자열을 관리자 웹/zero-rule-server와 같은 `RATIO`로 단일화했다. `VIEWPORT_RATIO`는 더 이상 받지 않는다(내부 enum 이름 `ViewportRatio`는 유지).

---

## 3. 숨김·완료 정책 필드

조회 API는 서버에서 기간·대상·숨김·완료·재노출 유예 여부를 판정하고 표시 순서상 첫 1건만 내려준다. WPF가 실제로 받거나 사용하는 정책 값은 아래와 같다.

| 옵션 | 필수 여부 | Default | 설명 |
|---|---|---|---|
| `hideDays` | 선택 | 결과 생성 시 30일 | 다시 보지 않기 선택 시 HIDDEN 결과에 사용. 1~3650(관리자 저장 시 서버 검증) |
| `completionRatio` | VIDEO/동영상+퀴즈 | 1.0 | 누적 시청 완료 기준 0~1 |
| `passingScore` | QUIZ | 없음 | WPF 로컬 채점 통과 점수 |
| ~~`allowCloseBeforeComplete`~~ | - | - | 폐기(TODO57). VIDEO 닫기 버튼은 `completionRatio` 기준 전 항상 비활성(시청 %·기준 사유 표시), 동영상+퀴즈는 기준 전 입력·제출 잠금. Alt+F4 등 외부 닫기는 `useBackgroundOverlay`, 완료 전 연기는 `showLater`로 정한다 |

기간·반복 정책 자체는 서버 내부 책임이며 WPF 응답 DTO에는 별도 반복 정책 필드를 두지 않는다.

---

## 4. TEXT 팝업

`TextPopupContentDto`의 실제 content 항목이다.

| 옵션 | 형식 | 설명 |
|---|---|---|
| `plainText` | string | 일반 텍스트 본문. `textBlocks`가 있으면 서버가 서식 본문에서 만든 값 |
| `textBlocks` | array | 서식 본문(문단·Run). 관리자 서식 편집기가 만들며 있으면 본문 대신 표시. 콘텐츠 제목·설명도 앞 문단으로 포함. Run `strikethrough`(boolean, 누락 false)는 취소선이며 밑줄과 동시 적용 가능(TODO62). 문단 `indent`(0 이상 정수, 1단계 40, 단계 수 제한 없음·TODO63)는 문단 전체 왼쪽 들여쓰기(설계 49) |
| `showPlainText` | bool | 일반 텍스트 영역 사용 여부 |
| `highlightText` | string | 강조 문구 |
| `showHighlight` | bool | 강조 영역 표시 여부. 없으면 false |
| `bottomDescription` | string | 본문 하단 설명 |
| `bottomDescriptionUrl` | string | 하단 설명 클릭 시 열 HTTP/HTTPS URL. 비우면 일반 설명. 호버 시 색상·밑줄 변경 |
| `showBottomDescription` | bool | 하단 설명 표시 여부. 없으면 false |

> Markdown 모드(`markdownMode`/`markdownContent`)는 2026-09-21 제거했다. 값이 남아 있어도 WPF·웹 모두 무시한다.
>
> `contentTitle`·`description`·`showContentHeader`는 2026-10-13 제거했다(설계 37). 콘텐츠 제목·설명은 서식 본문 앞 문단으로 작성하며, 통합 전 데이터는 서버가 조회 시 제목 문단(`LEFT`, 굵게, 크기 24) → 설명 문단(`LEFT`) → 기존 본문 순으로 합쳐 보낸다(textBlocks가 없던 행은 기존 plainText 줄을 문단으로 바꿔 뒤에 붙임). 제목·설명을 숨겼던 행(`showContentHeader=false`)은 합치지 않는다. [설계 39-3] 제목·설명은 보이고 본문은 숨겼던 행(`showPlainText=false`)은 헤더만 보이기 — 제목·설명 문단만 보내고 숨긴 본문은 빼며 `showPlainText=true`로 보낸다(관리자 재저장 시 숨긴 본문 삭제).

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
| `keepAspectRatio` | bool | FIT_TO_IMAGE 비율 고정, 기본 true(콘텐츠 영역 안에 원본 비율로 맞춤). false는 영역을 채워 왜곡 허용 |
| (최상위) `width` / `height` | number | IMAGE 크기도 공통 한 쌍(TODO58). ADAPTIVE·ORIGINAL 팝업 창 전체, FIT_TO_IMAGE 이미지 콘텐츠 영역. content.width/height는 폐기 |

현재 관리자 화면에는 다음 이미지 모드가 노출된다.

| 관리자 값 | 설명 | WPF 처리 |
|---|---|---|
| `ORIGINAL` | 원본 픽셀 크기 유지, 왼쪽 위 배치, 넘치는 영역 자름 | 전용 원본 렌더링(스크롤/확대·축소 없음) |
| `FIT_TO_IMAGE` | 지정 콘텐츠 영역(없으면 원본)에 헤더·푸터·제목·설명을 더해 창 크기 재계산 | `FitToImage` |
| `ADAPTIVE` | 고정 팝업 영역 안에 비율 유지하여 맞춤 | `Adaptive` |

신규 관리자 등록 기본 선택은 `ADAPTIVE`이다. API 필드가 없으면 기존 호환을 위해 `ADAPTIVE`로 처리한다. 과거 값 `FIXED`는 지원하지 않는다.

---

### 비율 및 창 경계 (v3.6 / 설계 23)

- [TODO58] IMAGE의 크기는 모든 모드에서 최상위 width/height 한 쌍이다(content.width/height 폐기). ADAPTIVE·ORIGINAL은 팝업 창 전체, FIT_TO_IMAGE는 이미지 콘텐츠 영역이다. 일반 모드는 축별로 생략할 수 있다.
- ADAPTIVE: content 크기는 창 크기. 미지정 축은 원본 이미지와 실제 제목·설명·여백을 측정해 산정한다. 로딩 전 임시 창은 560×420 DIP이며, 명시한 축은 유지한다. 이미지는 원본보다 확대하지 않고 가용 영역 안에 비율을 유지해 표시한다.
- FIT_TO_IMAGE: 크기는 이미지 콘텐츠 영역 DIP 크기. keepAspectRatio 기본 true. 등록 화면에서 고정이면 한쪽 수정 시 다른 쪽을 원본 비율로 계산한다. 양쪽 API 값이 비율과 다르면 영역 안에 원본 비율로 맞추고 남는 쪽은 여백이다(TODO58 — 예전 너비 우선 정규화 대체).
- 해제(false)는 양쪽을 그대로 사용해 왜곡을 허용하며 누락한 축만 원본 DIP 길이로 채운다. 둘 다 없으면 원본 DIP 크기다. 서버는 원본 URL을 다운로드하지 않는다. 원본 로딩 후 WPF와 웹에서 계산한다.
- IMAGE 창 최대는 현재 모니터 작업 영역 너비·높이의 **90%**다. 고정 maximumWidth/maximumHeight 값(기본 1200×900)은 IMAGE 창 상한으로 사용하지 않는다. 최소는 이 화면 상한 이하로 보정하고, 최소로 늘어난 창에는 이미지 주변 여백을 허용한다. 지정한 크기는 유지하며 FIT_TO_IMAGE의 최대 초과 부분은 **중앙 기준**으로 자른다. ORIGINAL은 왼쪽 위 Clip을 유지한다. FULLSCREEN은 모니터 전체 크기를 우선한다. 다른 유형의 기존 최대 크기 정책은 유지한다.
- 설명은 항상 아래. showDescription=false 또는 공백이면 설명과 14 DIP 전용 간격을 제거한다. 설명은 가용 너비로 줄바꿈하고 하단 가용 콘텐츠 높이의 최대 30%에서 세로 스크롤한다. 제목·닫기·푸터는 이미지와 함께 스크롤하지 않는다.
- 크기 계산에는 이미지 Border, 제목·설명 실제 측정, 콘텐츠 Margin(28/24), 그림자용 바깥 Margin(24), 창 Border, 표시 중인 Header(40)·Footer(80) 행(창 Border·본문 테두리는 0)을 사용한다. 이미지와 무관한 190/300 높이 추정은 제거했다.
- WPF 원본 DIP는 파일 DPI를 반영한다. 브라우저 원본은 naturalWidth/naturalHeight CSS px이므로 파일 DPI·글꼴·작업 영역이 다른 PC와 미리보기 사이에는 차이가 생길 수 있다. ORIGINAL은 기존처럼 메타데이터 DPI와 무관하게 원본 1px=1 DIP, 왼쪽 위 기준으로 자른다.
- FILL, imageWidth/imageHeight, descriptionPosition, imageAreaRatio는 새 입력에서 제거했다. 서버 저장은 해당 키·모드와 중복 최상위 크기를 거절한다. 기존 DB는 조회 변환 또는 전환 계획 스크립트를 통해 새 계약으로 제공한다.

## 6. VIDEO 팝업

`VideoPopupContentDto`와 PopupOptions를 합쳐 실제 사용 옵션을 정리한다.

| 옵션 | 기본값 | 설명 | 실제 연결 상태 |
|---|---:|---|---|
| `videoTitle` | 빈 문자열 | 콘텐츠 제목 | 사용 |
| `videoUrl` | 빈 문자열 | 영상 URL/경로 | 사용 |
| `description` | 빈 문자열 | 영상 설명 | 사용 |
| `showDescription` | `true` | 설명 표시 | 사용 |
| `showControls` | `true` | 컨트롤 표시 | 사용 |
| `allowFullScreen` | `true` | 영상 자체 전체화면 허용 | 사용 |
| `allowPlaybackRateChange` | `true` | 배속 변경 허용 | 사용 |
| `allowSeek` | `true` | 재생 위치 변경(진행바 탐색) 허용 | 사용 |
| `autoPlay` | `false` | 자동 재생 | 사용 |
| `isLoop` | `false` | 반복 재생 | 사용 |
| `defaultVolume` | `0.7` | 시스템 볼륨 연결 전/실패 시 초기 음량 0~1. 연결 성공 시 현재 Windows 값 우선 | 사용 |
| `completionRatio` | `1.0` | 완료 인정 비율 | 누적 시청 기준/닫기 제한에 사용 |

로컬 MediaElement와 HTTP/HTTPS HTML5 영상은 영상 하단에 겹치는 WPF Overlay 컨트롤바를 사용한다. 재생 중 일반 화면 3초·영상 전체화면 2초 무입력·마우스 이탈 시 숨기고 진입·이동 시 표시하며 일시정지·조작 중에는 유지한다. URL 영상의 브라우저 기본 controls는 없으며 공통 재생·일시정지·탐색·배속·전체화면 옵션을 적용한다. 음량/음소거는 Windows Master Volume/Mute와 양방향 동기화하고 내부 영상 음량은 1.0으로 유지한다. `defaultVolume`은 시스템 연결 전/실패 시 초기 음량이며 시스템 연결 성공 시 현재 Windows 값으로 대체한다. Windows 볼륨 변경은 다른 앱에도 영향을 주며 종료 시 이전 값으로 복원하지 않는다. `showControls=false`이면 숨기고 영상 클릭으로 재생을 전환한다. `allowPlaybackRateChange=false`이면 HTML5도 1.0배로 제한하며 `allowFullScreen=false`이면 WPF 버튼과 진입을 제한한다. `allowSeek=false`이면 진행바 클릭·드래그·키보드·UI Automation으로 재생 위치를 바꿀 수 없고 HTML5 seek 명령도 무시한다. 진행률·현재/전체 시간 표시와 루프·종료 후 재시작은 유지하며 전체화면에서도 같은 정책을 적용한다. buffering/waiting/stalled는 중앙 Spinner로 표시한다.

영상 진행률은 결과 항목의 `video` 블록으로 `durationSeconds`, `positionSeconds`, `maximumPositionSeconds`, `watchedSeconds`를 전송한다. 동영상+퀴즈는 누적 시청 기준 충족 후 퀴즈·푸터가 활성화되고, 통과한 SUBMITTED 결과에 답안·점수·영상 정보를 함께 담는다.

---

## 7. SURVEY / QUIZ 팝업

두 유형은 공통 `SurveyPopupView`를 사용한다.

### 7.1 콘텐츠 옵션

| 옵션 | 설명 |
|---|---|
| `surveyTitle` | 설문/퀴즈 콘텐츠 제목 |
| `description` | 설명 |

문항 목록은 응답 최상위 `questions`, 퀴즈 통과 점수는 최상위 `passingScore`(QUIZ만)로 받는다. 서버는 2026-09-28(설계 18 L-3)부터 content에 `questions`·`passingScore`·`validateRequiredQuestions`를 싣지 않는다. 필수 응답 검사는 문항별 `isRequired` 기준이다.

### 7.2 문항 옵션

`SurveyQuestionDto`/모델은 다음 유형을 처리한다.

| questionType | UI 형태 | WPF 지원 |
|---|---|---|
| `RATING5` | 2026-09-28(설계 18 L-4) 삭제. 기존 문항은 08 스크립트로 `SINGLE_CHOICE` + 가로 배치로 이관 | X |
| `SINGLE_CHOICE` | 단일 선택 RadioButton | O |
| `MULTIPLE_CHOICE` | 복수 선택 CheckBox. QUIZ는 정답 수까지만 선택(TODO52-5) | O |
| `TEXT` | 주관식 TextBox | O |

문항 공통 필드는 `questionId`, `title`, `description`, `questionType`, `isRequired`, `isScored`, `questionScore`, 정답/선택지 관련 값이다.

선택지는 단일·복수 선택 문항에서 직접 입력한다. questions[].optionLayout은 VERTICAL(기본) / HORIZONTAL이며 각 문항에 개별 적용한다. 문항 템플릿 저장·조회에도 포함한다. 가로형은 영역 너비를 넘으면 다음 줄로 배치한다. RATING5는 제거됐으며, 이관된 기존 데이터는 SINGLE_CHOICE + HORIZONTAL 형태로 처리한다. 필드 계약은 [`interfaces/POPUP_INTERFACE_SPEC.md`](interfaces/POPUP_INTERFACE_SPEC.md) §9를 따른다.

### 7.3 QUIZ

QUIZ는 다음 기능이 추가된다.

- 문항별 배점
- 선택형 정답 지정
- 주관식 정답 및 비교 방식
- 총점 계산
- 통과 점수 입력
- 응답 서버 제출
- WPF 로컬 채점 및 통과 여부 판정
- `content.videoEnabled=true`인 경우 영상 시청 기준 충족 후 퀴즈 입력 활성화

---

## 8. 실제 WPF API 호출 목록

> **설계 18 L-0 (2026-09-28)** — 구 사용자용 API(`/api/popups?userId=`, `/hide`, `/responses`, `/video-progress`, `/events`, `/statuses`) 설명과 해당 `PopupApiService` 메서드는 삭제했다.
> WPF가 호출하는 API와 요청·응답 형식은 WPF Client API 계약서 v3.7 [`docs/interfaces/POPUP_INTERFACE_SPEC.md`](interfaces/POPUP_INTERFACE_SPEC.md)를 기준으로 한다.

WPF는 아래 3개 API만 호출한다. 사용자 ID는 보내지 않으며 서버가 인증 헤더로 사용자를 식별한다.

| 호출 위치 | HTTP | 경로 | 기능 |
|---|---|---|---|
| `WpfLoginClient.LoginAsync` | POST | `/api/wpf/auth/login` | 로그인(토큰 발급, SSO 프로토타입) |
| `PopupApiService.GetNextPopupAsync` | POST | `/api/wpf/popups` | 서버가 노출 판정·정렬을 끝낸 팝업 1건(`popup`, 없으면 null) + `deliveryId`·공통 옵션·content·문항 |
| `PopupApiService.PostResultAsync` | POST | `/api/wpf/popups/results` | 팝업 종료 시 결과 1건(CLOSED·HIDDEN·LATER·SUBMITTED·VIDEO_WATCHED, `deliveryId` 포함) 전송. 응답 `nextStatus`로 다음 조회 시점 결정. `PopupResultQueue`가 실패 시 보관·순서대로 재전송 |

---

## 9. 다시 보지 않기

```text
showFooter = true
AND showDoNotShowAgain = true
→ 체크박스 표시
→ 사용자가 체크 후 닫기
→ PopupWindow.RecordDoNotShowAgainChoice (체크 여부만 기록, 서버 호출 없음)
→ 창이 닫히면 HIDDEN 결과 항목(hideDays: 팝업 hideDays, 없으면 30) 생성
→ POST /api/wpf/popups/results
```

### 9.1 나중에 보기 (TODO52-2)

```text
showFooter = true
AND showLater = true
→ Footer에 "나중에 보기" 버튼 표시(모든 유형)
→ 사용자가 버튼 클릭(완료 기준 전·Background Overlay 중에도 가능, 완료 기준 전 유일한 화면 이탈 버튼 — TODO57)
→ PopupWindow가 LaterRequested 기록 후 닫기
→ 창이 닫히면 LATER 결과 항목 생성(다시 보지 않기 체크·영상 시청량보다 우선, hideDays·video 미포함)
→ POST /api/wpf/popups/results
→ 서버: 완료·숨김 없이 전달 건 유예(pollingIntervalSeconds) → 다음 조회 주기에 다시 표시
```

DB 컬럼은 `POPUP_NOTICE.SHOW_LATER_YN`(기본 'N')이며 기존 DB는 `db/oracle/16_popup_later_oracle.sql`을 서버 반영 전에 실행한다.

---

## 10. 표시 완료 및 중복 방지

기간·대상·숨김·완료·재노출 유예 판정은 서버가 조회 시 끝낸다(설계 35). TEXT·IMAGE 닫기(Footer 닫기·바로가기 포함)는 서버가 완료로 처리해 노출 기간 안에 다시 내려주지 않는다. 미완료로 끝난 SURVEY·QUIZ·VIDEO는 결과 저장 시각부터 `pollingIntervalSeconds` 동안 제외한 뒤 조건을 만족하면 다시 내려준다. WPF는 팝업 표시 중에 다른 조회를 하지 않으며, 이전의 실행 중 표시 ID 기억(`_shownPopupIds`)은 삭제했다.

---

## 11. 공통 푸터 동작

`footerAction`은 기본 `CLOSE`(닫기)이며, `LINK_AND_CLOSE`(바로가기)일 때 `footerLinkUrl`의 HTTP(S) 주소를 기본 브라우저로 연 뒤 팝업을 닫는다. 설문·퀴즈는 `SUBMIT`(제출) 고정이다. 관리자 저장은 content(CONTENT_OPTIONS)에 하지만 WPF 조회 응답에서는 `popup` 최상위 값이다(설계 30). 이 동작은 `showFooter`와 `showFooterButton`이 모두 켜져 Footer 버튼이 표시된 경우에만 화면에 나타난다.

---

## 12. 관리자 화면과 런타임의 현재 차이

문서를 사용하는 개발자는 아래 항목을 반드시 확인한다.

1. 크기 비율 값은 관리자 웹·서버·WPF 모두 `RATIO`다.
2. WPF에는 `AUTO` 크기 모드가 있으나 관리자 웹/zero-rule-server 허용 목록에는 없다.
3. RATING5 유형은 삭제했다(2026-09-28). 직접 입력한 단일 선택 보기와 가로·세로 배치를 사용한다.
4. `hideDays`는 관리자 입력 가능하며, 비우면 WPF가 HIDDEN 결과에 30일을 사용한다.
5. 기간·대상·숨김·완료·재노출 유예 판정과 표시 순서 정렬은 서버가 조회 시 끝내고 1건만 내려준다.
6. IMAGE ORIGINAL, 푸터 바로가기, 동영상+퀴즈는 최신 main에서 관리자·미리보기·WPF·서버 계약에 반영되어 있다.

남은 미결 항목(WPF 전용 `AUTO` 크기 모드 처리, 기간·반복 정책)은 [`design/09_전환계획_및_미결사항.md`](design/09_전환계획_및_미결사항.md)에서 관리한다.
