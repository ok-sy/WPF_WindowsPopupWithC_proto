# 팝업 레이아웃 가이드

기준 형상 · `main` `b4632d8` 이후 작업 트리 (2026-11-19 KST)  
범위 · 관리자 웹 미리보기(`PopupPreview`)와 WPF 실제 팝업(`PopupWindow`)의 공통 창 구조·여백·버튼·글자 크기  
관련 · [팝업 UI 기본값 사양](61_POPUP_UI_DEFAULTS_SPEC.md)(영역별 기본값 표) · [TODO61-20 실측 기록](../reviews/TODO61-20_popup_ui_parity/README.md) · [TODO61](61_관리자_미리보기_컴포넌트화_TODO.md#61-22-팝업-레이아웃-가이드-2026-11-19)

그림은 웹 미리보기 흰 판(그림자 여백을 뺀 내부 패널)을 브라우저 100%로 캡처하고, 그 위에 영역과 수치를 표시한 것이다. 수치는 웹 CSS px와 WPF DIP가 같다(Windows 96 DPI 기준). 번호표의 WPF 값은 같은 데이터로 띄운 실제 WPF 팝업에서 잰 값이다.

| 색 | 표시 |
|---|---|
| 파랑 | 헤더 |
| 초록 점선 | 본문 콘텐츠 영역(본문 여백 안쪽) |
| 주황 | 푸터 |
| 보라 | 푸터 버튼(크기 표시) |
| 빨강 번호 | 글자 크기/굵기가 처음 나오는 요소 |

## 다시 만들기

```
node scripts/verify-popup-parity.cjs
```

- 결과는 `.offline-verify/popup-parity/`에 생긴다. `<ID>.guide.png`(이 문서의 그림 — 그림 아래 칸에 유형별 최소·최대, 설문·퀴즈 콘텐츠 너비(최대 760)·영상 높이(최소 180/170) 실측 상자 포함), `<ID>.side.png`(웹·WPF 나란히), `guide-figures.md`(유형별 그림·번호표), `texts.md`(전체 글자 대조)다.
- 레이아웃을 바꾼 뒤 다시 실행해 아래 그림을 `61_popup_layout_guide/`에 덮어쓰고, 유형별 절은 `guide-figures.md` 내용으로 바꾼다.
- 한계: 로그인한 관리자 화면이 아닌 같은 컴포넌트 하네스다. 브라우저 확대·Windows 배율·폐쇄망 전역 CSS는 포함하지 않는다. WPF 영상(WebView2)은 캡처에 그려지지 않는다.

## 공통 창 구조

![TEXT 560×750 공통 구조](61_popup_layout_guide/PARITY-TEXT-560x750.guide.png)

| 영역 | 값 | 웹(관리자 미리보기) | WPF |
|---|---|---|---|
| 창 바깥 그림자 여백 | 24 (영상 창·FULLSCREEN 0) | `POPUP_LAYOUT.windowMargin`, `previewShadowMargin()` | `PopupOuterGrid` Margin 24 |
| 헤더 | 높이 40, 검정 배경 | `POPUP_LAYOUT.headerHeight` | `HeaderRow` 40, `HeaderArea` |
| 헤더 제목 | 17 / 600, 왼쪽 시작 18, 한 줄 말줄임 | `POPUP_DEFAULT_FONT_SIZES.header`, `POPUP_LAYOUT.headerPaddingLeft` | `PopupTitleText` |
| 헤더 로고 | 100×24, 오른쪽 끝 | `PopupPreview` 헤더 로고 | `HeaderLogo` |
| 본문 여백 | 좌우 28 · 위아래 24 | `POPUP_LAYOUT.contentPaddingX/Y` | `PopupContent` Margin 28,24,28,24 |
| 푸터 | 최소 높이 64, 좌우 28 · 위아래 15, 구분선 없음 | `POPUP_LAYOUT.footerHeight/footerPaddingX/footerPaddingY`, `PopupFooter` | `FooterRow`(최소 64), `FooterArea` Margin 28,15,28,15 |
| 푸터 간격 | 나중에 보기 → 안내 16, 버튼 사이 10 | `POPUP_LAYOUT.footerGroupGap/footerButtonGap` | `FooterLaterButton`·안내 Margin 오른쪽 16, `FooterAuxCloseButton` 10 |
| 확인·바로가기 버튼 | 최소 118 × 34, 좌우 22, 모서리 9, #111827 · 흰 글자 14/600 | `PopupFooterButton kind="primary"` | `FooterActionButtonStyle` |
| 나중에 보기·보조 닫기 | 최소 118 × 34, 밝은 면 #F3F4F6 · 테두리 #D1D5DB | `kind="secondary"` | `FooterSecondaryButtonStyle` |
| 제출 | 최소 132 × 34, 모서리 11, 설문 버튼 색 | `kind="submit"` | `SurveyFooterSubmitButtonStyle` |
| 푸터 글자 | 버튼·체크박스 14(`footerFontSize` 우선), 설문 응답 진행 문구 12 고정 | `PopupFooter` `fontSize` | `ApplyFontSizes`, `FooterResponseProgressText` |
| TEXT 본문 | 15 / 400 (`bodyFontSize` 우선) | `POPUP_DEFAULT_FONT_SIZES.textBody` | `BodyTextStyle` |

웹 수치·색 원본은 `zero-rule-web/main/src/features/PopupcommonComponent/popupLayout.ts`, 푸터는 `PopupFooter.tsx`다. WPF 푸터 버튼 스타일은 `popup-frameWork/Popup/Views/Windows/PopupStyles.xaml`, 설문 제출은 `Views/Contents/SurveyDesigns/SurveyStyles.V1·V2.xaml`에 있다. 결과 안내창 버튼(`ActionButtonStyle`, 높이 44)은 푸터 버튼과 별개다.

## 최소·최대 크기 — 전체 레이아웃 (2026-11-23 정적 코드 확인)

> **창 제한과 콘텐츠 내부 제한은 서로 다르다.** WPF 수치는 DIP, WEB 수치는 CSS px. 아래 값은 Git `main` 코드 기준이며 기존 2026-11-19 실측 이미지나 폐쇄망 반입본을 새로 검증한 결과가 아니다.

### 창 크기: 공통 기준과 크기 모드

- 유효 창 하한(축별): `max(300, minimumWidth/Height)`. 작업 영역이 더 작으면 화면 안에 들어가도록 최소값을 최종 상한 이하로 보정한다.
- 기본 설정: WPF `PopupOptions`는 **900×620**, 최소 **300×300**, 최대 설정값 **1200×900**, RATIO **0.7/0.75**. WEB 미리보기의 표시용 기본 창은 **560×420**이며 최소/최대 설정 기본값은 동일하다.
- `PopupWindow.xaml`의 시작값 `760×620 / MinWidth 620 / MinHeight 480`은 런타임 `ApplyWindowSize()`가 덮어쓴다. 창의 정책 최소 620×480이 아니다.

| 창 모드 | WPF 최소 | WPF 최대(가로·세로 각각) | 실제 크기 |
|---|---|---|---|
| `FIXED` | 유효 하한, 화면 상한 이하로 보정 | **비IMAGE:** `min(설정 maximum, 작업 영역×90%)`; **IMAGE:** 작업 영역×90% | 요청 width/height 보정. 2026-11-24 95% → 90% 통일 |
| `RATIO` | 유효 하한, 화면 상한 이하로 보정 | **비IMAGE:** `min(설정 maximum, 작업 영역×100%)`; **IMAGE:** 작업 영역×90% | WPF가 축별 비율을 0.1~1.0으로 보정해 작업 영역에 적용 |
| `AUTO` | 유효 하한, 화면 상한 이하로 보정 | **비IMAGE:** `min(설정 maximum, 작업 영역×90%)`; **IMAGE:** 작업 영역×90% | 콘텐츠 측정 크기(`SizeToContent`) 기준 |
| `FULLSCREEN` | 창 속성 min 0 | 창 속성 max ∞; 실제 주 모니터 전체 크기 | 일반 최소 300·화면 90% 상한 적용하지 않음 |

비IMAGE에서 설정 maximum이 유효 하한보다 작으면 하한까지 올린다. IMAGE는 설정 maximum이 아닌 **작업 영역 90% 상한**을 사용한다. IMAGE의 `ADAPTIVE/FIT_TO_IMAGE`는 위의 창 크기 모드와 다른 **이미지 표시 모드**다.

### 유형별 내부 min/max

| 유형 | 창 제한 | 콘텐츠 내부의 별도 최소·최대 |
|---|---|---|
| **TEXT** | 비IMAGE 공통 규칙 | WPF `TextPopupView.xaml` 루트에 **자체 최소 크기 없음**(2026-11-23 320×240 제거 — 창 최소 300보다 커서 300~319 폭에서 본문이 잘릴 수 있었음). 본문은 창 안 스크롤로 표시. 별도 최대 없음 |
| **IMAGE** | 일반 모드 작업 영역 **최대 90%**, 최소 유효 300×300(화면 부족 시 보정) | ADAPTIVE 이미지는 원본 크기보다 확대하지 않음. WPF 설명 영역 `MaxHeight`는 이미지 표시 높이·남은 높이의 **30%** 기준. `FIT_TO_IMAGE`는 이미지 기준 권장 크기를 창 제한으로 보정 |
| **VIDEO** | 비IMAGE 공통 규칙 | WPF 단독 영상 행은 남는 높이(`*`) 사용, 별도 재생 영역 높이 min/max 없음. **웹 `FillVideoArea`에만 `minHeight:170`** |
| **SURVEY** | 비IMAGE 공통 규칙 | **설문 콘텐츠 MaxWidth 760**, 문항 제목 자체 고정 max 없음(줄바꿈). 선택지 **MinHeight 32**, WPF 주관식 **MinHeight 96**. WEB 주관식은 **96~180** |
| **QUIZ** | 비IMAGE 공통 규칙 | SURVEY와 동일: **MaxWidth 760**, 선택지 **최소 32**, 주관식 WPF **최소 96** / WEB **96~180** |
| **VIDEO+QUIZ** | 비IMAGE 공통 규칙(퀴즈가 포함된 팝업) | QUIZ 콘텐츠 **MaxWidth 760** 및 선택지/주관식 제한. 영상 재생 행 **최소 180**, 높이 상한 **`max(180, 부모 세로 스크롤 가용 높이×70%)`**. 전체 콘텐츠 높이 상한은 아님(부모 세로 스크롤) |

- **760의 의미:** WPF `SurveyPopupView.xaml` `MaxWidth="760"`, WEB `SurveyPreview.tsx` `maxWidth:760`. 창 너비와 별개다. 카드 패딩·창 여백·스크롤바 때문에 실제 문항 가용 폭은 더 작으며 제목은 `TextWrapping.Wrap`이다. XAML `d:DesignWidth="700"`은 디자이너용 수치.
- **VIDEO+QUIZ 영상 높이:** `(영상 가용 폭−테두리 좌우)×원본 세로/가로+테두리 상하`를 계산한 뒤 180 하한·가용 높이 70% 상한을 적용한다. 상한이 180보다 작으면 180을 우선한다. WPF `VideoPopupView.CalculateAspectHeight()`와 WEB `aspectVideoHeight()` 기준.
- **공통 영역:** 푸터 최소 높이 **64**(문구에 따라 증가), 일반 버튼 최소 너비 **118**·높이 **34**, 제출 버튼 최소 너비 **132**·높이 **34**. 별도 버튼 최대 너비·푸터 최대 높이는 지정하지 않는다.

### WEB 미리보기 전용 min/max와 WPF 차이

| 화면 | 적용 범위·제한 |
|---|---|
| 인라인 미리보기 | 미리보기 내용 자리 **최소 높이 320**, 너비는 부모 영역 기준. 실제 팝업 창의 최소 높이가 아님 |
| 실제 크기 모달(비IMAGE) | **작업 영역 기준**(TODO61-23, 2026-11-24): 설정 minimum/maximum으로 보정 후 FIXED `min(설정 maximum, 작업 영역×90%)`, RATIO `min(설정 maximum, 작업 영역×100%)`·비율 0.1~1.0 보정으로 WPF와 같다(웹에는 AUTO 없음). 작업 영역은 현재 모니터(`screen.availWidth/availHeight`) 또는 기준 화면 프리셋(1920×1080→1920×1040, 2560×1440→2560×1400) |
| 실제 크기 모달(IMAGE) | **작업 영역 90% 상한**(WPF와 같음). FIT_TO_IMAGE 권장 창 크기도 같은 작업 영역으로 계산한다 |
| 실제 크기 모달 표시 | 기준 화면 프리셋(1366×768·1920×1080·2560×1440)은 그 해상도 화면을 실제 크기로 그린다. 현재 모니터와 프리셋 모두 브라우저보다 크면 축소하지 않고 스크롤로 본다(2026-11-24). 이전 기록: 넘치는 축만 표시 영역까지 줄이고 '1:1 아님'을 안내한다. 배경은 브라우저 뷰포트를 덮고 페이지·모달 래퍼 스크롤은 없다 |
| FULLSCREEN 미리보기 | 브라우저 뷰포트 전체. WPF는 주 모니터 전체화면 |

**확인 기준:** 유형별 300 하한·설정 maximum·모드별 화면 상한, TEXT 300 폭 본문 스크롤, QUIZ 760 및 긴 문항 줄바꿈, 선택지 32, WEB 주관식 96~180, VIDEO+QUIZ 영상 180/70%, 인라인 320·모달 작업 영역 90%(RATIO 100%)를 같은 데이터로 확인한다. 브라우저/WPF 실화면·DPI·폐쇄망 검증은 미실행 상태로 유지한다.

근거: [WPF 창 크기](../../popup-frameWork/Popup/Views/Windows/PopupWindow.xaml.cs) · [WPF 기본 설정](../../popup-frameWork/Popup/Models/PopupOptions.cs) · [TEXT 뷰](../../popup-frameWork/Popup/Views/Contents/TextPopupView.xaml) · [설문/퀴즈 뷰](../../popup-frameWork/Popup/Views/Contents/SurveyPopupView.xaml) · [문항 구현](../../popup-frameWork/Popup/Views/Contents/SurveyPopupView.xaml.cs) · [영상 비율](../../popup-frameWork/Popup/Views/Contents/VideoPopupView.AspectSizing.cs) · [웹 설문](../../zero-rule-web/main/src/features/PopupcommonComponent/SurveyPreview.tsx) · [웹 크기 계산](../../zero-rule-web/main/src/features/PopupcommonComponent/popupPreviewDialogLayout.ts) · [인라인 미리보기](../../zero-rule-web/main/src/features/PopupcommonComponent/InlinePopupPreview.tsx)

## 푸터 배치 규칙

- 순서: 왼쪽 끝 **나중에 보기** → **안내 문구·다시 보지 않기** → 오른쪽 **보조 닫기·확인/바로가기/제출**. WPF `FooterArea`의 세 열과 같다.
- 버튼 아래~흰 판 아래는 15다(모든 유형 실측 일치).
- 좁은 폭에서 웹 일반 푸터는 오른쪽 버튼 묶음을 다음 줄로 내리고 푸터가 위로 늘어난다(아래 TEXT 좁은 폭 그림, 푸터 110). WPF는 줄을 나누지 않는다. 설문 푸터는 줄을 나누지 않고 안내 문구를 줄바꿈한다.
- 다시 보지 않기 글자 위치는 웹·WPF가 같다(MUI `FormControlLabel` 기본 여백을 푸터 안에서 0으로 둔다).

## 유형별

번호표의 `—`는 같은 글자를 자동으로 짝짓지 못한 경우다. 문항 제목은 웹이 제목과 '하나 선택' 안내를 한 요소로 그려 글자가 달라지지만, WPF 문항 제목도 16/600이다([실측 표](../reviews/TODO61-20_popup_ui_parity/MEASURES_61-21.md)). 영상 컨트롤 줄(▶ 00:00)은 미리보기 전용이다.

### TEXT (560×750)

샘플 ID `PARITY-TEXT-560x750`

![PARITY-TEXT-560x750 레이아웃](61_popup_layout_guide/PARITY-TEXT-560x750.guide.png)

| 번호 | 글자 | 웹 크기/굵기 | WPF 크기/굵기 |
|---|---|---|---|
| 1 | TEXT 560×750 | 17/600 | 17/600 |
| 2 | 공지 본문 첫 줄입니다. 둘째 줄입니다. | 15/400 | 15/400 |
| 3 | 확인 | 14/600 | 14/600 |

최소·최대(그림 아래 칸과 같음):

- **창** · 최소 300×300(축별 max(300, minimum)) · 최대 설정 maximum과 화면 90%(RATIO 100%) 중 작은 값 · FULLSCREEN 제외
- **본문** · 자체 최소·최대 없음 — 창 안에서 줄바꿈하고 넘치면 세로 스크롤
- **푸터** · 최소 높이 64(문구에 따라 증가) · 버튼 최소 118×34, 제출 132×34
- **웹 미리보기** · 인라인 최소 높이 320 · 실제 크기 모달 작업 영역 90%(RATIO 100%)

웹·WPF 나란히: [PARITY-TEXT-560x750.side.png](61_popup_layout_guide/PARITY-TEXT-560x750.side.png)

### TEXT 좁은 폭·긴 문구·나중에 보기·다시 보지 않기 (360×480)

샘플 ID `PARITY-TEXT-NARROW-LONG`

![PARITY-TEXT-NARROW-LONG 레이아웃](61_popup_layout_guide/PARITY-TEXT-NARROW-LONG.guide.png)

| 번호 | 글자 | 웹 크기/굵기 | WPF 크기/굵기 |
|---|---|---|---|
| 1 | 좁은 폭에서 아주 긴 팝업 제목이 한 줄 말 | 17/600 | 17/600 |
| 2 | 긴 문구 줄바꿈 확인용 본문입니다. 좁은 창 | 15/400 | 15/400 |
| 3 | 나중에 보기 | 14/600 | 14/600 |
| 4 | 30일간 보지 않기 | 14/400 | 14/400 |

최소·최대(그림 아래 칸과 같음):

- **창** · 최소 300×300(축별 max(300, minimum)) · 최대 설정 maximum과 화면 90%(RATIO 100%) 중 작은 값 · FULLSCREEN 제외
- **본문** · 자체 최소·최대 없음 — 창 안에서 줄바꿈하고 넘치면 세로 스크롤
- **푸터** · 최소 높이 64(문구에 따라 증가) · 버튼 최소 118×34, 제출 132×34
- **웹 미리보기** · 인라인 최소 높이 320 · 실제 크기 모달 작업 영역 90%(RATIO 100%)

웹·WPF 나란히: [PARITY-TEXT-NARROW-LONG.side.png](61_popup_layout_guide/PARITY-TEXT-NARROW-LONG.side.png)

### SURVEY (720×820)

샘플 ID `PARITY-SURVEY`

![PARITY-SURVEY 레이아웃](61_popup_layout_guide/PARITY-SURVEY.guide.png)

| 번호 | 글자 | 웹 크기/굵기 | WPF 크기/굵기 |
|---|---|---|---|
| 1 | 설문 비교 | 17/600 | 17/600 |
| 2 | 교육 만족도 조사 | 25/600 | 25/600 |
| 3 | 교육 후 의견을 알려 주세요. | 14/400 | 14/400 |
| 4 | 교육 내용에 만족하십니까? *하나 선택 | 16/600 | — |
| 5 | 하나 선택 | 12/400 | 12/400 |
| 6 | 필수 응답 0/1 · 1문항 남음 | 12/400 | 12/400 |
| 7 | 제출 | 14/600 | 14/600 |

최소·최대(그림 아래 칸과 같음):

- **창** · 최소 300×300(축별 max(300, minimum)) · 최대 설정 maximum과 화면 90%(RATIO 100%) 중 작은 값 · FULLSCREEN 제외
- **설문·퀴즈** · 콘텐츠 최대 너비 760(창 너비와 별개) · 선택지 최소 높이 32 · 주관식 최소 96(웹 96~180)
- **푸터** · 최소 높이 64(문구에 따라 증가) · 버튼 최소 118×34, 제출 132×34
- **웹 미리보기** · 인라인 최소 높이 320 · 실제 크기 모달 작업 영역 90%(RATIO 100%)

웹·WPF 나란히: [PARITY-SURVEY.side.png](61_popup_layout_guide/PARITY-SURVEY.side.png)

### QUIZ — OX·선다형 (720×680)

샘플 ID `PARITY-QUIZ-OX`

![PARITY-QUIZ-OX 레이아웃](61_popup_layout_guide/PARITY-QUIZ-OX.guide.png)

| 번호 | 글자 | 웹 크기/굵기 | WPF 크기/굵기 |
|---|---|---|---|
| 1 | 퀴즈 비교 | 17/600 | 17/600 |
| 2 | 보안 퀴즈 | 25/600 | 25/600 |
| 3 | 비밀번호는 메모장에 적어 두어도 된다. *하 | 16/600 | — |
| 4 | 하나 선택 | 12/400 | 12/400 |
| 5 | O | 12/700 | 12/700 |
| 6 | 필수 응답 0/2 · 2문항 남음 | 12/400 | 12/400 |
| 7 | 제출 | 14/600 | 14/600 |

최소·최대(그림 아래 칸과 같음):

- **창** · 최소 300×300(축별 max(300, minimum)) · 최대 설정 maximum과 화면 90%(RATIO 100%) 중 작은 값 · FULLSCREEN 제외
- **설문·퀴즈** · 콘텐츠 최대 너비 760(창 너비와 별개) · 선택지 최소 높이 32 · 주관식 최소 96(웹 96~180)
- **푸터** · 최소 높이 64(문구에 따라 증가) · 버튼 최소 118×34, 제출 132×34
- **웹 미리보기** · 인라인 최소 높이 320 · 실제 크기 모달 작업 영역 90%(RATIO 100%)

웹·WPF 나란히: [PARITY-QUIZ-OX.side.png](61_popup_layout_guide/PARITY-QUIZ-OX.side.png)

### IMAGE — ADAPTIVE (640×560)

샘플 ID `PARITY-IMAGE`

![PARITY-IMAGE 레이아웃](61_popup_layout_guide/PARITY-IMAGE.guide.png)

| 번호 | 글자 | 웹 크기/굵기 | WPF 크기/굵기 |
|---|---|---|---|
| 1 | IMAGE 비교 | 17/600 | 17/600 |
| 2 | 이미지 제목 | 22/600 | 22/600 |
| 3 | 이미지 설명입니다. | 14/400 | 14/400 |
| 4 | 확인 | 14/600 | 14/600 |

최소·최대(그림 아래 칸과 같음):

- **창** · 최소 300×300(축별 max(300, minimum)) · 최대 화면 작업 영역 90%(설정 maximum 미사용) · FULLSCREEN 제외
- **이미지** · ADAPTIVE는 원본보다 확대하지 않음 · WPF 설명 영역 최대 30% · FIT_TO_IMAGE 권장 크기는 창 제한으로 보정
- **푸터** · 최소 높이 64(문구에 따라 증가) · 버튼 최소 118×34, 제출 132×34
- **웹 미리보기** · 인라인 최소 높이 320 · 실제 크기 모달 브라우저 90%

웹·WPF 나란히: [PARITY-IMAGE.side.png](61_popup_layout_guide/PARITY-IMAGE.side.png)

### VIDEO (720×640)

샘플 ID `PARITY-VIDEO`

![PARITY-VIDEO 레이아웃](61_popup_layout_guide/PARITY-VIDEO.guide.png)

| 번호 | 글자 | 웹 크기/굵기 | WPF 크기/굵기 |
|---|---|---|---|
| 1 | VIDEO 비교 | 17/600 | 17/600 |
| 2 | 영상 제목 | 22/600 | 22/600 |
| 3 | ▶ 00:00 / 00:00 | 14/400 | — |
| 4 | 확인 | 14/600 | 14/600 |

최소·최대(그림 아래 칸과 같음):

- **창** · 최소 300×300(축별 max(300, minimum)) · 최대 설정 maximum과 화면 90%(RATIO 100%) 중 작은 값 · FULLSCREEN 제외
- **영상** · WPF 남는 높이 사용(별도 min/max 없음) · 웹 미리보기만 최소 높이 170
- **푸터** · 최소 높이 64(문구에 따라 증가) · 버튼 최소 118×34, 제출 132×34
- **웹 미리보기** · 인라인 최소 높이 320 · 실제 크기 모달 작업 영역 90%(RATIO 100%)

웹·WPF 나란히: [PARITY-VIDEO.side.png](61_popup_layout_guide/PARITY-VIDEO.side.png)

### VIDEO+QUIZ (720×900)

샘플 ID `PARITY-VIDEO-QUIZ`

![PARITY-VIDEO-QUIZ 레이아웃](61_popup_layout_guide/PARITY-VIDEO-QUIZ.guide.png)

| 번호 | 글자 | 웹 크기/굵기 | WPF 크기/굵기 |
|---|---|---|---|
| 1 | VIDEO+QUIZ 비교 | 17/600 | 17/600 |
| 2 | 영상 퀴즈 | 25/600 | 22/600 |
| 3 | ▶ 00:00 / 00:00 | 12/400 | — |
| 4 | 영상을 보고 답하세요. | 14/400 | 14/400 |
| 5 | 영상에서 확인한 내용은? *하나 선택 | 16/600 | — |
| 6 | 필수 응답 0/1 · 1문항 남음 | 12/400 | — |
| 7 | 제출 | 14/600 | 14/600 |

최소·최대(그림 아래 칸과 같음):

- **창** · 최소 300×300(축별 max(300, minimum)) · 최대 설정 maximum과 화면 90%(RATIO 100%) 중 작은 값 · FULLSCREEN 제외
- **영상(퀴즈 포함)** · 높이 = 폭×원본 비율, 최소 180 · 최대 max(180, 가용 높이×70%)
- **설문·퀴즈** · 콘텐츠 최대 너비 760(창 너비와 별개) · 선택지 최소 높이 32 · 주관식 최소 96(웹 96~180)
- **푸터** · 최소 높이 64(문구에 따라 증가) · 버튼 최소 118×34, 제출 132×34
- **웹 미리보기** · 인라인 최소 높이 320 · 실제 크기 모달 작업 영역 90%(RATIO 100%)

웹·WPF 나란히: [PARITY-VIDEO-QUIZ.side.png](61_popup_layout_guide/PARITY-VIDEO-QUIZ.side.png)

## 알려진 차이

| 항목 | 웹 | WPF | 상태 |
|---|---|---|---|
| VIDEO+QUIZ 상단 제목 | 퀴즈 제목(25/600)을 상단에 한 번 | 영상 제목(22/600), 같은 퀴즈 제목은 접음 | 기존 기록([비교 문서](../reviews/POPUP_PREVIEW_WPF_PARITY.md)) |
| VIDEO+QUIZ 푸터 문구 | 응답 진행 문구 | 시청 완료 전에는 시청 진행 문구 | 미리보기는 시청 잠금을 시연하지 않음 |
| 좁은 폭 푸터 | 버튼을 다음 줄로 | 한 줄 유지 | TODO61-18 결정(잘림 방지) |
| IMAGE 이미지·설명 상자 | 회색 테두리 | 연한 배경 | 치수는 같음 |
| 영상 영역 높이(VIDEO+QUIZ) | 실제 영상 비율 | 캡처 시점에는 메타데이터 전 16:9 | 캡처 한계(실제 재생 시 같은 계산식) |

## 레이아웃을 바꿀 때

1. 웹 `popupLayout.ts`(`POPUP_LAYOUT`·`POPUP_COLORS`)와 WPF XAML·스타일을 같은 변경 단위로 고친다. 버튼은 `PopupFooterButton`과 `Footer*ButtonStyle`을 함께 바꾼다.
2. `node scripts/verify-popup-parity.cjs`로 판정(헤더·버튼·버튼 아래 간격·본문 글자)과 `texts.md` 차이를 확인한다.
3. 이 문서의 그림·번호표와 [팝업 UI 기본값 사양](61_POPUP_UI_DEFAULTS_SPEC.md)의 수치를 갱신한다.
