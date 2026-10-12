# 31. PopupWindow 공통 UI 옵션 최상위 계약 정리 TODO

## 1. 목적

현재 일부 PopupWindow 공통 UI 옵션이 `content` 내부의 `content_options_json`에서 전달된다.

예:

```json
{
  "content": {
    "useBackgroundOverlay": true,
    "backgroundOverlayOpacity": 0.45,
    "popupPosition": "CENTER",
    "headerFontSize": 16,
    "bodyFontSize": 14,
    "footerFontSize": 14
  }
}
```

하지만 이 값들은 TEXT/IMAGE/VIDEO/SURVEY/QUIZ 특정 콘텐츠의 속성이 아니라
**PopupWindow 전체에 공통으로 적용되는 표시 정책**이다.

따라서 API 응답에서는 `popups[]` 최상위 공통 필드로 이동한다.

기본 원칙:

```text
PopupWindow 전체에 영향을 주는 공통 정책
→ popups[] 최상위

popupType별 콘텐츠/표현 데이터
→ content
```

DB 저장 위치와 API 응답 위치는 동일할 필요가 없다.
기존 DB의 `content_options_json` 저장 구조는 유지할 수 있으며,
서버가 WPF 응답을 조립할 때 필요한 공통 옵션을 최상위로 승격한다.

---

## 2. 최상위 이동 대상

### 31-01. useBackgroundOverlay

현재:
- `content.useBackgroundOverlay`
- 기본값 `true`
- PopupFactory가 content에서 직접 읽어 `PopupOptions.UseBackgroundOverlay`에 설정

목표:
- `popups[].useBackgroundOverlay`
- PopupWindow 공통 배경 Overlay 사용 여부로 명확히 정의

### 31-02. backgroundOverlayOpacity

현재:
- `content.backgroundOverlayOpacity`
- 기본값 `0.45`
- 0.0~1.0 범위로 보정

목표:
- `popups[].backgroundOverlayOpacity`
- PopupWindow 공통 Overlay 불투명도로 정의

### 31-03. popupPosition

현재:
- `content.popupPosition`
- 기본값 `CENTER`
- PopupFactory가 content에서 읽어 PopupOptions.Position으로 변환

목표:
- `popups[].popupPosition`
- PopupWindow 배치 정책으로 최상위 이동

허용값:

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

### 31-04. headerFontSize

현재:
- `content.headerFontSize`
- 값이 없으면 XAML 기본값 사용
- PopupWindow에서 10~40 범위 보정

목표:
- `popups[].headerFontSize`

### 31-05. bodyFontSize

현재:
- `content.bodyFontSize`
- 타입별 View 본문에 공통 적용

목표:
- `popups[].bodyFontSize`

### 31-06. footerFontSize

현재:
- `content.footerFontSize`
- 공통 Footer UI에 적용

목표:
- `popups[].footerFontSize`

---

## 3. 목표 JSON 구조

변경 전:

```json
{
  "popupId": "IMAGE-001",
  "popupType": "IMAGE",
  "content": {
    "imageUrl": "https://example.com/image.png",
    "useBackgroundOverlay": true,
    "backgroundOverlayOpacity": 0.45,
    "popupPosition": "CENTER",
    "headerFontSize": 16,
    "bodyFontSize": 14,
    "footerFontSize": 14
  }
}
```

변경 후:

```json
{
  "popupId": "IMAGE-001",
  "popupType": "IMAGE",
  "useBackgroundOverlay": true,
  "backgroundOverlayOpacity": 0.45,
  "popupPosition": "CENTER",
  "headerFontSize": 16,
  "bodyFontSize": 14,
  "footerFontSize": 14,
  "content": {
    "imageUrl": "https://example.com/image.png"
  }
}
```

---

## 4. content에 남기는 값의 기준

`content`에는 popupType별 실제 콘텐츠 및 해당 콘텐츠 전용 표시/재생 옵션을 남긴다.

예:

### TEXT

- `plainText`
- `textBlocks`
- `contentTitle`
- `description`
- `highlightText`
- `showHighlight`
- `bottomDescription`

### IMAGE

- `imageUrl`
- `imageTitle`
- `description`
- `imageSizeMode`
- `width`
- `height`
- `keepAspectRatio`
- `linkUrl`

### VIDEO

- `videoUrl`
- `videoTitle`
- `description`
- `showControls`
- `allowFullScreen`
- `allowPlaybackRateChange`
- `allowSeek`
- `autoPlay`
- `isLoop`
- `defaultVolume`

### SURVEY / QUIZ

- `surveyTitle`
- `description`
- `videoEnabled`
- VIDEO+QUIZ일 때 영상 전용 content 값

문항은 기존 원칙대로 최상위 `questions[]`을 사용한다.

---

## 5. 30번 Footer Action TODO와의 관계

30번에서 다음 Footer 공통 동작을 최상위로 이동한다.

- `footerAction`
- `footerLinkUrl`

31번에서는 Footer 외 PopupWindow 공통 표시 옵션을 최상위로 이동한다.

따라서 최종 공통 구조는 다음 방향을 따른다.

```text
popups[]
├─ popupId / popupType / title
├─ displayMode / displayOrder
├─ sizeMode / width / height / ratio / min / max
├─ showHeader / showFooter / showFooterButton
├─ footerAction / footerLinkUrl              ← TODO 30
├─ useBackgroundOverlay                      ← TODO 31
├─ backgroundOverlayOpacity                  ← TODO 31
├─ popupPosition                             ← TODO 31
├─ headerFontSize / bodyFontSize / footerFontSize ← TODO 31
├─ showDoNotShowAgain / hideDays
├─ completionRatio / allowCloseBeforeComplete
├─ passingScore
├─ questions[]
└─ content
    └─ popupType별 콘텐츠/전용 옵션
```

---

## 6. C# 변경 목표

`PopupResponseDto`에 다음 속성을 추가한다.

```csharp
public bool UseBackgroundOverlay { get; set; } = true;
public double BackgroundOverlayOpacity { get; set; } = 0.45;
public string PopupPosition { get; set; } = "CENTER";
public double? HeaderFontSize { get; set; }
public double? BodyFontSize { get; set; }
public double? FooterFontSize { get; set; }
```

`PopupFactory`는 기존 content lookup:

```csharp
GetContentBoolean(content, "useBackgroundOverlay", true)
GetContentDouble(content, "backgroundOverlayOpacity", 0.45)
GetPopupPosition(content)
GetContentNullableDouble(content, "headerFontSize")
GetContentNullableDouble(content, "bodyFontSize")
GetContentNullableDouble(content, "footerFontSize")
```

를 제거하고 `PopupResponseDto` 최상위 값을 사용한다.

`popupPosition`은 문자열을 enum으로 변환하는 기존 검증/기본값 정책을 유지한다.

---

## 7. 서버 변경 목표

Java `WpfPopupItem`에 다음 필드를 최상위로 추가한다.

- `useBackgroundOverlay`
- `backgroundOverlayOpacity`
- `popupPosition`
- `headerFontSize`
- `bodyFontSize`
- `footerFontSize`

저장 구조가 기존 `content_options_json`인 경우:

```text
DB content_options_json
       ↓
서버 WPF 응답 조립
       ↓
공통 PopupWindow 옵션 추출
       ↓
WpfPopupItem 최상위 필드
       ↓
content에서는 해당 공통 key 제거
```

즉 API 계약 정리를 위해 DB 컬럼을 반드시 새로 만들 필요는 없다.

---

## 8. 하위 호환 정책

구버전 WPF는 공통 UI 옵션을 `content`에서 읽는다.

따라서 서버가 즉시 content key를 제거하면 구버전에서 기본값으로 돌아갈 수 있다.

예:
- Overlay 설정 유실
- Popup 위치가 CENTER로 복귀
- 폰트 크기가 XAML 기본값으로 복귀

권장 전환 순서:

### 단계 1

서버:
- 최상위 공통 옵션 추가
- content 내부 기존 key도 일시 유지

신규 WPF:
- 최상위 값을 우선 사용
- 필요 시 content fallback 유지

### 단계 2

지원 최소 WPF 버전을 신규 계약 버전으로 상향

### 단계 3

서버:
- content 내부 legacy 공통 옵션 제거

WPF:
- content fallback 제거

폐쇄망 배포 정책상 모든 Agent를 한 번에 교체할 수 있다면
최소 지원 버전을 즉시 상향하고 중복 전송 기간을 줄일 수 있다.

---

## 9. 구현 TODO

- [x] 31-01 `useBackgroundOverlay`를 popups[] 최상위로 이동
- [x] 31-02 `backgroundOverlayOpacity`를 popups[] 최상위로 이동
- [x] 31-03 `popupPosition`을 popups[] 최상위로 이동
- [x] 31-04 `headerFontSize`를 popups[] 최상위로 이동
- [x] 31-05 `bodyFontSize`를 popups[] 최상위로 이동
- [x] 31-06 `footerFontSize`를 popups[] 최상위로 이동
- [x] 31-07 C# `PopupResponseDto` 공통 UI 속성 추가
- [x] 31-08 C# `PopupFactory`의 content 공통 옵션 lookup 제거 — useBackgroundOverlay·opacity·position·폰트 lookup 제거(videoEnabled는 QUIZ content 전용이라 유지)
- [x] 31-09 Overlay 기본값 true / opacity 0.45 회귀 검증 — 로컬 행동 검증(생략 시 true / 0.45)
- [x] 31-10 opacity 0~1 범위 처리 위치를 서버/WPF 중 어디에 둘지 확정 — 서버 저장 시 0~1 검증(범위 밖 거부), 서버 응답 0~1 보정, WPF도 0~1 보정 유지로 확정
- [x] 31-11 popupPosition 9개 값 및 미지원 값 처리 회귀 검증 — 9개 값 변환·미지원 값 CENTER(서버 응답·WPF 모두)
- [x] 31-12 FontSize 10~40 보정 정책 유지 확인 — PopupWindow 10~40 보정 유지, 서버 저장 검증 유지
- [x] 31-13 Java `WpfPopupItem` 최상위 공통 UI 필드 추가
- [x] 31-14 서버 응답 조립 시 content_options_json에서 공통 옵션 추출 — WpfPopupItem.from에서 승격, content에서 6개 키 제거(Overlay·위치는 기본값을 채워 항상 전송)
- [x] 31-15 신규 WPF 전환 기간 content fallback 필요 여부 결정 — 운영 배포 버전이 없어 fallback 없이 즉시 전환
- [x] 31-16 `minimumSupportedVersion` 상향 시점 결정 — 운영 배포 버전이 없어 상향 불필요로 결정(미변경)
- [x] 31-17 content 내부 legacy 공통 UI key 제거 — WPF 응답 content에서 제거, WPF는 content 키를 읽지 않음. 관리자 API·DB(CONTENT_OPTIONS) 저장 위치 유지
- [x] 31-18 `POPUP_INTERFACE_SPEC.md` 공통 필드표 수정
- [x] 31-19 최소/전체 기능 정의서 수정
- [x] 31-20 유형별 Sample JSON 수정 (api/examples, docs/interfaces/examples, 계약서 §8·§15)
- [ ] 31-21 Excel 인터페이스 정의서 반영 — 저장소에 Excel 정의서 없음. 미반영
- [ ] 31-22 TEXT / IMAGE / VIDEO / SURVEY / QUIZ / VIDEO+QUIZ 전체 회귀 검증 — 단위·행동 검증 통과, 실제 서버 HTTP·Windows 화면 미확인
- [ ] 31-23 Overlay·위치·폰트 크기 실제 WPF 화면 수동 검증 — 미실행

---

## 10. 완료 기준

- PopupWindow 공통 UI 정책이 `content`와 분리되어 있다.
- API만 봐도 공통 정책과 타입별 콘텐츠의 경계가 명확하다.
- TEXT/IMAGE/VIDEO/SURVEY/QUIZ가 같은 공통 UI 계약을 사용한다.
- DB 저장 구조를 불필요하게 변경하지 않고도 WPF 응답 계약을 단순화할 수 있다.
- 구버전/신규 WPF 전환 중 Overlay·위치·폰트 설정이 조용히 유실되지 않는다.
